import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {runInThisContext} from 'node:vm';
const compiled=await build({stdin:{contents:`export {createElement} from 'react';export {renderToStaticMarkup} from 'react-dom/server';export {default as App} from './src/games/ten-seconds/TenSecondsApp';export {buildRoom,updateRoom,drawFallback} from './src/games/ten-seconds/scene';export {HowToPlay,TutorialGuide,tutorialStep} from './src/games/ten-seconds/Guide';export {TimeRun,LEVELS} from './src/games/ten-seconds/engine';`,loader:'tsx',resolveDir:process.cwd()},bundle:true,write:false,platform:'node',format:'cjs',jsx:'automatic',loader:{'.css':'empty'},define:{'process.env.NODE_ENV':'"production"'}});
const mod={exports:{}};runInThisContext(`(function(require,module,exports){${compiled.outputFiles[0].text}\n})`,{filename:'ten-seconds-ui.bundle.cjs'})(createRequire(import.meta.url),mod,mod.exports);
const {createElement,renderToStaticMarkup,App,buildRoom,updateRoom,drawFallback,TimeRun,LEVELS,HowToPlay,TutorialGuide,tutorialStep}=mod.exports;
test('lobby renders Korean instructions, playable entry points and accessible sound/map controls without browser APIs',()=>{
 const html=renderToStaticMarkup(createElement(App,{onExit:()=>{},profile:{}}));for(const text of ['10초 전의 나와','첫 번째 시간 시작','방 선택하기','연구소 지도','효과음 켜기','WASD / 방향키','최대 4명의 잔상','루프 · 시간 탐험가'])assert.ok(html.includes(text),text);assert.equal((html.match(/<h1/g)||[]).length,1);
});
test('all room models, animated actors and fallback graphics have finite coordinates',()=>{
 const context=new Proxy({}, {get:(target,name)=>target[name]??((...args)=>{for(const a of args)if(typeof a==='number')assert.ok(Number.isFinite(a),String(name));}),set:(target,name,value)=>{target[name]=value;return true;}});
 for(let i=0;i<LEVELS.length;i++){
  const run=new TimeRun(i),room=buildRoom(i);run.start();run.player={...run.level.plates[0],direction:0};run.advance(.1);run.rewind();updateRoom(room,run,12,true);assert.ok(room.ghosts[0].visible);assert.ok(!room.ghosts[1].visible);assert.equal(room.gates.length,run.level.gates.length);room.scene.traverse(o=>{assert.ok([o.position.x,o.position.y,o.position.z,o.rotation.x,o.rotation.y,o.rotation.z].every(Number.isFinite));});drawFallback(context,run,900,600);drawFallback(context,run,360,640);
 }
});

test('help explains the objective, replay and touch input; tutorial follows real player and ghost state',()=>{
 const html=renderToStaticMarkup(createElement(HowToPlay,{onPractice:()=>{},onClose:()=>{}}));for(const text of ['빛나는 출구로 탈출','A 발판까지 이동','지금 되감기','마지막 칸에 머물러요','시간 제한 없는 따라하기'])assert.ok(html.includes(text),text);
 const run=new TimeRun();run.practice=true;assert.equal(tutorialStep(run),0);Object.assign(run.player,run.level.plates[0]);assert.equal(tutorialStep(run),1);run.start();run.rewind();assert.equal(tutorialStep(run),2);const guide=renderToStaticMarkup(createElement(TutorialGuide,{run}));assert.ok(guide.includes('따라하기 3 / 3'));assert.ok(guide.includes('유령이 A를 밟으면'));
});
