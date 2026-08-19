import type { UISnapshot } from "./types";

/**
 * Draws a slither.io-style circular radar: other snakes render as faint, muted
 * squiggles that read as terrain contours rather than obvious "enemy" markers,
 * with the player as the one bright dot. Called only when a (throttled) UI
 * snapshot updates.
 */
export function drawMinimap(
  ctx: CanvasRenderingContext2D,
  snapshot: UISnapshot["minimap"],
  size: number,
): void {
  const center = size / 2;
  const radius = size / 2 - 1;

  ctx.clearRect(0, 0, size, size);

  ctx.save();
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.clip();

  const bg = ctx.createRadialGradient(center, center, 0, center, center, radius);
  bg.addColorStop(0, "rgba(20,22,38,0.9)");
  bg.addColorStop(1, "rgba(8,9,17,0.92)");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(center, 0);
  ctx.lineTo(center, size);
  ctx.moveTo(0, center);
  ctx.lineTo(size, center);
  ctx.stroke();

  const half = snapshot.worldSize / 2;
  const toMap = (x: number, y: number) => ({
    x: ((x + half) / snapshot.worldSize) * size,
    y: ((y + half) / snapshot.worldSize) * size,
  });

  ctx.strokeStyle = "rgba(200,210,230,0.4)";
  ctx.lineWidth = 1;
  ctx.lineJoin = "round";
  for (const trail of snapshot.trails) {
    if (trail.length < 2) continue;
    ctx.beginPath();
    const first = toMap(trail[0].x, trail[0].y);
    ctx.moveTo(first.x, first.y);
    for (let i = 1; i < trail.length; i++) {
      const p = toMap(trail[i].x, trail[i].y);
      ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
  }

  if (snapshot.viewport) {
    const tl = toMap(snapshot.viewport.x, snapshot.viewport.y);
    const w = (snapshot.viewport.w / snapshot.worldSize) * size;
    const h = (snapshot.viewport.h / snapshot.worldSize) * size;
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 1;
    ctx.strokeRect(tl.x, tl.y, w, h);
  }

  if (snapshot.player) {
    const p = toMap(snapshot.player.x, snapshot.player.y);
    ctx.fillStyle = "rgba(255,111,165,0.35)";
    ctx.beginPath();
    ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ff6fa5";
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();

  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.stroke();
}
