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
    <div class="filter" role="group" [attr.aria-label]="ariaLabel()">
      @for (option of options(); track option.value) {
        <button
          type="button"
          class="filter__option"
          [class.filter__option--active]="option.value === value()"
          [attr.aria-pressed]="option.value === value()"
          (click)="valueChange.emit(option.value)"
        >
          {{ option.label }}
          <span class="filter__count">{{ option.count }}</span>
        </button>
      }
    </div>
  `,
  styles: `
    .filter {
      display: inline-flex;
      flex-wrap: wrap;
      gap: var(--space-2);
    }
    .filter__option {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      min-height: 2.5rem;
      padding: 0 var(--space-4);
      border: 2px solid var(--color-border-strong);
      border-radius: 999px;
      background: var(--color-surface);
      color: var(--color-ink);
      font: inherit;
      font-weight: 600;
      cursor: pointer;
    }
    .filter__option:hover { background: var(--color-muted-bg); }
    .filter__option:focus-visible {
      outline: 3px solid var(--color-focus);
      outline-offset: 2px;
    }
    .filter__option--active,
    .filter__option--active:hover {
      background: var(--color-ink);
      border-color: var(--color-ink);
      color: var(--color-surface);
    }
    .filter__count {
      min-width: 1.75rem;
      padding: 0 0.4rem;
      border-radius: 999px;
      background: var(--color-accent);
      color: var(--color-ink);
      font-size: 0.8rem;
      text-align: center;
      font-variant-numeric: tabular-nums;
    }
  `,
})
export class StatusFilterComponent<T extends string = string> {
  readonly options = input.required<FilterOption<T>[]>();
  readonly value = input.required<T>();
  readonly ariaLabel = input('Filtrar');
  readonly valueChange = output<T>();
}
