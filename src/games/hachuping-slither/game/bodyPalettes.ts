export interface BodyPalette {
  id: string;
  name: string;
  /** Hex colors cycled one-per-segment along the body. Empty = keep the classic single-hue
   * tube rendering (snake.hue), unchanged from before this feature existed. */
  colors: string[];
}

export const BODY_PALETTES: BodyPalette[] = [
  { id: "classic", name: "클래식", colors: [] },
  { id: "rainbow", name: "레인보우", colors: ["#ff6b6b", "#ffa94d", "#ffd43b", "#69db7c", "#4dabf7", "#9775fa"] },
  { id: "mint-berry", name: "민트베리", colors: ["#6ee7b7", "#f472b6"] },
  { id: "sunset", name: "선셋", colors: ["#ff9a76", "#ff6fa5", "#c084fc"] },
  { id: "ocean", name: "오션", colors: ["#4fd8ff", "#3b82f6", "#22d3ee"] },
  { id: "candy", name: "캔디", colors: ["#ff8fc2", "#ffd166", "#a5f3ff"] },
];

export const DEFAULT_BODY_PALETTE_ID = BODY_PALETTES[0].id;

export function getBodyPaletteById(id: string): BodyPalette {
  return BODY_PALETTES.find((p) => p.id === id) ?? BODY_PALETTES[0];
}

/** Precomputed once per palette color rather than per frame — canvas strokeStyle strings for
 * the base tube color and its darker "rim" shading. */
export interface ResolvedSegmentColor {
  base: string;
  rim: string;
  sheen: string;
}

function darken(hex: string, factor: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.round(((num >> 16) & 0xff) * factor);
  const g = Math.round(((num >> 8) & 0xff) * factor);
  const b = Math.round((num & 0xff) * factor);
  return `rgb(${r},${g},${b})`;
}

function lighten(hex: string, factor: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.round(((num >> 16) & 0xff) + (255 - ((num >> 16) & 0xff)) * factor);
  const g = Math.round(((num >> 8) & 0xff) + (255 - ((num >> 8) & 0xff)) * factor);
  const b = Math.round((num & 0xff) + (255 - (num & 0xff)) * factor);
  return `rgb(${r},${g},${b})`;
}

export function resolveSegmentColors(colors: string[]): ResolvedSegmentColor[] {
  return colors.map((base) => ({ base, rim: darken(base, 0.6), sheen: lighten(base, 0.55) }));
}
