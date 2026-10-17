import { useCallback, useRef } from 'react';

/**
 * Stops a second tap from saving twice. Wrap a save handler with `guard(...)`: while it is still running, further
 * calls are ignored (a form's default submit is still prevented, so the page never reloads). Unlike a disabled
 * button, this also holds when two taps land before the screen has redrawn.
 */
export function useSaveGuard() {
  const busy = useRef(false);
  return useCallback(<A extends unknown[], R>(fn: (...args: A) => Promise<R> | R) => async (...args: A): Promise<R | undefined> => {
    if (busy.current) {
      const first = args[0] as { preventDefault?: () => void } | undefined;
      first?.preventDefault?.();
      return undefined;
    }
    busy.current = true;
    try {
      return await fn(...args);
    } finally {
      busy.current = false;
    }
  }, []);
}
