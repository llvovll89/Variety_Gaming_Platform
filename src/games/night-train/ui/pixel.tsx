import type { ReactElement } from 'react';

/**
 * A tiny pixel-art builder for the cast. Characters are composed from shapes painted with
 * materials (three-tone ramps). Shading follows classic JRPG sprite rules: light from the upper
 * left lights the top/left edge of every material, the lower-right of each form falls into shade,
 * a one-pixel ink outline wraps the silhouette and a dithered contact shadow sits underneath.
 * The result is emitted as SVG paths (one per colour), so it scales crisply and needs no image files.
 */
export interface Material { l: string; b: string; s: string }

export const OUTLINE = '#1b1626';

export class Sprite {
  readonly w: number;
  readonly h: number;
  private mat: (string | null)[];
  private detail: (string | null)[];
  private mats: Record<string, Material>;
  private glows: { x: number; y: number; r: number; color: string }[] = [];
  private shadow: { cx: number; cy: number; rx: number; ry: number } | null = null;
  private static seq = 0;
  private readonly uid = ++Sprite.seq;

  constructor(w: number, h: number, mats: Record<string, Material>) {
    this.w = w;
    this.h = h;
    this.mats = mats;
    this.mat = new Array(w * h).fill(null);
    this.detail = new Array(w * h).fill(null);
  }

