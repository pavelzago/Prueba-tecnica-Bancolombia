import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/**
 * Native file input (kept in the accessibility tree) with a Spanish, button-styled label,
 * so the browser's localized "Choose file" text is not shown. The field's main label is
 * provided by the parent through `inputId`.
 */
@Component({
  selector: 'app-file-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <input
      class="file-input visually-hidden"
      type="file"
      [id]="inputId()"
      [accept]="accept()"
      [disabled]="disabled()"
      [attr.aria-describedby]="describedBy() || null"
      (change)="onChange($event)"
    />
    <label class="file-input__button" [class.file-input__button--disabled]="disabled()" [for]="inputId()" aria-hidden="true">
      {{ buttonText() }}
    </label>
  `,
  styles: `
    .file-input__button {
      display: inline-flex;
      align-items: center;
      min-height: 2.25rem;
      padding: 0 var(--space-3);
      border: 1px solid var(--color-border-strong);
      border-radius: var(--radius);
      background: var(--color-surface);
      color: var(--color-ink);
      font-size: var(--text-sm);
      font-weight: var(--weight-semibold);
      cursor: pointer;
    }
    .file-input__button:hover { background: var(--color-surface-hover); border-color: var(--color-ink); }
    .file-input__button--disabled { opacity: 0.5; cursor: not-allowed; }
    .file-input:focus-visible + .file-input__button {
      outline: 2px solid var(--color-focus);
      outline-offset: 2px;
    }
  `,
})
export class FileInputComponent {
  readonly inputId = input.required<string>();
  readonly accept = input('.csv,text/csv');
  readonly disabled = input(false);
  readonly describedBy = input<string>('');
  readonly buttonText = input('Seleccionar archivo');
  readonly fileSelected = output<File | null>();

  protected onChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.fileSelected.emit(target.files?.item(0) ?? null);
    // Reset so selecting the same file again still triggers `change`.
    target.value = '';
  }
}
