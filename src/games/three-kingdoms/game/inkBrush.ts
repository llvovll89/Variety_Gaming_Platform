/**
 * Ink-wash drawing primitives.
 *
 * The whole visual identity is procedural — no sprites, no image downloads. Everything the
 * map needs is here: handmade paper, dry-brush strokes for mountains, wash fills, and text
 * that stays legible over a saturated hex.
 */
import { hexCorners, type Point } from "./hex";
import { HANJA_FONT, PALETTE } from "./constants";

export type Ctx = CanvasRenderingContext2D;

/**
 * A tiling paper texture, built once into a small offscreen canvas. Costs nothing to ship
 * and is most of what makes the board read as 한지 rather than as a beige rectangle.
 */
export function createPaperPattern(ctx: Ctx, size = 256): CanvasPattern | null {
  const off = document.createElement("canvas");
  off.width = size;
  off.height = size;
  const c = off.getContext("2d");
  if (!c) return null;

  c.fillStyle = PALETTE.paper;
  c.fillRect(0, 0, size, size);

  // Fibres: short, faint, mostly horizontal strokes.
  c.lineWidth = 1;
  for (let i = 0; i < 420; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const len = 3 + Math.random() * 14;
    const angle = (Math.random() - 0.5) * 0.7;
    c.strokeStyle = `rgba(58, 50, 38, ${0.012 + Math.random() * 0.03})`;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
    c.stroke();
  }
  // Flecks, so large flat areas are never perfectly uniform.
  for (let i = 0; i < 140; i++) {
    c.fillStyle = `rgba(120, 100, 70, ${0.015 + Math.random() * 0.035})`;
    c.beginPath();
    c.arc(Math.random() * size, Math.random() * size, Math.random() * 1.3, 0, Math.PI * 2);
    c.fill();
  }
  return ctx.createPattern(off, "repeat");
}

/** Trace a pointy-top hexagon. Does not fill or stroke. */
export function hexPath(ctx: Ctx, center: Point, size: number): void {
  const corners = hexCorners(center, size);
  ctx.beginPath();
  ctx.moveTo(corners[0].x, corners[0].y);
  for (let i = 1; i < 6; i++) ctx.lineTo(corners[i].x, corners[i].y);
  ctx.closePath();
}

export function fillHex(ctx: Ctx, center: Point, size: number, fill: string): void {
  hexPath(ctx, center, size);
  ctx.fillStyle = fill;
  ctx.fill();
}

/** Stroke a single hex EDGE (0-5, matching hexCorners order). */
export function strokeHexEdge(
  ctx: Ctx,
  center: Point,
  size: number,
  edge: number,
  color: string,
  width: number,
  alpha = 1,
): void {
  const corners = hexCorners(center, size);
  const a = corners[edge % 6];
  const b = corners[(edge + 1) % 6];
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
  ctx.restore();
}

/**
 * Deterministic jitter keyed on a tile so brushwork does not crawl while the camera moves.
 * A visible texture must not depend on frame time.
 */
