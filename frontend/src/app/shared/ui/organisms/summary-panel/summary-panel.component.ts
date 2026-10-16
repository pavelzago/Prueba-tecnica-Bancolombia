import { ChangeDetectionStrategy, Component, LOCALE_ID, computed, inject, input, output } from '@angular/core';
import { DatePipe, DecimalPipe, formatCurrency, formatPercent } from '@angular/common';

import {
  CauseFilter,
  CodigoInconsistencia,
  Summary,
} from '../../../../core/models/reconciliation.model';
import { SummaryInsights } from '../../../../core/utils/summary-insights';
import { SkeletonComponent } from '../../atoms/skeleton/skeleton.component';
import { CauseBarComponent } from '../../molecules/cause-bar/cause-bar.component';
import { DonutChartComponent, DonutSlice } from '../../molecules/donut-chart/donut-chart.component';
import { EmptyStateComponent } from '../../molecules/empty-state/empty-state.component';
import { StatCardComponent, StatTone } from '../../molecules/stat-card/stat-card.component';
import { StepHeaderComponent } from '../../molecules/step-header/step-header.component';

interface Kpi {
  label: string;
  value: string;
  caption: string;
  tone: StatTone;
}

/**
 * Step 2: headline, key figures, composition of the result (donut), net differences by
 * concept and the actionable breakdown by cause (click a cause to filter the table).
 */
@Component({
  selector: 'app-summary-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    DecimalPipe,
    StatCardComponent,
    CauseBarComponent,
    DonutChartComponent,
    EmptyStateComponent,
    SkeletonComponent,
    StepHeaderComponent,
  ],
  templateUrl: './summary-panel.component.html',
  styleUrl: './summary-panel.component.scss',
})
export class SummaryPanelComponent {
  private readonly locale = inject(LOCALE_ID);

  readonly summary = input<Summary | null>(null);
  readonly insights = input<SummaryInsights | null>(null);
  readonly invoicesName = input('');
  readonly ledgerName = input('');
  readonly processedAt = input<Date | null>(null);
  readonly loading = input(false);
  /** A slow load is in progress: draw the summary silhouette. */
  readonly skeleton = input(false);
  readonly activeCause = input<CauseFilter>(null);
  readonly causeToggle = output<CodigoInconsistencia>();

  protected readonly causeSkeletonWidths = [
    { label: '72%', bar: '100%' },
    { label: '58%', bar: '74%' },
    { label: '80%', bar: '52%' },
    { label: '64%', bar: '30%' },
  ];

  protected readonly headline = computed(() => {
    const s = this.summary();
    if (!s) return '';
    if (!s.con_inconsistencia) {
      return s.total_facturas === 1 ? 'La factura cuadra.' : `Las ${this.count(s.total_facturas)} facturas cuadran.`;
    }
    const verb = s.con_inconsistencia === 1 ? 'requiere' : 'requieren';
    return `${this.count(s.con_inconsistencia)} de ${this.count(s.total_facturas)} facturas ${verb} revisión.`;
  });

  protected readonly kpis = computed<Kpi[]>(() => {
    const s = this.summary();
    const k = this.insights();
    if (!s || !k) return [];
    const share = (n: number) =>
      s.total_facturas ? `${formatPercent(n / s.total_facturas, this.locale, '1.0-1')} del total` : '';
    const diff = k.ledgerDifference;
    return [
      {
        label: 'Facturas analizadas',
        value: this.count(s.total_facturas),
        caption: `${this.count(s.total_registros_contables)} registros contables`,
        tone: 'neutral',
      },
      { label: 'Correctas', value: this.count(s.correctas), caption: share(s.correctas), tone: 'success' },
      {
        label: 'Con inconsistencia',
        value: this.count(s.con_inconsistencia),
        caption: share(s.con_inconsistencia),
        tone: 'danger',
      },
      {
        label: 'Sin contabilizar',
        value: this.money(k.unposted.amount),
        caption: `${this.count(k.unposted.count)} ${k.unposted.count === 1 ? 'factura' : 'facturas'} sin registro contable`,
        tone: k.unposted.count ? 'danger' : 'neutral',
      },
      {
        label: 'Diferencia neta contable',
        value: this.signedMoney(diff.amount),
        caption: diff.count
          ? `contabilidad − factura · ${this.count(diff.count)} ${diff.count === 1 ? 'factura' : 'facturas'}`
          : 'contabilidad − factura',
        tone: diff.amount ? 'warning' : 'neutral',
      },
    ];
  });

  /** Facts only: correct / one cause / several causes (no ranking of causes). */
  protected readonly slices = computed<DonutSlice[]>(() => {
    const b = this.insights()?.breakdown;
    if (!b) return [];
    return [
      { label: 'Correctas', value: b.correct, color: 'var(--chart-ok)' },
      { label: 'Con 1 inconsistencia', value: b.single, color: 'var(--chart-one)' },
      { label: 'Con 2 o más inconsistencias', value: b.multiple, color: 'var(--chart-many)' },
    ];
  });

  /** Bridges the donut (invoices) and the cause list (invoice–cause pairs). */
  protected readonly causesNote = computed(() => {
    const s = this.summary();
    const k = this.insights();
    if (!s || !k || !k.causeCount) return '';
    const invoices = s.con_inconsistencia === 1 ? 'factura' : 'facturas';
    const base = `${this.count(k.causeCount)} ${k.causeCount === 1 ? 'causa' : 'causas'} en ${this.count(s.con_inconsistencia)} ${invoices}`;
    const multiple = k.breakdown.multiple;
    if (!multiple) return `${base}.`;
    return `${base}: ${this.count(multiple)} ${multiple === 1 ? 'factura tiene' : 'facturas tienen'} más de una, por eso la suma es mayor.`;
  });

  protected readonly donutLabel = computed(() =>
    'Estado de las facturas: ' + this.slices().map((s) => `${s.label} ${s.value}`).join(', '),
  );

  protected signedMoney(amount: number): string {
    const formatted = this.money(Math.abs(amount));
    if (amount > 0) return `+${formatted}`;
    if (amount < 0) return `−${formatted}`;
    return formatted;
  }

  private money(amount: number): string {
    return formatCurrency(amount, this.locale, '$', 'COP', '1.0-2');
  }

  private count(n: number): string {
    return new Intl.NumberFormat(this.locale).format(n);
  }
}
