/** Seeded mulberry32. The state lives on the run so a saved game continues with the same luck. */
export interface RngHolder { rng: number }

export function random(holder: RngHolder): number {
  holder.rng = (holder.rng + 0x6d2b79f5) >>> 0;
  let t = holder.rng;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function randInt(holder: RngHolder, min: number, max: number): number {
  return min + Math.floor(random(holder) * (max - min + 1));
}

export function pick<T>(holder: RngHolder, list: readonly T[]): T {
  return list[Math.floor(random(holder) * list.length)];
}

export function weighted<T extends string>(holder: RngHolder, weights: Partial<Record<T, number>>): T {
  const entries = Object.entries(weights) as [T, number][];
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let roll = random(holder) * total;
  for (const [key, w] of entries) {
    roll -= w;
    if (roll < 0) return key;
  }
  return entries[entries.length - 1][0];
}

export function shuffle<T>(holder: RngHolder, list: T[]): T[] {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(random(holder) * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}
