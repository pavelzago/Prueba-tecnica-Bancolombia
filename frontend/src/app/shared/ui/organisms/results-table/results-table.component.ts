import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CurrencyPipe, PercentPipe } from '@angular/common';

import {
  CodigoInconsistencia,
  ResultadoFactura,
  StatusFilter,
} from '../../../../core/models/reconciliation.model';
import { BadgeComponent } from '../../atoms/badge/badge.component';
import { FilterOption, StatusFilterComponent } from '../../molecules/status-filter/status-filter.component';

export interface StatusCounts {
  all: number;
  correct: number;
  inconsistent: number;
}

interface Comparison {
  reportedLabel: string;
  reported: number | null;
  expectedLabel: string;
  expected: number | null;
}

interface ResolvedComparison extends Comparison {
  reported: number;
  expected: number;
  difference: number;
}

/** Tolerance used by the backend (±1 COP) to decide whether two amounts differ. */
const TOLERANCE = 1;

/** For amount-related causes, which pair of values explains the difference. */
const COMPARISONS: Partial<Record<CodigoInconsistencia, (r: ResultadoFactura) => Comparison>> = {
  IVA_DIFERENTE: (r) => ({
    reportedLabel: 'IVA reportado',
    reported: r.iva_reportado,
    expectedLabel: 'IVA calculado',
    expected: r.iva_calculado,
  }),
  RETENCION_DIFERENTE: (r) => ({
    reportedLabel: 'Retención reportada',
    reported: r.retencion_reportada,
    expectedLabel: 'Retención calculada',
    expected: r.retencion_calculada,
  }),
  TOTAL_DIFERENTE: (r) => ({
    reportedLabel: 'Total reportado',
    reported: r.total_reportado,
    expectedLabel: 'Total calculado',
    expected: r.total_calculado,
  }),
  VALOR_CONTABLE_DIFERENTE: (r) => ({
    reportedLabel: 'Valor contabilizado',
    reported: r.valor_contabilizado,
    expectedLabel: 'Total de la factura',
    expected: r.total_reportado,
  }),
};

@Component({
  selector: 'app-results-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BadgeComponent, StatusFilterComponent, CurrencyPipe, PercentPipe],
  templateUrl: './results-table.component.html',
  styleUrl: './results-table.component.scss',
})
export class ResultsTableComponent {
  readonly results = input.required<ResultadoFactura[]>();
  readonly filter = input.required<StatusFilter>();
  readonly counts = input.required<StatusCounts>();
  readonly filterChange = output<StatusFilter>();

  protected readonly filterOptions = computed<FilterOption<StatusFilter>[]>(() => [
    { value: 'all', label: 'Todas', count: this.counts().all },
    { value: 'Correcta', label: 'Correctas', count: this.counts().correct },
    { value: 'Con inconsistencia', label: 'Con inconsistencia', count: this.counts().inconsistent },
  ]);

  protected differs(a: number | null, b: number | null): boolean {
    return a !== null && b !== null && Math.abs(a - b) > TOLERANCE;
  }

  protected comparisonFor(
    codigo: CodigoInconsistencia,
    row: ResultadoFactura,
  ): ResolvedComparison | null {
    const comparison = COMPARISONS[codigo]?.(row);
    if (!comparison || comparison.reported === null || comparison.expected === null) {
      return null;
    }
    const { reported, expected } = comparison;
    return { ...comparison, reported, expected, difference: reported - expected };
  }
}
