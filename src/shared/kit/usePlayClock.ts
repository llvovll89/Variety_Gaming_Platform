import { useCallback, useEffect, useRef } from 'react';

/**
 * Counts only the time a run is actually being played: pauses, intros and hidden tabs (games
 * auto-pause) do not count. Read the total with `elapsed()` when the run ends; `reset()` for a new run.
 */
export function usePlayClock(playing: boolean) {
  const clock = useRef({ ms: 0, since: 0 });
  useEffect(() => {
    const c = clock.current;
    if (playing) { c.since = performance.now(); return; }
    if (c.since) { c.ms += performance.now() - c.since; c.since = 0; }
  }, [playing]);
  const elapsed = useCallback(() => {
    const c = clock.current;
    return Math.round(c.ms + (c.since ? performance.now() - c.since : 0));
  }, []);
  const reset = useCallback(() => { clock.current = { ms: 0, since: clock.current.since ? performance.now() : 0 }; }, []);
  return { elapsed, reset };
}
