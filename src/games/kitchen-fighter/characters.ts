import { safeGetItem, safeSetItem } from '../../shared/storage';
import { WEAPONS, type Weapon } from './engine';

export type Character = { name: string; weapon: Weapon; photo: string; zoom: number; x: number; y: number };

/**
 * Names, weapons and crops live under one small key that is rewritten on every edit.
 * Each photo (a data URL of up to a few MB) has its own key and is written only when it changes,
 * so a photo too large for storage can never take the name and weapon edits down with it.
 */
export const CHARACTERS_KEY = 'arcade:kitchen-fighter:characters';
export const photoKey = (index: number) => `${CHARACTERS_KEY}:photo${index}`;

const validPhoto = (value: unknown) => typeof value === 'string' && value.startsWith('data:image/') ? value : '';

export function readCharacters(name: string): [Character, Character] {
  const defaults: [Character, Character] = [
    { name: name || '주걱 고수', weapon: 'spatula', photo: '', zoom: 1, x: 0, y: 0 },
    { name: '동네 챔피언', weapon: 'swatter', photo: '', zoom: 1, x: 0, y: 0 },
  ];
  try {
    const saved = JSON.parse(safeGetItem(CHARACTERS_KEY) || 'null');
    if (Array.isArray(saved) && saved.length === 2) return defaults.map((d, i) => {
      const s = saved[i]; if (!s || typeof s !== 'object') return d;
      const cropped = s.photoVersion === 2;
      return { name: typeof s.name === 'string' ? s.name.slice(0, 14) : d.name,
        weapon: Object.hasOwn(WEAPONS, s.weapon) ? s.weapon : d.weapon,
        // Older saves kept the photo inline; it moves to its own key on the next photo write.
        photo: validPhoto(safeGetItem(photoKey(i))) || validPhoto(s.photo),
        zoom: typeof s.zoom === 'number' && cropped ? Math.max(.5, Math.min(2, s.zoom)) : 1,
        x: typeof s.x === 'number' && cropped ? Math.max(-2, Math.min(2, s.x)) : 0, y: typeof s.y === 'number' && cropped ? Math.max(-2, Math.min(2, s.y)) : 0 };
    }) as [Character, Character];
  } catch { /* Invalid old saves fall back to the default fighters. */ }
  return defaults;
}

/** Everything but the photos: small, so it is safe to write on every slider tick. */
export function saveCharacterSettings(characters: readonly Character[]): void {
  safeSetItem(CHARACTERS_KEY, JSON.stringify(characters.map(({ photo: _photo, ...rest }) => ({ ...rest, photoVersion: 2 }))));
}

/** False when the browser refused the photo (usually storage full), so the caller can say so. */
export function savePhoto(index: number, photo: string): boolean {
  try {
    if (photo) localStorage.setItem(photoKey(index), photo);
    else localStorage.removeItem(photoKey(index));
    return true;
  } catch {
    return false;
  }
}
