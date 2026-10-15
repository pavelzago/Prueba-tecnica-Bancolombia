import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Placeholder block with a subtle shimmer. Decorative: the parent announces the loading state. */
@Component({
  selector: 'app-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'aria-hidden': 'true',
    '[style.width]': 'width()',
    '[style.height]': 'height()',
  },
  template: ``,
  styles: `
    :host {
      display: block;
      flex: none;
      max-width: 100%;
      border-radius: var(--radius-sm);
      background: linear-gradient(
          90deg,
          var(--color-surface-sunken) 0%,
          var(--color-border) 50%,
          var(--color-surface-sunken) 100%
        )
        0 0 / 200% 100%;
      animation: shimmer 1.4s ease-in-out infinite;
    }
    @keyframes shimmer {
      from {
        background-position: 100% 0;
      }
      to {
        background-position: -100% 0;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      :host {
        animation: none;
        background: var(--color-surface-sunken);
      }
    }
  `,
})
export class SkeletonComponent {
  readonly width = input('100%');
  readonly height = input('0.75rem');
}
