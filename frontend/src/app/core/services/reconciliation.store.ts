import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';

import {
  CauseFilter,
  FileKind,
  ReconciliationResponse,
  ResultadoFactura,
  StatusCounts,
  StatusFilter,
} from '../models/reconciliation.model';
import { UiError, mapHttpError } from '../utils/http-error.mapper';
import { ReconciliationApiService } from './reconciliation-api.service';
import { SampleFilesService } from './sample-files.service';

const SAMPLE_ERROR: UiError = {
  message:
    'No se pudieron cargar los archivos de ejemplo. Recarga la página e inténtalo de nuevo, o selecciona tus propios archivos.',
  details: [],
};

/** Lower-case and strip accents so "consultoria" matches "Consultoría". */
function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

function matchesSearch(row: ResultadoFactura, term: string): boolean {
  if (!term) return true;
  return [row.id_factura, row.nit_proveedor, row.concepto].some(
    (field) => field !== null && normalize(field).includes(term),
  );
}

function matchesCause(row: ResultadoFactura, cause: CauseFilter): boolean {
  return cause === null || row.inconsistencias.some((i) => i.codigo === cause);
}

/** Facade with signals: the single source of UI state for the reconciliation page. */
@Injectable({ providedIn: 'root' })
export class ReconciliationStore {
  private readonly api = inject(ReconciliationApiService);
  private readonly samples = inject(SampleFilesService);

  private readonly _invoicesFile = signal<File | null>(null);
  private readonly _ledgerFile = signal<File | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<UiError | null>(null);
  private readonly _result = signal<ReconciliationResponse | null>(null);
  private readonly _processedAt = signal<Date | null>(null);
  private readonly _filter = signal<StatusFilter>('all');
  private readonly _causeFilter = signal<CauseFilter>(null);
  private readonly _search = signal('');

  readonly invoicesFile = this._invoicesFile.asReadonly();
  readonly ledgerFile = this._ledgerFile.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly result = this._result.asReadonly();
  readonly processedAt = this._processedAt.asReadonly();
  readonly filter = this._filter.asReadonly();
  readonly causeFilter = this._causeFilter.asReadonly();
  readonly search = this._search.asReadonly();

  readonly summary = computed(() => this._result()?.summary ?? null);
  readonly totalResults = computed(() => this._result()?.results.length ?? 0);
  readonly canProcess = computed(
    () => !!this._invoicesFile() && !!this._ledgerFile() && !this._loading(),
  );
  readonly hasActiveFilters = computed(
    () => this._filter() !== 'all' || this._causeFilter() !== null || this._search().trim() !== '',
  );

  /** Rows matching cause + search (status not applied): feeds the status counters. */
  private readonly resultsBeforeStatus = computed(() => {
    const term = normalize(this._search());
    const cause = this._causeFilter();
    return (this._result()?.results ?? []).filter(
      (r) => matchesCause(r, cause) && matchesSearch(r, term),
    );
  });

  readonly statusCounts = computed<StatusCounts>(() => {
    const rows = this.resultsBeforeStatus();
    const correct = rows.filter((r) => r.estado === 'Correcta').length;
    return { all: rows.length, correct, inconsistent: rows.length - correct };
  });

  /** Status + cause + search, combined. */
  readonly filteredResults = computed(() => {
    const filter = this._filter();
    const rows = this.resultsBeforeStatus();
    return filter === 'all' ? rows : rows.filter((r) => r.estado === filter);
  });

  setFile(kind: FileKind, file: File | null): void {
    (kind === 'invoices' ? this._invoicesFile : this._ledgerFile).set(file);
    this._error.set(null);
  }

  setFilter(filter: StatusFilter): void {
    this._filter.set(filter);
  }

  setSearch(term: string): void {
    this._search.set(term);
  }

  /** Selecting the active cause again clears it. A cause implies an inconsistency. */
  toggleCause(cause: Exclude<CauseFilter, null>): void {
    if (this._causeFilter() === cause) {
      this._causeFilter.set(null);
      return;
    }
    this._causeFilter.set(cause);
    if (this._filter() === 'Correcta') {
      this._filter.set('all');
    }
  }

  clearCause(): void {
    this._causeFilter.set(null);
  }

  clearFilters(): void {
    this._filter.set('all');
    this._causeFilter.set(null);
    this._search.set('');
  }

  process(): void {
    const invoices = this._invoicesFile();
    const ledger = this._ledgerFile();
    if (!invoices || !ledger || this._loading()) {
      return;
    }
    this._loading.set(true);
    this._error.set(null);
    this._result.set(null);
    this._processedAt.set(null);
    this.clearFilters();

    this.api
      .reconcile(invoices, ledger)
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: (response) => {
          this._result.set(response);
          this._processedAt.set(new Date());
        },
        error: (err: unknown) => this._error.set(mapHttpError(err)),
      });
  }

  /** Loads the fictitious sample CSVs and runs the same flow as user-selected files. */
  loadSample(): void {
    if (this._loading()) {
      return;
    }
    this._loading.set(true);
    this._error.set(null);
    this.samples.load().subscribe({
      next: ({ invoices, ledger }) => {
        this._invoicesFile.set(invoices);
        this._ledgerFile.set(ledger);
        this._loading.set(false);
        this.process();
      },
      error: () => {
        this._loading.set(false);
        this._error.set(SAMPLE_ERROR);
      },
    });
  }

  dismissError(): void {
    this._error.set(null);
  }
}
