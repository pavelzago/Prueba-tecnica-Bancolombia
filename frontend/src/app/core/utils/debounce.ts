export interface Debouncer<T> {
  /** Schedules `fn(value)` after `ms` of quiet, replacing any pending call. */
  call(value: T): void;
  /** Runs `fn(value)` now and drops any pending call. */
  flush(value: T): void;
  /** Drops any pending call. */
  cancel(): void;
}

/**
 * Framework-free trailing debounce (testable with fake timers). `delay` may be a getter so it is
 * read on every call; a delay <= 0 calls synchronously.
 */
export function createDebouncer<T>(
  fn: (value: T) => void,
  delay: number | (() => number),
): Debouncer<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const cancel = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };
  return {
    call(value) {
      cancel();
      const ms = typeof delay === 'function' ? delay() : delay;
      if (ms <= 0) {
        fn(value);
        return;
      }
      timer = setTimeout(() => {
        timer = null;
        fn(value);
      }, ms);
    },
    flush(value) {
      cancel();
      fn(value);
    },
    cancel,
  };
}
