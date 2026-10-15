import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';

import { CAUSE_LABELS } from '../../core/models/reconciliation.model';
import { ReconciliationStore } from '../../core/services/reconciliation.store';
import { buildResultsCsv, downloadTextFile } from '../../core/utils/csv-export';
import { AlertComponent } from '../../shared/ui/atoms/alert/alert.component';
import { ResultsTableComponent } from '../../shared/ui/organisms/results-table/results-table.component';
import { SummaryPanelComponent } from '../../shared/ui/organisms/summary-panel/summary-panel.component';
import { FileChangeEvent, UploadPanelComponent } from '../../shared/ui/organisms/upload-panel/upload-panel.component';
import { ReconciliationLayoutComponent } from '../../templates/reconciliation-layout/reconciliation-layout.component';

/** The only "smart" component: wires the store to the presentational organisms. */
@Component({
  selector: 'app-reconciliation-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReconciliationLayoutComponent,
    AlertComponent,
    UploadPanelComponent,
    SummaryPanelComponent,
    ResultsTableComponent,
  ],
  template: `
    <app-reconciliation-layout
      title="Conciliador de facturas y retenciones"
      subtitle="Cruza las facturas de proveedores con su registro contable y encuentra cuáles no cuadran y por qué."
    >
      <ng-container layoutAlert>
        @if (store.error(); as error) {
          <app-alert
            tone="error"
            title="No se pudo procesar la conciliación"
            [message]="error.message"
            [details]="error.details"
            [dismissible]="true"
            (dismissed)="store.dismissError()"
          />
        }
      </ng-container>

      <app-upload-panel
        layoutUpload
        [invoicesFile]="store.invoicesFile()"
        [ledgerFile]="store.ledgerFile()"
        [loading]="store.loading()"
        [canProcess]="store.canProcess()"
        [compact]="uploadCompact()"
        [canCancel]="!!store.result()"
        [processedAt]="store.processedAt()"
        (fileChange)="onFileChange($event)"
        (process)="store.process()"
        (loadSample)="store.loadSample()"
        (expand)="changingFiles.set(true)"
        (collapse)="changingFiles.set(false)"
      />

      <ng-container layoutResults>
        <app-summary-panel
          [summary]="store.summary()"
          [loading]="store.loading()"
          [activeCause]="store.causeFilter()"
          (causeToggle)="store.toggleCause($event)"
        />

        <app-results-table
          [hasResult]="!!store.result()"
          [results]="store.filteredResults()"
          [total]="store.totalResults()"
          [filter]="store.filter()"
          [counts]="store.statusCounts()"
          [search]="store.search()"
          [causeLabel]="causeLabel()"
          [hasActiveFilters]="store.hasActiveFilters()"
          (filterChange)="store.setFilter($event)"
          (searchChange)="store.setSearch($event)"
          (causeClear)="store.clearCause()"
          (clearFilters)="store.clearFilters()"
          (exportCsv)="exportCsv()"
        />
      </ng-container>
    </app-reconciliation-layout>
  `,
})
export class ReconciliationPageComponent {
  protected readonly store = inject(ReconciliationStore);

  /** UI-only: the user reopened step 1 over an existing result. */
  protected readonly changingFiles = signal(false);

  protected readonly uploadCompact = computed(
    () => !!this.store.result() && !this.changingFiles() && !this.store.loading(),
  );

  protected readonly causeLabel = computed(() => {
    const cause = this.store.causeFilter();
    return cause ? CAUSE_LABELS[cause] : null;
  });

  constructor() {
    // A new successful run collapses step 1 back to its one-line summary.
    effect(() => {
      if (this.store.processedAt()) {
        this.changingFiles.set(false);
      }
    });
  }

  protected onFileChange({ kind, file }: FileChangeEvent): void {
    this.store.setFile(kind, file);
  }

  protected exportCsv(): void {
    const rows = this.store.filteredResults();
    if (!rows.length) return;
    const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');
    downloadTextFile(`conciliacion-${stamp}.csv`, buildResultsCsv(rows));
  }
}
