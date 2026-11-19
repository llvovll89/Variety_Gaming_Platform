import test from 'node:test';
import assert from 'node:assert/strict';
import { loadBundle } from './bundle.mjs';

const U = await loadBundle(`export * from './src/games/hachuping-dodge/survivor/unlocks.ts';`);
const none = { best: 0, wins: 0, region: 0 };

test('a new player starts with three heroes and three weapons; the rest open with the record', () => {
  assert.deepEqual(['ranger', 'knight', 'witch', 'robot', 'assassin', 'storm'].filter(h => U.heroOpen(h, none, [])), ['ranger', 'knight', 'witch']);
  assert.equal(U.weaponOpen('shotgun', none, []), false);
  assert.ok(U.heroOpen('robot', { ...none, best: 150 }, []) && U.weaponOpen('shotgun', { ...none, best: 150 }, []));
  assert.ok(U.heroOpen('assassin', { ...none, region: 3 }, []) && U.heroOpen('assassin', { ...none, best: 300 }, []));
  assert.ok(U.heroOpen('storm', { ...none, wins: 1 }, []) && !U.heroOpen('storm', { ...none, best: 599 }, []));
});

test('a locked saved loadout falls back to the default, and the result names what just opened', () => {
  assert.deepEqual(U.allowedLoadout({ hero: 'storm', weapon: 'shotgun', tint: 'gold' }, none, []), { hero: 'ranger', weapon: 'rifle', tint: 'gold' });
  assert.deepEqual(U.newlyOpened(none, { ...none, best: 320 }, []), ['룬 기계병', '월영 암살자', '산탄총']);
  assert.deepEqual(U.newlyOpened({ ...none, best: 320 }, { ...none, best: 400 }, []), []);
});

test('heroes and weapons from a loadout saved before unlocks stay open, once and for good', () => {
  const store = new Map([['rune-ranger-loadout', JSON.stringify({ hero: 'storm', weapon: 'shotgun', tint: 'mint' })]]);
  const get = k => store.get(k) ?? null, set = (k, v) => store.set(k, v);
  const kept = U.readKept(get, set);
  assert.deepEqual([...kept], ['storm', 'shotgun']);
  assert.ok(U.heroOpen('storm', none, kept) && U.weaponOpen('shotgun', none, kept));
  store.set('rune-ranger-loadout', JSON.stringify({ hero: 'ranger', weapon: 'rifle', tint: 'mint' }));
  assert.deepEqual([...U.readKept(get, set)], ['storm', 'shotgun'], 'decided on the first start only');
  assert.deepEqual([...U.readKept(() => null, () => { throw new Error('blocked'); })], [], 'a new player keeps nothing');
});

test('every screen change that has a sound names a real recipe', async () => {
  const S = await loadBundle(`export * from './src/games/hachuping-dodge/survivor/sound.ts';`);
  for (const status of ['upgrade', 'promotion', 'clear', 'victory', 'dead']) assert.ok(S.soundForStatus(status), status);
  for (const status of ['playing', 'paused', 'menu']) assert.equal(S.soundForStatus(status), null, status);
});
