import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { FileKind } from '../../../../core/models/reconciliation.model';
import { ButtonComponent } from '../../atoms/button/button.component';
import { SpinnerComponent } from '../../atoms/spinner/spinner.component';
import { FileDropFieldComponent } from '../../molecules/file-drop-field/file-drop-field.component';

export interface FileChangeEvent {
  kind: FileKind;
  file: File | null;
}

@Component({
  selector: 'app-upload-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent, SpinnerComponent, FileDropFieldComponent],
  template: `
    <section class="panel" aria-labelledby="upload-title">
      <h2 id="upload-title" class="panel__title">1. Cargar archivos</h2>
      <p class="panel__intro">
        Selecciona los dos archivos CSV exportados. El sistema validará cada factura contra su registro contable.
      </p>
      <form class="upload" (submit)="onSubmit($event)">
        <div class="upload__fields">
          <app-file-drop-field
            inputId="facturas-file"
            label="Archivo de facturas"
            hint="facturas.csv — detalle de facturas de proveedores."
            [file]="invoicesFile()"
            [disabled]="loading()"
            (fileChange)="fileChange.emit({ kind: 'invoices', file: $event })"
          />
          <app-file-drop-field
            inputId="contabilidad-file"
            label="Archivo de contabilidad"
            hint="contabilidad.csv — registros contables de las facturas."
            [file]="ledgerFile()"
            [disabled]="loading()"
            (fileChange)="fileChange.emit({ kind: 'ledger', file: $event })"
          />
        </div>
        <div class="upload__actions">
          <app-button type="submit" [disabled]="!canProcess()" [busy]="loading()">
            {{ loading() ? 'Procesando…' : 'Procesar conciliación' }}
          </app-button>
          @if (loading()) {
            <app-spinner label="Validando facturas, por favor espera…" />
          } @else if (!canProcess()) {
            <span class="upload__help">Selecciona ambos archivos para habilitar el procesamiento.</span>
          }
        </div>
      </form>
    </section>
  `,
  styles: `
    .upload {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }
    .upload__fields {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(16rem, 100%), 1fr));
      gap: var(--space-4);
    }
    .upload__actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--space-4);
    }
    .upload__help {
      font-size: 0.875rem;
      color: var(--color-ink-soft);
    }
  `,
})
export class UploadPanelComponent {
  readonly invoicesFile = input<File | null>(null);
  readonly ledgerFile = input<File | null>(null);
  readonly loading = input(false);
  readonly canProcess = input(false);
  readonly fileChange = output<FileChangeEvent>();
  readonly process = output<void>();

  protected onSubmit(event: Event): void {
    event.preventDefault();
    if (this.canProcess()) {
      this.process.emit();
    }
  }
}
