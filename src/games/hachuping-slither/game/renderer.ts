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
  c.fillStyle = '#172d2d'; c.fillRect(0, 0, camera.viewportWidth, camera.viewportHeight);
  const colWidth = Math.sqrt(3) * HEX_TILE_SIZE, rowHeight = HEX_TILE_SIZE * 1.5;
  for (let row = Math.floor(rect.minY / rowHeight) - 1; row <= Math.ceil(rect.maxY / rowHeight) + 1; row++) {
    for (let col = Math.floor(rect.minX / colWidth) - 1; col <= Math.ceil(rect.maxX / colWidth) + 1; col++) {
      const p = camera.worldToScreen({ x: col * colWidth + (row % 2 ? colWidth / 2 : 0), y: row * rowHeight });
      const size = HEX_TILE_SIZE * camera.zoom;
      c.beginPath();
      for (let i = 0; i < 6; i++) { const a = (i * 60 - 30) * Math.PI / 180; const x = p.x + Math.cos(a) * size, y = p.y + Math.sin(a) * size; if (i) c.lineTo(x, y); else c.moveTo(x, y); }
      c.closePath();
      const hash = Math.abs((row * 73 + col * 31) % 11);
      c.fillStyle = hash < 3 ? '#203737' : hash < 7 ? '#1c3232' : '#192f30'; c.fill();
      c.lineWidth = 1; c.strokeStyle = '#a4b9940b'; c.stroke();
      if (hash === 2) { c.fillStyle = '#9ab7a01c'; c.fillRect(p.x, p.y, 2 * camera.zoom, camera.zoom); }
    }
  }
  const light = c.createRadialGradient(camera.viewportWidth * .4, camera.viewportHeight * .3, 0, camera.viewportWidth / 2, camera.viewportHeight / 2, camera.viewportWidth * .75);
  light.addColorStop(0, '#b9de8b09'); light.addColorStop(1, '#05131770'); c.fillStyle = light; c.fillRect(0, 0, camera.viewportWidth, camera.viewportHeight);
}

export function renderWorld(c: CanvasRenderingContext2D, world: World, camera: Camera, image: HTMLImageElement | null, boostIntensity = 0): void {
  const rect = camera.getViewRect(160);
  floor(c, camera, rect);
  const border = camera.worldToScreen({ x: -WORLD_HALF, y: -WORLD_HALF });
  c.strokeStyle = '#ef9577'; c.lineWidth = 5; c.strokeRect(border.x, border.y, WORLD_HALF * 2 * camera.zoom, WORLD_HALF * 2 * camera.zoom);
  const motion = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  for (const star of world.getStarsInRect(rect.minX, rect.minY, rect.maxX, rect.maxY)) {
    const p = camera.worldToScreen(star.pos);
    drawCrystal(c, p.x, p.y, star.radius * camera.zoom, star.value >= 4 ? 160 : 45, motion ? world.time : 0);
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
    c.font = '600 11px Pretendard, sans-serif'; c.textAlign = 'center';
    const label = snake.name + '  ·  Lv.' + snake.level;
    const width = c.measureText(label).width + 16;
    c.fillStyle = '#081c21d9'; c.beginPath(); c.roundRect(p.x - width / 2, p.y - radius - 28, width, 20, 5); c.fill();
    c.fillStyle = snake.isPlayer ? '#d4edb2' : '#dfebe3'; c.fillText(label, p.x, p.y - radius - 14);
  }
  if (boostIntensity > .01 && motion) {
    const w = camera.viewportWidth, h = camera.viewportHeight;
    const glow = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .25, w / 2, h / 2, Math.hypot(w, h) * .5);
    glow.addColorStop(0, '#c8e69c00'); glow.addColorStop(1, 'rgba(200,230,156,' + boostIntensity * .15 + ')');
    c.fillStyle = glow; c.fillRect(0, 0, w, h);
  }
}
