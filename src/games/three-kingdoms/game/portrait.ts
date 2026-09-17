/**
 * Procedural officer portraits.
 *
 * There is no portrait art in this project and there is not going to be any, so each of the
 * 39 officers gets a bust generated from their own stats and id. Two rules keep this from
 * landing in the uncanny valley:
 *
 *  1. **Silhouette first.** Headgear, beard and shoulders carry the identity; the face gets
 *     four ink strokes and nothing else. A rendered face at 80px is a smudge, whereas a
 *     distinctive hat reads instantly — which is also how the period's own portraiture works.
 *  2. **Stats choose the archetype, the id chooses the variation.** 무력 puts a man in a
 *     helmet, 지력 and 정치 put him in a scholar's cap, a ruler gets the beaded crown. Within
 *     an archetype a hash of the id moves the face width, the brow angle and the beard, so no
 *     two officers are identical and every officer is identical every time you look at him.
 */
import type { Ctx } from "./inkBrush";
import { PALETTE } from "./constants";
import type { Officer } from "./types";

export type Archetype = "lord" | "general" | "scholar" | "veteran" | "retainer";

const INK = PALETTE.ink;
const SKIN = "#e8d6b8";
const SKIN_SHADE = "#d4bd99";

/** Stable 0..1 from a string plus a salt. */
function hash01(id: string, salt: number): number {
  let h = 0x811c9dc5 ^ salt;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  h = Math.imul(h ^ (h >>> 15), 0x2545f491);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/**
 * Which kind of man is this? Read off the stats, so the portrait is never at odds with the
 * numbers underneath it.
 */
export function archetypeOf(o: Officer, isLord: boolean): Archetype {
  if (isLord) return "lord";
  if (o.war >= 82) return "general";
  if (o.int >= 82 || o.pol >= 82) return "scholar";
  if (o.lead >= 70 || o.war >= 65) return "veteran";
  return "retainer";
}

function shade(hex: string, amount: number): string {
  const n = hex.replace("#", "");
  const full = n.length === 3 ? n.split("").map((c) => c + c).join("") : n;
  const k = 1 - amount;
  const r = Math.round(parseInt(full.slice(0, 2), 16) * k);
  const g = Math.round(parseInt(full.slice(2, 4), 16) * k);
  const b = Math.round(parseInt(full.slice(4, 6), 16) * k);
  return `rgb(${r}, ${g}, ${b})`;
}

function stroke(ctx: Ctx, w: number): void {
  ctx.strokeStyle = INK;
  ctx.lineWidth = w;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.stroke();
}

/**
 * Draw one officer into a `w` x `h` box whose top-left is the current origin.
 * `factionColor` tints the robe and the mount so allegiance is visible at a glance.
 */
export function drawPortrait(
  ctx: Ctx,
  w: number,
  h: number,
  officer: Officer,
  factionColor: string,
  archetype: Archetype,
): void {
  const u = Math.min(w, h) / 100;          // one design unit
  const line = Math.max(1, u * 1.6);
  const cx = w / 2;

  const faceW = (0.15 + hash01(officer.id, 1) * 0.035) * w;
  const faceH = faceW * (1.2 + hash01(officer.id, 2) * 0.12);
  const faceY = h * 0.44;
  const browTilt = (hash01(officer.id, 3) - 0.35) * u * 6 + (officer.war - 60) * u * 0.06;
  // Beards grow with seniority as well as with the id hash, so a senior commander reads as
  // an elder statesman and a young hothead does not. 관우 at 통솔 95 ends up with the long
  // beard he is owed; 전위 at 통솔 60 stays cropped.
  const seniority = (officer.lead + officer.int) / 200;
  const beardLen = faceH * (0.15 + seniority * 0.95 + hash01(officer.id, 4) * 0.55)
    * (archetype === "scholar" || archetype === "lord" ? 1.15 : 0.9);

  // --- background: paper washed toward the faction colour, in a seal frame ---
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, "#f4ecda");
  bg.addColorStop(1, shade(factionColor, 0.05).replace("rgb(", "rgba(").replace(")", ", 0.35)"));
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // --- shoulders and robe ---
  const shoulderY = h * 0.74;
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.42, h);
  ctx.quadraticCurveTo(cx - w * 0.36, shoulderY, cx - w * 0.14, shoulderY - h * 0.02);
  ctx.lineTo(cx + w * 0.14, shoulderY - h * 0.02);
  ctx.quadraticCurveTo(cx + w * 0.36, shoulderY, cx + w * 0.42, h);
  ctx.closePath();
  ctx.fillStyle = factionColor;
  ctx.fill();
  stroke(ctx, line);

  // Crossed collar — the single detail that says "period costume" rather than "t-shirt".
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.15, shoulderY - h * 0.01);
  ctx.lineTo(cx, shoulderY + h * 0.11);
  ctx.lineTo(cx + w * 0.15, shoulderY - h * 0.01);
  ctx.closePath();
  ctx.fillStyle = "#efe6d0";
  ctx.fill();
  stroke(ctx, line * 0.8);

  // Armour lamellae for fighters, a sash for everyone else.
  if (archetype === "general" || archetype === "veteran") {
    ctx.strokeStyle = shade(factionColor, 0.4);
    ctx.lineWidth = line * 0.7;
    for (let i = 0; i < 2; i++) {
      const y = shoulderY + h * (0.1 + i * 0.08);
      ctx.beginPath();
      ctx.moveTo(cx - w * 0.3, y);
      ctx.lineTo(cx - w * 0.17, y);
      ctx.moveTo(cx + w * 0.17, y);
      ctx.lineTo(cx + w * 0.3, y);
      ctx.stroke();
    }
    // Shoulder guards.
    for (const sign of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(cx + sign * w * 0.3, shoulderY + h * 0.06, w * 0.1, h * 0.06, 0, 0, Math.PI * 2);
      ctx.fillStyle = shade(factionColor, 0.25);
      ctx.fill();
      stroke(ctx, line * 0.8);
    }
  }

  // --- neck and head ---
  //
  // The jaw is built as a path rather than an ellipse. A fighter gets a broad square jaw and
  // a scholar a narrow one, which is the difference that actually survives being shrunk to
  // 30 px — far more than eye spacing or face width ever will.
  ctx.beginPath();
  ctx.rect(cx - faceW * 0.3, faceY + faceH * 0.55, faceW * 0.6, h * 0.1);
  ctx.fillStyle = SKIN_SHADE;
  ctx.fill();

  const jaw = archetype === "general" ? 0.96 : archetype === "scholar" ? 0.7 : 0.82;
  ctx.beginPath();
  ctx.moveTo(cx - faceW, faceY - faceH * 0.35);
  ctx.quadraticCurveTo(cx - faceW * 1.04, faceY + faceH * 0.3, cx - faceW * jaw, faceY + faceH * 0.62);
  ctx.quadraticCurveTo(cx, faceY + faceH * 1.06, cx + faceW * jaw, faceY + faceH * 0.62);
  ctx.quadraticCurveTo(cx + faceW * 1.04, faceY + faceH * 0.3, cx + faceW, faceY - faceH * 0.35);
  ctx.quadraticCurveTo(cx, faceY - faceH * 1.12, cx - faceW, faceY - faceH * 0.35);
  ctx.closePath();
  ctx.fillStyle = SKIN;
  ctx.fill();
  stroke(ctx, line);

  // Temples, so the head is not a bare egg under the hat.
  ctx.save();
  ctx.fillStyle = "#33302c";
  for (const sign of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx + sign * faceW * 0.98, faceY - faceH * 0.42);
    ctx.quadraticCurveTo(cx + sign * faceW * 1.1, faceY + faceH * 0.06, cx + sign * faceW * 0.82, faceY + faceH * 0.2);
    ctx.quadraticCurveTo(cx + sign * faceW * 0.9, faceY - faceH * 0.16, cx + sign * faceW * 0.8, faceY - faceH * 0.5);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // --- headgear, the main identity carrier ---
  drawHeadgear(ctx, cx, faceY, faceW, faceH, u, line, archetype, factionColor, officer);

  // --- features: a brow, two narrowed eyes, a nose. Deliberately no smile. ---
  const eyeY = faceY + faceH * 0.02;
  const eyeDx = faceW * 0.44;
  const fierce = Math.max(0, Math.min(1, (officer.war - 55) / 45));
  ctx.strokeStyle = INK;
  ctx.lineCap = "round";

  for (const sign of [-1, 1]) {
    // Brow: heavy, and it slopes inward and down as 무력 rises. This one line is what makes
    // 여포 look like 여포 and 순욱 look like 순욱.
    ctx.lineWidth = Math.max(1.2, line * (1.1 + fierce * 0.9));
    ctx.beginPath();
    ctx.moveTo(cx + sign * (eyeDx + faceW * 0.3), eyeY - faceH * (0.3 - fierce * 0.08) + browTilt * 0.04);
    ctx.quadraticCurveTo(
      cx + sign * eyeDx,
      eyeY - faceH * (0.38 - fierce * 0.02),
      cx + sign * faceW * 0.12,
      eyeY - faceH * (0.24 + fierce * 0.16),
    );
    ctx.stroke();

    // Eye: a narrowed slit that tilts with the brow, never a circle.
    ctx.lineWidth = Math.max(1, line * 1.05);
    ctx.beginPath();
    ctx.moveTo(cx + sign * (eyeDx + faceW * 0.24), eyeY - faceH * fierce * 0.04);
    ctx.quadraticCurveTo(
      cx + sign * eyeDx,
      eyeY + faceH * 0.06,
      cx + sign * faceW * 0.16,
      eyeY + faceH * fierce * 0.05,
    );
    ctx.stroke();
  }

  // Nose: one tick.
  ctx.lineWidth = Math.max(0.9, line * 0.8);
  ctx.beginPath();
  ctx.moveTo(cx - faceW * 0.04, eyeY + faceH * 0.08);
  ctx.lineTo(cx - faceW * 0.12, eyeY + faceH * 0.3);
  ctx.lineTo(cx + faceW * 0.06, eyeY + faceH * 0.32);
  ctx.stroke();

  // --- beard: the second identity carrier ---
  const hair = hash01(officer.id, 5) > 0.82 ? "#8d8378" : "#33302c";
  if (beardLen > faceH * 0.2) {
    const spread = faceW * (0.9 + hash01(officer.id, 7) * 0.25);
    const forked = hash01(officer.id, 8) > 0.55;
    ctx.beginPath();
    ctx.moveTo(cx - spread, faceY + faceH * 0.18);
    ctx.quadraticCurveTo(cx - spread * 0.95, faceY + faceH * 0.7, cx - spread * 0.4, faceY + faceH * 0.82 + beardLen);
    if (forked) {
      // A forked beard, which is period-correct and doubles the silhouette variety.
      ctx.quadraticCurveTo(cx, faceY + faceH * 0.7 + beardLen * 0.5, cx, faceY + faceH * 0.78 + beardLen * 0.72);
      ctx.quadraticCurveTo(cx, faceY + faceH * 0.7 + beardLen * 0.5, cx + spread * 0.4, faceY + faceH * 0.82 + beardLen);
    } else {
      ctx.quadraticCurveTo(cx, faceY + faceH * 0.95 + beardLen * 1.25, cx + spread * 0.4, faceY + faceH * 0.82 + beardLen);
    }
    ctx.quadraticCurveTo(cx + spread * 0.95, faceY + faceH * 0.7, cx + spread, faceY + faceH * 0.18);
    ctx.quadraticCurveTo(cx, faceY + faceH * 0.52, cx - spread, faceY + faceH * 0.18);
    ctx.closePath();
    ctx.fillStyle = hair;
    ctx.fill();
    stroke(ctx, line * 0.7);
  } else {
    // Clean-shaven men still need a mouth, or the lower face reads as blank.
    ctx.strokeStyle = INK;
    ctx.lineWidth = Math.max(1, line);
    ctx.beginPath();
    ctx.moveTo(cx - faceW * 0.3, faceY + faceH * 0.52);
    ctx.quadraticCurveTo(cx, faceY + faceH * 0.46, cx + faceW * 0.3, faceY + faceH * 0.52);
    ctx.stroke();
  }

  // Moustache: two strokes falling AWAY from the nose. The previous single upward curve read
  // as a broad grin and had every warlord in the scenario beaming.
  ctx.strokeStyle = hair;
  ctx.lineWidth = Math.max(1.2, line * 1.3);
  for (const sign of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx + sign * faceW * 0.06, faceY + faceH * 0.34);
    ctx.quadraticCurveTo(
      cx + sign * faceW * 0.46,
      faceY + faceH * 0.36,
      cx + sign * faceW * (0.52 + hash01(officer.id, 9) * 0.25),
      faceY + faceH * (0.52 + hash01(officer.id, 10) * 0.3),
    );
    ctx.stroke();
  }

  // --- seal frame on top of everything ---
  ctx.beginPath();
  ctx.rect(line, line, w - line * 2, h - line * 2);
  ctx.strokeStyle = INK;
  ctx.lineWidth = line * 1.4;
  ctx.stroke();
  ctx.beginPath();
  ctx.rect(line * 3, line * 3, w - line * 6, h - line * 6);
  ctx.strokeStyle = "rgba(58,50,38,0.3)";
  ctx.lineWidth = line * 0.6;
  ctx.stroke();
}

