import type { Camera } from './camera';
import { HEX_TILE_SIZE, WORLD_HALF } from './constants';
import { getSegmentsFromNeck } from './snake';
import type { World } from './world';
import { drawCrystal, drawWorm } from './models';
import { statsFor } from './progression';

type Rect = { minX: number; minY: number; maxX: number; maxY: number };
function inRect(x: number, y: number, r: number, rect: Rect): boolean {
  return x + r >= rect.minX && x - r <= rect.maxX && y + r >= rect.minY && y - r <= rect.maxY;
}

function floor(c: CanvasRenderingContext2D, camera: Camera, rect: Rect): void {
  c.fillStyle = '#0b121a'; c.fillRect(0, 0, camera.viewportWidth, camera.viewportHeight);
  const colWidth = Math.sqrt(3) * HEX_TILE_SIZE, rowHeight = HEX_TILE_SIZE * 1.5;
  const rotation = -.24, cos = Math.cos(rotation), sin = Math.sin(rotation);
  const corners = [
    { x: rect.minX, y: rect.minY }, { x: rect.maxX, y: rect.minY },
    { x: rect.minX, y: rect.maxY }, { x: rect.maxX, y: rect.maxY },
  ].map(p => ({ x: p.x * cos + p.y * sin, y: -p.x * sin + p.y * cos }));
  const minX = Math.min(...corners.map(p => p.x)), maxX = Math.max(...corners.map(p => p.x));
  const minY = Math.min(...corners.map(p => p.y)), maxY = Math.max(...corners.map(p => p.y));
  for (let row = Math.floor(minY / rowHeight) - 1; row <= Math.ceil(maxY / rowHeight) + 1; row++) {
    for (let col = Math.floor(minX / colWidth) - 1; col <= Math.ceil(maxX / colWidth) + 1; col++) {
      const x = col * colWidth + (row % 2 ? colWidth / 2 : 0), y = row * rowHeight;
      const p = camera.worldToScreen({ x: x * cos - y * sin, y: x * sin + y * cos });
      const size = HEX_TILE_SIZE * camera.zoom * .84;
      c.beginPath();
      for (let i = 0; i < 6; i++) { const a = (i * 60 - 30) * Math.PI / 180 + rotation; const x = p.x + Math.cos(a) * size, y = p.y + Math.sin(a) * size; if (i) c.lineTo(x, y); else c.moveTo(x, y); }
      c.closePath();
      const hash = Math.abs((row * 73 + col * 31) % 11);
      const tile = c.createLinearGradient(p.x - size, p.y - size, p.x + size, p.y + size);
      tile.addColorStop(0, hash < 3 ? '#22303f' : '#1c2a38');
      tile.addColorStop(1, '#141f2b');
      c.fillStyle = tile; c.fill();
      c.lineWidth = 3 * camera.zoom; c.strokeStyle = '#070e16'; c.stroke();
    }
  }
  const light = c.createRadialGradient(camera.viewportWidth * .4, camera.viewportHeight * .3, 0, camera.viewportWidth / 2, camera.viewportHeight / 2, camera.viewportWidth * .75);
  light.addColorStop(0, '#23324a00'); light.addColorStop(1, '#03091145'); c.fillStyle = light; c.fillRect(0, 0, camera.viewportWidth, camera.viewportHeight);
}

export function renderWorld(c: CanvasRenderingContext2D, world: World, camera: Camera, image: HTMLImageElement | null, boostIntensity = 0): void {
  const rect = camera.getViewRect(160);
  floor(c, camera, rect);
  const border = camera.worldToScreen({ x: -WORLD_HALF, y: -WORLD_HALF });
  c.strokeStyle = '#ef9577'; c.lineWidth = 5; c.strokeRect(border.x, border.y, WORLD_HALF * 2 * camera.zoom, WORLD_HALF * 2 * camera.zoom);
  const motion = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  for (const star of world.getStarsInRect(rect.minX, rect.minY, rect.maxX, rect.maxY)) {
    const p = camera.worldToScreen(star.pos);
    drawCrystal(c, p.x, p.y, star.radius * camera.zoom * .75, star.hue, motion ? world.time : 0);
  }
  // Include body points so long rivals remain visible when their heads leave view.
  const snakes = world.getAliveSnakes().map(snake => ({ snake, points: [snake.head, ...getSegmentsFromNeck(snake)] }))
    .filter(({ snake, points }) => points.some(p => inRect(p.x, p.y, snake.radius * 2, rect)))
    .sort((a, b) => a.snake.head.y - b.snake.head.y);
  for (const { snake, points } of snakes) {
    const p = camera.worldToScreen(snake.head), radius = snake.radius * camera.zoom;
    if (snake.isPlayer && statsFor(snake).pickupBonus > 0) {
      c.beginPath(); c.arc(p.x, p.y, radius + statsFor(snake).pickupBonus * camera.zoom, 0, Math.PI * 2);
      c.strokeStyle = '#cae8a535'; c.lineWidth = 1; c.setLineDash([3, 6]); c.stroke(); c.setLineDash([]);
    }
    drawWorm(c, points.map(p => camera.worldToScreen(p)), radius, snake.bodyPalette, snake.hue, snake.heading, snake.isPlayer ? image : null, snake.boosting);
    c.font = '500 14px Arial, sans-serif'; c.textAlign = 'center';
    c.fillStyle = snake.isPlayer ? '#d6d9aaa6' : '#c7cfdea6';
    c.fillText(snake.name, p.x, p.y + radius + 24);
  }
  if (boostIntensity > .01 && motion) {
    const w = camera.viewportWidth, h = camera.viewportHeight;
    const glow = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .25, w / 2, h / 2, Math.hypot(w, h) * .5);
    glow.addColorStop(0, '#c8e69c00'); glow.addColorStop(1, 'rgba(200,230,156,' + boostIntensity * .15 + ')');
    c.fillStyle = glow; c.fillRect(0, 0, w, h);
  }
}
