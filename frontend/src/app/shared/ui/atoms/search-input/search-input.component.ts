import { ChangeDetectionStrategy, Component, OnDestroy, input, linkedSignal, output } from '@angular/core';

import { createDebouncer } from '../../../../core/utils/debounce';
import { IconComponent } from '../icon/icon.component';

/**
 * Text search with a (visually hidden) label, search icon and a clear button.
 * The field updates on every keystroke; `valueChange` is emitted after `debounceMs`
 * of quiet (clearing is emitted at once).
 */
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
        [value]="draft()"
        (input)="onInput($any($event.target).value)"
        (keydown.escape)="clear()"
      />
      @if (draft()) {
        <button type="button" class="search__clear" aria-label="Borrar búsqueda" (click)="clear()">
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
export class SearchInputComponent implements OnDestroy {
  readonly inputId = input.required<string>();
  readonly label = input.required<string>();
  readonly placeholder = input('');
  /** Committed value from the parent; resets the field when it changes (e.g. "Limpiar filtros"). */
  readonly value = input('');
  /** Quiet time before emitting; 0 emits on every keystroke. */
  readonly debounceMs = input(0);
  readonly valueChange = output<string>();

  /** What the user sees right now (may be ahead of `value` while the debounce is pending). */
  protected readonly draft = linkedSignal(() => this.value());

  private readonly debouncer = createDebouncer<string>(
    (term) => this.valueChange.emit(term),
    () => this.debounceMs(),
  );

  protected onInput(term: string): void {
    this.draft.set(term);
    this.debouncer.call(term);
  }

  protected clear(): void {
    this.draft.set('');
    this.debouncer.flush('');
  }

  /**
   * Empties the field and drops any pending emission without emitting. Used when the parent
   * clears the search itself (e.g. "Limpiar filtros"): otherwise a term typed less than
   * `debounceMs` ago would be applied right after the reset.
   */
  reset(): void {
    this.debouncer.cancel();
    this.draft.set('');
  }

  ngOnDestroy(): void {
    this.debouncer.cancel();
  }
}
