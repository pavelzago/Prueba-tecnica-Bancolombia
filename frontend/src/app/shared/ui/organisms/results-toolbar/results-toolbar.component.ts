import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { StatusCounts, StatusFilter } from '../../../../core/models/reconciliation.model';
import { ButtonComponent } from '../../atoms/button/button.component';
import { ChipComponent } from '../../atoms/chip/chip.component';
import { IconComponent } from '../../atoms/icon/icon.component';
import { SearchInputComponent } from '../../atoms/search-input/search-input.component';
import { FilterOption, StatusFilterComponent } from '../../molecules/status-filter/status-filter.component';

/** Table controls: status, search, active cause, result count, clear and CSV export. */
@Component({
  selector: 'app-results-toolbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent, ChipComponent, IconComponent, SearchInputComponent, StatusFilterComponent],
  template: `
    <div class="toolbar">
      <div class="toolbar__row">
        <app-status-filter
          ariaLabel="Filtrar facturas por estado"
          [options]="filterOptions()"
          [value]="filter()"
          (valueChange)="filterChange.emit($event)"
        />
        <app-search-input
          class="toolbar__search"
          inputId="results-search"
          label="Buscar por factura, NIT o concepto"
          placeholder="Buscar factura, NIT o concepto"
          [value]="search()"
          (valueChange)="searchChange.emit($event)"
        />
        <app-button
          class="toolbar__export"
          variant="secondary"
          [disabled]="shown() === 0"
          (pressed)="exportCsv.emit()"
        >
          <app-icon name="download" [size]="16" />
          Exportar CSV
        </app-button>
      </div>

      <div class="toolbar__meta">
        <p class="toolbar__count" aria-live="polite">
          Mostrando <strong class="tabular">{{ shown() }}</strong> de <span class="tabular">{{ total() }}</span> facturas
        </p>
        @if (causeLabel(); as label) {
          <app-chip tone="accent" [removable]="true" removeLabel="Quitar filtro de causa" (removed)="causeClear.emit()">
            Causa: {{ label }}
          </app-chip>
        }
        @if (hasActiveFilters()) {
          <app-button variant="ghost" size="sm" (pressed)="clearFilters.emit()">Limpiar filtros</app-button>
        }
      </div>
    </div>
  `,
  styles: `
    :host { display: block; }
    .toolbar { display: grid; gap: var(--space-3); }
    .toolbar__row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-3); }
    .toolbar__search { flex: 1 1 16rem; max-width: 26rem; }
    .toolbar__export { margin-left: auto; }
    .toolbar__meta { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-2) var(--space-3); min-height: 2rem; }
    .toolbar__count { margin: 0; font-size: var(--text-sm); color: var(--color-ink-soft); }
    .toolbar__count strong { color: var(--color-ink); font-weight: var(--weight-semibold); }
    @media (max-width: 40rem) {
      .toolbar__search { max-width: none; }
      .toolbar__export { margin-left: 0; }
    }
  `,
})
export class ResultsToolbarComponent {
  readonly filter = input.required<StatusFilter>();
  readonly counts = input.required<StatusCounts>();
  readonly search = input('');
  /** Label of the active cause filter, or null. */
  readonly causeLabel = input<string | null>(null);
  readonly shown = input.required<number>();
  readonly total = input.required<number>();
  readonly hasActiveFilters = input(false);

  readonly filterChange = output<StatusFilter>();
  readonly searchChange = output<string>();
  readonly causeClear = output<void>();
  readonly clearFilters = output<void>();
  readonly exportCsv = output<void>();

  protected readonly filterOptions = computed<FilterOption<StatusFilter>[]>(() => [
    { value: 'all', label: 'Todas', count: this.counts().all },
    { value: 'Correcta', label: 'Correctas', count: this.counts().correct },
    { value: 'Con inconsistencia', label: 'Con inconsistencia', count: this.counts().inconsistent },
  ]);
}