export function tileNoise(q: number, r: number, salt: number): number {
  let h = Math.imul(q + 0x1f13, 0x85ebca6b) ^ Math.imul(r + 0x7f4a, 0xc2b2ae35) ^ Math.imul(salt + 1, 0x27d4eb2f);
  h = Math.imul(h ^ (h >>> 13), 0x165667b1);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Ridge marks for mountains: a few dry, tapering strokes rather than a flat fill. */
export function drawRidges(ctx: Ctx, center: Point, size: number, q: number, r: number): void {
  ctx.save();
  ctx.strokeStyle = "rgba(58, 50, 38, 0.5)";
  ctx.lineCap = "round";
  const count = 2 + Math.floor(tileNoise(q, r, 1) * 2);
  for (let i = 0; i < count; i++) {
    const t = tileNoise(q, r, 10 + i);
    const w = size * (0.34 + t * 0.26);
    const h = size * (0.36 + tileNoise(q, r, 20 + i) * 0.26);
    const cx = center.x + (t - 0.5) * size * 0.7;
    const cy = center.y + (tileNoise(q, r, 30 + i) - 0.5) * size * 0.4 + size * 0.1;
    ctx.lineWidth = Math.max(1, size * 0.07);
    ctx.beginPath();
    ctx.moveTo(cx - w, cy);
    ctx.lineTo(cx, cy - h);
    ctx.lineTo(cx + w, cy);
    ctx.stroke();
  }
  ctx.restore();
}

/** Clustered dots for woodland. */
export function drawGrove(ctx: Ctx, center: Point, size: number, q: number, r: number): void {
  ctx.save();
  ctx.fillStyle = "rgba(48, 66, 40, 0.42)";
  const count = 4 + Math.floor(tileNoise(q, r, 2) * 3);
  for (let i = 0; i < count; i++) {
    const a = tileNoise(q, r, 40 + i) * Math.PI * 2;
    const d = tileNoise(q, r, 50 + i) * size * 0.52;
    ctx.beginPath();
    ctx.arc(
      center.x + Math.cos(a) * d,
      center.y + Math.sin(a) * d,
      size * (0.1 + tileNoise(q, r, 60 + i) * 0.08),
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.restore();
}

/** Gentle horizontal wave strokes for water. */
export function drawWaves(ctx: Ctx, center: Point, size: number, q: number, r: number): void {
  ctx.save();
  ctx.strokeStyle = "rgba(38, 66, 82, 0.3)";
  ctx.lineWidth = Math.max(0.8, size * 0.05);
  ctx.lineCap = "round";
  for (let i = 0; i < 3; i++) {
    const y = center.y + (i - 1) * size * 0.38 + (tileNoise(q, r, 70 + i) - 0.5) * size * 0.12;
    const w = size * 0.6;
    ctx.beginPath();
    ctx.moveTo(center.x - w, y);
    ctx.quadraticCurveTo(center.x - w / 2, y - size * 0.1, center.x, y);
    ctx.quadraticCurveTo(center.x + w / 2, y + size * 0.1, center.x + w, y);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Sparse grass ticks for open ground. Only drawn when zoomed in: at overview scale the
 * plains should read as empty paper, but up close a completely bare hex looks unfinished.
 */
export function drawGrass(ctx: Ctx, center: Point, size: number, q: number, r: number): void {
  ctx.save();
  ctx.strokeStyle = "rgba(96, 92, 58, 0.26)";
  ctx.lineWidth = Math.max(0.6, size * 0.03);
  ctx.lineCap = "round";
  for (let i = 0; i < 5; i++) {
    const a = tileNoise(q, r, 110 + i) * Math.PI * 2;
    const d = Math.sqrt(tileNoise(q, r, 120 + i)) * size * 0.62;
    const x = center.x + Math.cos(a) * d;
    const y = center.y + Math.sin(a) * d;
    const lean = (tileNoise(q, r, 130 + i) - 0.5) * size * 0.1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + lean, y - size * (0.08 + tileNoise(q, r, 140 + i) * 0.07));
    ctx.stroke();
  }
  ctx.restore();
}

/** A low mound or two for hill country. */
export function drawMounds(ctx: Ctx, center: Point, size: number, q: number, r: number): void {
  ctx.save();
  ctx.strokeStyle = "rgba(58, 50, 38, 0.32)";
  ctx.lineWidth = Math.max(0.9, size * 0.055);
  ctx.lineCap = "round";
  for (let i = 0; i < 2; i++) {
    const cx = center.x + (tileNoise(q, r, 80 + i) - 0.5) * size * 0.7;
    const cy = center.y + (tileNoise(q, r, 90 + i) - 0.5) * size * 0.35 + size * 0.12;
    const w = size * (0.3 + tileNoise(q, r, 100 + i) * 0.16);
    ctx.beginPath();
    ctx.moveTo(cx - w, cy);
    ctx.quadraticCurveTo(cx, cy - w * 0.95, cx + w, cy);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Text drawn stroke-then-fill. The paper-coloured halo is mandatory: without it a Hanja
 * label disappears the moment it lands on a saturated faction hex.
 */
export function inkText(
  ctx: Ctx,
  text: string,
  at: Point,
  fontPx: number,
  fill: string,
  halo: string,
  haloWidth = Math.max(2, fontPx * 0.22),
  font = HANJA_FONT,
): void {
  ctx.save();
  ctx.font = `700 ${fontPx}px ${font}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.miterLimit = 2;
  ctx.lineWidth = haloWidth;
  ctx.strokeStyle = halo;
  ctx.strokeText(text, at.x, at.y);
  ctx.fillStyle = fill;
  ctx.fillText(text, at.x, at.y);
  ctx.restore();
}

/** Opaque plate behind small numbers so troop counts stay readable over any terrain. */
export function plate(ctx: Ctx, center: Point, w: number, h: number, radius: number): void {
  const x = center.x - w / 2;
  const y = center.y - h / 2;
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Does the platform have a font that can actually draw Hanja? Probed once at boot; if it
 * cannot, the renderer falls back to Korean names rather than showing tofu boxes.
 *
 * Comparing advance widths does NOT work here: a missing-glyph box in a CJK font is itself
 * full-width, so 洛 and U+FFFF measure identically whether or not the glyph exists. The only
 * reliable test is to rasterise both and compare pixels.
 */
export function canRenderHanja(_ctx: Ctx): boolean {
  const probe = document.createElement("canvas");
  probe.width = 48;
  probe.height = 48;
  const c = probe.getContext("2d", { willReadFrequently: true });
  if (!c) return false;

  const render = (ch: string): Uint8ClampedArray => {
    c.clearRect(0, 0, 48, 48);
    c.fillStyle = "#000";
    c.font = `700 40px ${HANJA_FONT}`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(ch, 24, 24);
    return c.getImageData(0, 0, 48, 48).data;
  };

  const glyph = render("洛");
  const tofu = render("￿");

  let ink = 0;
  let different = 0;
  for (let i = 3; i < glyph.length; i += 4) {
    if (glyph[i] > 8) ink++;
    if (Math.abs(glyph[i] - tofu[i]) > 8) different++;
  }
  // Needs to actually put ink on the canvas AND look unlike the platform's tofu box.
  return ink > 40 && different > 40;
}
