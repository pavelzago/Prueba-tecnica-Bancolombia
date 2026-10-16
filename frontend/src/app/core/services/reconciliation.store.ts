import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';

import {
  CauseFilter,
  FileKind,
  PageInfo,
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
  file: null,
};

/** Lower-case and strip accents so "consultoria" matches "Consultoría". */
function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

/** Searchable fields of a row, normalized once (one per line so a term never spans two fields). */
function searchText(row: ResultadoFactura): string {
  return [row.id_factura, row.nit_proveedor, row.concepto]
    .filter((field): field is string => field !== null)
    .map(normalize)
    .join('\n');
}

function matchesCause(row: ResultadoFactura, cause: CauseFilter): boolean {
  return cause === null || row.inconsistencias.some((i) => i.codigo === cause);
}

export const PAGE_SIZE_OPTIONS: readonly number[] = [25, 50, 100];
export const DEFAULT_PAGE_SIZE = 50;

/** A load shorter than this never shows the skeleton (avoids a flash with small files). */
export const SKELETON_DELAY_MS = 300;

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
  private readonly _page = signal(1);
  private readonly _pageSize = signal(DEFAULT_PAGE_SIZE);
  private readonly _slowLoad = signal(false);
  private skeletonTimer: ReturnType<typeof setTimeout> | null = null;

  readonly invoicesFile = this._invoicesFile.asReadonly();
  readonly ledgerFile = this._ledgerFile.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly result = this._result.asReadonly();
  readonly processedAt = this._processedAt.asReadonly();
  readonly filter = this._filter.asReadonly();
  readonly causeFilter = this._causeFilter.asReadonly();
  readonly search = this._search.asReadonly();
  readonly pageSize = this._pageSize.asReadonly();
  readonly pageSizeOptions = PAGE_SIZE_OPTIONS;

  /** True only while a load has lasted more than SKELETON_DELAY_MS. */
  readonly showSkeleton = computed(() => this._loading() && this._slowLoad());

  /** File the last error points at (its field shows an X instead of a check). */
  readonly invalidFile = computed(() => this._error()?.file ?? null);

  readonly summary = computed(() => this._result()?.summary ?? null);
  readonly totalResults = computed(() => this._result()?.results.length ?? 0);
  readonly canProcess = computed(
    () => !!this._invoicesFile() && !!this._ledgerFile() && !this._loading(),
  );
  readonly hasActiveFilters = computed(
    () => this._filter() !== 'all' || this._causeFilter() !== null || this._search().trim() !== '',
  );

  /** Normalized search text per row, computed once per result (not per keystroke). */
  private readonly searchIndex = computed(
    () => new Map((this._result()?.results ?? []).map((r) => [r, searchText(r)])),
  );

  /** Rows matching cause + search (status not applied): feeds the status counters. */
  private readonly resultsBeforeStatus = computed(() => {
    const term = normalize(this._search());
    const cause = this._causeFilter();
    const index = this.searchIndex();
    return (this._result()?.results ?? []).filter(
      (r) => matchesCause(r, cause) && (!term || index.get(r)!.includes(term)),
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

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredResults().length / this._pageSize())),
  );

  /** Current page (1-based), always clamped to the available pages. */
  readonly page = computed(() => Math.min(Math.max(1, this._page()), this.totalPages()));

  /** Only the rows of the current page: what the table renders. */
  readonly pagedResults = computed(() => {
    const start = (this.page() - 1) * this._pageSize();
    return this.filteredResults().slice(start, start + this._pageSize());
  });

  /** 1-based inclusive range of the rows shown ({0, 0} when empty). */
  readonly pageRange = computed(() => {
    const count = this.filteredResults().length;
    if (!count) return { from: 0, to: 0 };
    const from = (this.page() - 1) * this._pageSize() + 1;
    return { from, to: Math.min(count, from + this._pageSize() - 1) };
  });

  readonly pageInfo = computed<PageInfo>(() => ({
    page: this.page(),
    pageSize: this._pageSize(),
    totalPages: this.totalPages(),
    ...this.pageRange(),
  }));

  setFile(kind: FileKind, file: File | null): void {
    (kind === 'invoices' ? this._invoicesFile : this._ledgerFile).set(file);
    this._error.set(null);
  }

  setFilter(filter: StatusFilter): void {
    this._filter.set(filter);
    this._page.set(1);
  }

  setSearch(term: string): void {
    this._search.set(term);
    this._page.set(1);
  }

  setPage(page: number): void {
    this._page.set(Math.min(Math.max(1, Math.trunc(page)), this.totalPages()));
  }

  /** Changing the page size keeps the first visible row on screen. */
  setPageSize(size: number): void {
    if (!PAGE_SIZE_OPTIONS.includes(size) || size === this._pageSize()) return;
    const firstRow = Math.max(1, this.pageRange().from);
    this._pageSize.set(size);
    this._page.set(Math.ceil(firstRow / size));
  }

  /** Selecting the active cause again clears it. */
  toggleCause(cause: Exclude<CauseFilter, null>): void {
    this.setCause(this._causeFilter() === cause ? null : cause);
  }

  /** A cause implies an inconsistency, so it never combines with "Correctas". */
  setCause(cause: CauseFilter): void {
    this._page.set(1);
    this._causeFilter.set(cause);
    if (cause !== null && this._filter() === 'Correcta') {
      this._filter.set('all');
    }
  }

  clearCause(): void {
    this._causeFilter.set(null);
    this._page.set(1);
  }

  clearFilters(): void {
    this._filter.set('all');
    this._causeFilter.set(null);
    this._search.set('');
    this._page.set(1);
  }

  process(): void {
    const invoices = this._invoicesFile();
    const ledger = this._ledgerFile();
    if (!invoices || !ledger || this._loading()) {
      return;
    }
    this.startLoading();
    this._error.set(null);
    this._result.set(null);
    this._processedAt.set(null);
    this.clearFilters();

    this.api
      .reconcile(invoices, ledger)
      .pipe(finalize(() => this.stopLoading()))
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
    this.startLoading();
    this._error.set(null);
    this.samples.load().subscribe({
      next: ({ invoices, ledger }) => {
        this._invoicesFile.set(invoices);
        this._ledgerFile.set(ledger);
        this.stopLoading();
        this.process();
      },
      error: () => {
        this.stopLoading();
        this._error.set(SAMPLE_ERROR);
      },
    });
  }

  dismissError(): void {
    this._error.set(null);
  }

  private startLoading(): void {
    this._loading.set(true);
    this.clearSkeletonTimer();
    this.skeletonTimer = setTimeout(() => this._slowLoad.set(true), SKELETON_DELAY_MS);
  }

  private stopLoading(): void {
    this.clearSkeletonTimer();
    this._slowLoad.set(false);
    this._loading.set(false);
  }

  private clearSkeletonTimer(): void {
    if (this.skeletonTimer !== null) {
      clearTimeout(this.skeletonTimer);
      this.skeletonTimer = null;
    }
  }
}
