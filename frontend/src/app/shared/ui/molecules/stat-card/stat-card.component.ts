import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DecimalPipe, PercentPipe } from '@angular/common';

import { IconComponent, IconName } from '../../atoms/icon/icon.component';

export type StatTone = 'neutral' | 'success' | 'danger';

const ICONS: Record<StatTone, IconName> = { neutral: 'file', success: 'check', danger: 'alert' };

/** One key figure: label (with icon), value and optional share of the total. */
@Component({
  selector: 'app-stat-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, PercentPipe, IconComponent],
  template: `
    <div [class]="'stat stat--' + tone()">
      <p class="stat__label">
        <app-icon [name]="icon()" [size]="15" [strokeWidth]="2.25" />
        {{ label() }}
      </p>
      <p class="stat__value">
        {{ value() | number }}
        @if (share() !== null) {
          <span class="stat__share">{{ share() | percent: '1.0-1' }}</span>
        }
      </p>
      @if (caption()) {
        <p class="stat__caption">{{ caption() }}</p>
      }
    </div>
  `,
  styles: `
    :host { display: block; min-width: 0; }
    .stat { padding: var(--space-3) 0 var(--space-3) var(--space-4); border-left: 3px solid var(--color-border-strong); }
    .stat--success { border-left-color: var(--color-success); }
    .stat--danger { border-left-color: var(--color-danger); }
    .stat__label {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      margin: 0;
      font-size: var(--text-sm);
      font-weight: var(--weight-medium);
      color: var(--color-ink-soft);
    }
    .stat--success .stat__label app-icon { color: var(--color-success); }
    .stat--danger .stat__label app-icon { color: var(--color-danger); }
    .stat__value {
      display: flex;
      flex-wrap: wrap;
      row-gap: var(--space-1);
      align-items: baseline;
      gap: var(--space-3);
      margin: var(--space-1) 0 0;
      font-size: var(--text-2xl);
      font-weight: var(--weight-semibold);
      line-height: 1;
      font-variant-numeric: tabular-nums;
    }
    .stat__share {
      font-family: var(--font-mono);
      font-size: var(--text-md);
      font-weight: var(--weight-medium);
      color: var(--color-ink-soft);
    }
    .stat__caption { margin: var(--space-1) 0 0; font-size: var(--text-xs); color: var(--color-ink-faint); }
    /* Narrow screens: one compact line per figure (label left, value right). */
    @media (max-width: 30rem) {
      .stat { display: grid; grid-template-columns: 1fr auto; align-items: center; column-gap: var(--space-3); padding-block: var(--space-2); }
      .stat__value { margin: 0; font-size: var(--text-xl); grid-row: 1 / span 2; grid-column: 2; }
      .stat__share { font-size: var(--text-xs); }
      .stat__caption { margin: 0; }
    }
  `,
})
export class StatCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<number>();
  /** Fraction 0..1 of the total; null hides it. */
  readonly share = input<number | null>(null);
  readonly caption = input('');
  readonly tone = input<StatTone>('neutral');

  protected readonly icon = computed(() => ICONS[this.tone()]);
}
