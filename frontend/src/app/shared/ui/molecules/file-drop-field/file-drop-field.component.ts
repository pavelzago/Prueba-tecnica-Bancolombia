import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';

import { FileInputComponent } from '../../atoms/file-input/file-input.component';

/** Label + file input + selected file name, with drag & drop support. */
@Component({
  selector: 'app-file-drop-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FileInputComponent, DecimalPipe],
  template: `
    <div
      class="field"
      [class.field--dragging]="dragging()"
      [class.field--filled]="!!file()"
      (dragover)="onDragOver($event)"
      (dragleave)="dragging.set(false)"
      (drop)="onDrop($event)"
    >
      <label class="field__label" [for]="inputId()">{{ label() }}</label>
      <p class="field__hint" [id]="hintId()">{{ hint() }}</p>
      <app-file-input
        [inputId]="inputId()"
        [disabled]="disabled()"
        [describedBy]="hintId() + ' ' + statusId()"
        [buttonText]="file() ? 'Cambiar archivo' : 'Seleccionar archivo'"
        (fileSelected)="fileChange.emit($event)"
      />
      <p class="field__status" [id]="statusId()" aria-live="polite">
        @if (file(); as f) {
          <span class="field__file">{{ f.name }}</span>
          <span class="field__size">({{ f.size / 1024 | number: '1.0-1' }} KB)</span>
        } @else {
          Ningún archivo seleccionado. También puedes arrastrarlo aquí.
        }
      </p>
    </div>
  `,
  styleUrl: './file-drop-field.component.scss',
})
export class FileDropFieldComponent {
  readonly inputId = input.required<string>();
  readonly label = input.required<string>();
  readonly hint = input('');
  readonly file = input<File | null>(null);
  readonly disabled = input(false);
  readonly fileChange = output<File | null>();

  protected readonly dragging = signal(false);
  protected readonly hintId = computed(() => `${this.inputId()}-hint`);
  protected readonly statusId = computed(() => `${this.inputId()}-status`);

  protected onDragOver(event: DragEvent): void {
    if (this.disabled()) return;
    event.preventDefault();
    this.dragging.set(true);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    if (this.disabled()) return;
    const file = event.dataTransfer?.files?.item(0) ?? null;
    if (file) {
      this.fileChange.emit(file);
    }
  }
}
