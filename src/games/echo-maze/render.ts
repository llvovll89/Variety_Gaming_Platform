import { key, LEVELS, type MazeRun } from './engine';

/** Terrain is drawn before all markers, so no wall can cover a target. */
export function drawMaze(canvas: HTMLCanvasElement, run: MazeRun, avatar: HTMLImageElement | null) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const width = canvas.clientWidth, height = canvas.clientHeight, dpr = Math.min(devicePixelRatio || 1, 2);
  if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, width, height);
  const n = run.cells.length, s = Math.min((width - 32) / n, (height - 36) / (n * .9 + .12));
  const sy = s * .9, ox = (width - n * s) / 2, oy = (height - n * sy) / 2, depth = s * .1;
  const visible = (x: number, y: number) => run.status !== 'playing' || run.reveal > 0 || Math.hypot(x - run.player.x, y - run.player.y) <= LEVELS[run.difficulty].vision;
  const wall = (x: number, y: number) => run.cells[y]?.[x] === 1;
  ctx.fillStyle = '#00000012'; ctx.fillRect(ox + 3, oy + 7, n * s, n * sy);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(ox, oy, n * s, n * sy);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    if (!visible(x, y)) { ctx.fillStyle = '#d7d7d7'; ctx.fillRect(ox + x * s, oy + y * sy, s + .5, sy + .5); }
  }
  // Continuous narrow walls and shallow front faces leave corridors unobstructed.
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    if (!wall(x, y) || !visible(x, y)) continue;
    const px = ox + x * s, py = oy + y * sy;
    const left = wall(x - 1, y) ? 0 : .28, right = wall(x + 1, y) ? 1 : .72;
    const top = wall(x, y - 1) ? 0 : .28, bottom = wall(x, y + 1) ? 1 : .72;
    ctx.fillStyle = '#777777';
    ctx.fillRect(px + left * s, py + .28 * sy, (right - left) * s + .3, .44 * sy + depth);
    ctx.fillRect(px + .28 * s, py + top * sy, .44 * s, (bottom - top) * sy + depth);
    ctx.fillStyle = '#202020';
    ctx.fillRect(px + left * s, py + .28 * sy - depth, (right - left) * s + .3, .44 * sy);
    ctx.fillRect(px + .28 * s, py + top * sy - depth, .44 * s, (bottom - top) * sy);
  }
  // Draw exit, shards and anchor over the entire wall layer.
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    if (wall(x, y)) continue;
    const px = ox + (x + .5) * s, py = oy + (y + .5) * sy, id = `${x},${y}`, lit = visible(x, y);
    if (run.visited.has(id)) { ctx.fillStyle = '#a0a0a0'; ctx.beginPath(); ctx.arc(px, py, Math.max(1.2, s * .055), 0, Math.PI * 2); ctx.fill(); }
    if (lit && run.anchor && id === key(run.anchor)) {
      ctx.strokeStyle = '#333333'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 2]);
      ctx.beginPath(); ctx.arc(px, py, s * .4, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    }
    if (lit && run.shards.has(id)) {
      ctx.beginPath(); ctx.moveTo(px, py - sy * .26); ctx.lineTo(px + s * .21, py);
      ctx.lineTo(px, py + sy * .26); ctx.lineTo(px - s * .21, py); ctx.closePath();
      ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#111111'; ctx.lineWidth = Math.max(1.5, s * .055); ctx.fill(); ctx.stroke();
    }
    if (id === key(run.exit)) {
      const box = s * .78;
      ctx.fillStyle = '#ffffff'; ctx.fillRect(px - box / 2 - 2, py - box / 2 - 2, box + 4, box + 4);
      ctx.fillStyle = '#111111'; ctx.fillRect(px - box / 2, py - box / 2, box, box);
      ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `bold ${Math.max(7, s * .23)}px sans-serif`; ctx.fillText('EXIT', px, py);
    }
  }
  // The portrait is always the topmost object, centered in its walkable cell.
  const px = ox + (run.player.x + .5) * s, py = oy + (run.player.y + .5) * sy, r = Math.max(6, s * .34);
  ctx.shadowColor = '#00000044'; ctx.shadowBlur = 5; ctx.shadowOffsetY = 2;
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(px, py, r + 3, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; ctx.strokeStyle = '#111111'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.save(); ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.clip();
  if (avatar?.complete && avatar.naturalWidth) {
    const side = Math.min(avatar.naturalWidth, avatar.naturalHeight);
    ctx.drawImage(avatar, (avatar.naturalWidth - side) / 2, (avatar.naturalHeight - side) / 2, side, side, px - r, py - r, r * 2, r * 2);
  } else {
    ctx.fillStyle = '#ededed'; ctx.fillRect(px - r, py - r, r * 2, r * 2);
    ctx.fillStyle = '#111111'; ctx.font = `bold ${r}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('나', px, py);
  }
  ctx.restore();
}
