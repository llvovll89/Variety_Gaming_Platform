import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

const compiled = await build({ stdin: { contents: "export * from './src/platform/playExperience'; export * from './src/platform/savedProgress'; export { Battle, serialize } from './src/games/fantasy-tactics/game'; export { createRun, act, availableNodes } from './src/games/night-train/engine'; export { createDemo } from './src/games/three-kingdoms-card/lib/demoGame'; export * as nightTrainResume from './src/games/night-train/resume'; export * as ghostResume from './src/games/ghost-movers/resume'; export * as tenResume from './src/games/ten-seconds/resume'; export * as tacticsResume from './src/games/fantasy-tactics/resume'; export * as threeKingdomsResume from './src/games/three-kingdoms/resume'; export * as cardResume from './src/games/three-kingdoms-card/resume';", resolveDir: process.cwd() }, bundle: true, write: false, format: 'esm', platform: 'node' });
const bundle = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const { gamesForTime, recommendNext, scoreMessage, savedProgressLabel, Battle, serialize, createRun, act, availableNodes, createDemo } = bundle;

/** 레지스트리가 게임마다 들고 있는 이어하기 서술. 여기서는 게임 폴더의 resume 모듈로 똑같이 만든다. */
const RESUME = {
  'night-train': bundle.nightTrainResume.RUN_KEY,
  'ghost-movers': bundle.ghostResume.SAVE_KEY,
  'ten-seconds': bundle.tenResume.SAVE_KEY,
  'fantasy-tactics': bundle.tacticsResume.SAVE_KEY,
  'three-kingdoms': bundle.threeKingdomsResume.SAVE_KEY,
  'three-kingdoms-card': bundle.cardResume.SAVE_KEY,
};
const LABELS = {
  'night-train': bundle.nightTrainResume.resumeLabel,
  'ghost-movers': bundle.ghostResume.resumeLabel,
  'ten-seconds': bundle.tenResume.resumeLabel,
  'fantasy-tactics': bundle.tacticsResume.resumeLabel,
  'three-kingdoms': bundle.threeKingdomsResume.resumeLabel,
  'three-kingdoms-card': bundle.cardResume.resumeLabel,
};
/** 허브가 게임 하나에 대해 이어하기 라벨을 물을 때와 같은 호출. 모르는 게임은 이어하기가 없다. */
const resumeLabelOf = id => savedProgressLabel(RESUME[id] ? { resume: { key: RESUME[id], label: LABELS[id] } } : {});
const play = minutes => ({ duration: `${minutes}분`, minutes, controls: '터치', experience: '', save: '' });
const game = (id, genres, minutes, tags=[], extra={}) => ({id,genres,tags,play:play(minutes),...extra});
const games = [game('hachuping-balloon',['키즈','캐주얼'],1),game('hachuping-whack-a-mole',['액션','캐주얼'],.5),game('hachuping-jump',['액션','캐주얼'],3),game('fantasy-tactics',['전략'],15),game('three-kingdoms',['전략'],20),game('hachuping-color-match',['캐주얼'],1,[],{releaseStatus:'coming-soon'})];

test('time choices partition available games without recommending coming-soon entries',()=>{
  assert.deepEqual(gamesForTime(games,'short').map(g=>g.id),['hachuping-balloon','hachuping-whack-a-mole']);
  assert.deepEqual(gamesForTime(games,'medium').map(g=>g.id),['hachuping-jump']);
  assert.deepEqual(gamesForTime(games,'long').map(g=>g.id),['fantasy-tactics','three-kingdoms']);
  // 예전에는 플랫폼의 PLAY_INFO 맵에서 빠진 게임도 여기서 조용히 사라졌다. 이제 play는
  // GameDefinition의 필수 필드라 그런 게임은 아예 만들 수 없고, 남는 제외 사유는 둘뿐이다.
  assert.deepEqual(gamesForTime([game('hachuping-balloon',[],1,[],{disabled:true}),game('soon',[],1,[],{releaseStatus:'coming-soon'})],'short'),[]);
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
  for(const id of ['ghost-movers','ten-seconds','fantasy-tactics','three-kingdoms','three-kingdoms-card','night-train','hachuping-jump']) assert.equal(await savedProgressLabel(id),null);
  for(const key of ['gh-ghost-movers-v1','ten-seconds-progress-v1','gh-arcade:fantasy-tactics:v1','arcade:three-kingdoms:save','three-kingdoms-local-v2','arcade:night-train:run'])values.set(key,'broken');
  for(const id of ['ghost-movers','ten-seconds','fantasy-tactics','three-kingdoms','three-kingdoms-card','night-train'])assert.equal(await savedProgressLabel(id),null);
  globalThis.localStorage={getItem(){throw Error('blocked');}};
  assert.equal(await resumeLabelOf('ghost-movers'),null);
});
test('resume labels reflect validated puzzle progress and the saved battle chapter',async()=>{
  const values=new Map([
    ['gh-ghost-movers-v1',JSON.stringify({unlocked:1,best:{0:{stars:3,steps:8}}})],
    ['ten-seconds-progress-v1',JSON.stringify({unlocked:1,best:{0:{stars:3,loops:1,deaths:0}}})],
    ['gh-arcade:fantasy-tactics:v1',serialize(new Battle())],
  ]);globalThis.localStorage={getItem:key=>values.get(key)??null};
  assert.match(await resumeLabelOf('ghost-movers'),/의뢰 2/);
  assert.match(await resumeLabelOf('ten-seconds'),/방 2/);
  assert.match(await resumeLabelOf('fantasy-tactics'),/제1장/);
});
test('night train offers to resume a validated run but not a finished one',async()=>{
  const run=createRun(3),started=act(run,{t:'travel',nodeId:availableNodes(run.map,run.path)[0].id});
  const values=new Map([['arcade:night-train:run',JSON.stringify(started)]]);globalThis.localStorage={getItem:key=>values.get(key)??null};
  assert.equal(await resumeLabelOf('night-train'),'1번째 역 · 체력 70/70');
  values.set('arcade:night-train:run',JSON.stringify({...started,phase:'victory',combat:null}));
  assert.equal(await resumeLabelOf('night-train'),null);
});

test('the card game offers to resume only a land that has a lord', async () => {
  const values = new Map();
  globalThis.localStorage = { getItem: key => values.get(key) ?? null };
  try {
    const now = Date.now();
    values.set('three-kingdoms-local-v2', JSON.stringify({ ...createDemo(now), savedAt: now }));
    assert.equal(await resumeLabelOf('three-kingdoms-card'), null, 'opened but never named a lord');
    values.set('three-kingdoms-local-v2', JSON.stringify({ ...createDemo(now), lordName: '유비', castleName: '신야', savedAt: now }));
    assert.equal(await resumeLabelOf('three-kingdoms-card'), '신야로 돌아가기');
    values.set('three-kingdoms-local-v2', JSON.stringify({ ...createDemo(now), lordName: '조조', castleName: '낙양성', savedAt: now }));
    assert.equal(await resumeLabelOf('three-kingdoms-card'), '낙양성으로 돌아가기');
  } finally { delete globalThis.localStorage; }
});
