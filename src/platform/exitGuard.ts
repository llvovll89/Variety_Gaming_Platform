import { createContext, useContext, useEffect, useRef } from "react";

/**
 * Lets a game run its own "leave" routine when the player presses the browser's back button,
 * instead of being unmounted on the spot. Games that save before leaving (and may refuse to
 * leave when the save fails) register that routine; it must call `onExit` itself when done.
 */
export const ExitGuardSlot = createContext<((guard: (() => void) | null) => void) | null>(null);

export function useExitGuard(guard: (() => void) | null) {
  const register = useContext(ExitGuardSlot);
  const latest = useRef(guard);
  latest.current = guard;
  const active = guard !== null;
  useEffect(() => {
    if (!register || !active) return;
    register(() => latest.current?.());
    return () => register(null);
  }, [register, active]);
}
