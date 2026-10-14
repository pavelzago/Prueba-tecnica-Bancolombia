import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { PercentPipe } from '@angular/common';

import { Summary } from '../../../../core/models/reconciliation.model';
import { StatCardComponent } from '../../molecules/stat-card/stat-card.component';

@Component({
  selector: 'app-summary-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StatCardComponent, PercentPipe],
  template: `
    <section class="panel" aria-labelledby="summary-title">
      <h2 id="summary-title" class="panel__title">2. Resumen</h2>
      <div class="summary__cards">
        <app-stat-card
          label="Facturas procesadas"
          [value]="summary().total_facturas"
          [caption]="summary().total_registros_contables + ' registros contables leídos'"
        />
        <app-stat-card
          label="Correctas"
          tone="success"
          [value]="summary().correctas"
          [caption]="(ratio(summary().correctas) | percent: '1.0-1') + ' del total'"
        />
        <app-stat-card
          label="Con inconsistencia"
          tone="danger"
          [value]="summary().con_inconsistencia"
          [caption]="(ratio(summary().con_inconsistencia) | percent: '1.0-1') + ' del total'"
        />
      </div>

      <h3 class="summary__subtitle">Inconsistencias por causa</h3>
      @if (summary().por_causa.length) {
        <p class="summary__note">Una factura puede tener más de una causa.</p>
        <ul class="causes">
          @for (cause of summary().por_causa; track cause.codigo) {
            <li class="causes__item">
              <span class="causes__label">{{ cause.descripcion }}</span>
              <span class="causes__bar" aria-hidden="true">
                <span class="causes__fill" [style.width.%]="(cause.cantidad / maxCause()) * 100"></span>
              </span>
              <span class="causes__count">{{ cause.cantidad }}</span>
            </li>
          }
        </ul>
      } @else {
        <p class="summary__note">No se encontraron inconsistencias.</p>
      }
    </section>
  `,
  styleUrl: './summary-panel.component.scss',
})
export class SummaryPanelComponent {
  readonly summary = input.required<Summary>();

  protected readonly maxCause = computed(() =>
    Math.max(1, ...this.summary().por_causa.map((c) => c.cantidad)),
  );

  protected ratio(value: number): number {
    const total = this.summary().total_facturas;
    return total ? value / total : 0;
  }
}
