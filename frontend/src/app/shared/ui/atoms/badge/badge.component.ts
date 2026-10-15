import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { IconComponent, IconName } from '../icon/icon.component';

export type BadgeTone = 'success' | 'danger' | 'warning' | 'neutral';

const ICONS: Partial<Record<BadgeTone, IconName>> = {
  success: 'check',
  danger: 'alert',
  warning: 'alert',
};

/** Status label: tone is encoded by colour AND icon + text (never colour alone). */
@Component({
  selector: 'app-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <span [class]="'badge badge--' + tone()">
      @if (icon(); as name) {
        <app-icon [name]="name" [size]="13" [strokeWidth]="2.5" />
      }
      <ng-content />
    </span>
  `,
  styles: `
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.125rem 0.5rem;
      border: 1px solid transparent;
      border-radius: var(--radius-sm);
      font-size: var(--text-xs);
      font-weight: var(--weight-semibold);
      line-height: 1.4;
      white-space: nowrap;
    }
    .badge--success { background: var(--color-success-bg); color: var(--color-success); border-color: var(--color-success-border); }
    .badge--danger { background: var(--color-danger-bg); color: var(--color-danger); border-color: var(--color-danger-border); }
    .badge--warning { background: var(--color-warning-bg); color: var(--color-warning); border-color: var(--color-warning-border); }
    .badge--neutral { background: var(--color-surface-sunken); color: var(--color-ink-soft); border-color: var(--color-border); }
  `,
})
export class BadgeComponent {
  readonly tone = input<BadgeTone>('neutral');
  protected readonly icon = computed(() => ICONS[this.tone()] ?? null);
}
