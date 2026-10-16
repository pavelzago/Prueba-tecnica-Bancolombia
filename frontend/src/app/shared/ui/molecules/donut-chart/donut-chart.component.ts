import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DecimalPipe, PercentPipe } from '@angular/common';

export interface DonutSlice {
  label: string;
  value: number;
  /** Any CSS color, usually a token: `var(--chart-...)`. */
  color: string;
}

interface DrawnSlice extends DonutSlice {
  dash: string;
  offset: number;
  share: number;
}

const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
/** Visual gap between slices, in the same units as the circumference. */
const GAP = 1.2;

/**
 * Donut chart drawn to scale (each arc = value / total of the circle), with the total in the
 * centre and a legend that carries the exact figures. Pure SVG, no chart library.
 */
@Component({
  selector: 'app-donut-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, PercentPipe],
  template: `
    <div class="donut">
      <svg class="donut__chart" viewBox="0 0 100 100" role="img" [attr.aria-label]="ariaLabel()">
        <g transform="rotate(-90 50 50)">
          <circle class="donut__track" cx="50" cy="50" [attr.r]="radius" />
          @for (slice of drawn(); track slice.label) {
          <circle
            class="donut__slice"
            cx="50"
            cy="50"
            [attr.r]="radius"
            [attr.stroke]="slice.color"
            [attr.stroke-dasharray]="slice.dash"
            [attr.stroke-dashoffset]="slice.offset"
          />
          }
        </g>
        <text class="donut__total" x="50" y="49" text-anchor="middle">{{ total() | number }}</text>
        <text class="donut__unit" x="50" y="61" text-anchor="middle">{{ unit() }}</text>
      </svg>

      <ul class="donut__legend">
        @for (slice of drawn(); track slice.label) {
          <li class="donut__item">
            <span class="donut__swatch" [style.background]="slice.color" aria-hidden="true"></span>
            <span class="donut__label">{{ slice.label }}</span>
            <span class="donut__value">{{ slice.value | number }}</span>
            <span class="donut__share">{{ slice.share | percent: '1.0-0' }}</span>
          </li>
        }
      </ul>
    </div>
  `,
  styles: `
    :host { display: block; }
    .donut {
      display: grid;
      grid-template-columns: minmax(9rem, 11rem) minmax(0, 1fr);
      align-items: center;
      gap: var(--space-5);
    }
    @media (max-width: 30rem) {
      .donut { grid-template-columns: minmax(0, 1fr); justify-items: center; }
      .donut__legend { width: 100%; }
    }
    .donut__chart { width: 100%; max-width: 11rem; height: auto; overflow: visible; }
    .donut__track, .donut__slice { fill: none; stroke-width: 13; }
    .donut__track { stroke: var(--color-bar-track); }
    .donut__total { fill: var(--color-ink); }
    .donut__total { font-size: 17px; font-weight: var(--weight-semibold); font-variant-numeric: tabular-nums; }
    .donut__unit { font-size: 7px; fill: var(--color-ink-soft); letter-spacing: 0.04em; }
    .donut__legend { display: grid; gap: 2px; margin: 0; padding: 0; list-style: none; min-width: 0; }
    .donut__item {
      display: grid;
      grid-template-columns: 0.75rem minmax(0, 1fr) 2.5rem 2.75rem;
      align-items: center;
      gap: var(--space-2);
      min-height: 1.75rem;
      font-size: var(--text-sm);
    }
    .donut__swatch { width: 0.75rem; height: 0.75rem; border-radius: 2px; }
    .donut__label { min-width: 0; }
    .donut__value, .donut__share { text-align: right; font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
    .donut__value { font-weight: var(--weight-semibold); }
    .donut__share { font-size: var(--text-xs); color: var(--color-ink-faint); }
  `,
})
export class DonutChartComponent {
  readonly slices = input.required<DonutSlice[]>();
  /** Word under the total, e.g. "facturas". */
  readonly unit = input('');
  readonly ariaLabel = input('Gráfico de dona');

  protected readonly radius = RADIUS;

  protected readonly total = computed(() => this.slices().reduce((sum, s) => sum + s.value, 0));

  protected readonly drawn = computed<DrawnSlice[]>(() => {
    const total = this.total();
    const visible = this.slices().filter((s) => s.value > 0);
    const gap = visible.length > 1 ? GAP : 0;
    let start = 0;
    return visible.map((slice) => {
      const length = total ? (slice.value / total) * CIRCUMFERENCE : 0;
      const drawnLength = Math.max(length - gap, 0.5);
      const result: DrawnSlice = {
        ...slice,
        share: total ? slice.value / total : 0,
        dash: `${drawnLength} ${CIRCUMFERENCE - drawnLength}`,
        offset: -start,
      };
      start += length;
      return result;
    });
  });
}
