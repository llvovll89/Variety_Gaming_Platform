/**
 * Hex grid math. Pointy-top hexagons.
 *
 * Two coordinate systems live here and NOWHERE else in the codebase:
 *   - axial {q, r}  — used for all geometry: neighbours, distance, range, pathfinding.
 *   - odd-r offset  — used for storage: a rectangular row-major Tile[] indexed row*width+col.
 *
 * Every conversion between them goes through this file. Keeping the dual representation
 * contained is what stops the classic "taps select the wrong tile on odd rows" bug.
 */

export interface HexCoord {
  q: number;
  r: number;
}

export interface Point {
  x: number;
  y: number;
}

/** The six axial neighbour offsets, starting east and going counter-clockwise. */
export const HEX_DIRS: readonly HexCoord[] = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
] as const;

export const SQRT3 = Math.sqrt(3);

export function hexEquals(a: HexCoord, b: HexCoord): boolean {
  return a.q === b.q && a.r === b.r;
}

/** Stable string key for Map/Set usage. */
export function hexKey(h: HexCoord): string {
  return `${h.q},${h.r}`;
}

export function hexAdd(a: HexCoord, b: HexCoord): HexCoord {
  return { q: a.q + b.q, r: a.r + b.r };
}

/** Number of steps between two hexes on the grid. */
export function hexDistance(a: HexCoord, b: HexCoord): number {
  const dq = a.q - b.q;
  const dr = a.r - b.r;
  return (Math.abs(dq) + Math.abs(dq + dr) + Math.abs(dr)) / 2;
}

/** The six hexes adjacent to `h`, in HEX_DIRS order. Always length 6, bounds unchecked. */
export function hexNeighbors(h: HexCoord): HexCoord[] {
  return HEX_DIRS.map((d) => ({ q: h.q + d.q, r: h.r + d.r }));
}

/** Every hex within `radius` steps of `center`, including `center` itself. */
export function hexesInRange(center: HexCoord, radius: number): HexCoord[] {
  const out: HexCoord[] = [];
  for (let dq = -radius; dq <= radius; dq++) {
    const lo = Math.max(-radius, -dq - radius);
    const hi = Math.min(radius, -dq + radius);
    for (let dr = lo; dr <= hi; dr++) out.push({ q: center.q + dq, r: center.r + dr });
  }
  return out;
}

// ---------------------------------------------------------------------------
// axial <-> odd-r offset
// ---------------------------------------------------------------------------

/** Odd-r offset column/row for an axial coord. Odd rows are shifted right by half a hex. */
export function axialToOffset(h: HexCoord): { col: number; row: number } {
  return { col: h.q + (h.r - (h.r & 1)) / 2, row: h.r };
}

export function offsetToAxial(col: number, row: number): HexCoord {
  return { q: col - (row - (row & 1)) / 2, r: row };
}

// ---------------------------------------------------------------------------
// axial <-> pixel
// ---------------------------------------------------------------------------

/**
 * Center of a hex in world pixels. `size` is the circumradius (center to corner).
 * Pointy-top: width = √3·size, vertical spacing = 1.5·size.
 */
export function axialToPixel(h: HexCoord, size: number): Point {
  return {
    x: size * SQRT3 * (h.q + h.r / 2),
    y: size * 1.5 * h.r,
  };
}

/** Inverse of axialToPixel. Exact and O(1) — no per-hex search. */
export function pixelToAxial(p: Point, size: number): HexCoord {
  const r = (2 / 3) * (p.y / size);
  const q = p.x / (size * SQRT3) - r / 2;
  return hexRound(q, r);
}

/** Round fractional axial coords to the nearest hex via cube rounding. */
export function hexRound(qf: number, rf: number): HexCoord {
  const sf = -qf - rf;
  let q = Math.round(qf);
  let r = Math.round(rf);
  const s = Math.round(sf);

  const dq = Math.abs(q - qf);
  const dr = Math.abs(r - rf);
  const ds = Math.abs(s - sf);

  // Discard whichever component drifted most; the cube constraint q+r+s=0 restores it.
  if (dq > dr && dq > ds) q = -r - s;
  else if (dr > ds) r = -q - s;

  return { q, r };
}

/** The six corner points of a hex outline, for canvas paths. */
export function hexCorners(center: Point, size: number): Point[] {
  const out: Point[] = [];
  for (let i = 0; i < 6; i++) {
    // Pointy-top: first corner sits straight up, so start at -90° and step 60°.
    const angle = (Math.PI / 180) * (60 * i - 90);
    out.push({ x: center.x + size * Math.cos(angle), y: center.y + size * Math.sin(angle) });
  }
  return out;
}

/** Straight line of hexes from a to b inclusive, for path previews and LOS-ish checks. */
export function hexLine(a: HexCoord, b: HexCoord): HexCoord[] {
  const n = hexDistance(a, b);
  if (n === 0) return [{ ...a }];
  const out: HexCoord[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    // Nudge off the exact center so ties round consistently instead of flickering.
    out.push(hexRound(a.q + (b.q - a.q) * t + 1e-6, a.r + (b.r - a.r) * t + 1e-6));
  }
  return out;
}
