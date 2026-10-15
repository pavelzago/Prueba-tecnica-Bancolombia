import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { IconComponent } from '../icon/icon.component';

export type ChipTone = 'neutral' | 'danger' | 'accent';

/** Compact label; when `removable`, shows a "×" button that emits `removed`. */
@Component({
  selector: 'app-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <span [class]="'chip chip--' + tone()">
      <span class="chip__text"><ng-content /></span>
      @if (removable()) {
        <button type="button" class="chip__remove" [attr.aria-label]="removeLabel()" (click)="removed.emit()">
          <app-icon name="close" [size]="14" [strokeWidth]="2.5" />
        </button>
      }
    </span>
  `,
  styles: `
    :host { display: inline-flex; max-width: 100%; }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      max-width: 100%;
      min-height: 1.75rem;
      padding: 0 var(--space-2);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      background: var(--color-surface);
      color: var(--color-ink);
      font-size: var(--text-sm);
      font-weight: var(--weight-medium);
    }
    .chip__text { min-width: 0; overflow-wrap: anywhere; }
    .chip--danger { border-color: var(--color-danger-border); background: var(--color-danger-bg); }
    .chip--accent { border-color: var(--color-accent); background: var(--color-accent-soft); box-shadow: inset 3px 0 0 var(--color-accent); padding-left: var(--space-3); }
    .chip__remove {
      display: inline-grid;
      place-items: center;
      width: 1.5rem;
      height: 1.5rem;
      margin-right: calc(var(--space-1) * -1);
      border: 0;
      border-radius: var(--radius-sm);
      background: transparent;
      color: var(--color-ink-soft);
      cursor: pointer;
    }
    .chip__remove:hover { background: var(--color-surface-hover); color: var(--color-ink); }
  `,
})
export class ChipComponent {
  readonly tone = input<ChipTone>('neutral');
  readonly removable = input(false);
  readonly removeLabel = input('Quitar');
  readonly removed = output<void>();
}
