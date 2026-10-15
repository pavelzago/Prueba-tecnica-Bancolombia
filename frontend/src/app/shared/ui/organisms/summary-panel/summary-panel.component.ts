import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { CauseFilter, CodigoInconsistencia, Summary } from '../../../../core/models/reconciliation.model';
import { SpinnerComponent } from '../../atoms/spinner/spinner.component';
import { CauseBarComponent } from '../../molecules/cause-bar/cause-bar.component';
import { EmptyStateComponent } from '../../molecules/empty-state/empty-state.component';
import { StatCardComponent } from '../../molecules/stat-card/stat-card.component';
import { StepHeaderComponent } from '../../molecules/step-header/step-header.component';

/** Step 2: key figures + actionable breakdown by cause (click a cause to filter the table). */
@Component({
  selector: 'app-summary-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StatCardComponent, CauseBarComponent, EmptyStateComponent, SpinnerComponent, StepHeaderComponent],
  templateUrl: './summary-panel.component.html',
  styleUrl: './summary-panel.component.scss',
})
export class SummaryPanelComponent {
  readonly summary = input<Summary | null>(null);
  readonly loading = input(false);
  readonly activeCause = input<CauseFilter>(null);
  readonly causeToggle = output<CodigoInconsistencia>();

  protected readonly maxCause = computed(() =>
    Math.max(0, ...(this.summary()?.por_causa ?? []).map((c) => c.cantidad)),
  );

  protected ratio(value: number): number {
    const total = this.summary()?.total_facturas ?? 0;
    return total ? value / total : 0;
  }
}
