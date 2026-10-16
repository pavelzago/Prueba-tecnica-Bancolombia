import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type StatTone = 'neutral' | 'success' | 'danger' | 'warning';

/**
 * One key figure of the summary strip: coloured dot + label, the value and a caption.
 * The value arrives already formatted (count, money or signed money) by the parent.
 */
@Component({
  selector: 'app-stat-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [class]="'stat stat--' + tone()">
      <p class="stat__label"><span class="stat__dot" aria-hidden="true"></span>{{ label() }}</p>
      <p class="stat__value">{{ value() }}</p>
      @if (caption()) {
        <p class="stat__caption">{{ caption() }}</p>
      }
    </div>
  `,
  styles: `
    :host { display: block; min-width: 0; }
    .stat { display: grid; gap: var(--space-1); padding: var(--space-4) var(--space-5); }
    .stat__label {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      margin: 0;
      font-size: var(--text-sm);
      color: var(--color-ink-soft);
    }
    .stat__dot { width: 0.5rem; height: 0.5rem; border-radius: 50%; background: var(--color-ink); flex: none; }
    .stat__value {
      margin: 0;
      font-size: var(--text-2xl);
      font-weight: var(--weight-semibold);
      line-height: 1.1;
      font-variant-numeric: tabular-nums;
      overflow-wrap: anywhere;
    }
    .stat__caption { margin: 0; font-size: var(--text-xs); color: var(--color-ink-soft); }
    .stat--success .stat__dot { background: var(--color-success); }
    .stat--success .stat__value { color: var(--color-success); }
    .stat--danger .stat__dot { background: var(--color-danger); }
    .stat--danger .stat__value { color: var(--color-danger); }
    .stat--warning .stat__dot { background: var(--chart-total); }
    .stat--warning .stat__value { color: var(--color-warning); }
    @media (max-width: 30rem) {
      .stat { padding: var(--space-3) var(--space-4); }
      .stat__value { font-size: var(--text-xl); }
    }
  `,
})
export class StatCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly tone = input<StatTone>('neutral');
  readonly caption = input('');
}
