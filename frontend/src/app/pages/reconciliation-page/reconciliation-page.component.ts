import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { ReconciliationStore } from '../../core/services/reconciliation.store';
import { AlertComponent } from '../../shared/ui/atoms/alert/alert.component';
import { ResultsTableComponent, StatusCounts } from '../../shared/ui/organisms/results-table/results-table.component';
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
      subtitle="Carga las facturas de proveedores y su contabilización para identificar automáticamente las que están correctas y las que presentan inconsistencias."
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
        (fileChange)="onFileChange($event)"
        (process)="store.process()"
      />

      <ng-container layoutResults>
        @if (store.summary(); as summary) {
          <app-summary-panel [summary]="summary" />

          <app-results-table
            [results]="store.filteredResults()"
            [filter]="store.filter()"
            [counts]="counts()"
            (filterChange)="store.setFilter($event)"
          />
        }
      </ng-container>
    </app-reconciliation-layout>
  `,
})
export class ReconciliationPageComponent {
  protected readonly store = inject(ReconciliationStore);

  protected readonly counts = computed<StatusCounts>(() => {
    const summary = this.store.summary();
    return {
      all: summary?.total_facturas ?? 0,
      correct: summary?.correctas ?? 0,
      inconsistent: summary?.con_inconsistencia ?? 0,
    };
  });

  protected onFileChange({ kind, file }: FileChangeEvent): void {
    this.store.setFile(kind, file);
  }
}
