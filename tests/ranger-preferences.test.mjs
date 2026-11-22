import test from 'node:test';
import assert from 'node:assert/strict';
import { loadBundle } from './bundle.mjs';

// Preferences now read the arcade settings, which pull in react and zod: bundle rather than import.
const { readDifficulty, saveDifficulty, readBest, DIFFICULTY_KEY, GAME_ID, settingsStore } = await loadBundle(
  `export * from './src/games/hachuping-dodge/survivor/preferences.ts';
   export { settingsStore } from './src/shared/kit/settings.ts';`,
);

test('new or invalid difficulty preferences fall back to easy without touching records',()=>{
  const values=new Map([['rune-ranger-best-hard','123']]);
  globalThis.localStorage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
  for(const raw of [null,'','HARD','unknown','__proto__','constructor','{"difficulty":"hard"}']){
    if(raw===null)values.delete(DIFFICULTY_KEY);else values.set(DIFFICULTY_KEY,raw);
    assert.equal(readDifficulty(),'easy');assert.equal(values.get('rune-ranger-best-hard'),'123');
  }
  for(const difficulty of ['easy','normal','hard','nightmare']){
    saveDifficulty(difficulty);assert.equal(readDifficulty(),difficulty);
    assert.equal(values.get('rune-ranger-best-hard'),'123');
  }
});

test("today's challenge opens the expedition on the difficulty it asks for",()=>{
  // The hub writes the day's difficulty into the arcade settings before opening the game.
  const values=new Map([[DIFFICULTY_KEY,'easy']]);
  globalThis.localStorage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
  settingsStore.resetForTests();
  settingsStore.setGame(GAME_ID,{extra:{difficulty:'hard'}});
  assert.equal(readDifficulty(),'hard');
  // A player who chose before the move still gets their own choice back.
  settingsStore.resetForTests();
  values.set(DIFFICULTY_KEY,'nightmare');
  assert.equal(readDifficulty(),'nightmare');
});

test('difficulty and record reads tolerate unavailable storage and writes do not throw',()=>{
  globalThis.localStorage={getItem(){throw Error('blocked');},setItem(){throw Error('quota');}};
  settingsStore.resetForTests();
  assert.equal(readDifficulty(),'easy');assert.equal(readBest('hard'),0);
  assert.doesNotThrow(()=>saveDifficulty('nightmare'));
});

test('best records remain difficulty-specific and invalid values are ignored',()=>{
  const values=new Map([['rune-ranger-best-easy','11'],['rune-ranger-best-normal','22'],['rune-ranger-best-hard','33'],['rune-ranger-best-nightmare','44']]);
  globalThis.localStorage={getItem:key=>values.get(key)??null};
  for(const [d,n] of [['easy',11],['normal',22],['hard',33],['nightmare',44]])assert.equal(readBest(d),n);
  for(const raw of ['NaN','Infinity','-5','oops']){values.set('rune-ranger-best-easy',raw);assert.equal(readBest('easy'),0);assert.equal(values.get('rune-ranger-best-easy'),raw);}
});
