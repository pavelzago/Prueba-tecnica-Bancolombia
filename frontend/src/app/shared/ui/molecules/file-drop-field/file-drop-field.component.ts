import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';

import { FileInputComponent } from '../../atoms/file-input/file-input.component';
import { IconComponent, IconName } from '../../atoms/icon/icon.component';

/**
 * Label + file input + selected file name, with drag & drop support.
 * `invalid` (the backend rejected this file) swaps the check for an X.
 */
@Component({
  selector: 'app-file-drop-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FileInputComponent, IconComponent, DecimalPipe],
  template: `
    <div
      class="field"
      [class.field--dragging]="dragging()"
      [class.field--filled]="!!file() && !invalid()"
      [class.field--invalid]="!!file() && invalid()"
      (dragover)="onDragOver($event)"
      (dragleave)="dragging.set(false)"
      (drop)="onDrop($event)"
    >
      <span class="field__mark" aria-hidden="true">
        <app-icon [name]="markIcon()" [size]="20" />
      </span>
      <div class="field__body">
        <label class="field__label" [for]="inputId()">{{ label() }}</label>
        <p class="field__hint" [id]="hintId()">{{ hint() }}</p>
        <p class="field__status" [id]="statusId()" aria-live="polite">
          @if (file(); as f) {
            <span class="field__file">{{ f.name }}</span>
            <span class="field__size">{{ f.size / 1024 | number: '1.0-1' }} KB</span>
            @if (invalid()) {
              <span class="field__error">Archivo con error, cámbialo</span>
            }
          } @else {
            Arrástralo aquí o selecciónalo.
          }
        </p>
      </div>
      <app-file-input
        class="field__action"
        [inputId]="inputId()"
        [disabled]="disabled()"
        [describedBy]="hintId() + ' ' + statusId()"
        [buttonText]="file() ? 'Cambiar' : 'Seleccionar'"
        (fileSelected)="fileChange.emit($event)"
      />
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
  readonly invalid = input(false);
  readonly fileChange = output<File | null>();

  protected readonly dragging = signal(false);
  protected readonly markIcon = computed<IconName>(() => {
    if (!this.file()) return 'file';
    return this.invalid() ? 'close' : 'check';
  });
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
