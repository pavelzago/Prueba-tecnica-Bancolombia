import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-spinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="spinner" role="status" aria-live="polite">
      <span class="spinner__circle" aria-hidden="true"></span>
      <span [class.visually-hidden]="!showLabel()">{{ label() }}</span>
    </span>
  `,
  styles: `
    .spinner {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      color: var(--color-ink-soft);
    }
    .spinner__circle {
      width: 1.25rem;
      height: 1.25rem;
      border: 3px solid var(--color-border);
      border-top-color: var(--color-ink);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    @media (prefers-reduced-motion: reduce) {
      .spinner__circle { animation-duration: 2.4s; }
    }
  `,
})
export class SpinnerComponent {
  readonly label = input('Cargando…');
  readonly showLabel = input(true);
}
