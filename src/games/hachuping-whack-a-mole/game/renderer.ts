import {
  LOGICAL_HEIGHT,
  LOGICAL_WIDTH,
  MOLE_HOLE_SIZE,
  HOLE_BACKGROUND_COLOR,
  HOLE_BORDER_COLOR,
  HOLE_BORDER_WIDTH,
  MOLE_RADIUS,
  MOLE_COLOR,
  MOLE_EYE_RADIUS,
  MOLE_NOSE_RADIUS,
  HIT_SCALE_REDUCE,
  MOLE_PADDING_X,
  MOLE_PADDING_Y,
  HOLE_SPACING_X,
  HOLE_SPACING_Y,
  MOLE_GRID_COLS,
  MOLE_GRID_ROWS,
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
    // viewport is wider: pillar box
    scale = viewportHeight / LOGICAL_HEIGHT;
  } else {
    // viewport is taller: letter box
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

export function renderWhackAMole(
  ctx: CanvasRenderingContext2D,
  t: LetterboxTransform,
  gameState: GameState,
  getMoleHitFlashAlpha: (moleId: number) => number,
): void {
  // Clear canvas
  ctx.fillStyle = "#87CEEB"; // Sky blue
  ctx.fillRect(0, 0, t.viewportWidth, t.viewportHeight);

  // Draw grass area background
  const grassScreenPos = toScreen(t, 0, 0);
  ctx.fillStyle = "#228B22"; // Forest green
  ctx.fillRect(
    grassScreenPos.x,
    grassScreenPos.y,
    LOGICAL_WIDTH * t.scale,
    LOGICAL_HEIGHT * t.scale,
  );

  // Draw mole holes
  for (let y = 0; y < MOLE_GRID_ROWS; y++) {
    for (let x = 0; x < MOLE_GRID_COLS; x++) {
      const holeX = MOLE_PADDING_X + x * HOLE_SPACING_X;
      const holeY = MOLE_PADDING_Y + y * HOLE_SPACING_Y;
      const screenPos = toScreen(t, holeX, holeY);

      // Draw hole background (dark circle)
      ctx.fillStyle = HOLE_BACKGROUND_COLOR;
      ctx.beginPath();
      ctx.arc(screenPos.x + (HOLE_SPACING_X / 2) * t.scale, screenPos.y + (HOLE_SPACING_Y / 2) * t.scale, (MOLE_HOLE_SIZE / 2) * t.scale, 0, Math.PI * 2);
      ctx.fill();

      // Draw hole border
      ctx.strokeStyle = HOLE_BORDER_COLOR;
      ctx.lineWidth = HOLE_BORDER_WIDTH * t.scale;
      ctx.stroke();
    }
  }

  // Draw moles
  for (const mole of gameState.moles) {
    const holeX = MOLE_PADDING_X + mole.gridX * HOLE_SPACING_X;
    const holeY = MOLE_PADDING_Y + mole.gridY * HOLE_SPACING_Y;
    const screenPos = toScreen(t, holeX, holeY);
    const moleCenterX = screenPos.x + (HOLE_SPACING_X / 2) * t.scale;
    const moleCenterY = screenPos.y + (HOLE_SPACING_Y / 2) * t.scale;

    if (mole.isActive) {
      const flashAlpha = getMoleHitFlashAlpha(mole.id);
      const scale = flashAlpha < 0.5 ? HIT_SCALE_REDUCE : 1;
      const scaledRadius = MOLE_RADIUS * t.scale * scale;

      // Draw mole with simplified design
      ctx.globalAlpha = flashAlpha;

      // Draw mole body
      const gradient = ctx.createRadialGradient(
        moleCenterX - scaledRadius * 0.3,
        moleCenterY - scaledRadius * 0.3,
        0,
        moleCenterX,
        moleCenterY,
        scaledRadius,
      );
      gradient.addColorStop(0, "#A0522D");
      gradient.addColorStop(1, "#654321");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(moleCenterX, moleCenterY, scaledRadius, 0, Math.PI * 2);
      ctx.fill();

      // Draw left eye
      ctx.fillStyle = "white";
      ctx.beginPath();
      ctx.arc(moleCenterX - scaledRadius * 0.35, moleCenterY - scaledRadius * 0.25, MOLE_EYE_RADIUS * t.scale * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Draw right eye
      ctx.beginPath();
      ctx.arc(moleCenterX + scaledRadius * 0.35, moleCenterY - scaledRadius * 0.25, MOLE_EYE_RADIUS * t.scale * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Draw pupils with shine
      ctx.fillStyle = "black";
      ctx.beginPath();
      ctx.arc(moleCenterX - scaledRadius * 0.35, moleCenterY - scaledRadius * 0.25, MOLE_EYE_RADIUS * 0.8 * t.scale, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(moleCenterX + scaledRadius * 0.35, moleCenterY - scaledRadius * 0.25, MOLE_EYE_RADIUS * 0.8 * t.scale, 0, Math.PI * 2);
      ctx.fill();

      // Draw small white shine in eyes
      ctx.fillStyle = "white";
      ctx.beginPath();
      ctx.arc(moleCenterX - scaledRadius * 0.33, moleCenterY - scaledRadius * 0.28, MOLE_EYE_RADIUS * 0.3 * t.scale, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(moleCenterX + scaledRadius * 0.33, moleCenterY - scaledRadius * 0.28, MOLE_EYE_RADIUS * 0.3 * t.scale, 0, Math.PI * 2);
      ctx.fill();

      // Draw nose
      ctx.fillStyle = MOLE_COLOR;
      ctx.beginPath();
      ctx.arc(moleCenterX, moleCenterY + scaledRadius * 0.2, MOLE_NOSE_RADIUS * t.scale, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Draw HUD (score, time, round)
  ctx.fillStyle = "white";
  ctx.font = `${20 * t.scale}px Arial`;
  ctx.textAlign = "left";

  const hudX = (MOLE_PADDING_X + 10) * t.scale + t.offsetX;
  const hudY = (MOLE_PADDING_Y - 5) * t.scale + t.offsetY;

  ctx.fillText(`점수: ${gameState.score}`, hudX, hudY);
  ctx.fillText(`시간: ${Math.ceil(gameState.timeRemaining)}초`, hudX + 150 * t.scale, hudY);
}

export function getHitMoleFromPoint(
  t: LetterboxTransform,
  screenX: number,
  screenY: number,
  gameState: GameState,
): number | null {
  const logicalPos = fromScreen(t, screenX, screenY);

  for (const mole of gameState.moles) {
    const holeX = MOLE_PADDING_X + mole.gridX * HOLE_SPACING_X + HOLE_SPACING_X / 2;
    const holeY = MOLE_PADDING_Y + mole.gridY * HOLE_SPACING_Y + HOLE_SPACING_Y / 2;

    const dx = logicalPos.x - holeX;
    const dy = logicalPos.y - holeY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= MOLE_HOLE_SIZE / 2 && mole.isActive) {
      return mole.id;
    }
  }

  return null;
}
