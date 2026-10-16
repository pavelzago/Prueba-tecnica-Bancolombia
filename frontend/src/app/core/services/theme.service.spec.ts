import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';

import { THEME_STORAGE_KEY, ThemeService } from './theme.service';

describe('ThemeService', () => {
  const root = document.documentElement;

  afterEach(() => {
    localStorage.clear();
    delete root.dataset['theme'];
  });

  function create(): ThemeService {
    const service = TestBed.inject(ThemeService);
    TestBed.tick(); // run the effect that applies the preference
    return service;
  }

  it('defaults to the system theme: no data-theme attribute and nothing stored', () => {
    const service = create();
    expect(service.preference()).toBe('system');
    expect(root.dataset['theme']).toBeUndefined();
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it('forces light or dark on <html> and remembers the choice', () => {
    const service = create();
    service.setPreference('dark');
    TestBed.tick();
    expect(root.dataset['theme']).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

    service.setPreference('system');
    TestBed.tick();
    expect(root.dataset['theme']).toBeUndefined();
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it('restores a saved preference and ignores invalid values', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
    expect(create().preference()).toBe('light');
    expect(root.dataset['theme']).toBe('light');

    TestBed.resetTestingModule();
    localStorage.setItem(THEME_STORAGE_KEY, 'neon');
    expect(create().preference()).toBe('system');
  });
});