function drawHeadgear(
  ctx: Ctx,
  cx: number,
  faceY: number,
  faceW: number,
  faceH: number,
  u: number,
  line: number,
  archetype: Archetype,
  factionColor: string,
  officer: Officer,
): void {
  const topY = faceY - faceH * 0.82;

  if (archetype === "general") {
    // Helmet bowl with cheek guards and a plume.
    ctx.beginPath();
    ctx.ellipse(cx, faceY - faceH * 0.34, faceW * 1.12, faceH * 0.78, 0, Math.PI, Math.PI * 2);
    ctx.fillStyle = shade(factionColor, 0.35);
    ctx.fill();
    stroke(ctx, line);
    for (const sign of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(cx + sign * faceW * 1.08, faceY - faceH * 0.34);
      ctx.quadraticCurveTo(cx + sign * faceW * 1.3, faceY + faceH * 0.2, cx + sign * faceW * 0.9, faceY + faceH * 0.42);
      ctx.lineTo(cx + sign * faceW * 0.86, faceY - faceH * 0.2);
      ctx.closePath();
      ctx.fillStyle = shade(factionColor, 0.2);
      ctx.fill();
      stroke(ctx, line * 0.8);
    }
    // Plume.
    ctx.beginPath();
    ctx.moveTo(cx, topY + faceH * 0.1);
    ctx.quadraticCurveTo(cx + faceW * 0.5, topY - faceH * 0.5, cx + faceW * 0.1, topY - faceH * 0.78);
    ctx.quadraticCurveTo(cx - faceW * 0.1, topY - faceH * 0.3, cx - faceW * 0.16, topY + faceH * 0.1);
    ctx.closePath();
    ctx.fillStyle = PALETTE.seal;
    ctx.fill();
    stroke(ctx, line * 0.8);
    return;
  }

  if (archetype === "scholar") {
    // 幞頭 — a soft cap with two flat wings.
    ctx.beginPath();
    ctx.moveTo(cx - faceW * 1.0, faceY - faceH * 0.5);
    ctx.quadraticCurveTo(cx, faceY - faceH * 1.9, cx + faceW * 1.0, faceY - faceH * 0.5);
    ctx.closePath();
    ctx.fillStyle = "#33302c";
    ctx.fill();
    stroke(ctx, line);
    for (const sign of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(
        cx + sign * faceW * 1.38, faceY - faceH * 0.78,
        faceW * 0.46, faceH * 0.16, sign * 0.25, 0, Math.PI * 2,
      );
      ctx.fillStyle = "#33302c";
      ctx.fill();
      stroke(ctx, line * 0.8);
    }
    return;
  }

  if (archetype === "lord") {
    // 면류관 — a flat board with hanging beads. Unmistakably a ruler.
    ctx.beginPath();
    ctx.ellipse(cx, faceY - faceH * 0.62, faceW * 1.0, faceH * 0.5, 0, Math.PI, Math.PI * 2);
    ctx.fillStyle = "#33302c";
    ctx.fill();
    stroke(ctx, line);
    ctx.beginPath();
    ctx.rect(cx - faceW * 1.5, faceY - faceH * 1.32, faceW * 3, faceH * 0.26);
    ctx.fillStyle = "#26231f";
    ctx.fill();
    stroke(ctx, line);
    ctx.fillStyle = "#d8c27a";
    for (let i = -2; i <= 2; i++) {
      for (let j = 0; j < 3; j++) {
        ctx.beginPath();
        ctx.arc(cx + i * faceW * 0.52, faceY - faceH * (1.0 - j * 0.22), Math.max(1, u * 1.4), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    return;
  }

  // Veterans and retainers: a wrapped headcloth, height varied by the id.
  const capH = faceH * (0.55 + hash01(officer.id, 6) * 0.35);
  ctx.beginPath();
  ctx.moveTo(cx - faceW * 1.02, faceY - faceH * 0.42);
  ctx.quadraticCurveTo(cx, faceY - faceH * 0.42 - capH * 2, cx + faceW * 1.02, faceY - faceH * 0.42);
  ctx.closePath();
  ctx.fillStyle = archetype === "veteran" ? shade(factionColor, 0.45) : "#5a5248";
  ctx.fill();
  stroke(ctx, line);
  // Knot at the back.
  ctx.beginPath();
  ctx.ellipse(cx + faceW * 0.9, faceY - faceH * 0.62, faceW * 0.26, faceH * 0.2, 0.4, 0, Math.PI * 2);
  ctx.fillStyle = archetype === "veteran" ? shade(factionColor, 0.3) : "#6b6357";
  ctx.fill();
  stroke(ctx, line * 0.8);
}
