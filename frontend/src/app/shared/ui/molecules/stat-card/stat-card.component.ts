import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';

export type StatTone = 'neutral' | 'success' | 'danger';

@Component({
  selector: 'app-stat-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe],
  template: `
    <article [class]="'card card--' + tone()">
      <p class="card__label">{{ label() }}</p>
      <p class="card__value">{{ value() | number }}</p>
      @if (caption()) {
        <p class="card__caption">{{ caption() }}</p>
      }
    </article>
  `,
  styles: `
    .card {
      height: 100%;
      padding: var(--space-4);
      border: 1px solid var(--color-border);
      border-top: 6px solid var(--color-ink);
      border-radius: var(--radius-lg);
      background: var(--color-surface);
    }
    .card--success { border-top-color: var(--color-success); }
    .card--danger { border-top-color: var(--color-danger); }
    .card__label {
      margin: 0;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-ink-soft);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .card__value {
      margin: var(--space-1) 0 0;
      font-size: 2.25rem;
      font-weight: 800;
      line-height: 1.1;
      font-variant-numeric: tabular-nums;
    }
    .card__caption {
      margin: var(--space-1) 0 0;
      font-size: 0.875rem;
      color: var(--color-ink-soft);
    }
  `,
})
export class StatCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<number>();
  readonly caption = input('');
  readonly tone = input<StatTone>('neutral');
}
