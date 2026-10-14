import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type BadgeTone = 'success' | 'danger' | 'warning' | 'neutral';

@Component({
  selector: 'app-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span [class]="'badge badge--' + tone()"><ng-content /></span>`,
  styles: `
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35em;
      padding: 0.15rem 0.6rem;
      border-radius: 999px;
      font-size: 0.8rem;
      font-weight: 600;
      white-space: nowrap;
      border: 1px solid transparent;
    }
    .badge::before {
      content: '';
      width: 0.5em;
      height: 0.5em;
      border-radius: 50%;
      background: currentColor;
    }
    .badge--success { background: var(--color-success-bg); color: var(--color-success); border-color: var(--color-success-border); }
    .badge--danger { background: var(--color-danger-bg); color: var(--color-danger); border-color: var(--color-danger-border); }
    .badge--warning { background: var(--color-warning-bg); color: var(--color-warning); border-color: var(--color-warning-border); }
    .badge--neutral { background: var(--color-muted-bg); color: var(--color-ink-soft); border-color: var(--color-border); }
  `,
})
export class BadgeComponent {
  readonly tone = input<BadgeTone>('neutral');
}
