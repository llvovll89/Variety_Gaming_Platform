import {
  CAMERA_BOOST_ZOOM_OUT,
  CAMERA_ZOOM_FACTOR,
  CAMERA_ZOOM_MAX,
  CAMERA_ZOOM_MIN,
  CAMERA_ZOOM_SMOOTHING,
} from "./constants";
import type { Vector2 } from "../../../utils/math";
import { clamp, lerp } from "../../../utils/math";

export class Camera {
  x = 0;
  y = 0;
  zoom = CAMERA_ZOOM_MAX;
  viewportWidth = 0;
  viewportHeight = 0;

  setViewport(width: number, height: number): void {
    this.viewportWidth = width;
    this.viewportHeight = height;
  }

  follow(target: Vector2, targetRadius: number, dt: number, boosting: boolean): void {
    this.x = target.x;
    this.y = target.y;
    let desired = 1 / (1 + targetRadius * CAMERA_ZOOM_FACTOR);
    if (boosting) desired *= CAMERA_BOOST_ZOOM_OUT;
    desired = clamp(desired, CAMERA_ZOOM_MIN, CAMERA_ZOOM_MAX);
    const t = 1 - Math.exp(-CAMERA_ZOOM_SMOOTHING * dt);
    this.zoom = lerp(this.zoom, desired, t);
  }

  worldToScreen(pos: Vector2): Vector2 {
    return {
      x: (pos.x - this.x) * this.zoom + this.viewportWidth / 2,
      y: (pos.y - this.y) * this.zoom + this.viewportHeight / 2,
    };
  }

  screenToWorld(pos: Vector2): Vector2 {
    return {
      x: (pos.x - this.viewportWidth / 2) / this.zoom + this.x,
      y: (pos.y - this.viewportHeight / 2) / this.zoom + this.y,
    };
  }

  /** World-space rectangle currently visible, expanded by margin (world units). */
  getViewRect(margin: number): { minX: number; minY: number; maxX: number; maxY: number } {
    const halfW = this.viewportWidth / 2 / this.zoom + margin;
    const halfH = this.viewportHeight / 2 / this.zoom + margin;
    return {
      minX: this.x - halfW,
      minY: this.y - halfH,
      maxX: this.x + halfW,
      maxY: this.y + halfH,
    };
  }
}
