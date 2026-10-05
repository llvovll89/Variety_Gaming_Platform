import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowUp, ArrowRight, ArrowDown, ArrowCounterClockwise, Clock, Ghost, Play, Pause, Lock, Star, MapTrifold, SpeakerHigh, SpeakerSlash, ArrowUUpLeft, Sparkle, X } from '@phosphor-icons/react';
import type { GameProps } from '../../platform/types';
import { COLORS, LEVELS, MAX_ECHOES, SAVE_KEY, TimeRun, completeRoom, loadProgress, type Direction, type Point } from './engine';
import { HowToPlay, TutorialGuide } from './Guide';
import { TimeScene } from './scene';
import './time.css';

const directionKeys:Record<string,Direction>={ArrowUp:0,w:0,ArrowRight:1,d:1,ArrowDown:2,s:2,ArrowLeft:3,a:3};
function Stars({count=0}:{count?:number}){return <span className="ts-stars" aria-label={`${count}개 별`}>{[1,2,3].map(i=><Star key={i} weight={i<=count?'fill':'regular'}/>)}</span>;}
function Board({run,held,onRefresh,onNavigate}:{run:TimeRun;held:React.RefObject<Direction|null>;onRefresh:()=>void;onNavigate?:(p:Point)=>void}){
  const [markers,setMarkers]=useState<{id:string;p:Point;x:number;y:number}[]>([]);
  const navigate=useRef(onNavigate);navigate.current=onNavigate;
  const host=useRef<HTMLDivElement>(null),refresh=useRef(onRefresh);refresh.current=onRefresh;
  useEffect(()=>{
    if(!host.current)return;const scene=new TimeScene(host.current,run);let frame=0,previous=performance.now(),lastUi=0,lastEvent=run.event;
    const resizeScene=()=>{scene.resize();setMarkers([...run.level.plates.map(p=>({id:p.id+' 발판',p,...scene.screenPoint(p)})),{id:'출구 ↗',p:run.level.exit,...scene.screenPoint(run.level.exit)}]);};
    const resize=new ResizeObserver(resizeScene);resize.observe(host.current);resizeScene();
    let touch:{id:number;x:number;y:number}|null=null;const target=host.current;
    const down=(e:PointerEvent)=>{touch={id:e.pointerId,x:e.clientX,y:e.clientY};};
    const up=(e:PointerEvent)=>{if(!touch||touch.id!==e.pointerId)return;const origin=touch;touch=null;if(Math.hypot(e.clientX-origin.x,e.clientY-origin.y)>12)return;const p=scene.pick(e.clientX,e.clientY);if(p)navigate.current?.(p);};
    const cancel=()=>{touch=null;};target.addEventListener('pointerdown',down);target.addEventListener('pointerup',up);target.addEventListener('pointercancel',cancel);
    const animate=(now:number)=>{const dt=(now-previous)/1000;previous=now;run.advance(dt,held.current??undefined);const instant=run.event!==lastEvent;lastEvent=run.event;scene.draw(now/1000,instant);if(now-lastUi>80||instant){refresh.current();lastUi=now;}frame=requestAnimationFrame(animate);};frame=requestAnimationFrame(animate);
    return()=>{cancelAnimationFrame(frame);resize.disconnect();target.removeEventListener('pointerdown',down);target.removeEventListener('pointerup',up);target.removeEventListener('pointercancel',cancel);scene.dispose();};
  },[run,held]);
  return <div className="ts-board"><div className="ts-viewport" ref={host} role="img" aria-label={`${run.level.name}의 3D 연구실. 탐험가와 시간 잔상, 발판과 시간의 문.`}/>{onNavigate&&markers.map(m=><button key={m.id} className="ts-world-label" aria-label={`${m.id}으로 이동`} style={{left:m.x,top:m.y}} onClick={()=>navigate.current?.(m.p)}>{m.id}</button>)}</div>;
}

