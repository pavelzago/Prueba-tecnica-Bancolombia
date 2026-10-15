import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'md' | 'sm';

@Component({
  selector: 'app-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      [class]="'btn btn--' + variant() + (size() === 'sm' ? ' btn--sm' : '')"
      [type]="type()"
      [disabled]="disabled()"
      [attr.aria-busy]="busy() || null"
      [attr.aria-expanded]="expanded()"
      [attr.aria-controls]="controls()"
      (click)="pressed.emit()"
    >
      <ng-content />
    </button>
  `,
  styleUrl: './button.component.scss',
})
export class ButtonComponent {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');
  readonly type = input<'button' | 'submit'>('button');
  readonly disabled = input(false);
  readonly busy = input(false);
  readonly expanded = input<boolean | null>(null);
  readonly controls = input<string | null>(null);
  readonly pressed = output<void>();
}
