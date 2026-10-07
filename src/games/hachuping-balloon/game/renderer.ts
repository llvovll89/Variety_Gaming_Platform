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
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.beginPath();
  ctx.moveTo(x + 34 * scale, y);
  ctx.ellipse(x, y, 34 * scale, 20 * scale, 0, 0, Math.PI * 2);
  ctx.moveTo(x - 8 * scale, y + 6 * scale);
  ctx.ellipse(x - 30 * scale, y + 6 * scale, 22 * scale, 16 * scale, 0, 0, Math.PI * 2);
  ctx.moveTo(x + 56 * scale, y + 6 * scale);
  ctx.ellipse(x + 32 * scale, y + 6 * scale, 24 * scale, 17 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSky(ctx: CanvasRenderingContext2D, t: LetterboxTransform, decorTime: number): void {
  const grad = ctx.createLinearGradient(0, 0, 0, t.viewportHeight);
  grad.addColorStop(0, "#75c9ef");
  grad.addColorStop(0.6, "#c5eafa");
  grad.addColorStop(1, "#edf9ff");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, t.viewportWidth, t.viewportHeight);

  for (const cloud of CLOUDS) {
    const wrapWidth = t.viewportWidth + 220;
    const x = (((cloud.nx * wrapWidth + decorTime * cloud.speed) % wrapWidth) + wrapWidth) % wrapWidth - 110;
    const y = cloud.ny * t.viewportHeight;
    drawCloud(ctx, x, y, cloud.scale * Math.min(2.2, t.viewportWidth / 300));
  }
}

function drawBalloon(ctx: CanvasRenderingContext2D, t: LetterboxTransform, balloon: Balloon): void {
  const s = toScreen(t, balloon.x, balloon.y);
  const r = balloon.radius * t.scale;
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate(Math.sin(balloon.age * balloon.swaySpeed + balloon.swayPhase) * 0.12);
  const bodyPath = (): void => {
    ctx.beginPath();
    if (balloon.shape === "heart") {
      ctx.moveTo(0, r);
      ctx.bezierCurveTo(-r * 1.8, -r * 0.2, -r * .9, -r * 1.7, 0, -r * .6);
      ctx.bezierCurveTo(r * .9, -r * 1.7, r * 1.8, -r * .2, 0, r);
    } else if (balloon.shape === "star") {
      for (let i = 0; i < 10; i++) {
        const a = i * Math.PI / 5 - Math.PI / 2, length = r * (i % 2 ? .53 : 1.13);
        const x = Math.cos(a) * length, y = Math.sin(a) * length;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
    } else ctx.ellipse(0, 0, r * .88, r, 0, 0, Math.PI * 2);
    ctx.closePath();
  };

  // String.
  ctx.strokeStyle = "rgba(65,108,132,0.5)";
  ctx.lineWidth = Math.max(1, 1.5 * t.scale);
  ctx.beginPath();
  ctx.moveTo(0, r);
  ctx.bezierCurveTo(-r * .25, r * 1.6, r * .4, r * 1.7, 0, r + BALLOON_STRING_LENGTH * t.scale * 2);
  ctx.stroke();

  // Knot.
  ctx.fillStyle = `hsl(${balloon.hue}, 75%, 45%)`;
  ctx.beginPath();
  ctx.moveTo(-r * 0.12, r * 1.15);
  ctx.lineTo(r * 0.12, r * 1.15);
  ctx.lineTo(0, r * .95);
  ctx.closePath();
  ctx.fill();

  // Body — glossy gradient with a soft drop shadow.
  ctx.save();
  ctx.shadowColor = "rgba(33,102,143,0.2)";
  ctx.shadowBlur = 14 * t.scale;
  ctx.shadowOffsetY = 7 * t.scale;
  const body = ctx.createRadialGradient(-r * .35, -r * .45, 0, r * .15, r * .25, r * 1.4);
  body.addColorStop(0, `hsl(${balloon.hue}, 94%, 88%)`);
  body.addColorStop(.28, `hsl(${balloon.hue}, 90%, 73%)`);
  body.addColorStop(.65, `hsl(${balloon.hue}, 84%, 59%)`);
  body.addColorStop(1, `hsl(${balloon.hue}, 72%, 38%)`);
  ctx.fillStyle = body;
  bodyPath();
  ctx.fill();
  ctx.restore();

  // Glossy highlight.
  ctx.save();
  bodyPath(); ctx.clip();
  if (balloon.shape === "star") {
    for (let i = 0; i < 5; i++) {
      const a = i * Math.PI * .4 - Math.PI / 2;
      ctx.fillStyle = i % 2 ? "rgba(255,255,255,.18)" : "rgba(70,45,20,.10)";
      ctx.beginPath(); ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * r * 1.13, Math.sin(a) * r * 1.13);
      ctx.lineTo(Math.cos(a + Math.PI / 5) * r * .53, Math.sin(a + Math.PI / 5) * r * .53);
      ctx.closePath(); ctx.fill();
    }
  }
  ctx.fillStyle = "rgba(255,255,255,0.68)";
  ctx.beginPath();
  ctx.ellipse(-r * 0.32, -r * 0.4, r * 0.11, r * 0.28, .45, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 2 * t.scale;
  ctx.beginPath(); ctx.ellipse(r * .18, r * .18, r * .65, r * .75, 0, 0, Math.PI * .55); ctx.stroke();
  ctx.restore();
  ctx.restore();
}

function drawPopEffect(ctx: CanvasRenderingContext2D, t: LetterboxTransform, effect: PopEffect, reducedMotion: boolean): void {
  const s = toScreen(t, effect.x, effect.y);
  const progress = effect.age / POP_EFFECT_LIFETIME;
  const alpha = Math.max(0, 1 - progress);
  const spread = (8 + Math.sin(progress * Math.PI / 2) * (reducedMotion ? 25 : 85)) * t.scale;

  const petals = 14;
  for (let i = 0; i < petals; i++) {
    const angle = (i / petals) * Math.PI * 2;
    const px = s.x + Math.cos(angle) * spread;
    const py = s.y + Math.sin(angle) * spread + progress * progress * (reducedMotion ? 0 : 65) * t.scale;
    ctx.save(); ctx.translate(px, py); ctx.rotate(angle + (reducedMotion ? 0 : progress * 7));
    ctx.fillStyle = `hsla(${effect.hue + i * 39}, 85%, 60%, ${alpha})`;
    ctx.fillRect(-3 * t.scale, -5 * t.scale, 6 * t.scale, (i % 3 === 0 ? 17 : 9) * t.scale);
    ctx.restore();
  }
  ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = "#fff"; ctx.lineWidth = 3 * t.scale;
  ctx.beginPath(); ctx.arc(s.x, s.y, spread * .55, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
}

function drawMascot(
  ctx: CanvasRenderingContext2D,
  t: LetterboxTransform,
  image: HTMLImageElement | null,
  decorTime: number,
): void {
  const bob = Math.sin(decorTime * 2) * 4;
  const cx = t.viewportWidth / t.scale / 2;
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
  const offsetX = 0;
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
  reducedMotion = false,
): void {
  drawSky(ctx, t, decorTime);
  drawMascot(ctx, t, mascotImage, decorTime);
  for (const balloon of balloons) drawBalloon(ctx, t, balloon);
  for (const effect of popEffects) drawPopEffect(ctx, t, effect, reducedMotion);
}
