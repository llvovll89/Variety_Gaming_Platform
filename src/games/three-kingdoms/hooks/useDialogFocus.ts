import { useEffect, useRef } from 'react';

/** Keep keyboard focus in a modal, then return it to the command that opened it. */
export function useDialogFocus(onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  useEffect(() => { close.current = onClose; }, [onClose]);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog.focus();
    const keydown = (event: KeyboardEvent) => {
      // A nested native officer dialog owns its own focus and Escape handling.
      if (document.querySelector('dialog[open]')) return;
      if (event.key === 'Escape') {
        event.preventDefault(); event.stopPropagation(); close.current(); return;
      }
      if (event.key !== 'Tab') return;
      const controls = [...dialog.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),a[href],[tabindex="0"]')].filter(el => el.getClientRects().length > 0);
      const first = controls[0], last = controls.at(-1);
      if (!first || !last) { event.preventDefault(); dialog.focus(); return; }
      if (!dialog.contains(document.activeElement) || document.activeElement === dialog) {
        event.preventDefault(); (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    };
    document.addEventListener('keydown', keydown, true);
    return () => { document.removeEventListener('keydown', keydown, true); if (previous?.isConnected) previous.focus(); };
  }, []);
  return ref;
}
