import {
  GROUND_Y,
  HEX_TILE_SIZE,
  LOGICAL_HEIGHT,
  LOGICAL_WIDTH,
  PIPE_WIDTH,
  PLAYER_RADIUS,
  PLAYER_X,
  STAR_RADIUS,
} from "./constants";
import type { Obstacle, PlayerState } from "./types";
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

function drawSky(ctx: CanvasRenderingContext2D, t: LetterboxTransform): void {
  const grad = ctx.createLinearGradient(0, 0, 0, t.viewportHeight);
  grad.addColorStop(0, "#171233");
  grad.addColorStop(1, "#0b0e1a");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, t.viewportWidth, t.viewportHeight);
}

function drawGroundHex(ctx: CanvasRenderingContext2D, t: LetterboxTransform, scrollDistance: number): void {
  const groundScreenY = toScreen(t, 0, GROUND_Y).y;
  ctx.fillStyle = "#0a0d17";
  ctx.fillRect(0, groundScreenY, t.viewportWidth, t.viewportHeight - groundScreenY);

  const hexSize = HEX_TILE_SIZE * t.scale;
  const colWidth = Math.sqrt(3) * hexSize;
  const rowHeight = hexSize * 1.5;
  const scrollOffset = scrollDistance * t.scale;

  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;

  const rowCount = Math.ceil((t.viewportHeight - groundScreenY) / rowHeight) + 2;
  const colCount = Math.ceil(t.viewportWidth / colWidth) + 2;
  for (let row = 0; row < rowCount; row++) {
    const rowOffset = row % 2 !== 0 ? colWidth / 2 : 0;
    const cy = groundScreenY + row * rowHeight;
    for (let col = -1; col < colCount; col++) {
      const cx = ((col * colWidth + rowOffset - scrollOffset) % (colWidth * colCount)) + colWidth * colCount * 0.5;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 180) * (60 * i - 30);
        const px = cx + hexSize * Math.cos(angle);
        const py = cy + hexSize * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    }
  }

  ctx.strokeStyle = "#4fd8ff";
  ctx.lineWidth = 2;
  ctx.shadowColor = "rgba(79,216,255,0.6)";
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.moveTo(0, groundScreenY);
  ctx.lineTo(t.viewportWidth, groundScreenY);
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function drawPillar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  hue: number,
  scrollDistance: number,
  capAtBottom: boolean,
): void {
  if (h <= 0) return;
  const radius = w / 2;
  const pulse = 0.5 + 0.5 * Math.sin(scrollDistance * 0.02 + hue);

  const path = new Path2D();
  path.moveTo(x, y + radius);
  path.arcTo(x, y, x + radius, y, radius);
  path.arcTo(x + w, y, x + w, y + radius, radius);
  path.lineTo(x + w, y + h - radius);
  path.arcTo(x + w, y + h, x + w - radius, y + h, radius);
  path.arcTo(x, y + h, x, y + h - radius, radius);
  path.closePath();

  ctx.save();
  ctx.shadowColor = `hsla(${hue}, 90%, 65%, ${0.4 + pulse * 0.3})`;
  ctx.shadowBlur = 14 + pulse * 12;

  const grad = ctx.createLinearGradient(x, 0, x + w, 0);
  grad.addColorStop(0, `hsla(${hue}, 70%, 42%, 1)`);
  grad.addColorStop(0.5, `hsla(${hue}, 92%, 76%, 1)`);
  grad.addColorStop(1, `hsla(${hue}, 70%, 42%, 1)`);
  ctx.fillStyle = grad;
  ctx.fill(path);
  ctx.restore();

  // Diagonal energy stripes that scroll with the world, so the pillars read as
  // powered/alive rather than static blocks.
  ctx.save();
  ctx.clip(path);
  const stripeSpacing = 24;
  const stripeThickness = 9;
  const offset = ((scrollDistance * 0.5) % stripeSpacing + stripeSpacing) % stripeSpacing;
  ctx.fillStyle = `hsla(${hue}, 100%, 92%, 0.22)`;
  for (let sy = y - stripeSpacing + offset; sy < y + h + stripeSpacing; sy += stripeSpacing) {
    ctx.save();
    ctx.translate(x + w / 2, sy);
    ctx.rotate((-18 * Math.PI) / 180);
    ctx.fillRect(-w, -stripeThickness / 2, w * 2, stripeThickness);
    ctx.restore();
  }
  ctx.restore();

  ctx.strokeStyle = `hsla(${hue}, 100%, 92%, 0.55)`;
  ctx.lineWidth = 1.5;
  ctx.stroke(path);

  // Glowing energy core at the tip nearest the gap, with a few orbiting sparks —
  // draws the eye to the gap edge while keeping the actual hitbox untouched.
  const capY = capAtBottom ? y + h - radius * 0.35 : y + radius * 0.35;
  const cx = x + w / 2;
  const coreR = radius * (0.4 + pulse * 0.14);

  const glow = ctx.createRadialGradient(cx, capY, 0, cx, capY, coreR * 2.6);
  glow.addColorStop(0, `hsla(${hue}, 100%, 92%, ${0.55 + pulse * 0.25})`);
  glow.addColorStop(1, `hsla(${hue}, 100%, 92%, 0)`);
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, capY, coreR * 2.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = `hsla(${hue}, 100%, 95%, 0.95)`;
  ctx.beginPath();
  ctx.arc(cx, capY, coreR, 0, Math.PI * 2);
  ctx.fill();

  const sparkCount = 3;
  for (let i = 0; i < sparkCount; i++) {
    const angle = scrollDistance * 0.012 + hue + (i * Math.PI * 2) / sparkCount;
    const orbitR = coreR * 2.1;
    const px = cx + Math.cos(angle) * orbitR;
    const py = capY + Math.sin(angle) * orbitR * 0.55;
    ctx.fillStyle = `hsla(${hue}, 100%, 90%, 0.85)`;
    ctx.beginPath();
    ctx.arc(px, py, Math.max(1, coreR * 0.16), 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawObstacles(
  ctx: CanvasRenderingContext2D,
  t: LetterboxTransform,
  obstacles: Obstacle[],
  scrollDistance: number,
): void {
  for (const obstacle of obstacles) {
    const screenX = toScreen(t, obstacle.x, 0).x;
    const screenW = PIPE_WIDTH * t.scale;
    const gapTopY = obstacle.gapCenterY - obstacle.gapHeight / 2;
    const gapBottomY = obstacle.gapCenterY + obstacle.gapHeight / 2;
    const scaledScroll = scrollDistance * t.scale;

    const topScreenY = toScreen(t, 0, 0).y;
    const gapTopScreenY = toScreen(t, 0, gapTopY).y;
    drawPillar(ctx, screenX, topScreenY, screenW, gapTopScreenY - topScreenY, obstacle.hue, scaledScroll, true);

    const gapBottomScreenY = toScreen(t, 0, gapBottomY).y;
    const groundScreenY = toScreen(t, 0, GROUND_Y).y;
    drawPillar(
      ctx,
      screenX,
      gapBottomScreenY,
      screenW,
      groundScreenY - gapBottomScreenY,
      obstacle.hue,
      scaledScroll,
      false,
    );

    if (obstacle.star && !obstacle.star.collected) {
      const s = toScreen(t, obstacle.x + PIPE_WIDTH / 2, obstacle.star.y);
      const r = STAR_RADIUS * t.scale;
      const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r * 2.4);
      glow.addColorStop(0, "hsla(48, 95%, 70%, 0.4)");
      glow.addColorStop(1, "hsla(48, 95%, 70%, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(s.x, s.y, r * 2.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "hsl(48, 95%, 65%)";
      ctx.beginPath();
      ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "hsla(48, 100%, 90%, 0.8)";
      ctx.beginPath();
      ctx.arc(s.x - r * 0.3, s.y - r * 0.3, r * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawPlayer(
  ctx: CanvasRenderingContext2D,
  t: LetterboxTransform,
  player: PlayerState,
  image: HTMLImageElement | null,
  flapFx: number,
): void {
  const s = toScreen(t, PLAYER_X, player.y);
  const r = PLAYER_RADIUS * t.scale;

  if (flapFx > 0.01) {
    ctx.strokeStyle = `rgba(255,255,255,${0.5 * flapFx})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(s.x, s.y, r * (1.3 + (1 - flapFx) * 1.2), 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.beginPath();
  ctx.ellipse(s.x, s.y + r * 0.6, r * 0.85, r * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate(player.rotation);
  if (image && image.complete && image.naturalWidth > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.clip();
    drawImageTopCrop(ctx, image, -r, -r, r * 2);
    ctx.restore();
  } else {
    ctx.fillStyle = "#4fd8ff";
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function computeLetterboxTransform(viewportWidth: number, viewportHeight: number): LetterboxTransform {
  const scale = Math.min(viewportWidth / LOGICAL_WIDTH, viewportHeight / LOGICAL_HEIGHT);
  const offsetX = (viewportWidth - LOGICAL_WIDTH * scale) / 2;
  const offsetY = (viewportHeight - LOGICAL_HEIGHT * scale) / 2;
  return { scale, offsetX, offsetY, viewportWidth, viewportHeight };
}

export function renderJump(
  ctx: CanvasRenderingContext2D,
  t: LetterboxTransform,
  obstacles: Obstacle[],
  player: PlayerState,
  playerImage: HTMLImageElement | null,
  scrollDistance: number,
  flapFx: number,
): void {
  drawSky(ctx, t);
  drawGroundHex(ctx, t, scrollDistance);
  drawObstacles(ctx, t, obstacles, scrollDistance);
  drawPlayer(ctx, t, player, playerImage, flapFx);
}
