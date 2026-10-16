import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export interface SelectOption {
  value: string;
  label: string;
}

/** Native select with a (visually hidden) label. `value` '' is the "no selection" option. */
@Component({
  selector: 'app-select-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label class="visually-hidden" [for]="inputId()">{{ label() }}</label>
    <div class="select" [class.select--active]="!!value()">
      <select
        class="select__control"
        [id]="inputId()"
        [disabled]="disabled()"
        (change)="valueChange.emit($any($event.target).value)"
      >
        <option value="" [selected]="!value()">{{ emptyLabel() }}</option>
        @for (option of options(); track option.value) {
          <option [value]="option.value" [selected]="option.value === value()">{{ option.label }}</option>
        }
      </select>
      <svg class="select__chevron" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
        <path d="M6 9.5l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </div>
  `,
  styles: `
    :host { display: block; }
    .select { position: relative; display: flex; align-items: center; }
    .select__control {
      width: 100%;
      min-height: 2.5rem;
      padding: 0 2.25rem 0 var(--space-3);
      border: 1px solid var(--color-border-strong);
      border-radius: var(--radius);
      background: var(--color-surface);
      color: var(--color-ink);
      font: inherit;
      font-size: var(--text-sm);
      appearance: none;
      cursor: pointer;
    }
    .select--active .select__control {
      border-color: var(--color-accent);
      box-shadow: inset 0 -2px 0 var(--color-accent);
      font-weight: var(--weight-semibold);
    }
    .select__control:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 0; border-color: var(--color-focus); }
    .select__control:disabled { opacity: 0.6; cursor: not-allowed; }
    .select__chevron { position: absolute; right: var(--space-3); color: var(--color-ink-soft); pointer-events: none; }
  `,
})
export class SelectFieldComponent {
  readonly inputId = input.required<string>();
  readonly label = input.required<string>();
  readonly options = input.required<SelectOption[]>();
  readonly value = input('');
  /** Text of the "no selection" option. */
  readonly emptyLabel = input('Todos');
  readonly disabled = input(false);
  readonly valueChange = output<string>();
}
