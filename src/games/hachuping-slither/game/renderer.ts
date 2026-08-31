import type { Camera } from "./camera";
import { HEX_TILE_SIZE, PLAYER_HEAD_IMAGE_SCALE, WORLD_HALF } from "./constants";
import { getSegmentsFromNeck } from "./snake";
import type { Snake, Star } from "./types";
import type { World } from "./world";
import { lerp } from "../../../utils/math";
import { drawImageTopCrop } from "../../../shared/canvasImage";
import { resolveSegmentColors } from "./bodyPalettes";

const RENDER_MARGIN = 160;
const HEX_COL_WIDTH = Math.sqrt(3) * HEX_TILE_SIZE;
const HEX_ROW_HEIGHT = HEX_TILE_SIZE * 1.5;

type Rect = { minX: number; minY: number; maxX: number; maxY: number };
type Point = { x: number; y: number };

function hsl(hue: number, s: number, l: number, a = 1): string {
  return `hsla(${hue}, ${s}%, ${l}%, ${a})`;
}

function inRect(x: number, y: number, r: number, rect: Rect): boolean {
  return x + r >= rect.minX && x - r <= rect.maxX && y + r >= rect.minY && y - r <= rect.maxY;
}

/** Pointy-top hex tile floor, subtly shaded per-tile for a bit of terrain-like depth. */
function drawHexBackground(ctx: CanvasRenderingContext2D, camera: Camera, viewRect: Rect): void {
  ctx.fillStyle = "#0b0e1a";
  ctx.fillRect(0, 0, camera.viewportWidth, camera.viewportHeight);

  const hexScreenSize = HEX_TILE_SIZE * camera.zoom;
  const minRow = Math.floor(viewRect.minY / HEX_ROW_HEIGHT) - 1;
  const maxRow = Math.ceil(viewRect.maxY / HEX_ROW_HEIGHT) + 1;
  const minCol = Math.floor(viewRect.minX / HEX_COL_WIDTH) - 1;
  const maxCol = Math.ceil(viewRect.maxX / HEX_COL_WIDTH) + 1;

  for (let row = minRow; row <= maxRow; row++) {
    const rowOffset = row % 2 !== 0 ? HEX_COL_WIDTH / 2 : 0;
    const worldY = row * HEX_ROW_HEIGHT;
    for (let col = minCol; col <= maxCol; col++) {
      const worldX = col * HEX_COL_WIDTH + rowOffset;
      const center = camera.worldToScreen({ x: worldX, y: worldY });

      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 180) * (60 * i - 30);
        const px = center.x + hexScreenSize * Math.cos(angle);
        const py = center.y + hexScreenSize * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = (row + col) % 2 === 0 ? "rgba(255,255,255,0.015)" : "rgba(0,0,0,0.1)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.045)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
}

function drawBorder(ctx: CanvasRenderingContext2D, camera: Camera): void {
  const topLeft = camera.worldToScreen({ x: -WORLD_HALF, y: -WORLD_HALF });
  const size = WORLD_HALF * 2 * camera.zoom;
  ctx.strokeStyle = "#ff6fa5";
  ctx.lineWidth = 6;
  ctx.shadowColor = "rgba(255,111,165,0.6)";
  ctx.shadowBlur = 18;
  ctx.strokeRect(topLeft.x, topLeft.y, size, size);
  ctx.shadowBlur = 0;
}

function drawStars(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  stars: Star[],
  viewRect: Rect,
): void {
  for (const star of stars) {
    if (!inRect(star.pos.x, star.pos.y, star.radius, viewRect)) continue;
    const s = camera.worldToScreen(star.pos);
    const r = star.radius * camera.zoom;

    const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r * 2.6);
    glow.addColorStop(0, hsl(star.hue, 95, 70, 0.35));
    glow.addColorStop(1, hsl(star.hue, 95, 70, 0));
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(s.x, s.y, r * 2.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = hsl(star.hue, 90, 65);
    ctx.beginPath();
    ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = hsl(star.hue, 100, 88, 0.8);
    ctx.beginPath();
    ctx.arc(s.x - r * 0.3, s.y - r * 0.3, r * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Builds a smooth curve through control points (quadratic-through-midpoints), avoiding
 * the visibly "stepped" look of raw distance-sampled points, especially mid-turn. */
function tracePath(ctx: CanvasRenderingContext2D, points: Point[]): void {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length - 1; i++) {
    const mid = { x: (points[i].x + points[i + 1].x) / 2, y: (points[i].y + points[i + 1].y) / 2 };
    ctx.quadraticCurveTo(points[i].x, points[i].y, mid.x, mid.y);
  }
  const last = points[points.length - 1];
  ctx.lineTo(last.x, last.y);
}

/** Perpendicular "ring" marks at intervals along the body — the visual cue that reads
 * as a segmented worm instead of a single smooth capsule/balloon. */
function drawSegmentBands(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  diameter: number,
  hue: number,
  baseLightness: number,
): void {
  const n = points.length;
  if (n < 4 || diameter < 4) return;
  const halfWidth = diameter * 0.42;
  ctx.strokeStyle = hsl(hue, 40, Math.max(0, baseLightness - 32), 0.3);
  ctx.lineWidth = Math.max(1, diameter * 0.09);
  for (let i = 2; i < n - 2; i += 2) {
    const prev = points[i - 1];
    const next = points[i + 1];
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const p = points[i];
    ctx.beginPath();
    ctx.moveTo(p.x - nx * halfWidth, p.y - ny * halfWidth);
    ctx.lineTo(p.x + nx * halfWidth, p.y + ny * halfWidth);
    ctx.stroke();
  }
}

/** Tapers the last stretch of the body down to a point instead of ending in a blunt,
 * uniform-width tip — worms/snakes narrow toward the tail. */
function drawTailTaper(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  diameter: number,
  hue: number,
  baseLightness: number,
): void {
  const n = points.length;
  const taperCount = Math.min(6, Math.max(2, Math.floor(n * 0.25)));
  const startIdx = n - taperCount;
  if (startIdx < 1) return;
  ctx.strokeStyle = hsl(hue, 65, baseLightness - 4);
  for (let i = startIdx; i < n - 1; i++) {
    const t = (i - startIdx) / (taperCount - 1);
    ctx.lineWidth = Math.max(1, diameter * lerp(0.85, 0.16, t));
    ctx.beginPath();
    ctx.moveTo(points[i].x, points[i].y);
    ctx.lineTo(points[i + 1].x, points[i + 1].y);
    ctx.stroke();
  }
}

/** Per-segment stroke pass, cycling through the resolved palette — the multi-color
 * counterpart to the single-hue rim/base strokes below. `widthFactor`/`colorKey` pick which
 * pass (blurred darker rim vs. flat base) this call renders. */
function drawSegmentedPass(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  diameter: number,
  widthFactor: number,
  resolved: { base: string; rim: string }[],
  colorKey: "base" | "rim",
): void {
  const n = points.length;
  ctx.lineWidth = diameter * widthFactor;
  for (let i = 0; i < n - 1; i++) {
    ctx.strokeStyle = resolved[i % resolved.length][colorKey];
    ctx.beginPath();
    ctx.moveTo(points[i].x, points[i].y);
    ctx.lineTo(points[i + 1].x, points[i + 1].y);
    ctx.stroke();
  }
}

function drawTailTaperGeneric(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  diameter: number,
  color: string,
): void {
  const n = points.length;
  const taperCount = Math.min(6, Math.max(2, Math.floor(n * 0.25)));
  const startIdx = n - taperCount;
  if (startIdx < 1) return;
  ctx.strokeStyle = color;
  for (let i = startIdx; i < n - 1; i++) {
    const t = (i - startIdx) / (taperCount - 1);
    ctx.lineWidth = Math.max(1, diameter * lerp(0.85, 0.16, t));
    ctx.beginPath();
    ctx.moveTo(points[i].x, points[i].y);
    ctx.lineTo(points[i + 1].x, points[i + 1].y);
    ctx.stroke();
  }
}

/** Draws the body as a smooth stroked tube (glow + rim + base + segment bands + glossy
 * core + tapered tail) instead of stamped circles — cheaper than per-segment fills and
 * reads as a segmented worm rather than a plain capsule. */
function drawSnakeBody(ctx: CanvasRenderingContext2D, camera: Camera, snake: Snake): void {
  const worldPoints: Point[] = [snake.head, ...getSegmentsFromNeck(snake)];
  const diameter = snake.radius * 2 * camera.zoom;
  if (diameter < 0.5) return;

  if (worldPoints.length < 2) {
    const s = camera.worldToScreen(snake.head);
    ctx.fillStyle = hsl(snake.hue, 75, snake.isPlayer ? 72 : 60);
    ctx.beginPath();
    ctx.arc(s.x, s.y, diameter / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  const screenPoints = worldPoints.map((p) => camera.worldToScreen(p));
  const baseLightness = snake.isPlayer ? 68 : 58;
  const palette = snake.isPlayer ? snake.bodyPalette : [];

  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (palette.length > 1) {
    const resolved = resolveSegmentColors(palette);

    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.35)";
    ctx.shadowBlur = diameter * 0.45;
    drawSegmentedPass(ctx, screenPoints, diameter, 1.06, resolved, "rim");
    ctx.restore();

    drawSegmentedPass(ctx, screenPoints, diameter, 0.9, resolved, "base");

    tracePath(ctx, screenPoints);
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = diameter * 0.36;
    ctx.stroke();

    const tailColor = resolved[(screenPoints.length - 2) % resolved.length]?.rim ?? resolved[0].rim;
    drawTailTaperGeneric(ctx, screenPoints, diameter, tailColor);
  } else {
    ctx.save();
    ctx.shadowColor = hsl(snake.hue, 75, 60, 0.55);
    ctx.shadowBlur = diameter * 0.45;
    tracePath(ctx, screenPoints);
    ctx.strokeStyle = hsl(snake.hue, 55, baseLightness - 24);
    ctx.lineWidth = diameter * 1.06;
    ctx.stroke();
    ctx.restore();

    tracePath(ctx, screenPoints);
    ctx.strokeStyle = hsl(snake.hue, 70, baseLightness);
    ctx.lineWidth = diameter * 0.9;
    ctx.stroke();

    drawSegmentBands(ctx, screenPoints, diameter, snake.hue, baseLightness);

    tracePath(ctx, screenPoints);
    ctx.strokeStyle = hsl(snake.hue, 55, Math.min(96, baseLightness + 22), 0.45);
    ctx.lineWidth = diameter * 0.36;
    ctx.stroke();

    drawTailTaper(ctx, screenPoints, diameter, snake.hue, baseLightness);
  }

  if (snake.boosting) {
    const tail = screenPoints[screenPoints.length - 1];
    const glow = ctx.createRadialGradient(tail.x, tail.y, 0, tail.x, tail.y, diameter * 1.4);
    glow.addColorStop(0, hsl(snake.hue, 80, 75, 0.35));
    glow.addColorStop(1, hsl(snake.hue, 80, 75, 0));
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(tail.x, tail.y, diameter * 1.4, 0, Math.PI * 2);
    ctx.fill();

    // Fading motion-blur echoes stretching back from the tail, so a boost visibly
    // "streaks" rather than just moving faster with no extra feedback.
    const prev = screenPoints[screenPoints.length - 2] ?? tail;
    const dx = tail.x - prev.x;
    const dy = tail.y - prev.y;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    for (let i = 1; i <= 3; i++) {
      const dist = diameter * 0.55 * i;
      const px = tail.x + ux * dist;
      const py = tail.y + uy * dist;
      ctx.fillStyle = hsl(snake.hue, 70, 72, 0.22 * (1 - i / 4));
      ctx.beginPath();
      ctx.arc(px, py, (diameter / 2) * (1 - i * 0.18), 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** Screen-space vignette + radiating streaks that fade in with boost intensity — the
 * "everything is rushing past" cue a raw speed increase alone doesn't convey. */
function drawBoostOverlay(ctx: CanvasRenderingContext2D, camera: Camera, intensity: number): void {
  if (intensity <= 0.01) return;
  const w = camera.viewportWidth;
  const h = camera.viewportHeight;
  const cx = w / 2;
  const cy = h / 2;
  const maxR = Math.hypot(cx, cy);

  const vignette = ctx.createRadialGradient(cx, cy, maxR * 0.35, cx, cy, maxR * 0.95);
  vignette.addColorStop(0, "rgba(255,150,200,0)");
  vignette.addColorStop(1, `rgba(255,120,190,${0.22 * intensity})`);
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);

  const lineCount = 16;
  ctx.strokeStyle = `rgba(255,255,255,${0.3 * intensity})`;
  ctx.lineCap = "round";
  for (let i = 0; i < lineCount; i++) {
    const angle = (i / lineCount) * Math.PI * 2 + (i % 2 === 0 ? 0.08 : -0.08);
    const innerR = maxR * 0.4;
    const outerR = maxR * (0.78 + 0.16 * ((i % 3) / 3));
    ctx.lineWidth = i % 3 === 0 ? 2.5 : 1.4;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR);
    ctx.lineTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR);
    ctx.stroke();
  }
}

function drawPlayerHead(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  snake: Snake,
  image: HTMLImageElement | null,
): void {
  const s = camera.worldToScreen(snake.head);
  const r = snake.radius * camera.zoom;
  const imgR = r * PLAYER_HEAD_IMAGE_SCALE;

  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.beginPath();
  ctx.ellipse(s.x, s.y + imgR * 0.55, imgR * 0.85, imgR * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate(snake.heading + Math.PI / 2);
  if (image && image.complete && image.naturalWidth > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, imgR, 0, Math.PI * 2);
    ctx.clip();
    drawImageTopCrop(ctx, image, -imgR, -imgR, imgR * 2);
    ctx.restore();
  } else {
    ctx.fillStyle = hsl(snake.hue, 80, 75);
    ctx.beginPath();
    ctx.arc(0, 0, imgR, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawBotHead(ctx: CanvasRenderingContext2D, camera: Camera, snake: Snake): void {
  const s = camera.worldToScreen(snake.head);
  const r = snake.radius * camera.zoom;

  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.beginPath();
  ctx.ellipse(s.x, s.y + r * 0.55, r * 0.85, r * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();

  const shading = ctx.createRadialGradient(
    s.x - r * 0.35,
    s.y - r * 0.4,
    r * 0.1,
    s.x,
    s.y,
    r * 1.1,
  );
  shading.addColorStop(0, hsl(snake.hue, 85, 78));
  shading.addColorStop(0.6, hsl(snake.hue, 80, 62));
  shading.addColorStop(1, hsl(snake.hue, 70, 45));
  ctx.fillStyle = shading;
  ctx.beginPath();
  ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
  ctx.fill();

  const eyeOffset = r * 0.45;
  const eyeR = Math.max(1.5, r * 0.22);
  for (const side of [-1, 1]) {
    const ex = s.x + Math.cos(snake.heading + side * 0.6) * eyeOffset;
    const ey = s.y + Math.sin(snake.heading + side * 0.6) * eyeOffset;
    ctx.fillStyle = "#1a1a2a";
    ctx.beginPath();
    ctx.arc(ex, ey, eyeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(ex - eyeR * 0.3, ey - eyeR * 0.3, eyeR * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawNameTag(ctx: CanvasRenderingContext2D, camera: Camera, snake: Snake): void {
  const s = camera.worldToScreen(snake.head);
  const r = (snake.radius * camera.zoom) * (snake.isPlayer ? PLAYER_HEAD_IMAGE_SCALE : 1);
  ctx.font = "600 13px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillText(snake.name, s.x + 1, s.y - r - 9);
  ctx.fillStyle = "#fff";
  ctx.fillText(snake.name, s.x, s.y - r - 10);
}

export function renderWorld(
  ctx: CanvasRenderingContext2D,
  world: World,
  camera: Camera,
  playerImage: HTMLImageElement | null,
  boostIntensity = 0,
): void {
  const viewRect = camera.getViewRect(RENDER_MARGIN);

  drawHexBackground(ctx, camera, viewRect);
  drawBorder(ctx, camera);

  const stars = world.getStarsInRect(viewRect.minX, viewRect.minY, viewRect.maxX, viewRect.maxY);
  drawStars(ctx, camera, stars, viewRect);

  const visibleSnakes = world
    .getAliveSnakes()
    .filter((s) => inRect(s.head.x, s.head.y, s.radius * 6 + 400, viewRect));

  for (const snake of visibleSnakes) {
    drawSnakeBody(ctx, camera, snake);
  }
  for (const snake of visibleSnakes) {
    if (snake.isPlayer) {
      drawPlayerHead(ctx, camera, snake, playerImage);
    } else {
      drawBotHead(ctx, camera, snake);
    }
    drawNameTag(ctx, camera, snake);
  }

  drawBoostOverlay(ctx, camera, boostIntensity);
}