  private set(x: number, y: number, m: string | null) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.mat[y * this.w + x] = m;
    this.detail[y * this.w + x] = null;
  }

  rect(x: number, y: number, w: number, h: number, m: string) {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, m);
    return this;
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, m: string) {
    for (let j = Math.floor(cy - ry); j <= Math.ceil(cy + ry); j++) {
      for (let i = Math.floor(cx - rx); i <= Math.ceil(cx + rx); i++) {
        const dx = (i + 0.5 - cx - 0.5) / (rx + 0.5), dy = (j + 0.5 - cy - 0.5) / (ry + 0.5);
        if (dx * dx + dy * dy <= 1) this.set(i, j, m);
      }
    }
    return this;
  }

  /** Scanline polygon fill (even-odd), pixel centres. */
  poly(points: [number, number][], m: string) {
    const ys = points.map(p => p[1]);
    for (let j = Math.floor(Math.min(...ys)); j <= Math.ceil(Math.max(...ys)); j++) {
      const yc = j + 0.5;
      const xs: number[] = [];
      for (let k = 0; k < points.length; k++) {
        const [x1, y1] = points[k], [x2, y2] = points[(k + 1) % points.length];
        if ((y1 <= yc && y2 > yc) || (y2 <= yc && y1 > yc)) xs.push(x1 + ((yc - y1) / (y2 - y1)) * (x2 - x1));
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) for (let i = Math.ceil(xs[k] - 0.5); i <= Math.floor(xs[k + 1] - 0.5); i++) this.set(i, j, m);
    }
    return this;
  }

  line(x0: number, y0: number, x1: number, y1: number, m: string, thick = 1) {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let s = 0; s <= steps; s++) {
      const x = Math.round(x0 + ((x1 - x0) * s) / steps), y = Math.round(y0 + ((y1 - y0) * s) / steps);
      this.rect(x - Math.floor((thick - 1) / 2), y - Math.floor((thick - 1) / 2), thick, thick, m);
    }
    return this;
  }

  /** Fixed-colour detail pixels (eyes, buttons, sparkles) painted over the shaded result. */
  px(points: [number, number][], color: string) {
    for (const [x, y] of points) if (x >= 0 && y >= 0 && x < this.w && y < this.h) {
      if (!this.mat[y * this.w + x]) this.mat[y * this.w + x] = '__detail';
      this.detail[y * this.w + x] = color;
    }
    return this;
  }

  dot(cx: number, cy: number, rx: number, ry: number, color: string) {
    const pts: [number, number][] = [];
    for (let j = Math.floor(cy - ry); j <= Math.ceil(cy + ry); j++) for (let i = Math.floor(cx - rx); i <= Math.ceil(cx + rx); i++) {
      const dx = (i - cx) / (rx + 0.5), dy = (j - cy) / (ry + 0.5);
      if (dx * dx + dy * dy <= 1) pts.push([i, j]);
    }
    return this.px(pts, color);
  }

  clear(points: [number, number][]) {
    for (const [x, y] of points) this.set(x, y, null);
    return this;
  }

  glow(x: number, y: number, r: number, color: string) {
    this.glows.push({ x, y, r, color });
    return this;
  }

  ground(cx: number, cy: number, rx: number, ry: number) {
    this.shadow = { cx, cy, rx, ry };
    return this;
  }

  /** Shade every material, outline the silhouette and return colour → path data. */
  private paint(): Map<string, string> {
    const { w, h, mat, detail } = this;
    const at = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h ? null : mat[y * w + x]);
    const boxes = new Map<string, [number, number, number, number]>();
    mat.forEach((m, i) => {
      if (!m) return;
      const x = i % w, y = Math.floor(i / w);
      const b = boxes.get(m) ?? [x, y, x, y];
      boxes.set(m, [Math.min(b[0], x), Math.min(b[1], y), Math.max(b[2], x), Math.max(b[3], y)]);
    });
    const out = new Array<string | null>(w * h).fill(null);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x, m = mat[i];
      if (!m) continue;
      if (detail[i]) { out[i] = detail[i]; continue; }
      const ramp = this.mats[m];
      if (!ramp) continue;
      const lit = at(x - 1, y) !== m || at(x, y - 1) !== m;
      const edgeShade = at(x + 1, y) !== m || at(x, y + 1) !== m;
      const [x0, y0, x1, y1] = boxes.get(m)!;
      const t = ((x - x0) / Math.max(1, x1 - x0)) * 0.55 + ((y - y0) / Math.max(1, y1 - y0)) * 0.45;
      out[i] = lit && !edgeShade ? ramp.l : edgeShade || t > 0.68 ? ramp.s : ramp.b;
    }
    // One-pixel ink outline around the silhouette.
    const filled = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && !!mat[y * w + x];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (mat[i]) continue;
      if (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1)) out[i] = OUTLINE;
    }
    // Dithered contact shadow on empty pixels.
    if (this.shadow) {
      const { cx, cy, rx, ry } = this.shadow;
      for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        if (x < 0 || y < 0 || x >= w || y >= h) continue;
        const dx = (x - cx) / rx, dy = (y - cy) / ry, d = dx * dx + dy * dy;
        const i = y * w + x;
        if (d > 1 || out[i]) continue;
        if (d < 0.55 || (x + y) % 2 === 0) out[i] = '#00000059';
      }
    }
    const paths = new Map<string, string>();
    for (let y = 0; y < h; y++) {
      let x = 0;
      while (x < w) {
        const c = out[y * w + x];
        if (!c) { x++; continue; }
        let run = 1;
        while (x + run < w && out[y * w + x + run] === c) run++;
        paths.set(c, (paths.get(c) ?? '') + `M${x} ${y}h${run}v1h-${run}z`);
        x += run;
      }
    }
    return paths;
  }

  private cache: Map<string, string> | null = null;

  /** `scale` sets how big this character is in the world relative to the shared pixel size. */
  render(className = '', extra?: ReactElement, scale = 1): ReactElement {
    this.cache ??= this.paint();
    const id = `ntpx${this.uid}`;
    return (
      <svg viewBox={`0 0 ${this.w} ${this.h}`} className={`nt-art nt-pixel ${className}`} style={{ ['--px-w' as string]: Math.round(this.w * scale * 10) / 10 }} shapeRendering="crispEdges" aria-hidden="true">
        {this.glows.length > 0 && (
          <defs>
            {this.glows.map((g, i) => (
              <radialGradient key={i} id={`${id}-g${i}`}><stop offset="0" stopColor={g.color} stopOpacity=".55" /><stop offset="1" stopColor={g.color} stopOpacity="0" /></radialGradient>
            ))}
          </defs>
        )}
        {this.glows.map((g, i) => <circle key={i} cx={g.x} cy={g.y} r={g.r} fill={`url(#${id}-g${i})`} shapeRendering="auto" />)}
        {[...this.cache].map(([color, d]) => <path key={color} d={d} fill={color} />)}
        {extra}
      </svg>
    );
  }
}

