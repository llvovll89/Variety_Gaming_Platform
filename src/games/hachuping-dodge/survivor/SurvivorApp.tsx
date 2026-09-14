import { useEffect, useRef, useState } from 'react';
import type { GameProps } from '../../../platform/types';
import { chooseUpgrade, createWorld, DIFFICULTIES, HEIGHT, nextStage, spawnEnemy, STAGES, stepWorld, UPGRADES, WIDTH, type Difficulty, type World } from './world';
import { drawUnit, renderWorld, viewFor } from './render';
import './survivor.css';

function Portrait({ hero = false }: {hero?:boolean}) {
  const ref=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{ const c=ref.current?.getContext('2d'); if(!c)return; c.clearRect(0,0,360,300); drawUnit(c,hero?'hero':'boss',180,190,3.4,0,-.3,2); },[hero]);
  return <canvas ref={ref} width={360} height={300} className="survivor-portrait" aria-label={hero?'룬 소총을 든 레인저':'왕관과 검을 든 군단 보스'} role="img"/>;
}
const clock=(time:number)=>`${Math.floor(time/60).toString().padStart(2,'0')}:${Math.floor(time%60).toString().padStart(2,'0')}`;
const readBest=(difficulty:Difficulty)=>{try{return Number(localStorage.getItem(`rune-ranger-best-${difficulty}`))||0;}catch{return 0;}};
export default function SurvivorApp({onExit}:GameProps) {
  const world=useRef<World>(createWorld('menu','hard'));
  const canvas=useRef<HTMLCanvasElement>(null);
  const keys=useRef(new Set<string>());
  const pointer=useRef<{x:number;y:number}|null>(null);
  const [ui,setUi]=useState(()=>structuredClone(world.current));
  const [best,setBest]=useState(()=>readBest('hard'));
  const bestRef=useRef(best);
  const publish=()=>setUi(structuredClone(world.current));
  const resetInput=()=>{keys.current.clear();pointer.current=null;};
  const start=()=>{world.current=createWorld('playing',world.current.difficulty);resetInput();publish();};
  const mainMenu=()=>{world.current=createWorld('menu',world.current.difficulty);resetInput();publish();};
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
      if(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d'].includes(k)){event.preventDefault();keys.current.add(k);}
      if((k==='escape'||k==='p')&&!event.repeat)pause();
      if(world.current.status==='upgrade'&&['1','2','3'].includes(k)&&!event.repeat){const key=world.current.choices[Number(k)-1];if(key){chooseUpgrade(world.current,key);resetInput();publish();}}
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
    if(import.meta.env.DEV)Object.assign(window,{__ranger:{getWorld:()=>world.current,step:stepWorld,spawn:spawnEnemy,choose:chooseUpgrade,next:nextStage}});
    frame=requestAnimationFrame(loop);
    return()=>{cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',blur);document.removeEventListener('visibilitychange',visibility);if(import.meta.env.DEV)delete (window as Window & {__ranger?:unknown}).__ranger;};
  },[]);
  const stage=STAGES[ui.stage],p=ui.player;
  const boss=ui.enemies.find(e=>e.kind==='boss'||e.kind==='elite');
  const menu=ui.status==='menu';
  const modal=ui.status!=='playing'&&!menu;
  return <div className="survivor" style={{'--ranger-accent':stage.color} as React.CSSProperties}>
    <canvas ref={canvas} className="survivor-field" aria-label="룬 레인저 전장. WASD 또는 방향키로 이동하고 자동으로 사격합니다."
      onPointerDown={e=>{if(world.current.status!=='playing')return;e.currentTarget.setPointerCapture(e.pointerId);const r=e.currentTarget.getBoundingClientRect();pointer.current={x:e.clientX-r.left,y:e.clientY-r.top};}}
      onPointerMove={e=>{if(pointer.current){const r=e.currentTarget.getBoundingClientRect();pointer.current={x:e.clientX-r.left,y:e.clientY-r.top};}}}
      onPointerUp={()=>{pointer.current=null;}} onPointerCancel={()=>{pointer.current=null;}} onLostPointerCapture={()=>{pointer.current=null;}}/>
    {menu?<div className="survivor-menu">
      <nav className="survivor-nav"><button onClick={onExit}>← 게임 허브</button><span>액션 서바이벌 RPG</span></nav>
      <fieldset className="survivor-difficulty"><legend>원정 난이도</legend><div>{(Object.keys(DIFFICULTIES) as Difficulty[]).map(key=><button key={key} aria-pressed={ui.difficulty===key} onClick={()=>selectDifficulty(key)}>{DIFFICULTIES[key].name}</button>)}</div><p>{DIFFICULTIES[ui.difficulty].description} · 적 체력 ×{DIFFICULTIES[ui.difficulty].hp} · 출현 빈도 ×{(1/DIFFICULTIES[ui.difficulty].spawn).toFixed(1)}</p></fieldset>
      <main className="survivor-intro">
        <div className="survivor-intro-copy"><span className="survivor-kicker">RUNE RANGER</span><h1>룬 레인저<span>작은 영웅,<br/>거대한 전투.</span></h1><p>소총을 들고 몰려오는 군단에 맞서세요.<br/>쓰러뜨리고, 성장하고, 마지막 왕좌까지.</p><button className="survivor-primary survivor-start" onClick={start}>원정 시작 <span>→</span></button><div className="survivor-controls"><span><kbd>W A S D</kbd> 이동</span><span>자동 조준 · 자동 사격</span><span>모바일은 화면을 누른 채 이동</span></div></div>
        <div className="survivor-showcase"><div className="survivor-orbit"/><Portrait hero/><div className="survivor-character-caption"><span>THE RANGER</span><strong>룬 소총의 수호자</strong><p>가장 가까운 적을 자동으로 공격합니다.</p></div></div>
      </main>
      <div className="survivor-route">{STAGES.map((s,i)=><div key={s.name}><span>0{i+1}</span><div><strong>{s.name}</strong><small>{i===0?'미니언 군단':i===1?'강화된 적과 중간보스':'최종 보스와 결전'}</small></div></div>)}</div>
      <footer className="survivor-menu-footer"><span>처치 → 경험치 수집 → 능력 선택 → 보스 격파</span><span>{DIFFICULTIES[ui.difficulty].name} 최고 기록 {best} 처치</span></footer>
    </div>:<>
      <header className="survivor-hud"><div className="survivor-stage"><span>STAGE 0{ui.stage+1} / 03 · {DIFFICULTIES[ui.difficulty].name}</span><strong>{stage.name}</strong></div><div className="survivor-tally"><span>{clock(ui.time)}</span><strong>{ui.kills} <small>처치</small></strong></div><button onClick={pause} disabled={!['playing','paused'].includes(ui.status)} aria-label={ui.status==='paused'?'계속하기':'일시정지'}>{ui.status==='paused'?'▶':'Ⅱ'}</button></header>
      <div className="survivor-progress"><div className="survivor-level">LV <strong>{ui.level}</strong></div><div className="survivor-vitals"><div className="survivor-bar-label"><span>HP {Math.ceil(p.hp)} / {p.maxHp}</span><span>EXP {Math.floor(ui.xp)} / {ui.xpNext}</span></div><div className="survivor-health"><i style={{width:`${p.hp/p.maxHp*100}%`}}/></div><div className="survivor-exp"><i style={{width:`${Math.min(100,ui.xp/ui.xpNext*100)}%`}}/></div></div>
      </div>
      {boss?<div className="survivor-boss"><span>{boss.kind==='boss'?stage.boss:'중간보스 · 철갑 대장'} <small>{Math.ceil(boss.hp)} / {boss.maxHp}</small></span><div><i style={{width:`${Math.max(0,boss.hp/boss.maxHp*100)}%`}}/></div></div>:<div className="survivor-objective">{!ui.eliteSpawned?`중간보스 출현까지 ${Math.max(0,Math.ceil(25-ui.stageTime))}초`:ui.eliteKilled?`보스 출현까지 ${Math.max(0,Math.ceil(60-ui.stageTime))}초`:'철갑 대장을 처치하세요'}</div>}
      <div className="survivor-bottom"><span>룬 소총 <b>자동 사격</b></span><div><span>공격력 <b>{Math.round(p.damage)}</b></span><span>초당 <b>{(1/Math.max(.07,p.interval)).toFixed(1)}발</b></span><span>동시 탄환 <b>{p.shots}</b></span></div><small>WASD / 방향키 · 터치 이동 · P 일시정지</small></div>
    </>}
    {modal&&<div className="survivor-overlay"><section className={`survivor-dialog ${ui.status==='upgrade'?'survivor-upgrade-dialog':''}`} role="dialog" aria-modal="true" aria-labelledby="ranger-dialog-title">
      {ui.status==='upgrade'?<><span className="survivor-kicker">LEVEL {ui.level}</span><h2 id="ranger-dialog-title">더 강해질 시간.</h2><p>능력 하나를 선택하세요. 선택하는 동안 전투가 멈춥니다.</p><div className="survivor-upgrades">{ui.choices.map((key,i)=><button autoFocus={i===0} key={key} onClick={()=>{chooseUpgrade(world.current,key);resetInput();publish();}}><span className="survivor-upgrade-symbol">{UPGRADES[key].symbol}</span><small>{ui.upgrades[key]>0?`강화 ${ui.upgrades[key]+1}단계`:'새로운 능력'}</small><strong>{UPGRADES[key].name}</strong><p>{UPGRADES[key].description}</p><span className="survivor-upgrade-select">선택하기 <kbd>{i+1}</kbd></span></button>)}</div><small>모든 레벨업은 체력 10을 회복합니다.</small></>:
      ui.status==='paused'?<><span className="survivor-kicker">TAKE A BREATH</span><h2 id="ranger-dialog-title">잠시 쉬어가기</h2><p>{DIFFICULTIES[ui.difficulty].name} · LV {ui.level} · {ui.kills} 처치 · {clock(ui.time)}</p><button autoFocus className="survivor-primary" onClick={pause}>계속하기</button><button onClick={mainMenu}>원정 종료 · 메뉴로</button></>:
      ui.status==='clear'?<><span className="survivor-kicker">STAGE CLEAR</span><h2 id="ranger-dialog-title">{stage.name} 탈환!</h2><p>능력치는 유지되고 체력이 모두 회복됩니다.<br/>다음 목적지: {STAGES[ui.stage+1].name}</p><button autoFocus className="survivor-primary" onClick={()=>{nextStage(world.current);resetInput();publish();}}>다음 스테이지 →</button></>:
      <><span className="survivor-kicker">{ui.status==='victory'?'EXPEDITION COMPLETE':'EXPEDITION ENDED'}</span><h2 id="ranger-dialog-title">{ui.status==='victory'?'왕좌를 되찾았습니다.':'다음 원정을 기약하며.'}</h2><p>{DIFFICULTIES[ui.difficulty].name} · {ui.status==='victory'?'세 지역의 보스를 모두 쓰러뜨렸습니다.':`${stage.name}에서 원정이 끝났습니다.`}</p><div className="survivor-results"><div><strong>{ui.kills}</strong><span>몬스터 처치</span></div><div><strong>{ui.level}</strong><span>도달 레벨</span></div><div><strong>{clock(ui.time)}</strong><span>생존 시간</span></div></div><button autoFocus className="survivor-primary" onClick={start}>새 원정 시작</button><button onClick={mainMenu}>게임 메뉴</button></>}
    </section></div>}
    <span className="sr-only">전장 크기 {WIDTH} × {HEIGHT}</span>
  </div>;
}
