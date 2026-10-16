import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { ThemePreference } from '../../../../core/services/theme.service';
import { IconComponent, IconName } from '../../atoms/icon/icon.component';

interface ThemeOption {
  value: ThemePreference;
  label: string;
  icon: IconName;
}

const OPTIONS: ThemeOption[] = [
  { value: 'light', label: 'Claro', icon: 'sun' },
  { value: 'dark', label: 'Oscuro', icon: 'moon' },
  { value: 'system', label: 'Sistema', icon: 'monitor' },
];

/** Light / dark / system selector, styled for the dark page header. */
@Component({
  selector: 'app-theme-switch',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <div class="theme" role="group" aria-label="Tema de color">
      @for (option of options; track option.value) {
        <button
          type="button"
          class="theme__option"
          [class.theme__option--active]="option.value === value()"
          [attr.aria-pressed]="option.value === value()"
          [attr.title]="option.value === 'system' ? 'Seguir el tema del sistema operativo' : 'Tema ' + option.label.toLowerCase()"
          (click)="valueChange.emit(option.value)"
        >
          <app-icon [name]="option.icon" [size]="16" />
          <span class="theme__label">{{ option.label }}</span>
        </button>
      }
    </div>
  `,
  styles: `
    :host { display: inline-flex; }
    .theme {
      display: inline-flex;
      padding: 2px;
      border: 1px solid color-mix(in srgb, var(--color-header-soft) 45%, transparent);
      border-radius: var(--radius);
    }
    .theme__option {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      min-height: 2rem;
      padding: 0 var(--space-2);
      border: 0;
      border-radius: var(--radius-sm);
      background: transparent;
      color: var(--color-header-soft);
      font-size: var(--text-xs);
      font-weight: var(--weight-medium);
      cursor: pointer;
    }
    .theme__option:hover { color: var(--color-header-ink); background: color-mix(in srgb, var(--color-header-ink) 10%, transparent); }
    .theme__option:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 1px; }
    .theme__option--active,
    .theme__option--active:hover {
      background: var(--color-accent);
      color: var(--color-accent-ink);
      font-weight: var(--weight-semibold);
    }
    @media (max-width: 40rem) {
      .theme__label { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
      .theme__option { padding: 0 var(--space-2); min-width: 2.25rem; justify-content: center; }
    }
  `,
})
export class ThemeSwitchComponent {
  readonly value = input.required<ThemePreference>();
  readonly valueChange = output<ThemePreference>();

  protected readonly options = OPTIONS;
}