/** Shared three-tone ramps, lit from the upper left. */
export const M: Record<string, Material> = {
  navy: { l: '#6f8ad6', b: '#34488c', s: '#1d2858' },
  navyDark: { l: '#3a4a86', b: '#1d2756', s: '#0f1534' },
  trouser: { l: '#4a5080', b: '#272b4a', s: '#14162a' },
  skin: { l: '#fff0e0', b: '#ffcfa8', s: '#de9a76' },
  hair: { l: '#a8693e', b: '#6e3f24', s: '#3c2214' },
  cloth: { l: '#ffffff', b: '#ece0c6', s: '#b9a888' },
  gold: { l: '#fff3b0', b: '#e2aa3e', s: '#93641c' },
  red: { l: '#f58a6c', b: '#c24a3c', s: '#7a2820' },
  boot: { l: '#7a5642', b: '#3c2a1e', s: '#1c120c' },
  steel: { l: '#f2f4fa', b: '#a4aabd', s: '#5a6074' },
  visor: { l: '#5a5a70', b: '#1c1c28', s: '#0a0a12' },
  glass: { l: '#fffbe6', b: '#ffd26a', s: '#e3892a' },
  fur: { l: '#948eaa', b: '#57526e', s: '#2c283a' },
  furLight: { l: '#b4aec8', b: '#807a96', s: '#544e68' },
  pink: { l: '#ffd0d4', b: '#e88a98', s: '#a8506a' },
  ghost: { l: '#ffffff', b: '#d6e6f8', s: '#8aa6d2' },
  capGrey: { l: '#8a8fb0', b: '#4c5170', s: '#2a2d46' },
  ticket: { l: '#fff6d0', b: '#f0d080', s: '#b4863a' },
  wing: { l: '#fff2c4', b: '#e8b45c', s: '#a26a2a' },
  wing2: { l: '#eeaa60', b: '#b8743a', s: '#6c3e1e' },
  mothBody: { l: '#cc9a70', b: '#8a5a3a', s: '#4a2e1a' },
  fluff: { l: '#fff8e6', b: '#f2d8a8', s: '#c4a274' },
  rust: { l: '#f6aa7a', b: '#c8693e', s: '#74331c' },
  dollHead: { l: '#ffe8cc', b: '#f0a87c', s: '#ae5e3a' },
  coat: { l: '#605890', b: '#2e2848', s: '#15112a' },
  shade: { l: '#3e385c', b: '#231d36', s: '#110d1e' },
  paper: { l: '#fff8e2', b: '#dcc8a0', s: '#9c8862' },
  glove: { l: '#6a6488', b: '#3a3456', s: '#1e1a30' },
  mist: { l: '#7a72b0', b: '#4c4476', s: '#2c2650' },
  iron: { l: '#bab4c6', b: '#6c677c', s: '#33303e' },
  ironDark: { l: '#6e687e', b: '#3c3848', s: '#201e2a' },
  gauge: { l: '#ffffff', b: '#f2ead6', s: '#c4b898' },
  furnace: { l: '#40302a', b: '#1e1514', s: '#0c0808' },
  fire: { l: '#fff6c0', b: '#ffa040', s: '#d24a1e' },
  robe: { l: '#a096d0', b: '#5a5088', s: '#2a2448' },
  hat: { l: '#8278ba', b: '#3e3668', s: '#1c1836' },
  pale: { l: '#f4f0ff', b: '#bcb4da', s: '#8880aa' },
  void: { l: '#2c2744', b: '#1a1630', s: '#0d0b1a' },
  silver: { l: '#ffffff', b: '#d8d0ee', s: '#9890c0' },
  wood: { l: '#a87e54', b: '#6c4830', s: '#3c2616' },
  wisp: { l: '#ffffff', b: '#bafce6', s: '#5ed2aa' },
  fog: { l: '#f2f0fc', b: '#c8c2e2', s: '#9890bc' },
  flame: { l: '#fff6c0', b: '#ff9a48', s: '#d0502a' },
  smoke: { l: '#948ea8', b: '#504a62', s: '#2a2634' },
  engine: { l: '#6c6684', b: '#2e2a3a', s: '#121019' },
  engineTop: { l: '#86809c', b: '#403c50', s: '#22202c' },
  face: { l: '#56506a', b: '#2a2636', s: '#13111a' },
  brow: { l: '#ffbc96', b: '#ff6a4a', s: '#b8361e' },
  cow: { l: '#f58068', b: '#b8382c', s: '#661a14' },
};
