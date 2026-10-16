import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, viewChild } from '@angular/core';

import { CAUSE_LABELS } from '../../core/models/reconciliation.model';
import { ReconciliationStore } from '../../core/services/reconciliation.store';
import { ThemeService } from '../../core/services/theme.service';
import { buildResultsCsv, downloadTextFile } from '../../core/utils/csv-export';
import { AlertComponent } from '../../shared/ui/atoms/alert/alert.component';
import { SelectOption } from '../../shared/ui/atoms/select-field/select-field.component';
import { ThemeSwitchComponent } from '../../shared/ui/molecules/theme-switch/theme-switch.component';
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
    ThemeSwitchComponent,
  ],
  template: `
    <app-reconciliation-layout
      title="Conciliador de facturas y retenciones"
      subtitle="Cruza las facturas de proveedores con su registro contable y encuentra cuáles no cuadran y por qué."
    >
      <app-theme-switch layoutActions [value]="theme.preference()" (valueChange)="theme.setPreference($event)" />

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
        [invalidFile]="store.invalidFile()"
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
          [insights]="store.insights()"
          [invoicesName]="store.invoicesFile()?.name ?? ''"
          [ledgerName]="store.ledgerFile()?.name ?? ''"
          [processedAt]="store.processedAt()"
          [loading]="store.loading()"
          [skeleton]="store.showSkeleton()"
          [activeCause]="store.causeFilter()"
          (causeToggle)="store.toggleCause($event)"
        />

        <app-results-table
          [hasResult]="!!store.result()"
          [results]="store.pagedResults()"
          [shown]="store.filteredResults().length"
          [total]="store.totalResults()"
          [pagination]="store.pageInfo()"
          [pageSizeOptions]="store.pageSizeOptions"
          [skeleton]="store.showSkeleton()"
          [filter]="store.filter()"
          [counts]="store.statusCounts()"
          [search]="store.search()"
          [causeOptions]="causeOptions()"
          [cause]="store.causeFilter()"
          [hasActiveFilters]="store.hasActiveFilters()"
          (filterChange)="store.setFilter($event)"
          (searchChange)="store.setSearch($event)"
          (causeChange)="store.setCause($event)"
          (clearFilters)="store.clearFilters()"
          (exportCsv)="exportCsv()"
          (pageChange)="onPageChange($event)"
          (pageSizeChange)="store.setPageSize($event)"
        />
      </ng-container>
    </app-reconciliation-layout>
  `,
})
export class ReconciliationPageComponent {
  protected readonly store = inject(ReconciliationStore);
  protected readonly theme = inject(ThemeService);

  private readonly table = viewChild.required(ResultsTableComponent);

  /** UI-only: the user reopened step 1 over an existing result. */
  protected readonly changingFiles = signal(false);

  protected readonly uploadCompact = computed(
    () => !!this.store.result() && !this.changingFiles() && !this.store.loading(),
  );

  /** Error types present in the result, with how many invoices have each. */
  protected readonly causeOptions = computed<SelectOption[]>(() =>
    (this.store.summary()?.por_causa ?? [])
      .filter((c) => c.cantidad > 0)
      .map((c) => ({ value: c.codigo, label: `${CAUSE_LABELS[c.codigo]} (${c.cantidad})` })),
  );

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

  /** Paging moves the reader back to the first row of the table. */
  protected onPageChange(page: number): void {
    this.store.setPage(page);
    this.table().scrollToTop();
  }

  /** Exports every filtered row (all pages), not only the visible page. */
  protected exportCsv(): void {
    const rows = this.store.filteredResults();
    if (!rows.length) return;
    const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');
    downloadTextFile(`conciliacion-${stamp}.csv`, buildResultsCsv(rows));
  }
}
