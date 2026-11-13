import test from 'node:test';
import assert from 'node:assert/strict';
import { readDifficulty, saveDifficulty, readBest, DIFFICULTY_KEY } from '../src/games/hachuping-dodge/survivor/preferences.ts';

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

test('difficulty and record reads tolerate unavailable storage and writes do not throw',()=>{
  globalThis.localStorage={getItem(){throw Error('blocked');},setItem(){throw Error('quota');}};
  assert.equal(readDifficulty(),'easy');assert.equal(readBest('hard'),0);
  assert.doesNotThrow(()=>saveDifficulty('nightmare'));
});

test('best records remain difficulty-specific and invalid values are ignored',()=>{
  const values=new Map([['rune-ranger-best-easy','11'],['rune-ranger-best-normal','22'],['rune-ranger-best-hard','33'],['rune-ranger-best-nightmare','44']]);
  globalThis.localStorage={getItem:key=>values.get(key)??null};
  for(const [d,n] of [['easy',11],['normal',22],['hard',33],['nightmare',44]])assert.equal(readBest(d),n);
  for(const raw of ['NaN','Infinity','-5','oops']){values.set('rune-ranger-best-easy',raw);assert.equal(readBest('easy'),0);assert.equal(values.get('rune-ranger-best-easy'),raw);}
});
