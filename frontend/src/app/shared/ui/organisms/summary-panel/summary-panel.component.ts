import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';

import { CauseFilter, CodigoInconsistencia, Summary } from '../../../../core/models/reconciliation.model';
import { SkeletonComponent } from '../../atoms/skeleton/skeleton.component';
import { CauseBarComponent } from '../../molecules/cause-bar/cause-bar.component';
import { EmptyStateComponent } from '../../molecules/empty-state/empty-state.component';
import { StatCardComponent } from '../../molecules/stat-card/stat-card.component';
import { StepHeaderComponent } from '../../molecules/step-header/step-header.component';

/** Step 2: key figures + actionable breakdown by cause (click a cause to filter the table). */
@Component({
  selector: 'app-summary-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, StatCardComponent, CauseBarComponent, EmptyStateComponent, SkeletonComponent, StepHeaderComponent],
  templateUrl: './summary-panel.component.html',
  styleUrl: './summary-panel.component.scss',
})
export class SummaryPanelComponent {
  readonly summary = input<Summary | null>(null);
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
    { label: '70%', bar: '14%' },
  ];

  protected readonly maxCause = computed(() =>
    Math.max(0, ...(this.summary()?.por_causa ?? []).map((c) => c.cantidad)),
  );

  protected ratio(value: number): number {
    const total = this.summary()?.total_facturas ?? 0;
    return total ? value / total : 0;
  }
}
