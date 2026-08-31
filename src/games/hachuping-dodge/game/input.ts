const MOVE_KEYS = new Set([
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "w",
  "a",
  "s",
  "d",
  "W",
  "A",
  "S",
  "D",
]);

export interface PointerTarget {
  x: number; // canvas CSS-pixel space
  y: number;
}

/**
 * Unifies keyboard (Arrow keys / WASD, held) and touch/mouse into a single per-frame
 * movement intent. Touch/mouse steer continuously toward the pointer's on-screen position —
 * the same "aim toward the pointer" model as hachuping-slither — rather than a delta-based
 * virtual joystick: a floating joystick reads as imprecise on touch (tiny drags near the
 * anchor point produce a noisy angle) and doesn't match how a mouse is used at all (no
 * "hold and drag from an anchor" convention). The engine owns the world/letterbox transform,
 * so it converts `pointerTarget` into a world-space direction itself; this controller only
 * tracks the raw pointer position.
 */
export class DodgeInputController {
  private element: HTMLElement;
  private heldKeys = new Set<string>();
  private pointerTarget: PointerTarget | null = null;

  private onKeyDown = (e: KeyboardEvent): void => {
    if (!MOVE_KEYS.has(e.key)) return;
    this.heldKeys.add(e.key.length === 1 ? e.key.toLowerCase() : e.key);
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.heldKeys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key);
  };

  private updateTarget = (e: PointerEvent): void => {
    const rect = this.element.getBoundingClientRect();
    this.pointerTarget = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  private onPointerDown = (e: PointerEvent): void => {
    this.updateTarget(e);
    this.element.setPointerCapture?.(e.pointerId);
  };

  private onPointerMove = (e: PointerEvent): void => {
    if (!this.pointerTarget) return;
    this.updateTarget(e);
  };

  private onPointerUp = (): void => {
    this.pointerTarget = null;
  };

  constructor(element: HTMLElement) {
    this.element = element;
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    element.addEventListener("pointerdown", this.onPointerDown);
    element.addEventListener("pointermove", this.onPointerMove);
    window.addEventListener("pointerup", this.onPointerUp);
    window.addEventListener("pointercancel", this.onPointerUp);
  }

  /** Pointer target takes priority over keyboard whenever a touch/click is held. */
  getPointerTarget(): PointerTarget | null {
    return this.pointerTarget;
  }

  getKeyboardVector(): { x: number; y: number } {
    let kx = 0;
    let ky = 0;
    if (this.heldKeys.has("ArrowLeft") || this.heldKeys.has("a")) kx -= 1;
    if (this.heldKeys.has("ArrowRight") || this.heldKeys.has("d")) kx += 1;
    if (this.heldKeys.has("ArrowUp") || this.heldKeys.has("w")) ky -= 1;
    if (this.heldKeys.has("ArrowDown") || this.heldKeys.has("s")) ky += 1;
    const len = Math.hypot(kx, ky);
    if (len > 0) {
      kx /= len;
      ky /= len;
    }
    return { x: kx, y: ky };
  }

  /** Drops held keys and the active pointer target without other side effects — used on pause. */
  reset(): void {
    this.heldKeys.clear();
    this.pointerTarget = null;
  }

  destroy(): void {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    this.element.removeEventListener("pointerdown", this.onPointerDown);
    this.element.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("pointerup", this.onPointerUp);
    window.removeEventListener("pointercancel", this.onPointerUp);
  }
}
