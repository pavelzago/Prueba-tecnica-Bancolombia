import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SearchInputComponent } from './search-input.component';

describe('SearchInputComponent', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function setup() {
    const fixture = TestBed.createComponent(SearchInputComponent);
    fixture.componentRef.setInput('inputId', 'search');
    fixture.componentRef.setInput('label', 'Buscar');
    fixture.componentRef.setInput('debounceMs', 200);
    fixture.detectChanges();
    const emitted: string[] = [];
    fixture.componentInstance.valueChange.subscribe((term) => emitted.push(term));
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    const type = (text: string) => {
      input.value = text;
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges(); // as the browser does after each keystroke
    };
    return { fixture, input, emitted, type };
  }

  it('emits the term only after the debounce pause', () => {
    const { emitted, type } = setup();
    type('consult');
    vi.advanceTimersByTime(199);
    expect(emitted).toEqual([]);
    vi.advanceTimersByTime(1);
    expect(emitted).toEqual(['consult']);
  });

  it('reset() drops a pending term so it is not applied after "Limpiar filtros"', () => {
    const { fixture, input, emitted, type } = setup();
    type('FAC-0001');
    fixture.componentInstance.reset();
    fixture.detectChanges();
    vi.advanceTimersByTime(500);
    expect(emitted).toEqual([]);
    expect(input.value).toBe('');
  });
});
