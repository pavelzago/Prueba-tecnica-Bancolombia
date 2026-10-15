import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';

/**
 * One cause as a clickable horizontal bar. Width is drawn to scale:
 * `count / max` of the largest cause in the list.
 */
@Component({
  selector: 'app-cause-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe],
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
      <span class="cause__count">{{ count() | number }}<span class="visually-hidden"> facturas</span></span>
    </button>
  `,
  styles: `
    :host { display: block; }
    .cause {
      display: grid;
      grid-template-columns: minmax(9rem, 15rem) 1fr 3.5rem;
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
    .cause__count { font-family: var(--font-mono); font-variant-numeric: tabular-nums; text-align: right; font-weight: var(--weight-medium); }
    @media (max-width: 30rem) {
      .cause { grid-template-columns: 1fr 3.5rem; row-gap: var(--space-1); }
      .cause__track { grid-column: 1 / -1; grid-row: 2; }
    }
  `,
})
export class CauseBarComponent {
  readonly label = input.required<string>();
  readonly count = input.required<number>();
  readonly max = input.required<number>();
  readonly active = input(false);
  readonly toggled = output<void>();

  protected readonly width = computed(() => (this.max() > 0 ? (this.count() / this.max()) * 100 : 0));
}
