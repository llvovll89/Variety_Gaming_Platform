import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

const bundle = await build({ stdin: { contents: `export * from './src/games/three-kingdoms-card/lib/localSave'; export { createDemo, STORAGE_KEY, demoSchema } from './src/games/three-kingdoms-card/lib/demoGame';`, resolveDir: process.cwd() }, bundle: true, write: false, format: 'esm', platform: 'node' });
const { LocalSave, BACKUP_KEY, STORAGE_KEY, createDemo, demoSchema } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);
function fixture(initial = JSON.stringify(createDemo(0))) {
  const values = new Map([[STORAGE_KEY, initial]]);
  let broken = null;
  const storage = { getItem: key => values.get(key) ?? null, setItem(key, raw) { if (key === broken) throw new Error('quota'); values.set(key, raw); } };
  let tail = Promise.resolve();
  const lock = work => { const next = tail.then(work); tail = next.catch(() => {}); return next; };
  return { values, storage, lock, fail: key => { broken = key; }, session: () => new LocalSave(storage, values.get(STORAGE_KEY) ?? null, lock) };
}

test('legacy save remains valid; successful writes retain exact previous snapshot and timestamp', async () => {
  const f = fixture(); const original = f.values.get(STORAGE_KEY); const writer = f.session();
  const state = createDemo(1000); state.lordName = '군주';
  const result = await writer.write(state);
  assert.equal(result.status, 'saved');
  assert.equal(f.values.get(BACKUP_KEY), original);
  const raw = JSON.parse(f.values.get(STORAGE_KEY));
  assert.equal(raw.savedAt, result.at); assert.ok(raw.saveRevision);
  assert.equal(demoSchema.parse(raw).lordName, '군주');
});

test('simultaneous tabs admit one writer and never replace its save or backup with stale data', async () => {
  const f = fixture(); const a = f.session(); const b = f.session();
  const stateA = { ...createDemo(1), lordName: 'A' }; const stateB = { ...createDemo(1), lordName: 'B' };
  const results = await Promise.all([a.write(stateA), b.write(stateB)]);
  assert.deepEqual(results.map(r => r.status), ['saved', 'conflict']);
  const primary = f.values.get(STORAGE_KEY); const previous = f.values.get(BACKUP_KEY);
  assert.equal((await b.write(stateB)).status, 'conflict');
  assert.equal(f.values.get(STORAGE_KEY), primary); assert.equal(f.values.get(BACKUP_KEY), previous);
  assert.equal(b.check(), true);
});

test('same-tab queued actions save in order without a false conflict', async () => {
  const f = fixture(); const writer = f.session();
  const a = { ...createDemo(1), lordName: 'A' }; const b = { ...createDemo(2), lordName: 'B' };
  assert.deepEqual((await Promise.all([writer.write(a), writer.write(b)])).map(r => r.status), ['saved', 'saved']);
  assert.equal(JSON.parse(f.values.get(STORAGE_KEY)).lordName, 'B');
  assert.equal(JSON.parse(f.values.get(BACKUP_KEY)).lordName, 'A');
});

test('primary and backup write failures preserve primary, and retry recovers', async () => {
  for (const key of [STORAGE_KEY, BACKUP_KEY]) {
    const f = fixture(); const writer = f.session(); const original = f.values.get(STORAGE_KEY);
    f.fail(key); assert.equal((await writer.write(createDemo(1))).status, 'failed');
    assert.equal(f.values.get(STORAGE_KEY), original);
    f.fail(null); assert.equal((await writer.write(createDemo(2))).status, 'saved');
  }
});

test('corrupt originals do not replace a valid recovery backup; deletion and clear are conflicts', async () => {
  const f = fixture('{bad'); const good = JSON.stringify(createDemo(0)); f.values.set(BACKUP_KEY, good);
  assert.equal((await f.session().write(createDemo(1))).status, 'saved');
  assert.equal(f.values.get(BACKUP_KEY), good);
  const writer = f.session(); f.values.delete(STORAGE_KEY);
  assert.equal((await writer.write(createDemo(2))).status, 'conflict');
  assert.equal(f.values.has(STORAGE_KEY), false);
});

test('unavailable locking or inaccessible storage reports failure without overwriting records', async () => {
  const f = fixture(); const original = f.values.get(STORAGE_KEY);
  const writer = new LocalSave(f.storage, original, () => Promise.reject(new Error('unavailable')));
  assert.equal((await writer.write(createDemo(1))).status, 'failed');
  assert.equal(f.values.get(STORAGE_KEY), original);
  const inaccessible = new LocalSave({ getItem() { throw new Error('denied'); }, setItem() { assert.fail(); } }, null, f.lock);
  assert.equal((await inaccessible.write(createDemo(1))).status, 'failed');
});
