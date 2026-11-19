import { DEFAULT_LOADOUT, HEROES, WEAPONS, type Hero, type Loadout, type Weapon } from './world';

/**
 * Heroes and weapons that open up as the player's arcade record grows. The record is what the
 * arcade keeps for this game: the best kill count (on any difficulty), expeditions completed and
 * the furthest region reached. Best kills come in from the game's old high scores too, so a player
 * who was already good finds these open on day one.
 */
export interface UnlockProgress { best: number; wins: number; region: number }
export interface Need { label: string; met: (progress: UnlockProgress) => boolean }

export const HERO_NEEDS: Partial<Record<Hero, Need>> = {
  robot: { label: '아무 난이도에서 한 번에 150 처치', met: p => p.best >= 150 },
  assassin: { label: '세 번째 지역 도착, 또는 한 번에 300 처치', met: p => p.region >= 3 || p.best >= 300 },
  storm: { label: '원정 완수, 또는 한 번에 600 처치', met: p => p.wins >= 1 || p.best >= 600 },
};
export const WEAPON_NEEDS: Partial<Record<Weapon, Need>> = {
  shotgun: { label: '아무 난이도에서 한 번에 150 처치', met: p => p.best >= 150 },
};

/** Heroes and weapons that were in the player's saved loadout before unlocks existed stay open. */
export const KEPT_KEY = 'rune-ranger-kept-v1';
export type Kept = readonly string[];

export function readKept(get: (key: string) => string | null, set: (key: string, value: string) => void): Kept {
  try {
    const raw = get(KEPT_KEY);
    if (raw !== null) { const list: unknown = JSON.parse(raw); return Array.isArray(list) ? list.filter((x): x is string => typeof x === 'string') : []; }
    // First start with unlocks: keep whatever the saved loadout already used.
    const saved = JSON.parse(get('rune-ranger-loadout') || 'null') as { hero?: unknown; weapon?: unknown } | null;
    const kept = saved ? [saved.hero, saved.weapon].filter((x: unknown): x is string => typeof x === 'string') : [];
    try { set(KEPT_KEY, JSON.stringify(kept)); } catch { /* kept for this visit only */ }
    return kept;
  } catch { return []; }
}

export function heroOpen(hero: Hero, progress: UnlockProgress, kept: Kept): boolean {
  return !HERO_NEEDS[hero] || HERO_NEEDS[hero]!.met(progress) || kept.includes(hero);
}
export function weaponOpen(weapon: Weapon, progress: UnlockProgress, kept: Kept): boolean {
  return !WEAPON_NEEDS[weapon] || WEAPON_NEEDS[weapon]!.met(progress) || kept.includes(weapon);
}

/** A loadout the player may use: anything locked falls back to the default. */
export function allowedLoadout(loadout: Loadout, progress: UnlockProgress, kept: Kept): Loadout {
  return {
    ...loadout,
    hero: heroOpen(loadout.hero, progress, kept) ? loadout.hero : DEFAULT_LOADOUT.hero,
    weapon: weaponOpen(loadout.weapon, progress, kept) ? loadout.weapon : DEFAULT_LOADOUT.weapon,
  };
}

/** Names of what a run just opened, for the result screen. */
export function newlyOpened(before: UnlockProgress, after: UnlockProgress, kept: Kept): string[] {
  const heroes = (Object.keys(HEROES) as Hero[]).filter(h => !heroOpen(h, before, kept) && heroOpen(h, after, kept)).map(h => HEROES[h]);
  const weapons = (Object.keys(WEAPONS) as Weapon[]).filter(w => !weaponOpen(w, before, kept) && weaponOpen(w, after, kept)).map(w => WEAPONS[w].name);
  return [...heroes, ...weapons];
}
