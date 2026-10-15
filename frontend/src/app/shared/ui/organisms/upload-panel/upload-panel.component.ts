import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';

import { FileKind } from '../../../../core/models/reconciliation.model';
import { ButtonComponent } from '../../atoms/button/button.component';
import { IconComponent } from '../../atoms/icon/icon.component';
import { SpinnerComponent } from '../../atoms/spinner/spinner.component';
import { FileDropFieldComponent } from '../../molecules/file-drop-field/file-drop-field.component';
import { StepHeaderComponent } from '../../molecules/step-header/step-header.component';

export interface FileChangeEvent {
  kind: FileKind;
  file: File | null;
}

/**
 * Step 1. Expanded: two file fields + "Procesar" + "Probar con archivos de ejemplo".
 * Compact (after a successful run): one line with the processed files and "Cambiar archivos".
 */
@Component({
  selector: 'app-upload-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonComponent,
    IconComponent,
    SpinnerComponent,
    FileDropFieldComponent,
    StepHeaderComponent,
    DatePipe,
  ],
  template: `
    <section class="panel upload" [class.upload--compact]="compact()" aria-labelledby="upload-title">
      <app-step-header
        [number]="1"
        title="Cargar archivos"
        titleId="upload-title"
        [state]="compact() ? 'done' : 'current'"
        [description]="compact() ? '' : 'Selecciona los dos CSV exportados del mes. Cada factura se valida contra su registro contable.'"
      >
        @if (compact()) {
          <p class="upload__processed">
            <span class="mono">{{ invoicesFile()?.name }}</span>
            <span class="upload__sep" aria-hidden="true">·</span>
            <span class="mono">{{ ledgerFile()?.name }}</span>
            @if (processedAt(); as at) {
              <span class="upload__sep" aria-hidden="true">·</span>
              <span>procesado a las <time class="tabular" [attr.datetime]="at.toISOString()">{{ at | date: 'HH:mm' }}</time></span>
            }
          </p>
          <app-button variant="secondary" size="sm" [expanded]="false" controls="upload-form" (pressed)="expand.emit()">
            <app-icon name="swap" [size]="16" />
            Cambiar archivos
          </app-button>
        }
      </app-step-header>

      @if (!compact()) {
        <form id="upload-form" class="upload__form" (submit)="onSubmit($event)">
          <div class="upload__fields">
            <app-file-drop-field
              inputId="facturas-file"
              label="Facturas de proveedores"
              hint="facturas.csv"
              [file]="invoicesFile()"
              [disabled]="loading()"
              (fileChange)="fileChange.emit({ kind: 'invoices', file: $event })"
            />
            <app-file-drop-field
              inputId="contabilidad-file"
              label="Registros contables"
              hint="contabilidad.csv"
              [file]="ledgerFile()"
              [disabled]="loading()"
              (fileChange)="fileChange.emit({ kind: 'ledger', file: $event })"
            />
          </div>

          <div class="upload__actions">
            <div class="upload__main">
              <app-button type="submit" [disabled]="!canProcess()" [busy]="loading()">
                {{ loading() ? 'Procesando…' : 'Procesar conciliación' }}
              </app-button>
              @if (loading()) {
                <app-spinner label="Validando facturas…" />
              } @else if (!canProcess()) {
                <span class="upload__help">Selecciona los dos archivos para continuar.</span>
              }
              @if (canCancel() && !loading()) {
                <app-button variant="ghost" (pressed)="collapse.emit()">Cancelar</app-button>
              }
            </div>

            <div class="upload__sample">
              <app-button variant="secondary" [disabled]="loading()" (pressed)="loadSample.emit()">
                Probar con archivos de ejemplo
              </app-button>
              <span class="upload__note">Datos ficticios de la prueba</span>
            </div>
          </div>
        </form>
      }
    </section>
  `,
  styles: `
    :host { display: block; }
    .upload--compact { padding-block: var(--space-3); }
    .upload__processed {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      gap: 0 var(--space-2);
      margin: 0;
      font-size: var(--text-sm);
      color: var(--color-ink-soft);
    }
    .upload__processed .mono { color: var(--color-ink); font-size: var(--text-xs); overflow-wrap: anywhere; }
    .upload__sep { color: var(--color-border-strong); }
    .upload__form { display: flex; flex-direction: column; gap: var(--space-4); margin-top: var(--space-4); }
    .upload__fields {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(20rem, 100%), 1fr));
      gap: var(--space-3);
    }
    .upload__actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-4);
      padding-top: var(--space-4);
      border-top: 1px solid var(--color-border);
    }
    .upload__main, .upload__sample { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-3); }
    .upload__help, .upload__note { font-size: var(--text-sm); color: var(--color-ink-soft); }
    .upload__note { font-size: var(--text-xs); }
  `,
})
export class UploadPanelComponent {
  readonly invoicesFile = input<File | null>(null);
  readonly ledgerFile = input<File | null>(null);
  readonly loading = input(false);
  readonly canProcess = input(false);
  /** Collapsed to one line (after a successful run). */
  readonly compact = input(false);
  /** Expanded over an existing result: offer to go back without reprocessing. */
  readonly canCancel = input(false);
  readonly processedAt = input<Date | null>(null);

  readonly fileChange = output<FileChangeEvent>();
  readonly process = output<void>();
  readonly loadSample = output<void>();
  readonly expand = output<void>();
  readonly collapse = output<void>();

  protected onSubmit(event: Event): void {
    event.preventDefault();
    if (this.canProcess()) {
      this.process.emit();
    }
  }
}
