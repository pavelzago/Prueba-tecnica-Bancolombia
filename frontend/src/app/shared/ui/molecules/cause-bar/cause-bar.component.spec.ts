import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { CauseBarComponent } from './cause-bar.component';

describe('CauseBarComponent', () => {
  function render(count: number, base: number): HTMLElement {
    const fixture = TestBed.createComponent(CauseBarComponent);
    fixture.componentRef.setInput('label', 'Registro contable duplicado');
    fixture.componentRef.setInput('count', count);
    fixture.componentRef.setInput('base', base);
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  it('draws the bar as a share of the base and prints count and percentage', () => {
    const el = render(7, 22);
    const fill = el.querySelector<HTMLElement>('.cause__fill')!;
    expect(parseFloat(fill.style.width)).toBeCloseTo((7 / 22) * 100, 5);
    expect(el.querySelector('.cause__count')!.textContent).toMatch(/7[\s\S]*32\s?%/);
  });

  it('never overflows and stays empty without a base', () => {
    expect(render(5, 4).querySelector<HTMLElement>('.cause__fill')!.style.width).toBe('100%');
    expect(render(3, 0).querySelector<HTMLElement>('.cause__fill')!.style.width).toBe('0%');
  });
});
