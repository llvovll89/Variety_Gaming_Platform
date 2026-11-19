import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { loadBundle } from './bundle.mjs';

const ids = readdirSync('src/games').filter(id => existsSync(`src/games/${id}/meta.ts`));
const M = await loadBundle(ids.map((id, i) => `export {meta as m${i}} from './src/games/${id}/meta.ts';`).join('\n') + `\nexport * from './src/platform/meta/daily.ts';`);
const metas = Object.fromEntries(ids.map((id, i) => [id, M[`m${i}`]]));
const registry = readFileSync('src/platform/gameRegistry.ts', 'utf8').replace(/\r\n/g, '\n');
const KIDS = ['hachuping-whack-a-mole', 'hachuping-color-match', 'hachuping-balloon', 'hachuping-memory'];

test('every registered game has records data, and it loads nothing heavy', () => {
  const registered = [...registry.matchAll(/^\s+id: ['"]([^'"]+)['"],$/gm)].map(m => m[1]);
  assert.ok(registered.length >= 15, `found ${registered.length} games`);
  for (const id of registered) {
    assert.ok(metas[id], `${id} has meta.ts`);
    assert.match(registry, new RegExp(String.raw`id: ['"]${id}['"],\n\s+meta: `), `${id} is wired in the registry`);
    const imports = readFileSync(`src/games/${id}/meta.ts`, 'utf8').match(/^import .*$/gm) ?? [];
    assert.ok(imports.every(line => line.startsWith('import type ')), `${id}/meta.ts only imports types`);
  }
});

test('achievements are well formed, and kids games give stickers', () => {
  for (const [id, meta] of Object.entries(metas)) {
    const achievementIds = meta.achievements.map(a => a.id);
    assert.equal(new Set(achievementIds).size, achievementIds.length, `${id}: unique ids`);
    assert.ok(meta.achievements.length >= 3 && meta.achievements.length <= 8, `${id}: a short list`);
    assert.ok(meta.achievements.some(a => a.tier === 1), `${id}: something reachable early`);
    for (const a of meta.achievements) {
      assert.ok(a.title && a.description, `${id}/${a.id}: text`);
      if ('atLeast' in a.rule) assert.ok(a.rule.atLeast > 0, `${id}/${a.id}: positive goal`);
      if (KIDS.includes(id)) assert.ok(a.kids?.sticker, `${id}/${a.id}: kids games show stickers`);
    }
  }
});

test('daily challenges fill every placeholder and stay reachable for a year', () => {
  for (const [id, meta] of Object.entries(metas)) {
    if (!meta.daily) continue;
    for (let d = 0; d < 365; d += 7) {
      const date = M.localDateKey(new Date(2026, 0, 1 + d));
      const c = M.dailyChallenge(date, id, meta.daily);
      assert.ok(c && !c.label.includes('{') && c.goal > 0, `${id} ${date}: ${c?.label}`);
    }
  }
});

test('a timed daily challenge always asks for less time than the run allows', async () => {
  const { LEVELS } = await loadBundle(`export {LEVELS} from './src/games/echo-maze/engine.ts';`);
  for (const t of metas['echo-maze'].daily) for (const d of t.difficulty) assert.ok(t.range[1] < LEVELS[d.id].seconds, `${t.id} goal under the ${d.id} time limit`);
});
