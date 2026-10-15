import { createDebouncer } from './debounce';

describe('createDebouncer', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('emits only the last value after the quiet period', () => {
    const fn = vi.fn();
    const debouncer = createDebouncer<string>(fn, 200);

    debouncer.call('c');
    vi.advanceTimersByTime(150);
    debouncer.call('co');
    vi.advanceTimersByTime(150);
    debouncer.call('con');
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(199);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('con');
  });

  it('flush emits immediately and cancels the pending value', () => {
    const fn = vi.fn();
    const debouncer = createDebouncer<string>(fn, 200);

    debouncer.call('abc');
    debouncer.flush('');
    vi.advanceTimersByTime(500);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('');
  });
});
