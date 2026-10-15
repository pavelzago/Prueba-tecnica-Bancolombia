import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CurrencyPipe, PercentPipe } from '@angular/common';

import {
  CAUSE_LABELS,
  CodigoInconsistencia,
  ResultadoFactura,
  StatusCounts,
  StatusFilter,
} from '../../../../core/models/reconciliation.model';
import { BadgeComponent } from '../../atoms/badge/badge.component';
import { ButtonComponent } from '../../atoms/button/button.component';
import { EmptyStateComponent } from '../../molecules/empty-state/empty-state.component';
import { StepHeaderComponent } from '../../molecules/step-header/step-header.component';
import { ResultsToolbarComponent } from '../results-toolbar/results-toolbar.component';

/** Tolerance used by the backend (±1 COP) to decide whether two amounts differ. */
const TOLERANCE = 1;

/**
 * For amount-related causes, the [reported, expected] pair behind the difference.
 * The backend description already states both values; the UI adds the signed difference.
 */
const AMOUNT_PAIRS: Partial<
  Record<CodigoInconsistencia, (r: ResultadoFactura) => [number | null, number | null]>
> = {
  IVA_DIFERENTE: (r) => [r.iva_reportado, r.iva_calculado],
  RETENCION_DIFERENTE: (r) => [r.retencion_reportada, r.retencion_calculada],
  TOTAL_DIFERENTE: (r) => [r.total_reportado, r.total_calculado],
  VALOR_CONTABLE_DIFERENTE: (r) => [r.valor_contabilizado, r.total_reportado],
};

/** Step 3: toolbar + invoice-level detail table. */
@Component({
  selector: 'app-results-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    BadgeComponent,
    ButtonComponent,
    EmptyStateComponent,
    StepHeaderComponent,
    ResultsToolbarComponent,
    CurrencyPipe,
    PercentPipe,
  ],
  templateUrl: './results-table.component.html',
  styleUrl: './results-table.component.scss',
})
export class ResultsTableComponent {
  /** False until a reconciliation has been processed. */
  readonly hasResult = input(false);
  readonly results = input.required<ResultadoFactura[]>();
  readonly total = input(0);
  readonly filter = input.required<StatusFilter>();
  readonly counts = input.required<StatusCounts>();
  readonly search = input('');
  readonly causeLabel = input<string | null>(null);
  readonly hasActiveFilters = input(false);

  readonly filterChange = output<StatusFilter>();
  readonly searchChange = output<string>();
  readonly causeClear = output<void>();
  readonly clearFilters = output<void>();
  readonly exportCsv = output<void>();

  protected readonly causeLabels = CAUSE_LABELS;

  protected differs(a: number | null, b: number | null): boolean {
    return a !== null && b !== null && Math.abs(a - b) > TOLERANCE;
  }

  /** Signed difference (reported − expected) for amount causes; null otherwise. */
  protected differenceFor(codigo: CodigoInconsistencia, row: ResultadoFactura): number | null {
    const pair = AMOUNT_PAIRS[codigo]?.(row);
    if (!pair || pair[0] === null || pair[1] === null) {
      return null;
    }
    return pair[0] - pair[1];
  }
}
