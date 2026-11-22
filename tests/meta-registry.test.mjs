import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { loadBundle } from './bundle.mjs';

const ids = readdirSync('src/games').filter(id => existsSync(`src/games/${id}/meta.ts`));
const M = await loadBundle(ids.map((id, i) => `export {meta as m${i}} from './src/games/${id}/meta.ts';`).join('\n') + `\nexport * from './src/platform/meta/daily.ts';
export {PLAY_INFO} from './src/platform/playExperience.ts';`);
const { PLAY_INFO } = M;
const metas = Object.fromEntries(ids.map((id, i) => [id, M[`m${i}`]]));
const registry = readFileSync('src/platform/gameRegistry.ts', 'utf8').replace(/\r\n/g, '\n');
/** Each entry of the GAMES array, as source text. */
const ENTRY_SPLIT = /\n  \{\n/;
/** 레지스트리가 키즈로 분류한 게임. 손으로 적어 두면 새 게임이 생길 때마다 뒤처진다. */
const KIDS = registry.split(ENTRY_SPLIT).slice(1)
  .filter(block => /audience: ['"]kids['"]/.test(block) || /genres: \[[^\]]*키즈/.test(block))
  .map(block => block.match(/id: ['"]([^'"]+)['"]/)?.[1])
  .filter(Boolean);

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

test('삼국 영지 brings in its stage and heroes from the save, not just the tower', () => {
  const save = JSON.stringify({ stage: 3, heroes: [{}, {}, {}, {}], warRoom: { towerFloor: 7 } });
  const parse = { num: raw => { const n = Number(raw); return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0; }, json: raw => { try { return raw === null ? null : JSON.parse(raw); } catch { return null; } } };
  const found = metas['three-kingdoms-card'].legacy.read(key => key === 'three-kingdoms-local-v2' ? save : null, parse);
  assert.deepEqual(found.progress, { tower: 7, stage: 3, heroes: 4 });
  assert.deepEqual(metas['three-kingdoms-card'].legacy.read(() => null, parse).progress, { tower: 0, stage: 0, heroes: 0 });
});

test('puzzle par challenges only count runs started from the challenge', () => {
  for (const id of ['ghost-movers', 'ten-seconds']) {
    const [t] = metas[id].daily;
    assert.equal(t.mode, 'daily', `${id}: a normal level clear does not complete the challenge`);
    assert.equal(t.stat, 'stars');
    assert.ok(t.range[1] <= 3, `${id}: at most three stars`);
    assert.ok(metas[id].reportsRuns, `${id} reports runs`);
  }
});

/**
 * What each game actually passes to reportRun. Daily templates may only name these, or they would
 * ask for a number the game never reports. Keep in sync with the game's reportRun call; the keys
 * kitchen-fighter builds from the weapon are spelled out because the source has them only as
 * `win-${weapon}`.
 */
const REPORTED = {
  'hachuping-memory': { modes: [], difficulties: ['slow', 'normal'], stats: ['score', 'stage'] },
  'hachuping-balloon': { modes: [], difficulties: [], stats: ['score', 'popped'] },
  'hachuping-color-match': { modes: [], difficulties: ['easy', 'normal', 'hard'], stats: ['score', 'correct', 'streak', 'accuracy'] },
  'hachuping-whack-a-mole': { modes: [], difficulties: ['easy', 'normal', 'hard'], stats: ['score', 'hits', 'combo', 'accuracy'] },
  'hachuping-slither': { modes: ['timed'], difficulties: [], stats: ['score', 'kills', 'survivalSec', 'level'] },
  'hachuping-jump': { modes: ['full'], difficulties: [], stats: ['score', 'world'] },
  'hachuping-dodge': { modes: [], difficulties: ['easy', 'normal', 'hard', 'nightmare'], stats: ['score', 'kills', 'level', 'region'] },
  'echo-maze': { modes: ['daily'], difficulties: ['easy', 'normal', 'hard'], stats: ['score', 'steps', 'shards'] },
  'ghost-movers': { modes: ['daily'], difficulties: [], stats: ['steps', 'stars', 'undos'] },
  'ten-seconds': { modes: ['daily', 'practice'], difficulties: [], stats: ['loops', 'deaths', 'stars'] },
  'night-train': { modes: ['daily', 'easy'], difficulties: ['tier1', 'tier2', 'tier3'], stats: ['score', 'station', 'battles', 'elites', 'damage'] },
  'kitchen-fighter': { modes: ['ladder-1', 'ladder-2', 'ladder-3', 'ladder-4', 'ladder-5', 'cpu-easy', 'cpu-normal', 'local'], difficulties: [], stats: ['rounds', 'cpuWins', 'weapon-spatula', 'weapon-swatter', 'weapon-golf', 'win-spatula', 'win-swatter', 'win-golf'] },
  'fantasy-tactics': { modes: ['stage', 'side'], difficulties: [], stats: ['rounds', 'survivors', 'chests'] },
  'hangul-words': { modes: ['daily', 'free'], difficulties: [], stats: ['score', 'guesses', 'solved'] },
  'kids-rhythm': { modes: ['daily'], difficulties: ['easy', 'normal'], stats: ['score', 'hits', 'perfect', 'combo'] },
};

test('a daily challenge only asks for numbers its game reports', () => {
  for (const [id, meta] of Object.entries(metas)) {
    if (!meta.daily?.length) continue;
    const known = REPORTED[id];
    assert.ok(known, `${id} has daily challenges, so its reportRun arguments belong in REPORTED`);
    for (const t of meta.daily) {
      assert.ok(known.stats.includes(t.stat), `${id}/${t.id}: reports "${t.stat}"`);
      if (t.mode !== undefined) assert.ok(known.modes.includes(t.mode), `${id}/${t.id}: reports mode "${t.mode}"`);
      for (const d of t.difficulty ?? []) assert.ok(known.difficulties.includes(d.id), `${id}/${t.id}: reports difficulty "${d.id}"`);
      if (t.outcome !== undefined) assert.ok(['win', 'lose', 'complete'].includes(t.outcome), `${id}/${t.id}: a run can end as "${t.outcome}"`);
    }
  }
});

test('a game whose challenge picks a difficulty actually opens on it', () => {
  // The hub writes the day's difficulty into the arcade settings (TodayCard) before opening the
  // game. A game that reads only its own storage silently rejects every run that day.
  const sources = id => readdirSync(`src/games/${id}`, { recursive: true, encoding: 'utf8' })
    .filter(f => /\.(ts|tsx)$/.test(f)).map(f => readFileSync(`src/games/${id}/${f}`, 'utf8')).join('\n');
  for (const [id, meta] of Object.entries(metas)) {
    if (!meta.daily?.some(t => t.difficulty?.length)) continue;
    const source = sources(id);
    const reads = /extra\??\.difficulty/.test(source) || /daily\(\)/.test(source);
    assert.ok(reads, `${id}: reads the difficulty the hub asks for (settings extra.difficulty, or the challenge itself)`);
  }
});

test('the hub always has a kids, a short and a long challenge to offer', () => {
  // The hub shows three challenges a day: one kids game, one short and one long (featuredDailies).
  // A group with no candidate leaves a slot empty every day of the year, silently. The synthetic
  // fixtures in meta-daily.test.mjs cannot see that, so build the candidates from the real registry.
  const entries = registry.split(ENTRY_SPLIT).slice(1);
  const games = entries.map(block => ({
    id: block.match(/id: ['"]([^'"]+)['"]/)?.[1],
    kids: /audience: ['"]kids['"]/.test(block) || /genres: \[[^\]]*키즈/.test(block),
    comingSoon: /releaseStatus: ['"]coming-soon['"]/.test(block) || /disabled: true/.test(block),
  })).filter(g => g.id);
  assert.ok(games.length >= 15, `parsed ${games.length} registry entries`);

  const candidates = games.filter(g => !g.comingSoon && metas[g.id]?.reportsRuns && metas[g.id]?.daily?.length && PLAY_INFO[g.id])
    .map(g => ({ id: g.id, audience: g.kids ? 'kids' : 'general', minutes: PLAY_INFO[g.id].minutes }));
  const groups = {
    kids: candidates.filter(c => c.audience === 'kids'),
    short: candidates.filter(c => c.audience === 'general' && c.minutes <= 5),
    long: candidates.filter(c => c.audience === 'general' && c.minutes > 5),
  };
  for (const [name, group] of Object.entries(groups)) {
    assert.ok(group.length > 0, `the ${name} slot has a game to offer`);
  }
  for (let d = 0; d < 365; d++) {
    const date = M.localDateKey(new Date(2026, 0, 1 + d));
    assert.equal(M.featuredDailies(date, candidates).length, 3, `${date}: three challenges`);
  }
});

test('every game with a daily challenge is listed in PLAY_INFO', () => {
  // TodayCard drops a game with no PLAY_INFO entry, and gamesForTime filters it out of the time
  // picker, both without a word. A new game missing from that map just never appears.
  for (const [id, meta] of Object.entries(metas)) {
    if (!meta.daily?.length) continue;
    assert.ok(PLAY_INFO[id], `${id} has a PLAY_INFO entry, or its challenges never reach the hub`);
  }
});
