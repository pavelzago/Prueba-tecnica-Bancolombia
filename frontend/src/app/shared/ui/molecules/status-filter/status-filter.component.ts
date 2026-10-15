import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export interface FilterOption<T extends string = string> {
  value: T;
  label: string;
  count: number;
}

/** Segmented control: one option active at a time, each with its counter. */
@Component({
  selector: 'app-status-filter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="seg" role="group" [attr.aria-label]="ariaLabel()">
      @for (option of options(); track option.value) {
        <button
          type="button"
          class="seg__option"
          [class.seg__option--active]="option.value === value()"
          [attr.aria-pressed]="option.value === value()"
          (click)="valueChange.emit(option.value)"
        >
          <span>{{ option.label }}</span>
          <span class="seg__count">{{ option.count }}</span>
        </button>
      }
    </div>
  `,
  styles: `
    :host { display: inline-flex; max-width: 100%; }
    .seg {
      display: inline-flex;
      flex-wrap: wrap;
      max-width: 100%;
      padding: 2px;
      border: 1px solid var(--color-border-strong);
      border-radius: var(--radius);
      background: var(--color-surface-sunken);
    }
    .seg__option {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      min-height: 2.25rem;
      padding: 0 var(--space-3);
      border: 0;
      border-radius: var(--radius-sm);
      background: transparent;
      color: var(--color-ink-soft);
      font-size: var(--text-sm);
      font-weight: var(--weight-medium);
      cursor: pointer;
      white-space: nowrap;
    }
    .seg__option:hover { color: var(--color-ink); background: var(--color-surface-hover); }
    .seg__option--active,
    .seg__option--active:hover {
      background: var(--color-surface);
      color: var(--color-ink);
      font-weight: var(--weight-semibold);
      box-shadow: inset 0 -2px 0 var(--color-accent), 0 0 0 1px var(--color-border);
    }
    .seg__count {
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      font-variant-numeric: tabular-nums;
      color: var(--color-ink-faint);
    }
    .seg__option--active .seg__count { color: var(--color-ink); }
  `,
})
export class StatusFilterComponent<T extends string = string> {
  readonly options = input.required<FilterOption<T>[]>();
  readonly value = input.required<T>();
  readonly ariaLabel = input('Filtrar');
  readonly valueChange = output<T>();
}
