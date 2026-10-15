import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { IconComponent } from '../icon/icon.component';

/** Text search with a (visually hidden) label, search icon and a clear button. Emits on every keystroke. */
@Component({
  selector: 'app-search-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <label class="visually-hidden" [for]="inputId()">{{ label() }}</label>
    <div class="search">
      <app-icon class="search__icon" name="search" [size]="16" />
      <input
        class="search__input"
        type="search"
        autocomplete="off"
        spellcheck="false"
        [id]="inputId()"
        [placeholder]="placeholder()"
        [value]="value()"
        (input)="valueChange.emit($any($event.target).value)"
        (keydown.escape)="valueChange.emit('')"
      />
      @if (value()) {
        <button type="button" class="search__clear" aria-label="Borrar búsqueda" (click)="valueChange.emit('')">
          <app-icon name="close" [size]="14" [strokeWidth]="2.5" />
        </button>
      }
    </div>
  `,
  styles: `
    :host { display: block; }
    .search { position: relative; display: flex; align-items: center; }
    .search__icon { position: absolute; left: var(--space-3); color: var(--color-ink-faint); pointer-events: none; }
    .search__input {
      width: 100%;
      min-height: 2.5rem;
      padding: 0 2.25rem 0 2.25rem;
      border: 1px solid var(--color-border-strong);
      border-radius: var(--radius);
      background: var(--color-surface);
      color: var(--color-ink);
      font-size: var(--text-md);
    }
    .search__input::placeholder { color: var(--color-ink-faint); }
    .search__input::-webkit-search-cancel-button { display: none; }
    .search__input:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 0; border-color: var(--color-focus); }
    .search__clear {
      position: absolute;
      right: var(--space-1);
      display: grid;
      place-items: center;
      width: 2rem;
      height: 2rem;
      border: 0;
      border-radius: var(--radius-sm);
      background: transparent;
      color: var(--color-ink-soft);
      cursor: pointer;
    }
    .search__clear:hover { background: var(--color-surface-hover); color: var(--color-ink); }
  `,
})
export class SearchInputComponent {
  readonly inputId = input.required<string>();
  readonly label = input.required<string>();
  readonly placeholder = input('');
  readonly value = input('');
  readonly valueChange = output<string>();
}
