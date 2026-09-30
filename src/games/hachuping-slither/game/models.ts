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
  shade.addColorStop(0, '#ffffff65'); shade.addColorStop(.3, '#ffffff28');
  shade.addColorStop(.58, '#ffffff00'); shade.addColorStop(.85, '#07101855'); shade.addColorStop(1, '#071018b0');
  c.fillStyle = shade; c.fill();
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
    const taper = i === 0 ? 1.02 : Math.min(1, .55 + (points.length - i) / 7);
    const r = radius * taper;
    c.drawImage(sphere(colors[Math.floor(i / 3) % colors.length]), p.x - r, p.y - r - radius * .18, r * 2, r * 2);
  }
  const head = points[0]; c.translate(head.x, head.y - radius * .18);
  // Cover the entire head, then light the image as a rounded surface.
  if (portrait?.complete && portrait.naturalWidth) {
    const r = radius * 1.12;
    c.save(); c.beginPath(); c.arc(0, 0, r * .96, 0, TAU); c.clip();
    const size = Math.min(portrait.naturalWidth, portrait.naturalHeight);
    c.drawImage(portrait, (portrait.naturalWidth - size) / 2, (portrait.naturalHeight - size) / 2, size, size,
      -r, -r, r * 2, r * 2);
    const light = c.createRadialGradient(-r * .32, -r * .4, r * .08, 0, 0, r);
    light.addColorStop(0, '#ffffff45'); light.addColorStop(.4, '#ffffff08');
    light.addColorStop(.65, '#071a2810'); light.addColorStop(1, '#071a28ae');
    c.fillStyle = light; c.fillRect(-r, -r, r * 2, r * 2);
    c.beginPath(); c.ellipse(-r * .28, -r * .64, r * .36, r * .12, -.4, 0, TAU);
    c.fillStyle = '#ffffff30'; c.fill();
    c.restore();
  }
  c.rotate(heading);
  for (const side of portrait?.complete && portrait.naturalWidth ? [] : [-1, 1]) {
    c.fillStyle = '#14232b66'; c.beginPath(); c.ellipse(radius * .61, side * radius * .47 + radius * .08, radius * .39, radius * .34, 0, 0, TAU); c.fill();
    c.fillStyle = '#ffffef'; c.beginPath(); c.ellipse(radius * .62, side * radius * .48, radius * .43, radius * .4, 0, 0, TAU); c.fill();
    c.fillStyle = '#101314'; c.beginPath(); c.arc(radius * .79, side * radius * .48, radius * .23, 0, TAU); c.fill();
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
    const glow = s.createRadialGradient(48, 48, 0, 48, 48, 48);
    glow.addColorStop(0, `hsla(${key},95%,72%,.7)`);
    glow.addColorStop(.25, `hsla(${key},90%,65%,.25)`);
    glow.addColorStop(1, `hsla(${key},90%,60%,0)`);
    s.fillStyle = glow; s.fillRect(0, 0, 96, 96);
    const core = s.createRadialGradient(45, 43, 1, 48, 48, 12);
    core.addColorStop(0, '#ffffff');
    core.addColorStop(.3, `hsl(${key} 100% 87%)`);
    core.addColorStop(.7, `hsl(${key} 85% 65%)`);
    core.addColorStop(1, `hsla(${key},80%,45%,0)`);
    s.fillStyle = core; s.beginPath(); s.arc(48, 48, 12, 0, TAU); s.fill();
    crystals.set(key, sprite);
  }
  const size = r * (3 + Math.sin(time * 2 + x * .013) * .12);
  c.drawImage(sprite, x - size, y - size, size * 2, size * 2);
}
