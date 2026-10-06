import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import Module from 'node:module';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const compiled=await build({stdin:{contents:`
  export {createElement} from 'react';
  export {renderToStaticMarkup} from 'react-dom/server';
  export {createGameState} from './src/games/three-kingdoms/game/state';
  export {createOfficers} from './src/games/three-kingdoms/game/officers';
  export {dispatch} from './src/games/three-kingdoms/game/commands';
  export {GameEngine} from './src/games/three-kingdoms/game/engine';
  export * from './src/games/three-kingdoms/game/officerPortraits';
  export {OfficerEditor} from './src/games/three-kingdoms/components/OfficerEditor';
  export {OfficerDetails} from './src/games/three-kingdoms/components/OfficerDetails';
  export {StartMenu} from './src/games/three-kingdoms/components/StartMenu';
`,resolveDir:process.cwd()},bundle:true,write:false,format:'cjs',platform:'node',jsx:'automatic',define:{'import.meta.env.DEV':'false'}});
const bundled=new Module(fileURLToPath(import.meta.url));
bundled.filename=fileURLToPath(import.meta.url);
bundled.paths=Module._nodeModulePaths(process.cwd());
bundled._compile(compiled.outputFiles[0].text,bundled.filename);
const {createElement,renderToStaticMarkup,createGameState,createOfficers,dispatch,GameEngine,officerPortraitSource,officerPortraitStyle,OfficerEditor,OfficerDetails,StartMenu}=bundled.exports;

test('all 120 historical officers have distinct illustrated portraits backed by real assets',()=>{
  const portraits=Object.values(createOfficers()).map(o=>officerPortraitSource(o.id));
  assert.equal(portraits.length,120);
  assert.equal(new Set(portraits.map(p=>JSON.stringify(p))).size,120);
  assert.equal(portraits.filter(p=>p.kind==='shared').length,56);
  const images=new Set();
  for(const officer of Object.values(createOfficers())) {
    const style=officerPortraitStyle(officer.id);
    const asset=style.backgroundImage.match(/url\(['"]?([^'"\)]+)/)[1];
    assert.ok(existsSync(`public${asset}`),`${officer.name} portrait asset must exist`);
    images.add(asset);
    const coordinates=style.backgroundPosition.split(' ').map(parseFloat);
    assert.ok(coordinates.every(n=>Number.isFinite(n)&&n>=0&&n<=100));
  }
  for(const asset of [...images].filter(p=>p.includes('portraits-pk-'))) {
    const png=readFileSync(`public${asset}`);
    assert.equal(png.readUInt32BE(16),png.readUInt32BE(20),'square portrait atlas');
    assert.ok(png.readUInt32BE(16)>=1024);
  }
});

test('renamed and custom officers keep a stable face across thumbnail and detail sizes',()=>{
  const state=createGameState('caocao'),officer=state.officers.guanyu;
  const style=officerPortraitStyle(officer.id);
  officer.name='새 이름';officer.faction='caocao';officer.war=1;
  assert.deepEqual(officerPortraitStyle(officer.id),style);
  assert.deepEqual(officerPortraitSource('custom-test'),officerPortraitSource('custom-test'));
  const custom=officerPortraitSource('custom-test');
  assert.ok(custom.atlas>=1&&custom.atlas<=4&&custom.tile>=0&&custom.tile<16);
});

test('officer editor and details render portrait art without 3D preview or appearance controls',()=>{
  const state=createGameState('caocao');
  const html=renderToStaticMarkup(createElement(OfficerEditor,{engine:{getState:()=>state},onClose:()=>{}}));
  assert.match(html,/tk-portrait-art/);
  assert.match(html,/조조 초상/);
  assert.match(html,/변경 사항 저장/);
  assert.doesNotMatch(html,/<canvas|모델 외형|수염 길이|체격|3D 외형|type="color"/);
  const detail=renderToStaticMarkup(createElement(OfficerDetails,{officer:state.officers.guanyu,state,onClose:()=>{}}));
  assert.match(detail,/관우 초상/);assert.match(detail,/사용 가능한 전법/);
  assert.doesNotMatch(detail,/<canvas/);
  assert.match(detail,/heroes\.png/);
});

test('main menu shows actual faction resources and requires an explicit campaign start',()=>{
  const html=renderToStaticMarkup(createElement(StartMenu,{onStart:()=>{},onResume:()=>{},onExit:()=>{}}));
  assert.match(html,/20,000/);assert.match(html,/1,900/);assert.match(html,/12,500/);
  assert.match(html,/조조로 천하에 나서다/);
  assert.match(html,/aria-pressed="true"/);
  assert.match(html,/입문 추천/);
});

test('city navigation never moves an army, queues construction, or resolves an attack',()=>{
  const state=createGameState('caocao');
  const sent=dispatch(state,{cityId:'chenliu',officerIds:['caocao'],type:'spear',troops:1000});
  assert.equal(sent.ok,true);
  const unit=Object.values(state.units)[0];
  const engine=Object.create(GameEngine.prototype);
  Object.assign(engine,{state,selection:{kind:'unit',unitId:unit.id},reach:[],targets:[],attackRequest:state.cities.puyang.coord,placement:{cityId:'chenliu'},pendingTactic:'fire'});
  engine.focus=()=>{};engine.publish=()=>{};
  engine.actWithSelectedUnit=()=>{throw new Error('navigation must never execute a map command');};
  const before=JSON.stringify(state);
  engine.inspect(state.cities.xiapi.coord);
  assert.deepEqual(engine.selection,{kind:'city',cityId:'xiapi'});
  assert.equal(engine.pendingTactic,null);assert.equal(engine.placement,null);assert.equal(engine.attackRequest,null);
  engine.inspect(unit.coord);
  assert.deepEqual(engine.selection,{kind:'unit',unitId:unit.id});
  engine.inspect(state.cities.chenliu.coord,'city');
  assert.deepEqual(engine.selection,{kind:'city',cityId:'chenliu'},'a city shortcut still manages the city when an army stands on it');
  assert.equal(JSON.stringify(state),before);
});
