/**
 * Pointer handling: drag-vs-tap discrimination and two-finger pinch.
 *
 * Pointer Events only, matching the rest of the arcade — one code path covers mouse, touch
 * and pen. The engine owns the camera; this class only reports what the fingers did.
 */
import type { Point } from "./hex";
import { TAP_SLOP_PX } from "./constants";

export interface PointerGesture {
  /** Screen-space drag since the previous move event. */
  pan?: { dx: number; dy: number };
  /** Multiplicative zoom change about `anchor`. */
  pinch?: { factor: number; anchor: Point };
}

export class PointerTracker {
  private active = new Map<number, Point>();
  private start = new Map<number, Point>();
  private moved = false;
  private lastPinchDistance = 0;

  get pointerCount(): number {
    return this.active.size;
  }

  /** True once any pointer has travelled far enough that this is a pan, not a tap. */
  get isDragging(): boolean {
    return this.moved;
  }

  down(id: number, p: Point): void {
    this.active.set(id, p);
    this.start.set(id, p);
    if (this.active.size === 1) this.moved = false;
    if (this.active.size === 2) this.lastPinchDistance = this.distance();
  }

  move(id: number, p: Point): PointerGesture | null {
    const prev = this.active.get(id);
    if (!prev) return null;
    this.active.set(id, p);

    const origin = this.start.get(id);
    if (origin && Math.hypot(p.x - origin.x, p.y - origin.y) > TAP_SLOP_PX) this.moved = true;

    if (this.active.size >= 2) {
      const d = this.distance();
      // A pinch is always a drag; never let one also register as a tap.
      this.moved = true;
      if (this.lastPinchDistance > 0 && d > 0) {
        const factor = d / this.lastPinchDistance;
        this.lastPinchDistance = d;
        return { pinch: { factor, anchor: this.midpoint() } };
      }
      this.lastPinchDistance = d;
      return null;
    }

    return { pan: { dx: p.x - prev.x, dy: p.y - prev.y } };
  }

  /** Returns the tap point when the gesture was a tap, otherwise null. */
  up(id: number): Point | null {
    const origin = this.start.get(id);
    const wasSingle = this.active.size === 1;
    this.active.delete(id);
    this.start.delete(id);
    if (this.active.size < 2) this.lastPinchDistance = 0;
    if (this.active.size === 0) {
      const tapped = wasSingle && !this.moved && origin ? origin : null;
      this.moved = false;
      return tapped;
    }
    return null;
  }

  cancel(id: number): void {
    this.active.delete(id);
    this.start.delete(id);
    if (this.active.size < 2) this.lastPinchDistance = 0;
    if (this.active.size === 0) this.moved = false;
  }

  clear(): void {
    this.active.clear();
    this.start.clear();
    this.moved = false;
    this.lastPinchDistance = 0;
  }

  private two(): [Point, Point] {
    const [a, b] = [...this.active.values()];
    return [a, b];
  }

  private distance(): number {
    if (this.active.size < 2) return 0;
    const [a, b] = this.two();
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  private midpoint(): Point {
    const [a, b] = this.two();
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }
}
