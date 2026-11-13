import { useCallback, useEffect, useRef, useState } from 'react';

export const FLIP_DURATION = 520;
export const FLIP_STAGGER = 200;
export const REVEAL_DURATION = FLIP_DURATION + 4 * FLIP_STAGGER;

// Saved guesses are authoritative; this transient state only controls their presentation.
export function useGuessReveal() {
  const [row, setRow] = useState<number | null>(null);
  const busy = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancel = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null; busy.current = false; setRow(null);
  }, []);
  const start = useCallback((index: number, complete: () => void) => {
    if (busy.current) return false;
    busy.current = true; setRow(index);
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    timer.current = setTimeout(() => {
      timer.current = null; busy.current = false; setRow(null); complete();
    }, reduced ? 0 : REVEAL_DURATION);
    return true;
  }, []);
  useEffect(() => () => { if (timer.current !== null) clearTimeout(timer.current); }, []);
  return {row, busy, start, cancel};
}