/**
 * Discrete "flap now" input — unlike hachuping-slither's continuous angle tracking, this
 * game only needs an edge-triggered event per tap/click/spacebar press. `consumeFlap()`
 * reads and clears the pending flag so a single press yields exactly one flap.
 */
export class FlapInputController {
  private element: HTMLElement;
  private pending = false;

  private onPointerDown = (): void => {
    this.pending = true;
  };

  private onKeyDown = (e: KeyboardEvent): void => {
    if (e.code !== "Space" || e.repeat) return;
    e.preventDefault();
    this.pending = true;
  };

  constructor(element: HTMLElement) {
    this.element = element;
    element.addEventListener("pointerdown", this.onPointerDown);
    window.addEventListener("keydown", this.onKeyDown);
  }

  consumeFlap(): boolean {
    if (!this.pending) return false;
    this.pending = false;
    return true;
  }

  /** Drops any pending flap without applying it — used when pausing so a queued tap doesn't fire on resume. */
  reset(): void {
    this.pending = false;
  }

  destroy(): void {
    this.element.removeEventListener("pointerdown", this.onPointerDown);
    window.removeEventListener("keydown", this.onKeyDown);
  }
}
