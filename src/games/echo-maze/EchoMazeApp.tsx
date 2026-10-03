import { useEffect, useMemo, useRef, useState } from 'react';
import { Anchor, ArrowUUpLeft, Broadcast, Compass, Cube, Pause, Footprints, Diamond } from '@phosphor-icons/react';
import type { GameProps } from '../../platform/types';
import { MazeRun, LEVELS, type Difficulty } from './engine';
import { MazeScene } from './render';
import './maze.css';

export default function EchoMazeApp({ onExit, profile }: GameProps) {
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [run, setRun] = useState<MazeRun | null>(null);
  const [, refresh] = useState(0);
  const [photo, setPhoto] = useState<string | null>(null), [error, setError] = useState(''), [loading, setLoading] = useState(false);

  const page = useRef<HTMLElement>(null);
  const held = useRef<number | null>(null), lastMove = useRef(0), uploadId = useRef(0);
  const swipe = useRef<{id:number;x:number;y:number} | null>(null);
  const source = photo || profile.characterImage;

  useEffect(() => () => { uploadId.current++; }, []);
  useEffect(() => { page.current?.scrollTo(0, 0); }, [run]);
  useEffect(() => {
    if (!run) return;
    let frame = 0, previous = performance.now(), lastUi = 0;
    const loop = (now: number) => {
      run.tick((now - previous) / 1000); previous = now;
      if (held.current !== null && now - lastMove.current > 135) { run.move(held.current); lastMove.current = now; }

      if (now - lastUi > 90) { refresh(v => v + 1); lastUi = now; }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    const pause = () => { held.current = null; if (run.status === 'playing') run.paused = true; };
    const visibility = () => { if (document.hidden) pause(); };
    const directions: Record<string, number> = { ArrowUp:0, w:0, ArrowRight:1, d:1, ArrowDown:2, s:2, ArrowLeft:3, a:3 };
    const down = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || /INPUT|TEXTAREA/.test((e.target as HTMLElement).tagName)) return;
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (k in directions) { e.preventDefault(); if (!e.repeat) { held.current = directions[k]; run.move(directions[k]); lastMove.current = performance.now(); } }
      if (!e.repeat) { if (k==='e') run.action('anchor'); if (k==='r') run.action('return'); if (k===' ') { e.preventDefault(); run.action('pulse'); } if (k==='Escape') { run.paused = !run.paused; held.current=null; } }
    };
    const up = (e: KeyboardEvent) => { const k=e.key.length===1?e.key.toLowerCase():e.key; if (directions[k]===held.current) held.current=null; };
    window.addEventListener('keydown',down); window.addEventListener('keyup',up); window.addEventListener('blur',pause); document.addEventListener('visibilitychange',visibility);
    return () => { cancelAnimationFrame(frame); held.current=null; window.removeEventListener('keydown',down); window.removeEventListener('keyup',up); window.removeEventListener('blur',pause); document.removeEventListener('visibilitychange',visibility); };
  }, [run]);
  async function upload(file?: File) {
    if (!file) return; const id=++uploadId.current; setError('');
    if (!['image/png','image/jpeg','image/webp'].includes(file.type) || file.size > 10*1024*1024) { setError('10MB 이하의 JPG, PNG, WebP 사진을 선택해 주세요.'); return; }
    setLoading(true); const url=URL.createObjectURL(file);
    try {
      const img=new Image(); img.src=url; await img.decode();
      const c=document.createElement('canvas'); c.width=c.height=256; const ctx=c.getContext('2d'); if (!ctx) throw new Error();
      const size=Math.min(img.width,img.height); ctx.drawImage(img,(img.width-size)/2,(img.height-size)/2,size,size,0,0,256,256);
      if (id===uploadId.current) setPhoto(c.toDataURL('image/png'));
    } catch { if(id===uploadId.current) setError('사진을 읽을 수 없어요. 다른 사진을 선택해 주세요.'); }
    finally { URL.revokeObjectURL(url); if(id===uploadId.current) setLoading(false); }
  }
  const start=()=>{ held.current=null; setRun(new MazeRun(difficulty)); };
  return <main ref={page} className={`maze-app ${run ? 'maze-in-game' : ''}`}>
    <header className="maze-header"><button onClick={onExit}>← 게임 목록</button><span>메아리 미로 <small> ECHO MAZE</small></span><span className="maze-header-tag">작은 세계 속 3D 탐험</span></header>
    {!run ? <div className="maze-setup">
      <section className="maze-intro"><span className="maze-eyebrow"><Cube size={16} aria-hidden="true"/> 3D 미로 탐험</span><h1>작은 미로,<br/><em>커다란 모험.</em></h1><p>입체 미로 위에서 펼쳐지는 나만의 탐험.<br/>갈림길에 기억을 남기고, 시간이 끝나기 전에 탈출하세요.</p><div className="maze-preview"><MazePreview source={source} difficulty={difficulty}/><span>빛나는 출구를 향해, 한 걸음씩</span></div><div className="maze-story"><b>기억 닻</b><p>갈림길을 저장하고, 막다른 길에서 순간 귀환.<br/>돌아갈 곳은 생겨도, 흘러간 시간은 돌아오지 않아요.</p></div></section>
      <section className="maze-config"><div className="maze-config-heading"><h2>탐험 준비</h2><span><Compass size={23} aria-hidden="true"/></span></div><label className="maze-label" htmlFor="maze-name">탐험가 이름</label><input id="maze-name" maxLength={16} value={profile.name} onChange={e=>profile.setName(e.target.value)} />
        <span className="maze-label">내 캐릭터</span><div className="maze-photo"><img src={source} alt="내 캐릭터 미리보기"/><div><label className="maze-upload">{loading?'사진 준비 중…':'사진 선택'}<input type="file" accept="image/png,image/jpeg,image/webp" disabled={loading} onChange={e=>{void upload(e.target.files?.[0]);e.target.value='';}}/></label><p>얼굴이 가운데 있는 사진이 좋아요.<br/>JPG · PNG · WebP / 최대 10MB</p>{photo&&<button onClick={()=>setPhoto(null)}>기본 캐릭터 사용</button>}</div></div><p className="maze-private">사진은 이 화면에서만 사용하며 서버에 업로드하지 않아요.</p>{error&&<p role="alert" className="maze-error">{error}</p>}
        <span className="maze-label">난이도</span><div className="maze-levels">{(Object.keys(LEVELS) as Difficulty[]).map(d=><button key={d} aria-pressed={difficulty===d} onClick={()=>setDifficulty(d)}><strong>{LEVELS[d].label}</strong><span>{LEVELS[d].seconds}초</span></button>)}</div><p className="maze-level-detail">{LEVELS[difficulty].size} × {LEVELS[difficulty].size} · {LEVELS[difficulty].description}</p>
        <button className="maze-primary" disabled={loading} onClick={start}>3D 탐험 시작 →</button><p className="maze-controls-help">PC: 방향키 / WASD · 모바일: 화면 방향 패드</p>
      </section>
    </div> : <div className="maze-play">
      <div className="maze-hud"><div><span>{LEVELS[run.difficulty].label} · {profile.name||'탐험가'}</span><strong>빛나는 출구를 찾아라</strong></div><div className={run.remaining<=20?'maze-time urgent':'maze-time'}><small>남은 시간</small><b>{Math.floor(Math.ceil(run.remaining)/60)}:{String(Math.ceil(run.remaining)%60).padStart(2,'0')}</b></div><button onClick={()=>{run.paused=!run.paused;held.current=null;refresh(v=>v+1);}} disabled={run.status!=='playing'} aria-label="일시 정지"><Pause size={20} weight="fill"/></button></div>
      <div className="maze-board" onPointerDown={e=>{if(e.pointerType==='mouse'||(e.target as HTMLElement).closest('button,.maze-overlay'))return;swipe.current={id:e.pointerId,x:e.clientX,y:e.clientY};e.currentTarget.setPointerCapture(e.pointerId);}} onPointerUp={e=>{const start=swipe.current;swipe.current=null;if(!start||start.id!==e.pointerId)return;const x=e.clientX-start.x,y=e.clientY-start.y;if(Math.max(Math.abs(x),Math.abs(y))<18)return;run.move(Math.abs(x)>Math.abs(y)?(x>0?1:3):(y>0?2:0));refresh(v=>v+1);}} onPointerCancel={()=>{swipe.current=null;}} onLostPointerCapture={()=>{swipe.current=null;}}><MazeViewport run={run} source={source}/><div className="maze-run-stats"><span><Footprints size={16} aria-hidden="true"/>{run.steps} 걸음</span><span><Diamond size={16} aria-hidden="true"/>시간 조각 {run.collected}개</span><span>{"봉인"} {run.sealsCollected}/{run.requiredSeals}</span><span className="maze-north">↑ 북쪽</span></div><div className="maze-legend"><span>{"봉인"}</span><span>{run.trapsActive?"함정 활성 -6초":"함정 휴면"}</span><span>◆ 시간 조각 +10초</span><span>● 내 발자국</span><span>▣ 빛나는 출구</span></div>
      {(run.paused||run.status!=='playing')&&<div className="maze-overlay"><section role="dialog" aria-modal="true" aria-label={run.status==='playing'?'일시 정지':'게임 결과'}><span className="maze-eyebrow">{run.status==='won'?'EXPLORATION COMPLETE':run.status==='lost'?'TIME OVER':'TAKE A BREATH'}</span><h2>{run.status==='won'?'무사히 탈출했어요!':run.status==='lost'?'시간이 다 되었어요':'잠시 쉬어 가요'}</h2><p>{run.status==='playing'?'시간도 함께 멈췄어요. 준비되면 이어서 탐험하세요.':`${run.steps}걸음 · 시간 조각 ${run.collected}개 · 남은 시간 ${Math.ceil(run.remaining)}초`}</p>{run.status==='playing'?<button className="maze-primary" onClick={()=>{run.paused=false;refresh(v=>v+1);}}>계속 탐험</button>:<button className="maze-primary" onClick={start}>새 미로 도전</button>}<button onClick={()=>setRun(null)}>캐릭터 · 난이도 설정</button></section></div>}
      </div>
      <div className="maze-bottom"><div className="maze-tools"><p>{"모바일: 미로 스와이프 / 방향 패드 / 함정은 3초마다 켜지고 꺼져요."}</p><div className="maze-message" role="status">{run.message}</div><div className="maze-actions"><button disabled={run.paused||run.status!=='playing'} onClick={()=>run.action('anchor')}><Anchor size={24} aria-hidden="true"/><span><b>기억 닻 저장</b><small>E · 현재 위치</small></span></button><button disabled={run.paused||run.status!=='playing'||!run.anchor||!run.returns} onClick={()=>run.action('return')}><ArrowUUpLeft size={24} aria-hidden="true"/><span><b>닻으로 귀환</b><small>R · {run.returns}회 남음</small></span></button><button disabled={run.paused||run.status!=='playing'||!run.pulses||run.remaining<=4} onClick={()=>run.action('pulse')}><Broadcast size={24} aria-hidden="true"/><span><b>메아리</b><small>Space · −4초 · {run.pulses}회</small></span></button></div><p>방향키 / WASD 이동 · Esc 일시 정지 · 전체 보기로 출구 위치를 확인하세요.</p></div><div className="maze-dpad" aria-label="터치 이동">{[0,3,2,1].map(d=><button key={d} className={`dir-${d}`} aria-label={['위로 이동','오른쪽 이동','아래로 이동','왼쪽 이동'][d]} disabled={run.paused||run.status!=='playing'} onPointerDown={e=>{e.preventDefault();if(held.current!==null)return;e.currentTarget.setPointerCapture(e.pointerId);held.current=d;run.move(d);lastMove.current=performance.now();refresh(v=>v+1);}} onPointerUp={()=>{held.current=null;}} onPointerCancel={()=>{held.current=null;}} onLostPointerCapture={()=>{held.current=null;}} onClick={e=>{if(e.detail===0)run.move(d);}}>{['↑','→','↓','←'][d]}</button>)}</div></div>
    </div>}
  </main>;
}
function MazePreview({source,difficulty}:{source:string;difficulty:Difficulty}) {
  const run=useMemo(()=>new MazeRun(difficulty,()=>.42),[difficulty]);
  // Preparation displays the complete diorama; fog applies when the expedition starts.
  run.reveal=999;
  return <MazeViewport run={run} source={source} preview/>;
}
function MazeViewport({run,source,preview=false}:{run:MazeRun;source:string;preview?:boolean}) {
  const canvas=useRef<HTMLCanvasElement>(null), scene=useRef<MazeScene|null>(null);
  const [error,setError]=useState('');
  const [closeView,setCloseView]=useState(!preview);
  useEffect(()=>{
    if(!canvas.current)return;
    setError('');
    let renderer:MazeScene;
    try { renderer=new MazeScene(canvas.current,run); scene.current=renderer; }
    catch {run.paused=true;setError('3D 화면을 열 수 없어요. WebGL을 지원하는 브라우저에서 다시 시도해 주세요.');return;}
    let frame=0,last=performance.now();
    const draw=(now:number)=>{renderer.draw(Math.min(.05,(now-last)/1000));last=now;frame=requestAnimationFrame(draw);};
    const lost=(event:Event)=>{event.preventDefault();run.paused=true;setError('3D 화면이 중단되었어요. 설정으로 돌아가 새 탐험을 시작해 주세요.');};
    const element=canvas.current;element.addEventListener('webglcontextlost',lost);
    frame=requestAnimationFrame(draw);
    return()=>{cancelAnimationFrame(frame);element.removeEventListener('webglcontextlost',lost);renderer.dispose();scene.current=null;};
  },[run]);
  useEffect(()=>{scene.current?.setPortrait(source);},[source,run]);
  useEffect(()=>{scene.current?.setCloseView(closeView);},[closeView,run]);
  return <><canvas ref={canvas} aria-label="3D 미로. 화면 위쪽이 북쪽이며 방향키 또는 방향 패드로 이동하세요."/>{!preview&&<div className="maze-view-switch" aria-label="카메라 거리"><button aria-pressed={!closeView} onClick={()=>setCloseView(false)}>전체 보기</button><button aria-pressed={closeView} onClick={()=>setCloseView(true)}>가까이 보기</button></div>}{error&&<p className="maze-render-error" role="alert">{error}</p>}</>;
}
