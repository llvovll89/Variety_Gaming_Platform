import { useLayoutEffect, useRef, type MouseEvent, type ReactNode, type RefObject } from 'react';

let openDialogs = 0;
/** True while any kit dialog is open; useAutoPause stays quiet then. */
export function isKitDialogOpen() { return openDialogs > 0; }

/** The key press that opened a dialog (e.g. Escape to pause) must not also close it. */
const OPENING_GRACE_MS = 150;

/** Put this attribute on the control that should get focus when the dialog opens. */
export const AUTOFOCUS = { 'data-kit-autofocus': '' } as const;

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
  /** Focused when the dialog opens; otherwise the [data-kit-autofocus] control, else the browser's pick. */
  initialFocus?: RefObject<HTMLElement | null>;
  /** Give focus back to whatever had it before the dialog opened. Defaults to true. */
  returnFocus?: boolean;
  /** Extra classes, so a game keeps its own dialog styles. */
  className?: string;
  children: ReactNode;
}

/** A click outside the dialog box itself; clicks on its padding still land on the dialog element. */
function outsideBox(event: MouseEvent<HTMLDialogElement>): boolean {
  if (event.target !== event.currentTarget) return false;
  const box = event.currentTarget.getBoundingClientRect();
  return event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom;
}

/**
 * Modal built on the native <dialog>: the browser keeps focus inside it (top layer), so there is no
 * hand-written focus trap. Works inside a shadow root too, since focus is looked up from the
 * dialog's own root node instead of `document`.
 */
export function GameDialog({ open = true, label, labelledBy, describedBy, onClose, dismissible = true, closeOnBackdrop = false, initialFocus, returnFocus = true, className, children }: GameDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const openedAt = useRef(0);
  const latest = useRef({ onClose, dismissible, returnFocus });
  latest.current = { onClose, dismissible, returnFocus };

  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;
    const root = dialog.getRootNode() as Document | ShadowRoot;
    const previous = root.activeElement as HTMLElement | null;
    const show = () => {
      if (dialog.open) return;
      try { dialog.showModal(); } catch { dialog.setAttribute('open', ''); }
    };
    show();
    openedAt.current = performance.now();
    openDialogs++;
    // React focuses autoFocus children before this effect opens the dialog, so focus here instead.
    (initialFocus?.current ?? dialog.querySelector<HTMLElement>('[data-kit-autofocus]'))?.focus();
    // The browser may close the dialog itself (Chrome closes it on a second Escape without a click
    // in between, even when cancel is prevented). Keep React's state and the dialog in step.
    let closing = false;
    const onNativeClose = () => {
      if (closing) return;
      if (latest.current.dismissible && performance.now() - openedAt.current > OPENING_GRACE_MS) latest.current.onClose();
      else show();
    };
    dialog.addEventListener('close', onNativeClose);
    return () => {
      closing = true;
      dialog.removeEventListener('close', onNativeClose);
      openDialogs = Math.max(0, openDialogs - 1);
      if (dialog.open) dialog.close();
      if (latest.current.returnFocus && previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, [open]);

  if (!open) return null;
  return (
    <dialog
      ref={ref}
      className={className ? `kit-dialog ${className}` : 'kit-dialog'}
      aria-label={label}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      onCancel={event => { event.preventDefault(); if (dismissible && performance.now() - openedAt.current > OPENING_GRACE_MS) latest.current.onClose(); }}
      onClick={closeOnBackdrop ? event => { if (outsideBox(event)) latest.current.onClose(); } : undefined}
    >
      {children}
    </dialog>
  );
}
