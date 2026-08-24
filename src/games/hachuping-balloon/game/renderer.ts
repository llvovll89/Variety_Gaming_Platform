import {
  BALLOON_STRING_LENGTH,
  LOGICAL_HEIGHT,
  LOGICAL_WIDTH,
  MASCOT_RADIUS,
  POP_EFFECT_LIFETIME,
} from "./constants";
import type { Balloon, PopEffect } from "./types";
import { drawImageTopCrop } from "../../../shared/canvasImage";

export interface LetterboxTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
  viewportWidth: number;
  viewportHeight: number;
}

function toScreen(t: LetterboxTransform, x: number, y: number): { x: number; y: number } {
  return { x: t.offsetX + x * t.scale, y: t.offsetY + y * t.scale };
}

/** Inverse of toScreen — converts a pointer's CSS-pixel position back into logical space. */
export function toLogical(t: LetterboxTransform, screenX: number, screenY: number): { x: number; y: number } {
  return { x: (screenX - t.offsetX) / t.scale, y: (screenY - t.offsetY) / t.scale };
}

// Fixed backdrop clouds — generated once at module load, drifting slowly sideways and
// wrapping around, so the sky feels alive without any per-frame randomness.
interface Cloud {
  nx: number;
  ny: number;
  scale: number;
  speed: number;
}

const CLOUDS: Cloud[] = Array.from({ length: 7 }, () => ({
  nx: Math.random(),
  ny: 0.05 + Math.random() * 0.55,
  scale: 0.6 + Math.random() * 0.9,
  speed: 4 + Math.random() * 6,
}));

function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number): void {
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.beginPath();
  ctx.ellipse(x, y, 34 * scale, 20 * scale, 0, 0, Math.PI * 2);
  ctx.ellipse(x - 30 * scale, y + 6 * scale, 22 * scale, 16 * scale, 0, 0, Math.PI * 2);
  ctx.ellipse(x + 32 * scale, y + 6 * scale, 24 * scale, 17 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSky(ctx: CanvasRenderingContext2D, t: LetterboxTransform, decorTime: number): void {
  const grad = ctx.createLinearGradient(0, 0, 0, t.viewportHeight);
  grad.addColorStop(0, "#bfe6ff");
  grad.addColorStop(1, "#eaf7ff");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, t.viewportWidth, t.viewportHeight);

  for (const cloud of CLOUDS) {
    const wrapWidth = t.viewportWidth + 220;
    const x = (((cloud.nx * wrapWidth + decorTime * cloud.speed) % wrapWidth) + wrapWidth) % wrapWidth - 110;
    const y = cloud.ny * t.viewportHeight;
    drawCloud(ctx, x, y, cloud.scale);
  }
}

function drawBalloon(ctx: CanvasRenderingContext2D, t: LetterboxTransform, balloon: Balloon): void {
  const s = toScreen(t, balloon.x, balloon.y);
  const r = balloon.radius * t.scale;

  // String.
  ctx.strokeStyle = "rgba(90,70,60,0.55)";
  ctx.lineWidth = Math.max(1, 1.5 * t.scale);
  ctx.beginPath();
  ctx.moveTo(s.x, s.y + r);
  ctx.lineTo(s.x, s.y + r + BALLOON_STRING_LENGTH * t.scale);
  ctx.stroke();

  // Knot.
  ctx.fillStyle = `hsl(${balloon.hue}, 75%, 45%)`;
  ctx.beginPath();
  ctx.moveTo(s.x - r * 0.12, s.y + r * 0.95);
  ctx.lineTo(s.x + r * 0.12, s.y + r * 0.95);
  ctx.lineTo(s.x, s.y + r * 1.15);
  ctx.closePath();
  ctx.fill();

  // Body — glossy gradient with a soft drop shadow.
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.18)";
  ctx.shadowBlur = 10 * t.scale;
  ctx.shadowOffsetY = 4 * t.scale;
  const body = ctx.createRadialGradient(s.x - r * 0.3, s.y - r * 0.35, r * 0.1, s.x, s.y, r * 1.1);
  body.addColorStop(0, `hsl(${balloon.hue}, 95%, 78%)`);
  body.addColorStop(0.55, `hsl(${balloon.hue}, 90%, 62%)`);
  body.addColorStop(1, `hsl(${balloon.hue}, 80%, 48%)`);
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(s.x, s.y, r * 0.88, r, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Glossy highlight.
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.beginPath();
  ctx.ellipse(s.x - r * 0.32, s.y - r * 0.4, r * 0.22, r * 0.32, -0.3, 0, Math.PI * 2);
  ctx.fill();
}

function drawPopEffect(ctx: CanvasRenderingContext2D, t: LetterboxTransform, effect: PopEffect): void {
  const s = toScreen(t, effect.x, effect.y);
  const progress = effect.age / POP_EFFECT_LIFETIME;
  const alpha = Math.max(0, 1 - progress);
  const spread = (18 + progress * 46) * t.scale;

  const petals = 8;
  for (let i = 0; i < petals; i++) {
    const angle = (i / petals) * Math.PI * 2;
    const px = s.x + Math.cos(angle) * spread;
    const py = s.y + Math.sin(angle) * spread;
    ctx.fillStyle = `hsla(${effect.hue}, 90%, 65%, ${alpha})`;
    ctx.beginPath();
    ctx.arc(px, py, Math.max(1, 5 * t.scale * (1 - progress * 0.6)), 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawMascot(
  ctx: CanvasRenderingContext2D,
  t: LetterboxTransform,
  image: HTMLImageElement | null,
  decorTime: number,
): void {
  const bob = Math.sin(decorTime * 2) * 4;
  const cx = LOGICAL_WIDTH / 2;
  const cy = LOGICAL_HEIGHT - 46 + bob;
  const s = toScreen(t, cx, cy);
  const r = MASCOT_RADIUS * t.scale;

  ctx.fillStyle = "rgba(0,0,0,0.12)";
  ctx.beginPath();
  ctx.ellipse(s.x, s.y + r * 0.85, r * 0.75, r * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();

  if (image && image.complete && image.naturalWidth > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
    ctx.clip();
    drawImageTopCrop(ctx, image, s.x - r, s.y - r, r * 2);
    ctx.restore();
  } else {
    ctx.fillStyle = "#ffb020";
    ctx.beginPath();
    ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function computeLetterboxTransform(viewportWidth: number, viewportHeight: number): LetterboxTransform {
  const scale = Math.min(viewportWidth / LOGICAL_WIDTH, viewportHeight / LOGICAL_HEIGHT);
  const offsetX = (viewportWidth - LOGICAL_WIDTH * scale) / 2;
  const offsetY = (viewportHeight - LOGICAL_HEIGHT * scale) / 2;
  return { scale, offsetX, offsetY, viewportWidth, viewportHeight };
}

export function renderBalloons(
  ctx: CanvasRenderingContext2D,
  t: LetterboxTransform,
  balloons: Balloon[],
  popEffects: PopEffect[],
  mascotImage: HTMLImageElement | null,
  decorTime: number,
): void {
  drawSky(ctx, t, decorTime);
  drawMascot(ctx, t, mascotImage, decorTime);
  for (const balloon of balloons) drawBalloon(ctx, t, balloon);
  for (const effect of popEffects) drawPopEffect(ctx, t, effect);
}
