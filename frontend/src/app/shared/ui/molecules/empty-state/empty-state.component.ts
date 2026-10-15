import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { IconComponent, IconName } from '../../atoms/icon/icon.component';

/** Designed placeholder: explains what will appear here (or why nothing does). Actions via content. */
@Component({
  selector: 'app-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <div class="empty" role="status">
      <span class="empty__icon" aria-hidden="true"><app-icon [name]="icon()" [size]="22" [strokeWidth]="1.75" /></span>
      <div class="empty__body">
        <p class="empty__title">{{ title() }}</p>
        @if (text()) {
          <p class="empty__text">{{ text() }}</p>
        }
        <div class="empty__actions"><ng-content /></div>
      </div>
    </div>
  `,
  styles: `
    :host { display: block; }
    .empty {
      display: flex;
      align-items: flex-start;
      gap: var(--space-4);
      padding: var(--space-5);
      border: 1px dashed var(--color-border-strong);
      border-radius: var(--radius);
      background: var(--color-surface-sunken);
    }
    .empty__icon {
      display: grid;
      place-items: center;
      flex: none;
      width: 2.75rem;
      height: 2.75rem;
      border-radius: var(--radius);
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      color: var(--color-ink-soft);
    }
    .empty__body { min-width: 0; }
    .empty__title { margin: 0; font-weight: var(--weight-semibold); }
    .empty__text { margin: var(--space-1) 0 0; max-width: 40rem; font-size: var(--text-sm); color: var(--color-ink-soft); }
    .empty__actions:not(:empty) { margin-top: var(--space-3); display: flex; flex-wrap: wrap; gap: var(--space-2); }
  `,
})
export class EmptyStateComponent {
  readonly icon = input<IconName>('table');
  readonly title = input.required<string>();
  readonly text = input('');
}
