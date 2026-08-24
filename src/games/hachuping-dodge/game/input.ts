import { JOYSTICK_MAX_RADIUS } from "./constants";

export interface JoystickVisual {
  active: boolean;
  center: { x: number; y: number }; // canvas CSS-pixel space
  thumb: { x: number; y: number };
}

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

/**
 * Unifies keyboard (Arrow keys / WASD, held) and a touch/mouse drag virtual joystick into a
 * single per-frame movement vector. Unlike hachuping-slither's radial "steer toward the
 * pointer" input, the joystick here is drag-delta: pointerdown marks the stick center, and
 * the vector is (current pointer - center), clamped to JOYSTICK_MAX_RADIUS.
 *
 * Keyboard and joystick are combined by vector sum (then re-clamped to length 1) rather than
 * last-input-wins — summing degrades gracefully when only one source is active, and doesn't
 * produce a discontinuous jump when the player switches between them mid-press.
 */
export class DodgeInputController {
  private element: HTMLElement;
  private heldKeys = new Set<string>();
  private joystickCenter: { x: number; y: number } | null = null;
  private joystickDir = { x: 0, y: 0 };
  private joystickThumb = { x: 0, y: 0 };

  private onKeyDown = (e: KeyboardEvent): void => {
    if (!MOVE_KEYS.has(e.key)) return;
    this.heldKeys.add(e.key.length === 1 ? e.key.toLowerCase() : e.key);
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.heldKeys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key);
  };

  private onPointerDown = (e: PointerEvent): void => {
    const rect = this.element.getBoundingClientRect();
    this.joystickCenter = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    this.joystickThumb = { ...this.joystickCenter };
    this.joystickDir = { x: 0, y: 0 };
    this.element.setPointerCapture?.(e.pointerId);
  };

  private onPointerMove = (e: PointerEvent): void => {
    if (!this.joystickCenter) return;
    const rect = this.element.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const dx = px - this.joystickCenter.x;
    const dy = py - this.joystickCenter.y;
    const len = Math.hypot(dx, dy);
    const clampedLen = Math.min(len, JOYSTICK_MAX_RADIUS);
    const angle = Math.atan2(dy, dx);
    this.joystickThumb = {
      x: this.joystickCenter.x + Math.cos(angle) * clampedLen,
      y: this.joystickCenter.y + Math.sin(angle) * clampedLen,
    };
    this.joystickDir = { x: dx / JOYSTICK_MAX_RADIUS, y: dy / JOYSTICK_MAX_RADIUS };
    const dirLen = Math.hypot(this.joystickDir.x, this.joystickDir.y);
    if (dirLen > 1) {
      this.joystickDir = { x: this.joystickDir.x / dirLen, y: this.joystickDir.y / dirLen };
    }
  };

  private onPointerUp = (): void => {
    this.joystickCenter = null;
    this.joystickDir = { x: 0, y: 0 };
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

  getMoveVector(): { x: number; y: number } {
    let kx = 0;
    let ky = 0;
    if (this.heldKeys.has("ArrowLeft") || this.heldKeys.has("a")) kx -= 1;
    if (this.heldKeys.has("ArrowRight") || this.heldKeys.has("d")) kx += 1;
    if (this.heldKeys.has("ArrowUp") || this.heldKeys.has("w")) ky -= 1;
    if (this.heldKeys.has("ArrowDown") || this.heldKeys.has("s")) ky += 1;
    const keyLen = Math.hypot(kx, ky);
    if (keyLen > 0) {
      kx /= keyLen;
      ky /= keyLen;
    }

    let x = kx + this.joystickDir.x;
    let y = ky + this.joystickDir.y;
    const len = Math.hypot(x, y);
    if (len > 1) {
      x /= len;
      y /= len;
    }
    return { x, y };
  }

  getJoystickVisual(): JoystickVisual {
    return {
      active: this.joystickCenter !== null,
      center: this.joystickCenter ?? { x: 0, y: 0 },
      thumb: this.joystickThumb,
    };
  }

  /** Drops held keys and the active joystick without other side effects — used on pause. */
  reset(): void {
    this.heldKeys.clear();
    this.joystickCenter = null;
    this.joystickDir = { x: 0, y: 0 };
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
