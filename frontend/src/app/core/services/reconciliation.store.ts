import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { FileKind, ReconciliationResponse, StatusFilter } from '../models/reconciliation.model';
import { UiError, mapHttpError } from '../utils/http-error.mapper';
import { ReconciliationApiService } from './reconciliation-api.service';

/** Facade with signals: the single source of UI state for the reconciliation page. */
@Injectable({ providedIn: 'root' })
export class ReconciliationStore {
  private readonly api = inject(ReconciliationApiService);

  private readonly _invoicesFile = signal<File | null>(null);
  private readonly _ledgerFile = signal<File | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<UiError | null>(null);
  private readonly _result = signal<ReconciliationResponse | null>(null);
  private readonly _filter = signal<StatusFilter>('all');

  readonly invoicesFile = this._invoicesFile.asReadonly();
  readonly ledgerFile = this._ledgerFile.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly result = this._result.asReadonly();
  readonly filter = this._filter.asReadonly();

  readonly summary = computed(() => this._result()?.summary ?? null);
  readonly canProcess = computed(
    () => !!this._invoicesFile() && !!this._ledgerFile() && !this._loading(),
  );
  readonly filteredResults = computed(() => {
    const results = this._result()?.results ?? [];
    const filter = this._filter();
    return filter === 'all' ? results : results.filter((r) => r.estado === filter);
  });

  setFile(kind: FileKind, file: File | null): void {
    (kind === 'invoices' ? this._invoicesFile : this._ledgerFile).set(file);
    this._error.set(null);
  }

  setFilter(filter: StatusFilter): void {
    this._filter.set(filter);
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
    this._filter.set('all');

    this.api
      .reconcile(invoices, ledger)
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: (response) => this._result.set(response),
        error: (err: unknown) => this._error.set(mapHttpError(err)),
      });
  }

  dismissError(): void {
    this._error.set(null);
  }
}
