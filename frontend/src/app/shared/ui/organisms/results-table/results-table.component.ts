import { ChangeDetectionStrategy, Component, ElementRef, input, output, viewChild } from '@angular/core';
import { CurrencyPipe, PercentPipe } from '@angular/common';

import {
  CAUSE_LABELS,
  CodigoInconsistencia,
  PageInfo,
  ResultadoFactura,
  StatusCounts,
  StatusFilter,
} from '../../../../core/models/reconciliation.model';
import { BadgeComponent } from '../../atoms/badge/badge.component';
import { ButtonComponent } from '../../atoms/button/button.component';
import { SkeletonComponent } from '../../atoms/skeleton/skeleton.component';
import { EmptyStateComponent } from '../../molecules/empty-state/empty-state.component';
import { PaginatorComponent } from '../../molecules/paginator/paginator.component';
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
    PaginatorComponent,
    SkeletonComponent,
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
  /** Rows of the current page only. */
  readonly results = input.required<ResultadoFactura[]>();
  /** Rows after all filters, across every page. */
  readonly shown = input(0);
  /** Rows in the whole result. */
  readonly total = input(0);
  readonly pagination = input<PageInfo | null>(null);
  readonly pageSizeOptions = input<readonly number[]>([25, 50, 100]);
  /** A slow load is in progress: draw the table silhouette. */
  readonly skeleton = input(false);
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
  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();

  protected readonly causeLabels = CAUSE_LABELS;
  protected readonly skeletonRows = Array.from({ length: 8 }, (_, i) => i);

  private readonly tableWrap = viewChild<ElementRef<HTMLElement>>('tableWrap');

  /** Brings the start of the table into view and moves focus to it (called by the page after paging). */
  scrollToTop(): void {
    const wrap = this.tableWrap()?.nativeElement;
    if (!wrap) return;
    wrap.scrollTop = 0;
    wrap.focus({ preventScroll: true });
    wrap.scrollIntoView({ block: 'start' });
  }

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
