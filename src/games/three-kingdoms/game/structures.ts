/**
 * 2.5D structures drawn procedurally onto the hex map: walled cities, facility buildings,
 * troop formations and banners.
 *
 * There are no sprites and no 3D models in this project, so everything here is canvas paths.
 * The chosen register is **front elevation with a shallow extrusion** — a diorama seen from
 * slightly above and in front — rather than true isometric. At the sizes a hex gives us
 * (about 60x68 px at zoom 1) an isometric footprint wastes most of its pixels on the ground
 * plane, while a front elevation spends them on roofs, walls and banners, which is what
 * actually reads as "a city" at a glance.
 *
 * Every solid is drawn as: a darker right-hand side face, then the lit front face, then the
 * ink outline. That single ordering is what sells the depth.
 */
import { PALETTE } from "./constants";
import { inkText, plate, tileNoise, type Ctx } from "./inkBrush";
import type { Point } from "./hex";

/** Below this on-screen hex radius the map draws flat symbols instead of buildings. */
export const DETAIL_THRESHOLD = 24;

const INK = PALETTE.ink;

/** Push a colour toward black by `amount` (0..1). Used for side faces and shadows. */
function shade(hex: string, amount: number): string {
  const n = hex.replace("#", "");
  const full = n.length === 3 ? n.split("").map((c) => c + c).join("") : n;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  const k = 1 - amount;
  return `rgb(${Math.round(r * k)}, ${Math.round(g * k)}, ${Math.round(b * k)})`;
}

