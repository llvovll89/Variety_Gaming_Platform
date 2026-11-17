import { useLayoutEffect, useRef, type ReactNode, type RefObject } from 'react';

let openDialogs = 0;
/** True while any kit dialog is open; useAutoPause stays quiet then. */
export function isKitDialogOpen() { return openDialogs > 0; }

export interface GameDialogProps {
  /** Defaults to true: mounting the dialog opens it. */
  open?: boolean;
  label?: string;
  labelledBy?: string;
  describedBy?: string;
  /** Escape and (if enabled) a backdrop click call this. */
  onClose: () => void;
  /** False swallows Escape, for screens where the player must pick an action. */
  dismissible?: boolean;
  closeOnBackdrop?: boolean;
  /** Focused when the dialog opens; otherwise the browser picks [autofocus] or the first control. */
  initialFocus?: RefObject<HTMLElement | null>;
  /** Give focus back to whatever had it before the dialog opened. Defaults to true. */
  returnFocus?: boolean;
  /** Extra classes, so a game keeps its own dialog styles. */
  className?: string;
  children: ReactNode;
}

/**
 * Modal built on the native <dialog>: the browser keeps focus inside it (top layer), so there is no
 * hand-written focus trap. Works inside a shadow root too, since focus is looked up from the
 * dialog's own root node instead of `document`.
 */
export function GameDialog({ open = true, label, labelledBy, describedBy, onClose, dismissible = true, closeOnBackdrop = false, initialFocus, returnFocus = true, className, children }: GameDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const returnFocusRef = useRef(returnFocus);
  returnFocusRef.current = returnFocus;

  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;
    const root = dialog.getRootNode() as Document | ShadowRoot;
    const previous = root.activeElement as HTMLElement | null;
    if (!dialog.open) {
      try { dialog.showModal(); } catch { dialog.setAttribute('open', ''); }
    }
    openDialogs++;
    initialFocus?.current?.focus();
    return () => {
      openDialogs = Math.max(0, openDialogs - 1);
      if (dialog.open) dialog.close();
      if (returnFocusRef.current && previous?.isConnected) previous.focus({ preventScroll: true });
    };
    // initialFocus is read once on open, like the browser's own autofocus.
  }, [open]);

  if (!open) return null;
  return (
    <dialog
      ref={ref}
      className={className ? `kit-dialog ${className}` : 'kit-dialog'}
      aria-label={label}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      onCancel={event => { event.preventDefault(); if (dismissible) onCloseRef.current(); }}
      onClick={closeOnBackdrop ? event => { if (event.target === event.currentTarget) onCloseRef.current(); } : undefined}
    >
      {children}
    </dialog>
  );
}
