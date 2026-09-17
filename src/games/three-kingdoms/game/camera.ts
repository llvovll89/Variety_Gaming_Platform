/**
 * Camera math. Pure — no canvas, no DOM — so hit-testing can be unit tested.
 *
 * The camera stores the WORLD point sitting at the centre of the viewport plus a zoom
 * factor. Storing the centre (rather than a top-left offset) is what makes zooming about
 * a pinch midpoint a two-line operation.
 */
import { axialToPixel, offsetToAxial, pixelToAxial, SQRT3, type HexCoord, type Point } from "./hex";
import { HEX_SIZE, MAP_HEIGHT, MAP_WIDTH, MAX_ZOOM, MIN_ZOOM } from "./constants";

export interface Camera {
  /** World coordinate displayed at the viewport centre. */
  x: number;
  y: number;
  zoom: number;
}

export interface Viewport {
  width: number;
  height: number;
}

export interface WorldBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * Extent of the board in world pixels. In odd-r terms a hex centre is simply
 * x = size·√3·(col + halfShiftForOddRows), y = size·1.5·row, so the bounds are closed form.
 */
export function mapWorldBounds(size = HEX_SIZE): WorldBounds {
  const halfWidth = size * SQRT3 * 0.5;
  return {
    minX: -halfWidth,
    minY: -size,
    maxX: size * SQRT3 * (MAP_WIDTH - 1 + 0.5) + halfWidth,
    maxY: size * 1.5 * (MAP_HEIGHT - 1) + size,
  };
}

export function clampZoom(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

/**
 * Keep the board from being dragged off into empty paper. When the map is smaller than the
 * viewport on an axis it is centred on that axis instead of clamped, which stops the tiny
 * jitter you otherwise get at minimum zoom.
 */
export function clampCamera(cam: Camera, view: Viewport, bounds = mapWorldBounds()): Camera {
  const halfW = view.width / (2 * cam.zoom);
  const halfH = view.height / (2 * cam.zoom);
  const worldW = bounds.maxX - bounds.minX;
  const worldH = bounds.maxY - bounds.minY;

  const x =
    worldW <= halfW * 2
      ? (bounds.minX + bounds.maxX) / 2
      : Math.min(bounds.maxX - halfW, Math.max(bounds.minX + halfW, cam.x));
  const y =
    worldH <= halfH * 2
      ? (bounds.minY + bounds.maxY) / 2
      : Math.min(bounds.maxY - halfH, Math.max(bounds.minY + halfH, cam.y));

  return { x, y, zoom: cam.zoom };
}

export function worldToScreen(p: Point, cam: Camera, view: Viewport): Point {
  return {
    x: (p.x - cam.x) * cam.zoom + view.width / 2,
    y: (p.y - cam.y) * cam.zoom + view.height / 2,
  };
}

export function screenToWorld(p: Point, cam: Camera, view: Viewport): Point {
  return {
    x: (p.x - view.width / 2) / cam.zoom + cam.x,
    y: (p.y - view.height / 2) / cam.zoom + cam.y,
  };
}

/** The hex under a screen-space point. This is the whole of hit-testing. */
export function screenToHex(p: Point, cam: Camera, view: Viewport): HexCoord {
  return pixelToAxial(screenToWorld(p, cam, view), HEX_SIZE);
}

/** Drag the world by a screen-space delta. */
export function panBy(cam: Camera, dxScreen: number, dyScreen: number): Camera {
  return { ...cam, x: cam.x - dxScreen / cam.zoom, y: cam.y - dyScreen / cam.zoom };
}

/**
 * Zoom while keeping the world point under `anchor` pinned to that same screen position.
 * Used by both the wheel and the pinch midpoint.
 */
export function zoomAt(cam: Camera, factor: number, anchor: Point, view: Viewport): Camera {
  const nextZoom = clampZoom(cam.zoom * factor);
  if (nextZoom === cam.zoom) return cam;
  const before = screenToWorld(anchor, cam, view);
  const after = screenToWorld(anchor, { ...cam, zoom: nextZoom }, view);
  return { x: cam.x + (before.x - after.x), y: cam.y + (before.y - after.y), zoom: nextZoom };
}

export function focusOn(cam: Camera, hex: HexCoord): Camera {
  const p = axialToPixel(hex, HEX_SIZE);
  return { ...cam, x: p.x, y: p.y };
}

/** Camera that frames the whole board inside the viewport, used on first mount. */
export function fitToView(view: Viewport): Camera {
  const bounds = mapWorldBounds();
  const zoom = clampZoom(
    Math.min(view.width / (bounds.maxX - bounds.minX), view.height / (bounds.maxY - bounds.minY)),
  );
  return clampCamera(
    { x: (bounds.minX + bounds.maxX) / 2, y: (bounds.minY + bounds.maxY) / 2, zoom },
    view,
  );
}

/** Inclusive offset-coordinate rectangle currently on screen, with a one-hex margin. */
export function visibleOffsetRect(
  cam: Camera,
  view: Viewport,
): { minCol: number; maxCol: number; minRow: number; maxRow: number } {
  const topLeft = screenToWorld({ x: 0, y: 0 }, cam, view);
  const bottomRight = screenToWorld({ x: view.width, y: view.height }, cam, view);
  // Row is a direct function of world y; column needs the row-dependent shift, so widen by
  // one on each side rather than trying to invert the stagger exactly.
  const minRow = Math.max(0, Math.floor(topLeft.y / (HEX_SIZE * 1.5)) - 1);
  const maxRow = Math.min(MAP_HEIGHT - 1, Math.ceil(bottomRight.y / (HEX_SIZE * 1.5)) + 1);
  const minCol = Math.max(0, Math.floor(topLeft.x / (HEX_SIZE * SQRT3)) - 1);
  const maxCol = Math.min(MAP_WIDTH - 1, Math.ceil(bottomRight.x / (HEX_SIZE * SQRT3)) + 1);
  return { minCol, maxCol, minRow, maxRow };
}

/** World-space centre of an odd-r tile. */
export function tileCenter(col: number, row: number): Point {
  return axialToPixel(offsetToAxial(col, row), HEX_SIZE);
}
