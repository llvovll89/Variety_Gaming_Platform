import { useEffect, useRef, useState } from 'react';
import type { GameProps } from '../../../platform/types';
import { choosePromotion, weaponStats, chooseUpgrade, createWorld, DIFFICULTIES, HEIGHT, nextStage, spawnEnemy, STAGES, stepWorld, UPGRADES, WIDTH, type Difficulty, type World } from './world';
import { renderWorld, viewFor } from './render';
import './survivor.css';
import { DEFAULT_LOADOUT, HEROES, TINTS, WEAPONS, type Loadout } from './world';

import Preparation, { Portrait } from './Preparation';
import { ADVANCE_LEVELS, MAX_LEVEL, PATHS, promotionOptions, promotionTrait, skillDescription } from './classes';

function readLoadout(): Loadout {
  try { const v=JSON.parse(localStorage.getItem('rune-ranger-loadout')||'null');
    if(v && Object.hasOwn(HEROES,v.hero) && Object.hasOwn(WEAPONS,v.weapon) && Object.hasOwn(TINTS,v.tint)) return {hero:v.hero,weapon:v.weapon,tint:v.tint};
  } catch { /* Use defaults if storage is unavailable. */ }
  return {...DEFAULT_LOADOUT};
}
const clock=(time:number)=>`${Math.floor(time/60).toString().padStart(2,'0')}:${Math.floor(time%60).toString().padStart(2,'0')}`;
const readBest=(difficulty:Difficulty)=>{try{return Number(localStorage.getItem(`rune-ranger-best-${difficulty}`))||0;}catch{return 0;}};
export default function SurvivorApp({onExit}:GameProps) {
  const [initialWorld]=useState(()=>createWorld('menu','hard',readLoadout()));
  const world=useRef<World>(initialWorld);
  const canvas=useRef<HTMLCanvasElement>(null);
  const keys=useRef(new Set<string>());
  const pointer=useRef<{x:number;y:number}|null>(null);
  const [ui,setUi]=useState(()=>structuredClone(world.current));
  const [best,setBest]=useState(()=>readBest('hard'));
  const bestRef=useRef(best);
  const publish=()=>setUi(structuredClone(world.current));
  const resetInput=()=>{keys.current.clear();pointer.current=null;};
  const start=()=>{world.current=createWorld('playing',world.current.difficulty,world.current.loadout);resetInput();publish();};
  const mainMenu=()=>{world.current=createWorld('menu',world.current.difficulty,world.current.loadout);resetInput();publish();};
  const selectLoadout=(change:Partial<Loadout>)=>{world.current.loadout={...world.current.loadout,...change};try{localStorage.setItem('rune-ranger-loadout',JSON.stringify(world.current.loadout));}catch{/* Storage can be disabled. */}publish();};
  const selectDifficulty=(difficulty:Difficulty)=>{world.current.difficulty=difficulty;bestRef.current=readBest(difficulty);setBest(bestRef.current);publish();};
  const pause=()=>{ const w=world.current; if(w.status==='playing')w.status='paused';else if(w.status==='paused')w.status='playing';resetInput();publish();};
  useEffect(()=>{
    const element=canvas.current; if(!element)return;
    const c=element.getContext('2d');if(!c)return;
    let width=1,height=1,frame=0,last=0,published=0;
    const resize=()=>{const r=element.getBoundingClientRect();width=r.width;height=r.height;const dpr=Math.min(window.devicePixelRatio||1,2);element.width=Math.round(width*dpr);element.height=Math.round(height*dpr);c.setTransform(dpr,0,0,dpr,0,0);};
    const observer=new ResizeObserver(resize);observer.observe(element);resize();
    const blur=()=>{resetInput();if(world.current.status==='playing'){world.current.status='paused';publish();}};
    const visibility=()=>{if(document.hidden)blur();};
    const down=(event:KeyboardEvent)=>{
      const k=event.key.toLowerCase();
      if(k==='tab'&&!['playing','menu'].includes(world.current.status)){
        const buttons=Array.from(element.parentElement?.querySelectorAll<HTMLButtonElement>('[role="dialog"] button:not(:disabled)')??[]);
        if(buttons.length){const index=buttons.indexOf(document.activeElement as HTMLButtonElement);event.preventDefault();buttons[(index+(event.shiftKey?-1:1)+buttons.length)%buttons.length].focus();}
        return;
      }
      if(world.current.status==='playing'&&['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d'].includes(k)){event.preventDefault();keys.current.add(k);}
      if((k==='escape'||k==='p')&&!event.repeat)pause();
      if(world.current.status==='promotion'&&['1','2'].includes(k)&&!event.repeat){const option=promotionOptions(world.current.loadout.hero,world.current.job)[Number(k)-1];if(option){choosePromotion(world.current,option.id);resetInput();publish();}}
      else if(world.current.status==='upgrade'&&['1','2','3'].includes(k)&&!event.repeat){const key=world.current.choices[Number(k)-1];if(key){chooseUpgrade(world.current,key);resetInput();publish();}}
    };
    const up=(event:KeyboardEvent)=>keys.current.delete(event.key.toLowerCase());
    window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',blur);document.addEventListener('visibilitychange',visibility);
    const loop=(now:number)=>{
      const w=world.current,dt=last?Math.min((now-last)/1000,.05):0;last=now;
      let x=Number(keys.current.has('d')||keys.current.has('arrowright'))-Number(keys.current.has('a')||keys.current.has('arrowleft'));
      let y=Number(keys.current.has('s')||keys.current.has('arrowdown'))-Number(keys.current.has('w')||keys.current.has('arrowup'));
      if(pointer.current){const v=viewFor(width,height,w);x=(pointer.current.x-v.x)/v.scale-w.player.x;y=(pointer.current.y-v.y)/v.scale-w.player.y;if(Math.hypot(x,y)<8){x=0;y=0;}}
      const len=Math.hypot(x,y);const previous=w.status;
      stepWorld(w,dt,len?{x:x/len,y:y/len}:{x:0,y:0});
      renderWorld(c,w,width,height);
      if(w.status!==previous){resetInput();if(w.status==='dead'||w.status==='victory'){const record=Math.max(bestRef.current,w.kills);bestRef.current=record;setBest(record);try{localStorage.setItem(`rune-ranger-best-${w.difficulty}`,String(record));}catch{/* Storage can be disabled. */}}}
      if(now-published>100||w.status!==previous){publish();published=now;}
      frame=requestAnimationFrame(loop);
    };
    if(import.meta.env.DEV)Object.assign(window,{__ranger:{getWorld:()=>world.current,step:stepWorld,spawn:spawnEnemy,choose:chooseUpgrade,advance:choosePromotion,next:nextStage}});
    frame=requestAnimationFrame(loop);
    return()=>{cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',blur);document.removeEventListener('visibilitychange',visibility);if(import.meta.env.DEV)delete (window as Window & {__ranger?:unknown}).__ranger;};
  },[]);
  const stage=STAGES[ui.stage],p=ui.player;
  const boss=ui.enemies.find(e=>e.kind==='boss'||e.kind==='elite');
  const menu=ui.status==='menu';
  const job=ui.job, career=job.path?PATHS[job.path]:null, options=promotionOptions(ui.loadout.hero,job);
  const currentJob=job.history.at(-1)?.name??HEROES[ui.loadout.hero];
  const modal=ui.status!=='playing'&&!menu;
  return <div className="survivor" style={{'--ranger-accent':stage.color} as React.CSSProperties}>
    <canvas ref={canvas} className="survivor-field" aria-label="룬 레인저 전장. WASD 또는 방향키로 이동하고 자동으로 사격합니다."
      onPointerDown={e=>{if(world.current.status!=='playing')return;e.currentTarget.setPointerCapture(e.pointerId);const r=e.currentTarget.getBoundingClientRect();pointer.current={x:e.clientX-r.left,y:e.clientY-r.top};}}
      onPointerMove={e=>{if(pointer.current){const r=e.currentTarget.getBoundingClientRect();pointer.current={x:e.clientX-r.left,y:e.clientY-r.top};}}}
      onPointerUp={()=>{pointer.current=null;}} onPointerCancel={()=>{pointer.current=null;}} onLostPointerCapture={()=>{pointer.current=null;}}/>
    {menu?<Preparation loadout={ui.loadout} difficulty={ui.difficulty} best={best} onSelect={selectLoadout} onDifficulty={selectDifficulty} onStart={start} onExit={onExit}/>:<>
      <header className="survivor-hud"><div className="survivor-stage"><span>STAGE 0{ui.stage+1} / {String(STAGES.length).padStart(2,'0')} · {DIFFICULTIES[ui.difficulty].name}</span><strong>{stage.name}</strong></div><div className="survivor-tally"><span>{clock(ui.time)}</span><strong>{ui.kills} <small>처치</small></strong></div><button onClick={pause} disabled={!['playing','paused'].includes(ui.status)} aria-label={ui.status==='paused'?'계속하기':'일시정지'}>{ui.status==='paused'?'▶':'Ⅱ'}</button></header>
      <div className="survivor-progress"><div className="survivor-level">LV <strong>{ui.level}</strong><small> / {MAX_LEVEL}</small></div><div className="survivor-vitals"><div className="survivor-bar-label"><span>HP {Math.ceil(p.hp)} / {p.maxHp}</span><span>{ui.level>=MAX_LEVEL?'EXP MAX':`EXP ${Math.floor(ui.xp)} / ${ui.xpNext}`}</span></div><div className="survivor-health"><i style={{width:`${p.hp/p.maxHp*100}%`}}/></div><div className="survivor-exp"><i style={{width:`${ui.level>=MAX_LEVEL?100:Math.min(100,ui.xp/ui.xpNext*100)}%`}}/></div></div>
      </div>
      {boss?<div className="survivor-boss"><span>{boss.kind==='boss'?stage.boss:'중간보스 · 철갑 대장'} <small>{Math.ceil(boss.hp)} / {boss.maxHp}</small></span><div><i style={{width:`${Math.max(0,boss.hp/boss.maxHp*100)}%`}}/></div></div>:<div className="survivor-objective">{!ui.eliteSpawned?`중간보스 출현까지 ${Math.max(0,Math.ceil(25-ui.stageTime))}초`:ui.eliteKilled?`보스 출현까지 ${Math.max(0,Math.ceil(60-ui.stageTime))}초`:'철갑 대장을 처치하세요'}</div>}
      <div className="survivor-job-hud"><strong>{currentJob}</strong><span>{job.history.length<3?`다음 전직 LV ${ADVANCE_LEVELS[job.history.length]}`:'3차 전직 완료'}</span>{career&&<><b>{career.skill} · {job.cooldown>0?`${job.cooldown.toFixed(1)}초`:'자동 발동 대기'}</b><small>{skillDescription(job.path!,job.history.length,job.power)}</small></>}{job.shield>0&&<span>보호막 {Math.ceil(job.shield)}</span>}</div>
      <div className="survivor-bottom"><span>{WEAPONS[ui.loadout.weapon].name} <b>{currentJob} · 자동 공격</b></span><div><span>공격력 <b>{Math.round(p.damage*weaponStats(ui).damage)}</b></span><span>초당 <b>{(1/Math.max(.07,p.interval*weaponStats(ui).interval)).toFixed(1)}회</b></span><span>분열 룬 <b>{p.shots}</b></span></div><small>WASD / 방향키 · 터치 이동 · P 일시정지</small></div>
    </>}
    {modal&&<div className="survivor-overlay"><section className={`survivor-dialog ${ui.status==='upgrade'||ui.status==='promotion'?'survivor-upgrade-dialog':''}`} role="dialog" aria-modal="true" aria-labelledby="ranger-dialog-title">
      {ui.status==='promotion'?<><span className="survivor-kicker">LV {ui.level} · CLASS ADVANCEMENT</span><h2 id="ranger-dialog-title">{job.history.length+1}차 전직 · 새로운 힘</h2><p>{job.history.length===0?'캐릭터의 직업 계열을 선택하세요. 이후 전직은 선택한 계열을 이어갑니다.':'강습은 직업 스킬 위력, 수호는 체력과 방어를 강화합니다.'}<br/>선택 중에는 전투가 멈추며, 기존 강화는 유지됩니다.</p><div className="survivor-upgrades survivor-career-options">{options.map((option,i)=><button autoFocus={i===0} key={option.id} onClick={()=>{choosePromotion(world.current,option.id);resetInput();publish();}}><span className="survivor-upgrade-symbol">{option.tier}차</span><Portrait loadout={ui.loadout} appearance={option}/><strong>{option.name}</strong><p><b>{PATHS[option.path].skill} {option.tier}단계</b><br/>{PATHS[option.path].description}<br/>{skillDescription(option.path,option.tier,job.power+(option.tier>1&&option.focus==='power'?.35:0))}</p><small>{promotionTrait(option)}</small><span className="survivor-upgrade-select">전직하기 <kbd>{i+1}</kbd></span></button>)}</div><small>전직 보너스와 별개로 이번 레벨의 일반 강화도 선택합니다.</small></>:
      ui.status==='upgrade'?<><span className="survivor-kicker">LEVEL {ui.level}</span><h2 id="ranger-dialog-title">더 강해질 시간.</h2><p>능력 하나를 선택하세요. 선택하는 동안 전투가 멈춥니다.</p><div className="survivor-upgrades">{ui.choices.map((key,i)=><button autoFocus={i===0} key={key} onClick={()=>{chooseUpgrade(world.current,key);resetInput();publish();}}><span className="survivor-upgrade-symbol">{UPGRADES[key].symbol}</span><small>{ui.upgrades[key]>0?`강화 ${ui.upgrades[key]+1}단계`:'새로운 능력'}</small><strong>{UPGRADES[key].name}</strong><p>{UPGRADES[key].description}</p><span className="survivor-upgrade-select">선택하기 <kbd>{i+1}</kbd></span></button>)}</div><small>모든 레벨업은 체력 10을 회복합니다.</small></>:
      ui.status==='paused'?<><span className="survivor-kicker">TAKE A BREATH</span><h2 id="ranger-dialog-title">잠시 쉬어가기</h2><p>{DIFFICULTIES[ui.difficulty].name} · LV {ui.level} · {ui.kills} 처치 · {clock(ui.time)}</p><button autoFocus className="survivor-primary" onClick={pause}>계속하기</button><button onClick={mainMenu}>원정 종료 · 메뉴로</button></>:
      ui.status==='clear'?<><span className="survivor-kicker">STAGE CLEAR</span><h2 id="ranger-dialog-title">{stage.name} 탈환!</h2><p>능력치는 유지되고 체력이 모두 회복됩니다.<br/>다음 목적지: {STAGES[ui.stage+1].name}</p><button autoFocus className="survivor-primary" onClick={()=>{nextStage(world.current);resetInput();publish();}}>다음 스테이지 →</button></>:
      <><span className="survivor-kicker">{ui.status==='victory'?'EXPEDITION COMPLETE':'EXPEDITION ENDED'}</span><h2 id="ranger-dialog-title">{ui.status==='victory'?'왕좌를 되찾았습니다.':'다음 원정을 기약하며.'}</h2><p>{DIFFICULTIES[ui.difficulty].name} · {ui.status==='victory'?`${STAGES.length}개 지역의 보스를 모두 쓰러뜨렸습니다.`:`${stage.name}에서 원정이 끝났습니다.`}</p><div className="survivor-results"><div><strong>{ui.kills}</strong><span>몬스터 처치</span></div><div><strong>{ui.level}</strong><span>도달 레벨</span></div><div><strong>{clock(ui.time)}</strong><span>생존 시간</span></div></div><button autoFocus className="survivor-primary" onClick={start}>새 원정 시작</button><button onClick={mainMenu}>게임 메뉴</button></>}
    </section></div>}
    <span className="sr-only">전장 크기 {WIDTH} × {HEIGHT}</span>
  </div>;
}
