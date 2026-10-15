import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { IconComponent } from '../../atoms/icon/icon.component';

export type StepState = 'pending' | 'current' | 'done';

const STATE_TEXT: Record<StepState, string> = {
  pending: 'pendiente',
  current: 'paso actual',
  done: 'completado',
};

/** Numbered step title. The number is information here (1 → 2 → 3). Extra content goes to the right. */
@Component({
  selector: 'app-step-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <div [class]="'step step--' + state()">
      <span class="step__number" aria-hidden="true">
        @if (state() === 'done') {
          <app-icon name="check" [size]="16" [strokeWidth]="2.5" />
        } @else {
          {{ number() }}
        }
      </span>
      <div class="step__text">
        <h2 class="step__title" [id]="titleId()">
          <span class="visually-hidden">Paso {{ number() }} ({{ stateText[state()] }}): </span>{{ title() }}
        </h2>
        @if (description()) {
          <p class="step__description">{{ description() }}</p>
        }
      </div>
      <div class="step__aside"><ng-content /></div>
    </div>
  `,
  styles: `
    :host { display: block; }
    .step { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-2) var(--space-3); }
    .step__number {
      display: grid;
      place-items: center;
      flex: none;
      width: 1.75rem;
      height: 1.75rem;
      border: 1px solid var(--color-border-strong);
      border-radius: var(--radius-sm);
      font-family: var(--font-mono);
      font-size: var(--text-sm);
      font-weight: var(--weight-medium);
      color: var(--color-ink-soft);
    }
    .step--current .step__number { background: var(--color-accent); border-color: var(--color-accent); color: var(--color-accent-ink); }
    .step--done .step__number { background: var(--color-ink); border-color: var(--color-ink); color: var(--color-surface); }
    .step--pending .step__number { border-style: dashed; }
    .step--pending .step__title { color: var(--color-ink-soft); }
    .step__text { flex: 1 1 14rem; min-width: 0; }
    .step__title { margin: 0; font-size: var(--text-lg); }
    .step__description { margin: 0.125rem 0 0; font-size: var(--text-sm); color: var(--color-ink-soft); }
    .step__aside { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-2); }
    .step__aside:empty { display: none; }
  `,
})
export class StepHeaderComponent {
  readonly number = input.required<number>();
  readonly title = input.required<string>();
  readonly titleId = input.required<string>();
  readonly description = input('');
  readonly state = input<StepState>('current');

  protected readonly stateText = STATE_TEXT;
}
