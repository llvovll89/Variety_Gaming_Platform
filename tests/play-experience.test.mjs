import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

const compiled = await build({ stdin: { contents: "export * from './src/platform/playExperience'; export * from './src/platform/savedProgress'; export { Battle, serialize } from './src/games/fantasy-tactics/game';", resolveDir: process.cwd() }, bundle: true, write: false, format: 'esm', platform: 'node' });
const { gamesForTime, recommendNext, scoreMessage, savedProgressLabel, Battle, serialize } = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const game = (id, genres, tags=[], extra={}) => ({id,genres,tags,...extra});
const games = [game('hachuping-balloon',['키즈','캐주얼']),game('hachuping-whack-a-mole',['액션','캐주얼']),game('hachuping-jump',['액션','캐주얼']),game('fantasy-tactics',['전략']),game('three-kingdoms',['전략']),game('hachuping-color-match',['캐주얼'],[],{releaseStatus:'coming-soon'})];

test('time choices partition available games without recommending coming-soon entries',()=>{
  assert.deepEqual(gamesForTime(games,'short').map(g=>g.id),['hachuping-balloon','hachuping-whack-a-mole']);
  assert.deepEqual(gamesForTime(games,'medium').map(g=>g.id),['hachuping-jump']);
  assert.deepEqual(gamesForTime(games,'long').map(g=>g.id),['fantasy-tactics','three-kingdoms']);
  assert.deepEqual(gamesForTime([game('hachuping-balloon',[],[],{disabled:true}),game('unknown',[])],'short'),[]);
});
test('next-game recommendations match shared genres, offer a different genre and never change shelf order',()=>{
  const before=games.map(g=>g.id);
  assert.equal(recommendNext(games,'hachuping-jump','similar').id,'hachuping-whack-a-mole');
  assert.equal(recommendNext(games,'hachuping-jump','different').id,'fantasy-tactics');
  assert.deepEqual(games.map(g=>g.id),before);
  assert.equal(recommendNext([games[0]],games[0].id,'similar'),undefined);
});
test('score feedback distinguishes first, improved, tied and missed records using the pre-round best',()=>{
  assert.match(scoreMessage(30,0),/첫 기록/);
  assert.match(scoreMessage(150,120),/새 최고 기록.*30점/);
  assert.match(scoreMessage(120,120),/최고 기록과 같아요/);
  assert.match(scoreMessage(100,120),/20점 남았어요/);
  assert.match(scoreMessage(20,30,'개'),/10개/);
  assert.equal(scoreMessage(NaN,10),'');
  assert.equal(scoreMessage(10,Infinity),'');
});
test('resume detection rejects empty, corrupt and blocked storage',async()=>{
  const values=new Map();globalThis.localStorage={getItem:key=>values.get(key)??null};
  for(const id of ['ghost-movers','ten-seconds','fantasy-tactics','three-kingdoms','three-kingdoms-card','hachuping-jump']) assert.equal(await savedProgressLabel(id),null);
  for(const key of ['gh-ghost-movers-v1','ten-seconds-progress-v1','gh-arcade:fantasy-tactics:v1','arcade:three-kingdoms:save','three-kingdoms-local-v2'])values.set(key,'broken');
  for(const id of ['ghost-movers','ten-seconds','fantasy-tactics','three-kingdoms','three-kingdoms-card'])assert.equal(await savedProgressLabel(id),null);
  globalThis.localStorage={getItem(){throw Error('blocked');}};
  assert.equal(await savedProgressLabel('ghost-movers'),null);
});
test('resume labels reflect validated puzzle progress and the saved battle chapter',async()=>{
  const values=new Map([
    ['gh-ghost-movers-v1',JSON.stringify({unlocked:1,best:{0:{stars:3,steps:8}}})],
    ['ten-seconds-progress-v1',JSON.stringify({unlocked:1,best:{0:{stars:3,loops:1,deaths:0}}})],
    ['gh-arcade:fantasy-tactics:v1',serialize(new Battle())],
  ]);globalThis.localStorage={getItem:key=>values.get(key)??null};
  assert.match(await savedProgressLabel('ghost-movers'),/의뢰 2/);
  assert.match(await savedProgressLabel('ten-seconds'),/방 2/);
  assert.match(await savedProgressLabel('fantasy-tactics'),/제1장/);
});
