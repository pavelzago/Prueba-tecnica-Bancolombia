import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { IconComponent } from '../icon/icon.component';

export type AlertTone = 'error' | 'info' | 'success';

@Component({
  selector: 'app-alert',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <div
      [class]="'alert alert--' + tone()"
      [attr.role]="tone() === 'error' ? 'alert' : 'status'"
      [attr.aria-live]="tone() === 'error' ? 'assertive' : 'polite'"
    >
      <app-icon class="alert__icon" [name]="tone() === 'success' ? 'check' : 'alert'" [size]="20" />
      <div class="alert__body">
        @if (title()) {
          <p class="alert__title">{{ title() }}</p>
        }
        <p class="alert__message">{{ message() }}</p>
        @if (details().length) {
          <ul class="alert__details">
            @for (detail of details(); track detail) {
              <li>{{ detail }}</li>
            }
          </ul>
        }
      </div>
      @if (dismissible()) {
        <button type="button" class="alert__close" aria-label="Cerrar mensaje" (click)="dismissed.emit()">
          <app-icon name="close" [size]="16" [strokeWidth]="2.5" />
        </button>
      }
    </div>
  `,
  styleUrl: './alert.component.scss',
})
export class AlertComponent {
  readonly tone = input<AlertTone>('info');
  readonly title = input<string>('');
  readonly message = input.required<string>();
  readonly details = input<string[]>([]);
  readonly dismissible = input(false);
  readonly dismissed = output<void>();
}
