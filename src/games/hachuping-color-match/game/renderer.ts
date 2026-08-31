import {
  LOGICAL_WIDTH,
  LOGICAL_HEIGHT,
  COLOR_PALETTE,
  TARGET_CENTER_X,
  TARGET_CENTER_Y,
  TARGET_RADIUS,
  PROGRESS_BAR_Y,
  PROGRESS_BAR_WIDTH,
  PROGRESS_BAR_HEIGHT,
  OPTION_RADIUS,
} from "./constants";
import type { GameState } from "./types";

export interface LetterboxTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
  viewportWidth: number;
  viewportHeight: number;
}

export function computeLetterboxTransform(
  viewportWidth: number,
  viewportHeight: number,
): LetterboxTransform {
  const aspectRatio = viewportWidth / viewportHeight;
  const logicalAspect = LOGICAL_WIDTH / LOGICAL_HEIGHT;

  let scale: number;
  if (aspectRatio > logicalAspect) {
    scale = viewportHeight / LOGICAL_HEIGHT;
  } else {
    scale = viewportWidth / LOGICAL_WIDTH;
  }

  const scaledLogicalWidth = LOGICAL_WIDTH * scale;
  const scaledLogicalHeight = LOGICAL_HEIGHT * scale;

  return {
    scale,
    offsetX: (viewportWidth - scaledLogicalWidth) / 2,
    offsetY: (viewportHeight - scaledLogicalHeight) / 2,
    viewportWidth,
    viewportHeight,
  };
}

function toScreen(t: LetterboxTransform, x: number, y: number): { x: number; y: number } {
  return {
    x: t.offsetX + x * t.scale,
    y: t.offsetY + y * t.scale,
  };
}

function fromScreen(t: LetterboxTransform, screenX: number, screenY: number): { x: number; y: number } {
  return {
    x: (screenX - t.offsetX) / t.scale,
    y: (screenY - t.offsetY) / t.scale,
  };
}

function hexOf(colorId: string): string {
  return COLOR_PALETTE.find((c) => c.id === colorId)?.hex ?? "#ffffff";
}

export function renderColorMatch(
  ctx: CanvasRenderingContext2D,
  t: LetterboxTransform,
  gameState: GameState,
  getOptionFlashAlpha: (optionId: number) => number,
): void {
  // Background
  const bg = ctx.createLinearGradient(0, 0, 0, t.viewportHeight);
  bg.addColorStop(0, "#1a1f2e");
  bg.addColorStop(1, "#0f1419");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, t.viewportWidth, t.viewportHeight);

  // Prompt label
  const promptPos = toScreen(t, TARGET_CENTER_X, TARGET_CENTER_Y - TARGET_RADIUS - 18);
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = `${13 * t.scale}px sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("이 색과 같은 색을 찾아보세요!", promptPos.x, promptPos.y);

  // Target swatch
  const targetPos = toScreen(t, TARGET_CENTER_X, TARGET_CENTER_Y);
  ctx.fillStyle = hexOf(gameState.targetColorId);
  ctx.beginPath();
  ctx.arc(targetPos.x, targetPos.y, TARGET_RADIUS * t.scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = 4 * t.scale;
  ctx.stroke();

  // Answer-time progress bar
  const barX = TARGET_CENTER_X - PROGRESS_BAR_WIDTH / 2;
  const barPos = toScreen(t, barX, PROGRESS_BAR_Y);
  const progress = Math.max(0, gameState.answerTimeRemaining / gameState.answerTimeLimit);
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.fillRect(barPos.x, barPos.y, PROGRESS_BAR_WIDTH * t.scale, PROGRESS_BAR_HEIGHT * t.scale);
  ctx.fillStyle = progress < 0.3 ? "#ef4444" : "#22c55e";
  ctx.fillRect(barPos.x, barPos.y, PROGRESS_BAR_WIDTH * t.scale * progress, PROGRESS_BAR_HEIGHT * t.scale);

  // Option circles
  for (const option of gameState.options) {
    const pos = toScreen(t, option.x, option.y);
    const flash = getOptionFlashAlpha(option.id);
    const radius = OPTION_RADIUS * t.scale * (flash > 0 ? 0.92 : 1);

    ctx.fillStyle = hexOf(option.colorId);
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = flash > 0 ? `rgba(239,68,68,${0.4 + flash * 0.6})` : "rgba(255,255,255,0.35)";
    ctx.lineWidth = (flash > 0 ? 5 : 3) * t.scale;
    ctx.stroke();
  }
}

export function getHitOptionFromPoint(
  t: LetterboxTransform,
  screenX: number,
  screenY: number,
  gameState: GameState,
): number | null {
  const logicalPos = fromScreen(t, screenX, screenY);

  for (const option of gameState.options) {
    const dx = logicalPos.x - option.x;
    const dy = logicalPos.y - option.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= OPTION_RADIUS) {
      return option.id;
    }
  }

  return null;
}
