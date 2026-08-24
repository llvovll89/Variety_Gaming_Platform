import { LOGICAL_HEIGHT, LOGICAL_WIDTH, PLAYER_RADIUS, STAR_LIFETIME, STAR_RADIUS } from "./constants";
import type { BonusStar, Orb, PlayerState } from "./types";
import type { JoystickVisual } from "./input";
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

// Fixed backdrop starfield — generated once at module load (not per-frame) so the dots hold
// still in normalized 0..1 space and just twinkle in place, scaling to whatever viewport size.
interface BackdropStar {
  nx: number;
  ny: number;
  phase: number;
  speed: number;
  size: number;
}

const BACKDROP_STARS: BackdropStar[] = Array.from({ length: 90 }, () => ({
  nx: Math.random(),
  ny: Math.random(),
  phase: Math.random() * Math.PI * 2,
  speed: 0.6 + Math.random() * 1.4,
  size: 0.6 + Math.random() * 1.6,
}));

function drawStarfield(ctx: CanvasRenderingContext2D, t: LetterboxTransform, decorTime: number): void {
  for (const star of BACKDROP_STARS) {
    const x = star.nx * t.viewportWidth;
    const y = star.ny * t.viewportHeight;
    const twinkle = 0.25 + 0.6 * (0.5 + 0.5 * Math.sin(decorTime * star.speed + star.phase));
    ctx.fillStyle = `rgba(210, 200, 255, ${twinkle})`;
    ctx.beginPath();
    ctx.arc(x, y, star.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawArenaBackground(ctx: CanvasRenderingContext2D, t: LetterboxTransform, decorTime: number): void {
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, t.viewportWidth, t.viewportHeight);
  drawStarfield(ctx, t, decorTime);

  const topLeft = toScreen(t, 0, 0);
  const w = LOGICAL_WIDTH * t.scale;
  const h = LOGICAL_HEIGHT * t.scale;

  // A faint fill for the arena floor keeps it a hair above pure black so the play field
  // reads as a distinct surface, without abandoning the requested black background.
  ctx.fillStyle = "#050208";
  ctx.fillRect(topLeft.x, topLeft.y, w, h);

  // Subtle grid inside the arena for depth/scale cues against the black.
  const gridSize = 48 * t.scale;
  ctx.save();
  ctx.beginPath();
  ctx.rect(topLeft.x, topLeft.y, w, h);
  ctx.clip();
  ctx.strokeStyle = "rgba(124,79,255,0.08)";
  ctx.lineWidth = 1;
  for (let x = topLeft.x; x <= topLeft.x + w; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, topLeft.y);
    ctx.lineTo(x, topLeft.y + h);
    ctx.stroke();
  }
  for (let y = topLeft.y; y <= topLeft.y + h; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(topLeft.x, y);
    ctx.lineTo(topLeft.x + w, y);
    ctx.stroke();
  }
  ctx.restore();

  const pulse = 0.5 + 0.5 * Math.sin(decorTime * 1.5);
  ctx.save();
  ctx.strokeStyle = "#9a6bff";
  ctx.lineWidth = 2;
  ctx.shadowColor = `rgba(154,107,255,${0.55 + pulse * 0.25})`;
  ctx.shadowBlur = 14 + pulse * 6;
  ctx.strokeRect(topLeft.x, topLeft.y, w, h);
  ctx.restore();
}

function drawStar(ctx: CanvasRenderingContext2D, t: LetterboxTransform, star: BonusStar): void {
  if (star.collected) return;
  const fade = Math.min(1, Math.max(0, (STAR_LIFETIME - star.age) / (STAR_LIFETIME * 0.25)));
  const s = toScreen(t, star.x, star.y);
  const r = STAR_RADIUS * t.scale;

  const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r * 2.4);
  glow.addColorStop(0, `hsla(48, 95%, 70%, ${0.4 * fade})`);
  glow.addColorStop(1, "hsla(48, 95%, 70%, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(s.x, s.y, r * 2.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = `hsla(48, 95%, 65%, ${fade})`;
  ctx.beginPath();
  ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = `hsla(48, 100%, 90%, ${0.8 * fade})`;
  ctx.beginPath();
  ctx.arc(s.x - r * 0.3, s.y - r * 0.3, r * 0.35, 0, Math.PI * 2);
  ctx.fill();
}

function drawOrb(ctx: CanvasRenderingContext2D, t: LetterboxTransform, orb: Orb): void {
  const s = toScreen(t, orb.x, orb.y);
  const r = orb.radius * t.scale;
  const pulse = 0.5 + 0.5 * Math.sin(orb.age * 4 + orb.hue);

  ctx.save();
  ctx.shadowColor = `hsla(${orb.hue}, 90%, 65%, ${0.4 + pulse * 0.3})`;
  ctx.shadowBlur = 14 + pulse * 12;

  const body = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r);
  body.addColorStop(0, `hsla(${orb.hue}, 92%, 80%, 1)`);
  body.addColorStop(1, `hsla(${orb.hue}, 70%, 42%, 1)`);
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = `hsla(${orb.hue}, 100%, 92%, 0.55)`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
  ctx.stroke();

  // Rotating energy-ring arcs — the round-orb analog of the pillar's diagonal stripes.
  const ringR = r * 0.75;
  ctx.strokeStyle = `hsla(${orb.hue}, 100%, 92%, 0.5)`;
  ctx.lineWidth = 2;
  for (let i = 0; i < 2; i++) {
    const start = orb.age * 2.2 + orb.hue + i * Math.PI;
    ctx.beginPath();
    ctx.arc(s.x, s.y, ringR, start, start + Math.PI * 0.6);
    ctx.stroke();
  }

  // Bright core.
  const coreR = r * 0.32;
  const coreGlow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, coreR * 2.2);
  coreGlow.addColorStop(0, `hsla(${orb.hue}, 100%, 92%, ${0.55 + pulse * 0.25})`);
  coreGlow.addColorStop(1, `hsla(${orb.hue}, 100%, 92%, 0)`);
  ctx.fillStyle = coreGlow;
  ctx.beginPath();
  ctx.arc(s.x, s.y, coreR * 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = `hsla(${orb.hue}, 100%, 95%, 0.95)`;
  ctx.beginPath();
  ctx.arc(s.x, s.y, coreR, 0, Math.PI * 2);
  ctx.fill();

  // Orbiting spark particles.
  const sparkCount = 3;
  for (let i = 0; i < sparkCount; i++) {
    const angle = orb.age * 3 + orb.hue + (i * Math.PI * 2) / sparkCount;
    const orbitR = r * 1.35;
    const px = s.x + Math.cos(angle) * orbitR;
    const py = s.y + Math.sin(angle) * orbitR;
    ctx.fillStyle = `hsla(${orb.hue}, 100%, 90%, 0.85)`;
    ctx.beginPath();
    ctx.arc(px, py, Math.max(1, coreR * 0.5), 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlayer(
  ctx: CanvasRenderingContext2D,
  t: LetterboxTransform,
  player: PlayerState,
  image: HTMLImageElement | null,
): void {
  const s = toScreen(t, player.x, player.y);
  const r = PLAYER_RADIUS * t.scale;

  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.beginPath();
  ctx.ellipse(s.x, s.y + r * 0.75, r * 0.85, r * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();

  if (image && image.complete && image.naturalWidth > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
    ctx.clip();
    drawImageTopCrop(ctx, image, s.x - r, s.y - r, r * 2);
    ctx.restore();
  } else {
    ctx.fillStyle = "#c084fc";
    ctx.beginPath();
    ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawJoystick(ctx: CanvasRenderingContext2D, joystick: JoystickVisual, maxRadius: number): void {
  if (!joystick.active) return;
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(joystick.center.x, joystick.center.y, maxRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.beginPath();
  ctx.arc(joystick.thumb.x, joystick.thumb.y, maxRadius * 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function computeLetterboxTransform(viewportWidth: number, viewportHeight: number): LetterboxTransform {
  const scale = Math.min(viewportWidth / LOGICAL_WIDTH, viewportHeight / LOGICAL_HEIGHT);
  const offsetX = (viewportWidth - LOGICAL_WIDTH * scale) / 2;
  const offsetY = (viewportHeight - LOGICAL_HEIGHT * scale) / 2;
  return { scale, offsetX, offsetY, viewportWidth, viewportHeight };
}

export function renderDodge(
  ctx: CanvasRenderingContext2D,
  t: LetterboxTransform,
  orbs: Orb[],
  star: BonusStar | null,
  player: PlayerState,
  playerImage: HTMLImageElement | null,
  joystick: JoystickVisual,
  joystickMaxRadius: number,
  decorTime: number,
): void {
  drawArenaBackground(ctx, t, decorTime);
  if (star) drawStar(ctx, t, star);
  for (const orb of orbs) drawOrb(ctx, t, orb);
  drawPlayer(ctx, t, player, playerImage);
  drawJoystick(ctx, joystick, joystickMaxRadius);
}
