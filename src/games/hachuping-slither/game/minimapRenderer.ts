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
  bg.addColorStop(0, "rgba(104,119,139,0.22)");
  bg.addColorStop(1, "rgba(88,104,125,0.17)");
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

  ctx.strokeStyle = "rgba(210,220,234,0.65)";
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


  if (snapshot.player) {
    const p = toMap(snapshot.player.x, snapshot.player.y);
    ctx.fillStyle = "rgba(255,255,235,0.2)";
    ctx.beginPath();
    ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffeb";
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();

  ctx.strokeStyle = "rgba(190,204,225,0.12)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.stroke();
}
