export interface InputState {
  angle: number;
  boosting: boolean;
}

/**
 * Unifies mouse/touch/pen steering + boost via the Pointer Events API.
 *
 * Desktop: the head always steers toward the mouse position (pointermove fires on
 * hover, no button needed); holding the button down triggers boost.
 * Mobile: there is no hover, so a touch-drag does both at once — steering follows the
 * finger and boost is active for as long as the finger is down, matching the
 * "누르면 이동 + 꾹 누르면 부스트" gesture the user asked for.
 */
export class InputController {
  private element: HTMLElement;
  private angle = -Math.PI / 2;
  private boosting = false;

  private onPointerMove = (e: PointerEvent): void => {
    const rect = this.element.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    this.angle = Math.atan2(y - cy, x - cx);
  };

  private onPointerDown = (e: PointerEvent): void => {
    this.boosting = true;
    this.onPointerMove(e);
    this.element.setPointerCapture?.(e.pointerId);
  };

  private onPointerUp = (): void => {
    this.boosting = false;
  };

  constructor(element: HTMLElement) {
    this.element = element;
    element.addEventListener("pointermove", this.onPointerMove);
    element.addEventListener("pointerdown", this.onPointerDown);
    window.addEventListener("pointerup", this.onPointerUp);
    window.addEventListener("pointercancel", this.onPointerUp);
  }

  getState(): InputState {
    return { angle: this.angle, boosting: this.boosting };
  }

  /** Clears the held/boost state without forgetting the last steering angle — used when
   * the game is paused so a stuck pointer-down doesn't carry a boost into the pause. */
  reset(): void {
    this.boosting = false;
  }

  destroy(): void {
    this.element.removeEventListener("pointermove", this.onPointerMove);
    this.element.removeEventListener("pointerdown", this.onPointerDown);
    window.removeEventListener("pointerup", this.onPointerUp);
    window.removeEventListener("pointercancel", this.onPointerUp);
  }
}
