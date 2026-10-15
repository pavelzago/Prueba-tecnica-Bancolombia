import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';

import { ButtonComponent } from '../../atoms/button/button.component';
import { IconComponent } from '../../atoms/icon/icon.component';

/** Previous / next, "Página X de Y" and a page-size selector. Hidden when there is a single page. */
@Component({
  selector: 'app-paginator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, ButtonComponent, IconComponent],
  template: `
    @if (totalPages() > 1) {
      <nav class="pager" [attr.aria-label]="ariaLabel()">
        <div class="pager__size">
          <label class="pager__label" [for]="selectId()">Filas por página</label>
          <select class="pager__select" [id]="selectId()" (change)="onSizeChange($event)">
            @for (option of pageSizeOptions(); track option) {
              <option [value]="option" [selected]="option === pageSize()">{{ option }}</option>
            }
          </select>
        </div>

        <div class="pager__steps">
          <app-button
            variant="secondary"
            size="sm"
            [disabled]="page() <= 1"
            (pressed)="pageChange.emit(page() - 1)"
          >
            <app-icon name="chevron-left" [size]="16" [strokeWidth]="2.25" />
            Anterior
          </app-button>
          <p class="pager__status">
            Página <strong>{{ page() | number }}</strong> de
            <strong>{{ totalPages() | number }}</strong>
          </p>
          <app-button
            variant="secondary"
            size="sm"
            [disabled]="page() >= totalPages()"
            (pressed)="pageChange.emit(page() + 1)"
          >
            Siguiente
            <app-icon name="chevron-right" [size]="16" [strokeWidth]="2.25" />
          </app-button>
        </div>
      </nav>
    }
  `,
  styles: `
    :host {
      display: block;
    }
    .pager {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-3) var(--space-4);
    }
    .pager__size {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }
    .pager__label {
      font-size: var(--text-sm);
      color: var(--color-ink-soft);
    }
    .pager__select {
      min-height: 2rem;
      padding: 0 var(--space-2);
      border: 1px solid var(--color-border-strong);
      border-radius: var(--radius);
      background: var(--color-surface);
      color: var(--color-ink);
      font: inherit;
      font-family: var(--font-mono);
      font-size: var(--text-sm);
      font-variant-numeric: tabular-nums;
      cursor: pointer;
    }
    .pager__select:focus-visible {
      outline: 2px solid var(--color-focus);
      outline-offset: 2px;
    }
    .pager__steps {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      margin-left: auto;
    }
    .pager__status {
      margin: 0;
      padding: 0 var(--space-2);
      font-size: var(--text-sm);
      color: var(--color-ink-soft);
      white-space: nowrap;
      font-variant-numeric: tabular-nums;
    }
    .pager__status strong {
      color: var(--color-ink);
      font-weight: var(--weight-semibold);
    }
    @media (max-width: 30rem) {
      .pager__steps {
        width: 100%;
        justify-content: space-between;
        margin-left: 0;
      }
    }
  `,
})
export class PaginatorComponent {
  readonly page = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly pageSize = input.required<number>();
  readonly pageSizeOptions = input<readonly number[]>([25, 50, 100]);
  readonly selectId = input('page-size');
  readonly ariaLabel = input('Paginación');

  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();

  protected onSizeChange(event: Event): void {
    this.pageSizeChange.emit(Number((event.target as HTMLSelectElement).value));
  }
}
