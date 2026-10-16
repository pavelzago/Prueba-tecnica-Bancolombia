import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { DecimalPipe, PercentPipe } from '@angular/common';

/**
 * One cause as a clickable horizontal bar. Width is drawn to scale as `count / base`
 * (the summary passes the invoices with an inconsistency), so it reads as a real share.
 */
@Component({
  selector: 'app-cause-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, PercentPipe],
  template: `
    <button
      type="button"
      class="cause"
      [class.cause--active]="active()"
      [attr.aria-pressed]="active()"
      [attr.title]="active() ? 'Quitar filtro' : 'Ver solo estas facturas'"
      (click)="toggled.emit()"
    >
      <span class="cause__label">{{ label() }}</span>
      <span class="cause__track" aria-hidden="true">
        <span class="cause__fill" [style.width.%]="width()"></span>
      </span>
      <span class="cause__count">
        {{ count() | number }}<span class="visually-hidden"> facturas,</span>
        <span class="cause__share">{{ share() | percent: '1.0-0' }}</span>
      </span>
    </button>
  `,
  styles: `
    :host { display: block; }
    .cause {
      display: grid;
      grid-template-columns: minmax(9rem, 15rem) 1fr 5.5rem;
      align-items: center;
      gap: var(--space-3);
      width: 100%;
      min-height: 2.25rem;
      padding: var(--space-1) var(--space-2);
      border: 0;
      border-radius: var(--radius-sm);
      background: transparent;
      color: var(--color-ink);
      text-align: left;
      font-size: var(--text-sm);
      cursor: pointer;
    }
    .cause:hover { background: var(--color-surface-hover); }
    .cause:hover .cause__fill { background: var(--color-ink-soft); }
    .cause--active,
    .cause--active:hover {
      background: var(--color-accent-soft);
      box-shadow: inset 3px 0 0 var(--color-accent);
      font-weight: var(--weight-semibold);
    }
    .cause__track { height: 0.625rem; background: var(--color-bar-track); border-radius: 1px; overflow: hidden; }
    .cause__fill { display: block; height: 100%; min-width: 2px; background: var(--color-bar); transition: background-color var(--duration) ease; }
    .cause--active .cause__fill,
    .cause--active:hover .cause__fill { background: var(--color-ink); }
    .cause__count { display: flex; justify-content: flex-end; gap: var(--space-2); font-family: var(--font-mono); font-variant-numeric: tabular-nums; font-weight: var(--weight-medium); }
    .cause__share { min-width: 2.75rem; text-align: right; font-size: var(--text-xs); font-weight: 400; color: var(--color-ink-soft); }
    @media (max-width: 30rem) {
      .cause { grid-template-columns: 1fr 5.5rem; row-gap: var(--space-1); }
      .cause__track { grid-column: 1 / -1; grid-row: 2; }
    }
  `,
})
export class CauseBarComponent {
  readonly label = input.required<string>();
  readonly count = input.required<number>();
  /** Denominator of the share (invoices with an inconsistency). */
  readonly base = input.required<number>();
  readonly active = input(false);
  readonly toggled = output<void>();

  protected readonly share = computed(() => (this.base() > 0 ? Math.min(this.count() / this.base(), 1) : 0));
  protected readonly width = computed(() => this.share() * 100);
}
