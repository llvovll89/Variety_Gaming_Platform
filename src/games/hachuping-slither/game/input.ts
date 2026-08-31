export interface InputState {
  angle: number;
  boosting: boolean;
}

/**
 * Unifies mouse/touch/pen steering + boost via the Pointer Events API.
 *
 * Desktop: the head always steers toward the mouse position (pointermove fires on
 * hover, no button needed); holding the mouse button down triggers boost.
 * Mobile: there is no hover, so a touch-drag has to do steering alone — if it also
 * triggered boost (as it used to), every touch drained score just to move. Boost on
 * touch is instead driven explicitly via `setButtonBoosting`, wired to an on-screen
 * boost button, and kept independent of the drag-steering pointer's up/down state.
 */
export class InputController {
  private element: HTMLElement;
  private angle = -Math.PI / 2;
  private dragBoosting = false;
  private buttonBoosting = false;

  private onPointerMove = (e: PointerEvent): void => {
    const rect = this.element.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    this.angle = Math.atan2(y - cy, x - cx);
  };

  private onPointerDown = (e: PointerEvent): void => {
    if (e.pointerType === "mouse") {
      this.dragBoosting = true;
    }
    this.onPointerMove(e);
    this.element.setPointerCapture?.(e.pointerId);
  };

  private onPointerUp = (e: PointerEvent): void => {
    if (e.pointerType === "mouse") {
      this.dragBoosting = false;
    }
  };

  constructor(element: HTMLElement) {
    this.element = element;
    element.addEventListener("pointermove", this.onPointerMove);
    element.addEventListener("pointerdown", this.onPointerDown);
    window.addEventListener("pointerup", this.onPointerUp);
    window.addEventListener("pointercancel", this.onPointerUp);
  }

  getState(): InputState {
    return { angle: this.angle, boosting: this.dragBoosting || this.buttonBoosting };
  }

  /** Driven by the on-screen mobile boost button — independent of the steering pointer. */
  setButtonBoosting(value: boolean): void {
    this.buttonBoosting = value;
  }

  /** Clears the held/boost state without forgetting the last steering angle — used when
   * the game is paused so a stuck pointer-down doesn't carry a boost into the pause. */
  reset(): void {
    this.dragBoosting = false;
    this.buttonBoosting = false;
  }

  destroy(): void {
    this.element.removeEventListener("pointermove", this.onPointerMove);
    this.element.removeEventListener("pointerdown", this.onPointerDown);
    window.removeEventListener("pointerup", this.onPointerUp);
    window.removeEventListener("pointercancel", this.onPointerUp);
  }
}
