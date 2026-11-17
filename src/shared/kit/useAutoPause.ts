import { useEffect, useRef } from 'react';
import { isKitDialogOpen } from './GameDialog';

export interface AutoPauseOptions {
  /** Only listen while the run is actually playing. */
  active: boolean;
  onPause: () => void;
  /** Pause when the window loses focus. Defaults to true. */
  blur?: boolean;
  /** Pause when the tab is hidden. Defaults to true. */
  visibility?: boolean;
  /** Keys that pause. Defaults to Escape and P; pass [] to turn keys off. */
  keys?: readonly string[];
}

const DEFAULT_KEYS = ['Escape', 'p', 'P'] as const;

interface KeyLike {
  key: string;
  repeat?: boolean;
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  target?: EventTarget | null;
  composedPath?: () => EventTarget[];
}

function isTextField(target: EventTarget | null | undefined): boolean {
  const el = target as HTMLElement | null | undefined;
  if (!el || typeof el !== 'object') return false;
  const tag = typeof el.tagName === 'string' ? el.tagName.toLowerCase() : '';
  return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable === true;
}

/**
 * Whether this key press should pause the run. Typing in a field, held-down repeats, shortcuts with
 * modifiers and presses while a kit dialog is open never pause. composedPath() finds the real field
 * inside a shadow root, where event.target is only the host.
 */
export function shouldPauseForKey(event: KeyLike, keys: readonly string[] = DEFAULT_KEYS, dialogOpen = isKitDialogOpen()): boolean {
  if (dialogOpen || event.repeat || event.altKey || event.ctrlKey || event.metaKey) return false;
  if (!keys.includes(event.key)) return false;
  return !isTextField(event.composedPath?.()[0] ?? event.target);
}

/** Pauses the run when the player looks away or presses Escape/P, the same way in every game. */
export function useAutoPause({ active, onPause, blur = true, visibility = true, keys = DEFAULT_KEYS }: AutoPauseOptions) {
  const pause = useRef(onPause);
  pause.current = onPause;
  const keyList = keys.join('\u0000');

  useEffect(() => {
    if (!active) return;
    const pauseKeys = keyList ? keyList.split('\u0000') : [];
    const onKey = (event: KeyboardEvent) => {
      if (!shouldPauseForKey(event, pauseKeys)) return;
      event.preventDefault();
      pause.current();
    };
    const onBlur = () => pause.current();
    const onVisibility = () => { if (document.hidden) pause.current(); };
    if (pauseKeys.length) window.addEventListener('keydown', onKey);
    if (blur) window.addEventListener('blur', onBlur);
    if (visibility) document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [active, blur, visibility, keyList]);
}