export default function TenSecondsApp({onExit}:GameProps){
  const [run,setRun]=useState<TimeRun|null>(null),[,refresh]=useState(0),[mapOpen,setMapOpen]=useState(false);
  const [progress,setProgress]=useState(()=>{try{return loadProgress(localStorage.getItem(SAVE_KEY));}catch{return loadProgress(null);}});
  const [sound,setSound]=useState(false),[saveError,setSaveError]=useState(false),[helpOpen,setHelpOpen]=useState(false);
  const resumeAfterHelp=useRef(false),touchMove=useRef<number|null>(null);
  const preview=useMemo(()=>{const p=new TimeRun(0);p.player.direction=2;p.echoes=[Array.from({length:600},()=>({x:3,y:3,direction:2 as Direction}))];return p;},[]),held=useRef<Direction|null>(null),page=useRef<HTMLElement>(null),dialog=useRef<HTMLDivElement>(null),wonRun=useRef<TimeRun|null>(null),audio=useRef<AudioContext|null>(null);
  const update=()=>refresh(n=>n+1);
  const tone=(frequency=520)=>{if(!sound)return;try{const ctx=audio.current??new AudioContext();audio.current=ctx;void ctx.resume();const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='sine';osc.frequency.setValueAtTime(frequency,ctx.currentTime);osc.frequency.exponentialRampToValueAtTime(frequency*.65,ctx.currentTime+.18);gain.gain.setValueAtTime(.07,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.22);osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+.23);}catch{/* Sound is optional. */}};
  const launch=(index:number,immediate=false,practice:boolean=index===0&&!progress.best[0])=>{held.current=null;const next=new TimeRun(index);next.practice=practice;if(immediate)next.start();setRun(next);setMapOpen(false);setHelpOpen(false);page.current?.scrollTo({top:0});};
  const rewind=()=>{if(run?.rewind())tone(660);held.current=null;update();};
  const pause=()=>{touchMove.current=null;held.current=null;if(run)run.route=[];run?.pause();update();};
  const openHelp=()=>{resumeAfterHelp.current=run?.status==='playing';pause();setHelpOpen(true);};
  const closeHelp=()=>{setHelpOpen(false);if(resumeAfterHelp.current)run?.start();update();};
  const modal=helpOpen||mapOpen||!!run&&run.status!=='playing';
  useEffect(()=>{if(modal)requestAnimationFrame(()=>dialog.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus());},[modal,run?.status,mapOpen,helpOpen]);
  useEffect(()=>{
    if(!run||run.status!=='won'||wonRun.current===run)return;wonRun.current=run;
    const next=completeRoom(progress,run);setProgress(next);try{localStorage.setItem(SAVE_KEY,JSON.stringify(next));setSaveError(false);}catch{setSaveError(true);}
  },[run,run?.status,progress]);
  useEffect(()=>()=>{void audio.current?.close();},[]);
  useEffect(()=>{
    const down=(e:KeyboardEvent)=>{
      if(e.ctrlKey||e.metaKey||e.altKey||/INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement).tagName))return;
      const k=e.key.length===1?e.key.toLowerCase():e.key;
      if(k==='Escape'&&!e.repeat){e.preventDefault();if(helpOpen){closeHelp();}else if(mapOpen){setMapOpen(false);}else if(run?.status==='playing')pause();else if(run?.status==='paused'){run.start();update();}return;}
      if(!run||helpOpen||mapOpen||run.status!=='playing')return;
      if(k in directionKeys){e.preventDefault();held.current=directionKeys[k];if(!e.repeat){run.move(held.current);update();}}
      if(k==='r'&&!e.repeat){e.preventDefault();rewind();}
    };
    const up=(e:KeyboardEvent)=>{const k=e.key.length===1?e.key.toLowerCase():e.key;if(directionKeys[k]===held.current)held.current=null;};
    const hidden=()=>{if(document.hidden)pause();};
    window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',pause);document.addEventListener('visibilitychange',hidden);
    return()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',pause);document.removeEventListener('visibilitychange',hidden);held.current=null;};
  },[run,mapOpen,sound,helpOpen]);
  const openMap=()=>{run?.pause();held.current=null;setMapOpen(true);update();};
  const trapFocus=(e:React.KeyboardEvent)=>{if(e.key!=='Tab')return;const buttons=dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href]');if(!buttons?.length)return;const first=buttons[0],last=buttons[buttons.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}};
  const totalStars=Object.values(progress.best).reduce((n,v)=>n+v.stars,0);
  return <main className="ts-app" ref={page}>
    <div className="ts-shell" inert={modal}>
      <header className="ts-header"><button className="ts-back" onClick={onExit}><ArrowLeft size={18}/>게임 허브</button><div className="ts-brand"><span className="ts-brand-mark"><Clock size={25}/></span><span>TEN SECONDS<small>시간의 잔상</small></span></div><div className="ts-header-tools"><button className="ts-help-button" onClick={openHelp} aria-label="게임 방법 보기">?<span>게임 방법</span></button><button className="ts-icon" aria-label={sound?'효과음 끄기':'효과음 켜기'} aria-pressed={sound} onClick={()=>setSound(v=>!v)}>{sound?<SpeakerHigh size={20}/>:<SpeakerSlash size={20}/>}</button><button className="ts-map-button" onClick={openMap}><MapTrifold size={19}/><span>연구소 지도</span></button>{run&&<button className="ts-icon" aria-label="일시 정지" onClick={pause}><Pause size={20}/></button>}</div></header>
      {!run?<>
        <section className="ts-lobby"><div className="ts-lobby-copy"><span className="ts-eyebrow"><i/>TIME-LOOP PUZZLE · 3D</span><h1>10초 전의 나와<br/><em>다음 순간으로.</em></h1><p>혼자서는 열 수 없는 문.<br/>과거의 나를 남기고, 함께 길을 만들어 보세요.</p><div className="ts-lobby-actions"><button className="ts-primary" onClick={()=>launch(progress.unlocked)}><Play weight="fill" size={19}/>{progress.unlocked===0?'첫 번째 시간 시작':'원정 이어하기'}<ArrowRight size={19}/></button><button className="ts-secondary" onClick={openMap}>방 선택하기</button></div><div className="ts-lobby-meta"><span><Ghost size={18}/>최대 4명의 잔상</span><span><Star size={18}/>{totalStars} / 18</span><span>6개의 시간 퍼즐</span></div></div>
        <div className="ts-lobby-scene"><Board run={preview} held={held} onRefresh={()=>{}}/><div className="ts-scene-caption"><span>SUBJECT 01</span><b>루프 · 시간 탐험가</b><small>태엽 배낭에 담긴 10초의 기억</small></div><div className="ts-floating-tag"><span className="ts-status-dot"/>시간 연결 대기 중</div></div></section>
        <button className="ts-lobby-help ts-secondary" onClick={openHelp}>처음이라면? 게임 방법과 따라하기</button><section className="ts-how" aria-label="게임 방법"><article><span>01</span><div><b>길을 기록하고</b><p>발판까지 이동하세요. 당신의 모든 발걸음이 기억됩니다.</p></div><Ghost size={30}/></article><article><span>02</span><div><b>시간을 되감고</b><p>10초가 끝나거나 R을 누르면, 이전의 내가 잔상으로 남아요.</p></div><ArrowCounterClockwise size={30}/></article><article><span>03</span><div><b>함께 탈출하세요</b><p>잔상이 발판을 밟는 동안, 열린 문을 지나 출구로!</p></div><Sparkle size={30}/></article></section>
        <footer className="ts-footer"><span>WASD / 방향키 이동 · R 되감기 · 모바일 터치 지원</span><span>시간은 반복돼도, 당신은 앞으로.</span></footer>
      </>:<>
        <section className="ts-mission-header"><div><span className="ts-eyebrow">ROOM {String(run.levelIndex+1).padStart(2,'0')} / 06</span><h1>{run.level.name}</h1><p>{run.level.subtitle}</p></div><div className="ts-mission-badges"><span><Ghost size={18}/>{run.echoes.length} / {MAX_ECHOES} 잔상</span><Stars count={progress.best[run.levelIndex]?.stars}/></div></section>
        {run.practice&&<TutorialGuide run={run}/>}<div className="ts-play-layout"><section className="ts-stage" aria-label="시간 퍼즐 전장"><div className="ts-stage-top"><span><i className="ts-status-dot"/>LIVE TIMELINE</span><span>{run.practice?'시간 제한 없는 연습':`${run.secondsLeft.toFixed(1)}초 · LOOP ${String(run.loops+1).padStart(2,'0')}`}</span></div><Board run={run} held={held} onRefresh={update} onNavigate={p=>{held.current=null;if(!run.navigateTo(p))run.notice='갈 수 있는 바닥 칸을 눌러 주세요. 닫힌 문은 발판에 유령을 남겨 열어야 해요.';update();}}/><div className="ts-board-legend"><span><i style={{background:'#ede4c6'}}/>지금의 나</span><span><i style={{background:COLORS[0]}}/>시간 잔상</span><span><i style={{background:'#bcdfbe'}}/>출구 ↗</span></div></section>
          <aside className="ts-control-panel"><section className="ts-clock-panel"><span>다음 시간까지</span><div className={`ts-countdown ${!run.practice&&run.secondsLeft<3?'ts-urgent':''}`}><b>{run.practice?'∞':run.secondsLeft.toFixed(1)}</b><small>{run.practice?'연습':'SEC'}</small></div><div className="ts-countdown-track"><i style={{width:`${run.practice?100:run.secondsLeft*10}%`}}/></div><p>{run.practice?'천천히 연습하세요. 직접 되감으면 유령이 생겨요.':'10초가 끝나면 잔상이 하나 생겨요.'}</p></section>
            <section className="ts-objective"><span className="ts-panel-label">이번 방의 연결</span><h2>{run.level.gates.length>1?'문을 차례로 열고 탈출하세요':'발판을 연결하고 탈출하세요'}</h2><div className="ts-plate-list">{run.level.plates.map(p=><div key={p.id} className={run.occupiedPlates.includes(p.id)?'is-active':''}><b style={{color:p.color}}>{p.id}</b><span>{run.occupiedPlates.includes(p.id)?'연결됨':'발판 대기'}</span><i/></div>)}</div>{run.level.crystals.length>0&&<p className="ts-crystal-count"><Sparkle size={16}/>기억 결정 {run.collected.length} / {run.level.crystals.length} · 되감아도 유지</p>}</section>
            <section className="ts-echoes"><span className="ts-panel-label">나의 시간 잔상</span>{[0,1,2,3].map(i=><div key={i} className={i<run.echoes.length?'is-recorded':''}><Ghost size={19} style={{color:i<run.echoes.length?COLORS[i]:'#566773'}}/><b>{String(i+1).padStart(2,'0')}</b><span>{i<run.echoes.length?'이전 경로 재생 중':'아직 남기지 않은 시간'}</span></div>)}</section>
            <button className="ts-primary ts-rewind" disabled={run.status!=='playing'} onClick={rewind}><ArrowCounterClockwise size={21}/>지금 되감기<kbd>R</kbd></button><button className="ts-erase" disabled={!run.echoes.length} onClick={()=>{run.removeLastEcho();held.current=null;update();}}><ArrowUUpLeft size={16}/>마지막 잔상 지우기</button>
          </aside></div>
        <section className="ts-timeline" aria-label="10초 시간 기록"><div className="ts-timeline-heading"><span><Clock size={17}/>10초의 기록</span><p role="status">{run.notice}</p></div><div className="ts-timeline-ruler">{Array.from({length:11},(_,i)=><span key={i}>{i}s</span>)}</div><div className="ts-timeline-lanes">{run.echoes.map((_,i)=><div key={i}><Ghost size={15} style={{color:COLORS[i]}}/><span style={{background:`${COLORS[i]}55`}}><i style={{width:`${run.tick/6}%`,background:COLORS[i]}}/></span></div>)}<div><b>나</b><span><i style={{width:`${run.tick/6}%`,background:'#eac291'}}/></span></div></div></section>
        <section className="ts-bottom"><details><summary>이 방의 힌트 보기</summary><p>{run.level.hint}</p></details><div className="ts-key-guide"><kbd>W A S D</kbd><span>/</span><kbd>↑ ← ↓ →</kbd><span>이동</span><kbd>R</kbd><span>되감기</span><kbd>ESC</kbd><span>일시 정지</span></div><div className="ts-dpad" aria-label="터치 이동">{([0,3,2,1] as Direction[]).map(d=><button key={d} aria-label={['위로 이동','오른쪽으로 이동','아래로 이동','왼쪽으로 이동'][d]} style={{gridArea:['up','right','down','left'][d]}} onPointerDown={e=>{e.preventDefault();if(run.status!=='playing'||held.current!==null)return;e.currentTarget.setPointerCapture(e.pointerId);touchMove.current=e.pointerId;run.route=[];held.current=d;run.move(d);update();}} onPointerUp={e=>{if(touchMove.current===e.pointerId){touchMove.current=null;held.current=null;}}} onPointerCancel={e=>{if(touchMove.current===e.pointerId){touchMove.current=null;held.current=null;}}} onLostPointerCapture={e=>{if(touchMove.current===e.pointerId){touchMove.current=null;held.current=null;}}}>{[<ArrowUp/>,<ArrowRight/>,<ArrowDown/>,<ArrowLeft/>][d]}</button>)}</div></section>
      </>}
    </div>
    {modal&&<div className="ts-modal-backdrop"><div ref={dialog} className={`ts-modal ${mapOpen?'ts-map-modal':''} ${helpOpen?'ts-help-modal':''}`} role="dialog" aria-modal="true" aria-label={helpOpen?'게임 방법':mapOpen?'연구소 방 선택':run?.status==='won'?'시간 퍼즐 완료':run?.status==='ready'?'시간 퍼즐 준비':'일시 정지'} onKeyDown={trapFocus}>
      {helpOpen?<HowToPlay onPractice={()=>launch(0,true,true)} onClose={closeHelp}/>:mapOpen?<><div className="ts-modal-heading"><div><span className="ts-eyebrow">THE TIME LABORATORY</span><h2>여섯 개의 시간</h2></div><button className="ts-icon" aria-label="방 선택 닫기" onClick={()=>setMapOpen(false)}><X size={21}/></button></div><p>닫힌 방은 앞의 퍼즐을 완성하면 열립니다. 기록은 자동으로 저장돼요.</p><div className="ts-room-grid">{LEVELS.map((level,i)=><button key={level.name} className={i>progress.unlocked?'is-locked':''} disabled={i>progress.unlocked} onClick={()=>launch(i)}><span className="ts-room-number">{String(i+1).padStart(2,'0')}{i>progress.unlocked?<Lock size={21}/>:<ArrowRight size={21}/>}</span><b>{level.name}</b><small>{level.subtitle}</small><Stars count={progress.best[i]?.stars}/></button>)}</div></>
      :run?.status==='won'?<><span className="ts-win-mark"><Clock size={45}/></span><span className="ts-eyebrow">TIMELINE CONNECTED</span><h2>{run.levelIndex===5?'다시 흐르는 시간':'우리의 시간이 만났어요'}</h2><Stars count={run.stars}/><p>{run.levelIndex===5?'여섯 개의 시계가 다시 움직입니다. 혼자 남았던 루프는, 모든 순간의 자신과 함께 연구소를 나섰습니다.':'과거의 발걸음이 지금의 당신에게 길을 열어 주었습니다.'}</p><div className="ts-result-stats"><div><b>{run.loops}</b><span>되감기</span></div><div><b>{run.deaths}</b><span>레이저 접촉</span></div><div><b>{(run.totalTicks/60).toFixed(1)}s</b><span>움직인 시간</span></div></div>{saveError&&<p className="ts-save-error">이 브라우저에서 기록을 저장할 수 없어요. 현재 접속 중에는 계속 이어갈 수 있습니다.</p>}<button className="ts-primary" onClick={()=>run.levelIndex<5?launch(run.levelIndex+1):setRun(null)}>{run.levelIndex<5?'다음 시간으로':'연구소 원정 완료'}<ArrowRight size={20}/></button><div className="ts-modal-minor"><button onClick={()=>launch(run.levelIndex,true)}>다시 도전</button><button onClick={openMap}>방 선택하기</button></div></>
      :run?.status==='ready'?<><span className="ts-eyebrow">ROOM {String(run.levelIndex+1).padStart(2,'0')}</span><h2>{run.level.name}</h2><p>{run.practice?'첫 방은 시간 제한 없이 배워요. A 발판에 올라가 되감고, 유령에게 발판을 맡긴 뒤 출구로 가세요.':run.level.story}</p><div className="ts-modal-tip"><Ghost size={22}/><span>{run.level.hint}</span></div><button className="ts-primary" onClick={()=>{run.start();update();}}>이 시간에 들어가기<Play weight="fill" size={19}/></button><button className="ts-erase" onClick={openMap}>다른 방 보기</button></>
      :run&&<><span className="ts-eyebrow">A MOMENT TO BREATHE</span><h2>시간을 잠시 멈췄어요</h2><p>{run.echoes.length>=MAX_ECHOES?run.notice:'잔상과 기록은 그대로입니다. 준비되면 이어가세요.'}</p><button className="ts-primary" onClick={()=>{run.start();update();}}><Play size={20}/>계속하기</button>{run.echoes.length>0&&<button className="ts-secondary" onClick={()=>{run.removeLastEcho();run.start();update();}}>마지막 잔상을 지우고 계속</button>}<div className="ts-modal-minor"><button onClick={()=>launch(run.levelIndex,true)}>방 처음부터</button><button onClick={()=>{setRun(null);setMapOpen(false);}}>시작 화면</button></div></>}
    </div></div>}
  </main>;
}
