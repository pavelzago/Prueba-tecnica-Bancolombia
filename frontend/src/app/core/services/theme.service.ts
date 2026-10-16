import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject, signal } from '@angular/core';

/** "system" follows the OS preference; the others force a theme. */
export type ThemePreference = 'light' | 'dark' | 'system';

export const THEME_STORAGE_KEY = 'conciliador-theme';

function isPreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

/**
 * Theme preference, remembered in localStorage. It is applied as `data-theme` on <html>
 * (no attribute = system), which is what the tokens in styles.scss react to.
 * index.html applies the saved value before boot to avoid a flash.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly root = inject(DOCUMENT).documentElement;
  private readonly _preference = signal<ThemePreference>(this.readStored());

  readonly preference = this._preference.asReadonly();

  constructor() {
    effect(() => {
      const preference = this._preference();
      if (preference === 'system') {
        delete this.root.dataset['theme'];
      } else {
        this.root.dataset['theme'] = preference;
      }
      this.store(preference);
    });
  }

  setPreference(preference: ThemePreference): void {
    this._preference.set(preference);
  }

  private readStored(): ThemePreference {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      return isPreference(stored) ? stored : 'system';
    } catch {
      return 'system'; // storage blocked (private mode, policies)
    }
  }

  private store(preference: ThemePreference): void {
    try {
      if (preference === 'system') {
        localStorage.removeItem(THEME_STORAGE_KEY);
      } else {
        localStorage.setItem(THEME_STORAGE_KEY, preference);
      }
    } catch {
      // Not critical: the choice just won't survive a reload.
    }
  }
}
