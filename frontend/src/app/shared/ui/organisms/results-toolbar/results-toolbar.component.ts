import { ChangeDetectionStrategy, Component, computed, input, output, viewChild } from '@angular/core';
import { DecimalPipe } from '@angular/common';

import { CauseFilter, CodigoInconsistencia, StatusCounts, StatusFilter } from '../../../../core/models/reconciliation.model';
import { ButtonComponent } from '../../atoms/button/button.component';
import { IconComponent } from '../../atoms/icon/icon.component';
import { SearchInputComponent } from '../../atoms/search-input/search-input.component';
import { SelectFieldComponent, SelectOption } from '../../atoms/select-field/select-field.component';
import { FilterOption, StatusFilterComponent } from '../../molecules/status-filter/status-filter.component';

/** Table controls: status, error type (cause), search, result count, clear and CSV export. */
@Component({
  selector: 'app-results-toolbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, ButtonComponent, IconComponent, SearchInputComponent, SelectFieldComponent, StatusFilterComponent],
  template: `
    <div class="toolbar">
      <div class="toolbar__row">
        <app-status-filter
          ariaLabel="Filtrar facturas por estado"
          [options]="filterOptions()"
          [value]="filter()"
          (valueChange)="filterChange.emit($event)"
        />
        <app-select-field
          class="toolbar__cause"
          inputId="results-cause"
          label="Filtrar por tipo de error"
          emptyLabel="Todos los tipos de error"
          [options]="causeOptions()"
          [value]="cause() ?? ''"
          [disabled]="!causeOptions().length"
          (valueChange)="onCauseChange($event)"
        />
        <app-search-input
          class="toolbar__search"
          inputId="results-search"
          label="Buscar por factura, NIT o concepto"
          placeholder="Buscar factura, NIT o concepto"
          [value]="search()"
          [debounceMs]="searchDebounceMs()"
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
          @if (shown() === 0) {
            Ninguna factura coincide · <span class="tabular">{{ total() | number }}</span> en total
          } @else {
            Mostrando
            @if (rangeTo() - rangeFrom() + 1 < shown()) {
              <strong class="tabular">{{ rangeFrom() | number }}–{{ rangeTo() | number }}</strong> de
            }
            <strong class="tabular">{{ shown() | number }}</strong>
            @if (shown() < total()) {
              {{ shown() === 1 ? 'factura filtrada' : 'facturas filtradas' }} · <span class="tabular">{{ total() | number }}</span> en total
            } @else {
              {{ shown() === 1 ? 'factura' : 'facturas' }}
            }
          }
        </p>
        @if (hasActiveFilters()) {
          <app-button variant="ghost" size="sm" (pressed)="onClearFilters()">Limpiar filtros</app-button>
        }
      </div>
    </div>
  `,
  styles: `
    :host { display: block; }
    .toolbar { display: grid; gap: var(--space-3); }
    .toolbar__row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-3); }
    .toolbar__cause { flex: 0 1 17rem; min-width: 12rem; }
    .toolbar__search { flex: 1 1 14rem; max-width: 24rem; }
    .toolbar__export { margin-left: auto; }
    .toolbar__meta { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-2) var(--space-3); min-height: 2rem; }
    .toolbar__count { margin: 0; font-size: var(--text-sm); color: var(--color-ink-soft); }
    .toolbar__count strong { color: var(--color-ink); font-weight: var(--weight-semibold); }
    @media (max-width: 40rem) {
      .toolbar__search, .toolbar__cause { flex-basis: 100%; max-width: none; }
      .toolbar__export { margin-left: 0; }
    }
  `,
})
export class ResultsToolbarComponent {
  readonly filter = input.required<StatusFilter>();
  readonly counts = input.required<StatusCounts>();
  readonly search = input('');
  /** Error types present in the result (value = inconsistency code). */
  readonly causeOptions = input<SelectOption[]>([]);
  /** Active error type filter, or null. */
  readonly cause = input<CauseFilter>(null);
  /** Rows after all filters (every page). */
  readonly shown = input.required<number>();
  /** Rows in the whole result. */
  readonly total = input.required<number>();
  /** 1-based range of the current page. */
  readonly rangeFrom = input(1);
  readonly rangeTo = input(Infinity);
  readonly searchDebounceMs = input(200);
  readonly hasActiveFilters = input(false);

  readonly filterChange = output<StatusFilter>();
  readonly searchChange = output<string>();
  readonly causeChange = output<CauseFilter>();
  readonly clearFilters = output<void>();
  readonly exportCsv = output<void>();

  private readonly searchInput = viewChild(SearchInputComponent);

  protected onCauseChange(value: string): void {
    this.causeChange.emit(value ? (value as CodigoInconsistencia) : null);
  }

  protected onClearFilters(): void {
    this.searchInput()?.reset();
    this.clearFilters.emit();
  }

  protected readonly filterOptions = computed<FilterOption<StatusFilter>[]>(() => [
    { value: 'all', label: 'Todas', count: this.counts().all },
    { value: 'Correcta', label: 'Correctas', count: this.counts().correct },
    { value: 'Con inconsistencia', label: 'Con inconsistencia', count: this.counts().inconsistent },
  ]);
}