/** Push a colour toward white, for lit faces and highlights. */
function tint(hex: string, amount: number): string {
  const n = hex.replace("#", "");
  const full = n.length === 3 ? n.split("").map((c) => c + c).join("") : n;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgb(${Math.round(r + (255 - r) * amount)}, ${Math.round(g + (255 - g) * amount)}, ${Math.round(b + (255 - b) * amount)})`;
}

function outline(ctx: Ctx, width: number): void {
  ctx.strokeStyle = INK;
  ctx.lineWidth = width;
  ctx.lineJoin = "round";
  ctx.stroke();
}

/** Soft contact shadow so a building sits on the ground instead of floating over it. */
export function groundShadow(ctx: Ctx, at: Point, w: number, h: number): void {
  ctx.save();
  ctx.fillStyle = "rgba(58, 50, 38, 0.18)";
  ctx.beginPath();
  ctx.ellipse(at.x, at.y, w / 2, h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * A box standing on the ground at `base` (its bottom-centre), with a shaded right face.
 * `depth` is how far the side face juts out, in the same units as `w`.
 */
export function block(
  ctx: Ctx,
  base: Point,
  w: number,
  h: number,
  depth: number,
  color: string,
  lineWidth: number,
): void {
  const dx = depth;
  const dy = -depth * 0.55;
  const left = base.x - w / 2;
  const right = base.x + w / 2;
  const top = base.y - h;

  // Right side face first, so the front face overlaps it cleanly.
  ctx.beginPath();
  ctx.moveTo(right, base.y);
  ctx.lineTo(right + dx, base.y + dy);
  ctx.lineTo(right + dx, top + dy);
  ctx.lineTo(right, top);
  ctx.closePath();
  ctx.fillStyle = shade(color, 0.35);
  ctx.fill();
  outline(ctx, lineWidth);

  // Front face.
  ctx.beginPath();
  ctx.rect(left, top, w, h);
  ctx.fillStyle = color;
  ctx.fill();
  outline(ctx, lineWidth);
}

/**
 * A 기와지붕 — the upswept tiled roof that makes a shape read as East Asian architecture
 * rather than as a generic hut. Drawn as a ridge with two curved eaves that flick upward.
 */
export function tiledRoof(
  ctx: Ctx,
  base: Point,
  w: number,
  h: number,
  color: string,
  lineWidth: number,
): void {
  const half = w / 2;
  const flare = w * 0.16;
  const tipLift = h * 0.3;

  ctx.beginPath();
  ctx.moveTo(base.x - half - flare, base.y - tipLift);
  ctx.quadraticCurveTo(base.x - half * 0.45, base.y - h * 0.92, base.x, base.y - h);
  ctx.quadraticCurveTo(base.x + half * 0.45, base.y - h * 0.92, base.x + half + flare, base.y - tipLift);
  ctx.lineTo(base.x + half * 0.72, base.y);
  ctx.lineTo(base.x - half * 0.72, base.y);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  outline(ctx, lineWidth);

  // Ridge line plus a few tile courses, enough to read as tile without becoming noise.
  ctx.beginPath();
  ctx.moveTo(base.x - half - flare * 0.6, base.y - tipLift - h * 0.06);
  ctx.quadraticCurveTo(base.x, base.y - h * 1.04, base.x + half + flare * 0.6, base.y - tipLift - h * 0.06);
  ctx.strokeStyle = shade(color, 0.45);
  ctx.lineWidth = Math.max(0.8, lineWidth * 0.8);
  ctx.stroke();

  if (w > 18) {
    ctx.strokeStyle = shade(color, 0.28);
    ctx.lineWidth = Math.max(0.5, lineWidth * 0.45);
    for (let i = -1; i <= 1; i++) {
      const x = base.x + i * w * 0.22;
      ctx.beginPath();
      ctx.moveTo(x, base.y - h * 0.9);
      ctx.lineTo(x + i * flare * 0.4, base.y - tipLift * 0.6);
      ctx.stroke();
    }
  }
}

/** A single roofed building: body plus 기와지붕. Returns the roof ridge height. */
export function house(
  ctx: Ctx,
  base: Point,
  w: number,
  bodyH: number,
  color: string,
  roofColor: string,
  lineWidth: number,
): number {
  block(ctx, base, w, bodyH, w * 0.2, color, lineWidth);
  tiledRoof(ctx, { x: base.x, y: base.y - bodyH }, w * 1.22, w * 0.46, roofColor, lineWidth);
  return bodyH + w * 0.46;
}

/** Rampart with crenellations. `damage` 0..1 knocks merlons out as the wall is battered. */
export function rampart(
  ctx: Ctx,
  base: Point,
  w: number,
  h: number,
  color: string,
  lineWidth: number,
  damage = 0,
  seed = 0,
): void {
  block(ctx, base, w, h, w * 0.07, color, lineWidth);

  const merlonW = Math.max(2.5, w * 0.075);
  const merlonH = Math.max(2.5, h * 0.3);
  const count = Math.max(3, Math.floor(w / (merlonW * 2)));
  const step = w / count;
  ctx.fillStyle = tint(color, 0.12);
  for (let i = 0; i < count; i++) {
    // A battered wall loses merlons from pseudo-random positions, not left to right.
    if (damage > 0 && tileNoise(seed, i, 7) < damage) continue;
    const x = base.x - w / 2 + step * i + (step - merlonW) / 2;
    ctx.beginPath();
    ctx.rect(x, base.y - h - merlonH, merlonW, merlonH + 1);
    ctx.fill();
    outline(ctx, Math.max(0.6, lineWidth * 0.7));
  }

  // Cracks once the wall is genuinely in trouble.
  if (damage > 0.45) {
    ctx.save();
    ctx.strokeStyle = "rgba(58,50,38,0.55)";
    ctx.lineWidth = Math.max(0.7, lineWidth * 0.7);
    for (let i = 0; i < 2; i++) {
      const x = base.x + (tileNoise(seed, i, 11) - 0.5) * w * 0.7;
      ctx.beginPath();
      ctx.moveTo(x, base.y);
      ctx.lineTo(x + h * 0.18, base.y - h * 0.5);
      ctx.lineTo(x - h * 0.1, base.y - h * 0.85);
      ctx.stroke();
    }
    ctx.restore();
  }
}

/** Pole with a pennant. The glyph rides on the flag. */
export function banner(
  ctx: Ctx,
  base: Point,
  h: number,
  color: string,
  glyph: string,
  lineWidth: number,
  wave = 0,
): void {
  const top = base.y - h;
  ctx.beginPath();
  ctx.moveTo(base.x, base.y);
  ctx.lineTo(base.x, top);
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(1, lineWidth * 0.9);
  ctx.stroke();

  const flagH = h * 0.46;
  const flagW = h * 0.4;
  const sway = Math.sin(wave) * flagW * 0.12;
  ctx.beginPath();
  ctx.moveTo(base.x, top);
  ctx.quadraticCurveTo(base.x + flagW * 0.6 + sway, top + flagH * 0.1, base.x + flagW + sway, top + flagH * 0.34);
  ctx.lineTo(base.x + flagW * 0.72 + sway, top + flagH * 0.62);
  ctx.quadraticCurveTo(base.x + flagW * 0.4, top + flagH * 0.8, base.x, top + flagH);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  outline(ctx, Math.max(0.8, lineWidth * 0.8));

  if (flagH > 9 && glyph) {
    inkText(
      ctx,
      glyph,
      { x: base.x + flagW * 0.42 + sway, y: top + flagH * 0.46 },
      flagH * 0.62,
      "#ffffff",
      shade(color, 0.5),
      Math.max(1, flagH * 0.1),
    );
  }
}

/**
 * A knot of soldiers. Silhouettes rather than faces: at this scale a face is two pixels and
 * an attempt at one looks like a smudge, whereas a silhouette reads instantly.
 */
export function formation(
  ctx: Ctx,
  base: Point,
  w: number,
  color: string,
  kind: "spear" | "cavalry" | "archer",
  lineWidth: number,
  seed = 0,
): void {
  const unitH = w * 0.42;
  const rows: { x: number; y: number; s: number }[] = [];
  const perRow = 3;
  for (let row = 0; row < 2; row++) {
    const n = row === 0 ? perRow : perRow - 1;
    for (let i = 0; i < n; i++) {
      rows.push({
        x: base.x + (i - (n - 1) / 2) * w * 0.26,
        y: base.y - row * unitH * 0.34,
        s: 1 - row * 0.12,
      });
    }
  }
  // Back row first so the front row overlaps it.
  rows.sort((a, b) => a.y - b.y);

  for (const [index, f] of rows.entries()) {
    const h = unitH * f.s;
    const bw = h * 0.42;

    if (kind === "cavalry") {
      // Horse body as a rounded bar with two legs, rider as a bust above it.
      ctx.beginPath();
      ctx.ellipse(f.x, f.y - h * 0.34, bw * 0.85, h * 0.22, 0, 0, Math.PI * 2);
      ctx.fillStyle = shade(color, 0.2);
      ctx.fill();
      outline(ctx, Math.max(0.5, lineWidth * 0.55));
      ctx.beginPath();
      ctx.moveTo(f.x - bw * 0.5, f.y - h * 0.16);
      ctx.lineTo(f.x - bw * 0.5, f.y);
      ctx.moveTo(f.x + bw * 0.5, f.y - h * 0.16);
      ctx.lineTo(f.x + bw * 0.5, f.y);
      ctx.strokeStyle = INK;
      ctx.lineWidth = Math.max(0.5, lineWidth * 0.5);
      ctx.stroke();
    } else {
      // Legs.
      ctx.beginPath();
      ctx.moveTo(f.x - bw * 0.22, f.y - h * 0.3);
      ctx.lineTo(f.x - bw * 0.26, f.y);
      ctx.moveTo(f.x + bw * 0.22, f.y - h * 0.3);
      ctx.lineTo(f.x + bw * 0.26, f.y);
      ctx.strokeStyle = INK;
      ctx.lineWidth = Math.max(0.5, lineWidth * 0.5);
      ctx.stroke();
    }

    // Torso.
    const torsoY = kind === "cavalry" ? f.y - h * 0.52 : f.y - h * 0.3;
    ctx.beginPath();
    ctx.moveTo(f.x - bw * 0.5, torsoY);
    ctx.quadraticCurveTo(f.x, torsoY - h * 0.1, f.x + bw * 0.5, torsoY);
    ctx.lineTo(f.x + bw * 0.36, torsoY - h * 0.34);
    ctx.lineTo(f.x - bw * 0.36, torsoY - h * 0.34);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    outline(ctx, Math.max(0.5, lineWidth * 0.55));

    // Head with a helmet crest.
    ctx.beginPath();
    ctx.arc(f.x, torsoY - h * 0.45, bw * 0.24, 0, Math.PI * 2);
    ctx.fillStyle = tint(color, 0.15);
    ctx.fill();
    outline(ctx, Math.max(0.5, lineWidth * 0.5));

    // Weapon silhouettes: the fastest way to tell the three 병종 apart at a glance.
    ctx.strokeStyle = INK;
    ctx.lineWidth = Math.max(0.6, lineWidth * 0.7);
    const wx = f.x + bw * 0.5;
    if (kind === "spear") {
      const lean = (tileNoise(seed, index, 3) - 0.5) * h * 0.12;
      ctx.beginPath();
      ctx.moveTo(wx, torsoY + h * 0.05);
      ctx.lineTo(wx + lean, torsoY - h * 1.15);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(wx + lean, torsoY - h * 1.15);
      ctx.lineTo(wx + lean - bw * 0.1, torsoY - h * 0.95);
      ctx.lineTo(wx + lean + bw * 0.1, torsoY - h * 0.95);
      ctx.closePath();
      ctx.fillStyle = INK;
      ctx.fill();
    } else if (kind === "archer") {
      ctx.beginPath();
      ctx.arc(wx + bw * 0.1, torsoY - h * 0.3, h * 0.32, -Math.PI * 0.42, Math.PI * 0.42);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(wx + bw * 0.1 + h * 0.29, torsoY - h * 0.43);
      ctx.lineTo(wx + bw * 0.1 + h * 0.29, torsoY - h * 0.17);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(wx, torsoY - h * 0.2);
      ctx.lineTo(wx + bw * 0.55, torsoY - h * 0.72);
      ctx.stroke();
    }
  }
}

/** 농지 — furrowed strips with a field hut. */
export function farmField(ctx: Ctx, base: Point, w: number, lineWidth: number): void {
  ctx.save();
  ctx.strokeStyle = "rgba(76, 92, 48, 0.6)";
  ctx.lineWidth = Math.max(0.8, lineWidth * 0.8);
  for (let i = -2; i <= 2; i++) {
    const y = base.y - i * w * 0.1 - w * 0.02;
    const span = w * (0.46 - Math.abs(i) * 0.05);
    ctx.beginPath();
    ctx.moveTo(base.x - span, y);
    ctx.quadraticCurveTo(base.x, y - w * 0.04, base.x + span, y);
    ctx.stroke();
  }
  ctx.restore();
  house(ctx, { x: base.x - w * 0.3, y: base.y - w * 0.16 }, w * 0.26, w * 0.14, "#c9b483", "#7d6a4c", lineWidth);
}

/** 시장 — two awninged stalls. */
export function marketStalls(ctx: Ctx, base: Point, w: number, lineWidth: number): void {
  for (const [i, dx] of [-0.2, 0.22].entries()) {
    const at = { x: base.x + dx * w, y: base.y - i * w * 0.06 };
    block(ctx, at, w * 0.3, w * 0.17, w * 0.06, "#cbb388", lineWidth);
    // Striped awning.
    const aw = w * 0.4;
    ctx.beginPath();
    ctx.moveTo(at.x - aw / 2, at.y - w * 0.17);
    ctx.lineTo(at.x + aw / 2, at.y - w * 0.17);
    ctx.lineTo(at.x + aw / 2 - w * 0.03, at.y - w * 0.28);
    ctx.lineTo(at.x - aw / 2 + w * 0.03, at.y - w * 0.28);
    ctx.closePath();
    ctx.fillStyle = i === 0 ? "#a8543f" : "#8a6d2f";
    ctx.fill();
    outline(ctx, Math.max(0.6, lineWidth * 0.7));
  }
}

/** 병영 — a longhouse with a spear rack beside it. */
export function barrackYard(ctx: Ctx, base: Point, w: number, lineWidth: number): void {
  house(ctx, { x: base.x - w * 0.06, y: base.y }, w * 0.46, w * 0.2, "#b8a67f", "#6d5a41", lineWidth);
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(0.7, lineWidth * 0.8);
  for (let i = 0; i < 3; i++) {
    const x = base.x + w * 0.26 + i * w * 0.07;
    ctx.beginPath();
    ctx.moveTo(x, base.y);
    ctx.lineTo(x + w * 0.02, base.y - w * 0.32);
    ctx.stroke();
  }
}

/** 진지 — angled palisade stakes around a tent. */
export function fortCamp(ctx: Ctx, base: Point, w: number, color: string, lineWidth: number): void {
  // Tent.
  ctx.beginPath();
  ctx.moveTo(base.x, base.y - w * 0.36);
  ctx.lineTo(base.x + w * 0.22, base.y);
  ctx.lineTo(base.x - w * 0.22, base.y);
  ctx.closePath();
  ctx.fillStyle = "#cdbf9c";
  ctx.fill();
  outline(ctx, lineWidth);

  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(0.7, lineWidth * 0.8);
  for (let i = -3; i <= 3; i++) {
    if (i === 0) continue;
    const x = base.x + i * w * 0.115;
    ctx.beginPath();
    ctx.moveTo(x, base.y + w * 0.04);
    ctx.lineTo(x + w * 0.02, base.y - w * 0.2);
    ctx.stroke();
  }
  banner(ctx, { x: base.x + w * 0.28, y: base.y }, w * 0.42, color, "", lineWidth);
}

/** 궁노대 — a raised platform carrying a mounted crossbow. */
export function crossbowTower(ctx: Ctx, base: Point, w: number, lineWidth: number): void {
  block(ctx, base, w * 0.34, w * 0.26, w * 0.08, "#b3a07a", lineWidth);
  const top = { x: base.x, y: base.y - w * 0.26 };
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(0.9, lineWidth);
  // Bow arms.
  ctx.beginPath();
  ctx.moveTo(top.x - w * 0.26, top.y - w * 0.16);
  ctx.quadraticCurveTo(top.x, top.y - w * 0.04, top.x + w * 0.26, top.y - w * 0.16);
  ctx.stroke();
  // Stock.
  ctx.beginPath();
  ctx.moveTo(top.x - w * 0.02, top.y - w * 0.22);
  ctx.lineTo(top.x + w * 0.04, top.y);
  ctx.stroke();
}

/**
 * A walled city seen from the front: outbuildings behind, a rampart across the middle, a
 * gatehouse in the centre and a banner on the corner tower.
 */
export function walledCity(
  ctx: Ctx,
  center: Point,
  s: number,
  color: string,
  scale: "small" | "mid" | "large" | "capital",
  defenseRatio: number,
  lineWidth: number,
  seed: number,
  wave: number,
): void {
  const ground = center.y + s * 0.72;
  const width = s * (scale === "small" ? 1.5 : scale === "mid" ? 1.62 : 1.74);
  const wallH = s * (scale === "capital" ? 0.54 : scale === "large" ? 0.48 : 0.4);
  const wallColor = "#c3b391";
  const roofColor = shade(color, 0.15);
  const damage = 1 - Math.max(0, Math.min(1, defenseRatio));

  groundShadow(ctx, { x: center.x, y: ground + s * 0.05 }, width * 1.1, s * 0.22);

  // Outbuildings, tallest for the bigger cities. Drawn first so the wall stands in front.
  const backs = scale === "capital" ? 5 : scale === "large" ? 4 : 3;
  for (let i = 0; i < backs; i++) {
    const t = i / (backs - 1);
    const bx = center.x + (t - 0.5) * width * 0.78;
    const bw = width * (0.26 - Math.abs(t - 0.5) * 0.07);
    house(
      ctx,
      { x: bx, y: ground - wallH * (0.82 + tileNoise(seed, i, 9) * 0.3) },
      bw,
      bw * (0.5 + tileNoise(seed, i, 5) * 0.4),
      wallColor,
      roofColor,
      lineWidth,
    );
  }

  // The wall, then the gatehouse straddling it.
  rampart(ctx, { x: center.x, y: ground }, width, wallH, wallColor, lineWidth, damage, seed);

  const gateW = width * 0.3;
  const gateH = wallH * 1.2;
  block(ctx, { x: center.x, y: ground }, gateW, gateH, gateW * 0.14, tint(wallColor, 0.08), lineWidth);
  tiledRoof(ctx, { x: center.x, y: ground - gateH }, gateW * 1.38, gateW * 0.44, roofColor, lineWidth);

  // The gate arch itself, in the faction colour, so ownership is legible at any zoom.
  const archW = gateW * 0.42;
  ctx.beginPath();
  ctx.moveTo(center.x - archW / 2, ground);
  ctx.lineTo(center.x - archW / 2, ground - gateH * 0.42);
  ctx.quadraticCurveTo(center.x, ground - gateH * 0.72, center.x + archW / 2, ground - gateH * 0.42);
  ctx.lineTo(center.x + archW / 2, ground);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  outline(ctx, Math.max(0.7, lineWidth * 0.8));

  // Corner towers on the larger cities.
  if (scale !== "small") {
    for (const sign of [-1, 1]) {
      const tx = center.x + sign * width * 0.46;
      block(ctx, { x: tx, y: ground }, width * 0.14, wallH * 1.3, width * 0.05, wallColor, lineWidth);
      tiledRoof(ctx, { x: tx, y: ground - wallH * 1.3 }, width * 0.24, width * 0.1, roofColor, lineWidth);
    }
  }

  banner(
    ctx,
    { x: center.x - width * 0.46, y: ground - wallH * 1.45 },
    s * 0.46,
    color,
    "",
    lineWidth,
    wave,
  );
}

/** Paper plate label, used for city names and troop counts so they survive any background. */
export function mapLabel(
  ctx: Ctx,
  at: Point,
  text: string,
  fontPx: number,
  color: string = INK,
): void {
  ctx.save();
  ctx.font = `700 ${fontPx}px sans-serif`;
  const w = ctx.measureText(text).width + fontPx * 0.9;
  const h = fontPx * 1.5;
  ctx.restore();

  plate(ctx, at, w, h, h / 2);
  ctx.fillStyle = "rgba(244, 237, 222, 0.94)";
  ctx.fill();
  ctx.strokeStyle = "rgba(58, 50, 38, 0.5)";
  ctx.lineWidth = 1;
  ctx.stroke();
  inkText(ctx, text, at, fontPx, color, "rgba(244,237,222,0.9)", 1);
}
