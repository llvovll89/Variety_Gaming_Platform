import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { createRequire } from 'node:module';
import { runInThisContext } from 'node:vm';

globalThis.Image=class { naturalWidth=0;set src(value){this.url=value;this.onerror?.();} };
const compiled=await build({stdin:{contents:`export {createElement as element} from 'react';
export {renderToStaticMarkup} from 'react-dom/server';
export {TerrainPanel} from './src/games/fantasy-tactics/TerrainPanel';
export {CampScreen} from './src/games/fantasy-tactics/CampScreen';
export {drawBattle,pickTile,project} from './src/games/fantasy-tactics/render';
export {Battle} from './src/games/fantasy-tactics/game';`,resolveDir:process.cwd(),loader:'tsx'},jsx:'automatic',loader:{'.css':'empty'},bundle:true,write:false,format:'cjs',platform:'node',define:{'process.env.NODE_ENV':'"production"'}});
const bundledModule={exports:{}};
runInThisContext(`(function(require,module,exports){${compiled.outputFiles[0].text}\n})`,{filename:'fantasy-tactics-sea-ui.bundle.cjs'})(createRequire(import.meta.url),bundledModule,bundledModule.exports);
const {element,renderToStaticMarkup,TerrainPanel,CampScreen,drawBattle,pickTile,project,Battle}=bundledModule.exports;
const noop=()=>{};

test('sea camp screens show the correct route and departure while rescue quests remain limited to part one',()=>{
  for(let stage=0;stage<5;stage++){
    const b=new Battle(stage);b.units.filter(u=>u.team==='enemy').forEach(u=>u.hp=0);b.checkResult();b.enterCamp();
    const html=renderToStaticMarkup(element(CampScreen,{battle:b,revision:1,locked:false,onGear:noop,onUpdate:noop,onDepart:noop,onSideQuest:noop}));
    assert.ok(html.includes(`제${stage+2}장으로 출발`));assert.equal(html.includes('주민 구출 작전 출발'),stage<2);assert.ok(html.includes('별빛으로 성장하기'));
    b.talkCamp('route');const route=renderToStaticMarkup(element(CampScreen,{battle:b,revision:2,locked:false,onGear:noop,onUpdate:noop,onDepart:noop,onSideQuest:noop}));
    assert.ok(route.includes(stage===2?'루미아 항구':stage===3?'유령선 갑판':stage===4?'낙성섬':'목적지 지도'));
  }
});

test('terrain controls expose keyboard-friendly coordinate targets, explanations and locked states',()=>{
  const b=new Battle(3);while(b.phase==='intro')b.advanceDialogue();b.actor.x=4;b.actor.y=5;
  const props={battle:b,mode:'cut',locked:false,onMode:noop,onTarget:noop,onHover:noop};
  const html=renderToStaticMarkup(element(TerrainPanel,props));assert.ok(html.includes('다리 끊기 대상'));assert.ok(html.includes('6열 6행'));assert.ok(html.includes('남쪽 우회로 유지'));assert.ok(html.includes('아군도 피해'));
  const locked=renderToStaticMarkup(element(TerrainPanel,{...props,locked:true}));assert.match(locked,/inert=""/);assert.match(locked,/disabled=""/);
});

test('all six boards draw with finite coordinates and can pick a visible terrain tile without raster assets',()=>{
  const labels=[];
  const context=new Proxy({}, {get:(target,name)=>target[name]??((...args)=>{for(const a of args)if(typeof a==='number')assert.ok(Number.isFinite(a),`${String(name)}: ${a}`);if(name==='fillText')labels.push(args[0]);}),set:(target,name,value)=>{target[name]=value;return true;}});
  for(let stage=0;stage<6;stage++){
    const b=new Battle(stage);while(b.phase==='intro')b.advanceDialogue();
    if(stage===3){b.actor.x=6;b.actor.y=4;b.act({x:7,y:4},'ignite');}
    drawBattle(context,b,'move',null,true);
    const tile=b.tile({x:3,y:5});assert.equal(pickTile(b,project(tile,tile.height))?.x,3);
  }
  assert.ok(labels.includes('낡은 다리'));assert.ok(labels.includes('불 2회'));assert.ok(labels.includes('!'));
});
