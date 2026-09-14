type Point = { x: number; y: number };
const spheres = new Map<string, HTMLCanvasElement>();
const crystals = new Map<number, HTMLCanvasElement>();
const TAU = Math.PI * 2;

// Bake lighting once per material, then reuse it for every body segment.
function sphere(color: string): HTMLCanvasElement {
  const cached = spheres.get(color);
  if (cached) return cached;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 96;
  const c = canvas.getContext('2d')!;
  c.beginPath(); c.arc(48, 48, 46, 0, TAU);
  c.fillStyle = color; c.fill();
  const shade = c.createRadialGradient(31, 23, 3, 48, 48, 49);
  shade.addColorStop(0, '#ffffffa8'); shade.addColorStop(.3, '#ffffff35');
  shade.addColorStop(.58, '#ffffff00'); shade.addColorStop(.85, '#071a2855'); shade.addColorStop(1, '#071a28c9');
  c.fillStyle = shade; c.fill();
  c.strokeStyle = '#e7fff64a'; c.lineWidth = 2; c.stroke();
  c.beginPath(); c.ellipse(34, 24, 16, 7, -.5, 0, TAU);
  c.fillStyle = '#ffffff66'; c.fill();
  if (spheres.size > 180) spheres.clear();
  spheres.set(color, canvas);
  return canvas;
}

export function drawWorm(c: CanvasRenderingContext2D, points: Point[], radius: number,
  palette: string[], hue: number, heading: number, portrait: HTMLImageElement | null = null,
  boosting = false): void {
  if (!points.length) return;
  const colors = palette.length ? palette : [`hsl(${hue} 66% 65%)`];
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath();
  points.forEach((p, i) => i ? c.lineTo(p.x + radius * .25, p.y + radius * .6) : c.moveTo(p.x + radius * .25, p.y + radius * .6));
  c.strokeStyle = '#040e14a0'; c.lineWidth = radius * 1.8; c.stroke();
  for (let i = points.length - 1; i >= 0; i--) {
    const p = points[i];
    const taper = i === 0 ? 1.12 : Math.min(1, .32 + (points.length - i) / 5);
    const r = radius * taper;
    c.drawImage(sphere(colors[Math.floor(i / 3) % colors.length]), p.x - r, p.y - r - radius * .18, r * 2, r * 2);
  }
  const head = points[0]; c.translate(head.x, head.y - radius * .18);
  // Custom portraits become a medallion on the rounded head.
  if (portrait?.complete && portrait.naturalWidth) {
    c.save(); c.beginPath(); c.arc(-Math.cos(heading) * radius * .28, -Math.sin(heading) * radius * .28, radius * .53, 0, TAU); c.clip();
    const size = Math.min(portrait.naturalWidth, portrait.naturalHeight);
    c.drawImage(portrait, (portrait.naturalWidth - size) / 2, 0, size, size,
      -Math.cos(heading) * radius * .28 - radius * .53, -Math.sin(heading) * radius * .28 - radius * .53, radius * 1.06, radius * 1.06);
    c.restore();
  }
  c.rotate(heading);
  for (const side of [-1, 1]) {
    c.fillStyle = '#14232b66'; c.beginPath(); c.ellipse(radius * .61, side * radius * .47 + radius * .08, radius * .39, radius * .34, 0, 0, TAU); c.fill();
    c.fillStyle = '#f6f9ed'; c.beginPath(); c.ellipse(radius * .62, side * radius * .47, radius * .35, radius * .32, 0, 0, TAU); c.fill();
    c.fillStyle = '#132635'; c.beginPath(); c.arc(radius * .76, side * radius * .47, radius * .18, 0, TAU); c.fill();
    c.fillStyle = '#ffffff'; c.beginPath(); c.arc(radius * .78, side * radius * .47 - radius * .07, radius * .065, 0, TAU); c.fill();
  }
  if (boosting) {
    c.strokeStyle = '#e1fda9aa'; c.lineWidth = 2;
    for (const side of [-1, 1]) { c.beginPath(); c.moveTo(-radius * 1.5, side * radius * 1.3); c.lineTo(-radius * 3, side * radius * 1.3); c.stroke(); }
  }
  c.restore();
}

export function drawCrystal(c: CanvasRenderingContext2D, x: number, y: number, r: number, hue = 45, time = 0): void {
  const key = Math.round(hue / 30) * 30;
  let sprite = crystals.get(key);
  if (!sprite) {
    sprite = document.createElement('canvas'); sprite.width = sprite.height = 96;
    const s = sprite.getContext('2d')!;
    const pts = Array.from({ length: 10 }, (_, i) => {
      const angle = -Math.PI / 2 + i * Math.PI / 5, length = i % 2 ? 17 : 37;
      return { x: 48 + Math.cos(angle) * length, y: 43 + Math.sin(angle) * length };
    });
    const path = (dy: number) => { s.beginPath(); pts.forEach((p, i) => i ? s.lineTo(p.x, p.y + dy) : s.moveTo(p.x, p.y + dy)); s.closePath(); };
    path(8); s.fillStyle = `hsl(${key} 65% 27%)`; s.fill();
    path(0); s.fillStyle = `hsl(${key} 83% 64%)`; s.fill();
    for (let i = 0; i < 10; i++) {
      s.beginPath(); s.moveTo(48, 40); s.lineTo(pts[i].x, pts[i].y); s.lineTo(pts[(i + 1) % 10].x, pts[(i + 1) % 10].y); s.closePath();
      s.fillStyle = i % 2 ? `hsl(${key} 77% 53%)` : `hsl(${key} 92% 82%)`; s.fill();
    }
    path(0); s.strokeStyle = `hsl(${key} 90% 86%)`; s.lineWidth = 1.5; s.stroke();
    crystals.set(key, sprite);
  }
  c.fillStyle = '#03131670'; c.beginPath(); c.ellipse(x + r * .2, y + r * .7, r * .78, r * .3, 0, 0, TAU); c.fill();
  const bob = Math.sin(time * 2 + x * .013) * Math.min(2, r * .12);
  c.drawImage(sprite, x - r * 1.25, y - r * 1.35 + bob, r * 2.5, r * 2.5);
}
