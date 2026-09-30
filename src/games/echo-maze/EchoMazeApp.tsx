import { useEffect, useRef, useState } from 'react';
import type { GameProps } from '../../platform/types';
import { MazeRun, LEVELS, type Difficulty } from './engine';
import { drawMaze } from './render';
import './maze.css';

export default function EchoMazeApp({ onExit, profile }: GameProps) {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [run, setRun] = useState<MazeRun | null>(null);
  const [, refresh] = useState(0);
  const [photo, setPhoto] = useState<string | null>(null), [error, setError] = useState(''), [loading, setLoading] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null), avatar = useRef<HTMLImageElement | null>(null);
  const page = useRef<HTMLElement>(null);
  const held = useRef<number | null>(null), lastMove = useRef(0), uploadId = useRef(0);
  const source = photo || profile.characterImage;
  useEffect(() => { const img = new Image(); img.src = source; img.onload = () => { avatar.current = img; }; return () => { img.onload = null; avatar.current = null; }; }, [source]);
  useEffect(() => () => { uploadId.current++; }, []);
  useEffect(() => { page.current?.scrollTo(0, 0); }, [run]);
  useEffect(() => {
    if (!run) return;
    let frame = 0, previous = performance.now(), lastUi = 0;
    const loop = (now: number) => {
      run.tick((now - previous) / 1000); previous = now;
      if (held.current !== null && now - lastMove.current > 135) { run.move(held.current); lastMove.current = now; }
      if (canvas.current) drawMaze(canvas.current, run, avatar.current);
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
  return <main ref={page} className="maze-app">
    <header className="maze-header"><button onClick={onExit}>← 게임 목록</button><span>메아리 미로 <small> ECHO MAZE</small></span><span className="maze-header-tag">2.5D 탐험</span></header>
    {!run ? <div className="maze-setup">
      <section className="maze-intro"><span className="maze-eyebrow">길을 잃어도, 기억은 남으니까.</span><h1>나의 얼굴로,<br/>낯선 미로 속으로.</h1><p>하얀 길과 검은 벽 사이로 떠나는 작은 모험.<br/>갈림길에 기억을 남기고, 시간이 끝나기 전에 탈출하세요.</p><div className="maze-preview"><MazePreview source={source}/><span>당신이 이번 모험의 주인공</span></div><div className="maze-story"><b>기억 닻</b><p>갈림길을 저장하고, 막다른 길에서 순간 귀환.<br/>돌아갈 곳은 생겨도, 흘러간 시간은 돌아오지 않아요.</p></div></section>
      <section className="maze-config"><h2>탐험 준비</h2><label className="maze-label" htmlFor="maze-name">탐험가 이름</label><input id="maze-name" maxLength={16} value={profile.name} onChange={e=>profile.setName(e.target.value)} />
        <span className="maze-label">내 캐릭터</span><div className="maze-photo"><img src={source} alt="내 캐릭터 미리보기"/><div><label className="maze-upload">{loading?'사진 준비 중…':'사진 선택'}<input type="file" accept="image/png,image/jpeg,image/webp" disabled={loading} onChange={e=>{void upload(e.target.files?.[0]);e.target.value='';}}/></label><p>얼굴이 가운데 있는 사진이 좋아요.<br/>JPG · PNG · WebP / 최대 10MB</p>{photo&&<button onClick={()=>setPhoto(null)}>기본 캐릭터 사용</button>}</div></div><p className="maze-private">사진은 이 화면에서만 사용하며 서버에 업로드하지 않아요.</p>{error&&<p role="alert" className="maze-error">{error}</p>}
        <span className="maze-label">난이도</span><div className="maze-levels">{(Object.keys(LEVELS) as Difficulty[]).map(d=><button key={d} aria-pressed={difficulty===d} onClick={()=>setDifficulty(d)}><strong>{LEVELS[d].label}</strong><span>{LEVELS[d].seconds}초</span></button>)}</div><p className="maze-level-detail">{LEVELS[difficulty].size} × {LEVELS[difficulty].size} · {LEVELS[difficulty].description}</p>
        <button className="maze-primary" disabled={loading} onClick={start}>미로로 출발 →</button><p className="maze-controls-help">PC: 방향키 / WASD · 모바일: 화면 방향 패드</p>
      </section>
    </div> : <div className="maze-play">
      <div className="maze-hud"><div><span>{LEVELS[run.difficulty].label} · {profile.name||'탐험가'}</span><strong>EXIT 출구를 찾아라</strong></div><div className={run.remaining<=20?'maze-time urgent':'maze-time'}><small>남은 시간</small><b>{Math.floor(Math.ceil(run.remaining)/60)}:{String(Math.ceil(run.remaining)%60).padStart(2,'0')}</b></div><button onClick={()=>{run.paused=!run.paused;held.current=null;refresh(v=>v+1);}} disabled={run.status!=='playing'}>일시 정지</button></div>
      <div className="maze-board"><canvas ref={canvas} aria-label="입체 미로. 방향키 또는 아래 방향 패드로 이동하세요."/><div className="maze-legend"><span>◇ 시간 조각 +10초</span><span>● 내 발자국</span><span>■ EXIT 출구</span></div>
      {(run.paused||run.status!=='playing')&&<div className="maze-overlay"><section role="dialog" aria-modal="true" aria-label={run.status==='playing'?'일시 정지':'게임 결과'}><span className="maze-eyebrow">{run.status==='won'?'EXPLORATION COMPLETE':run.status==='lost'?'TIME OVER':'TAKE A BREATH'}</span><h2>{run.status==='won'?'무사히 탈출했어요!':run.status==='lost'?'시간이 다 되었어요':'잠시 쉬어 가요'}</h2><p>{run.status==='playing'?'시간도 함께 멈췄어요. 준비되면 이어서 탐험하세요.':`${run.steps}걸음 · 시간 조각 ${run.collected}개 · 남은 시간 ${Math.ceil(run.remaining)}초`}</p>{run.status==='playing'?<button className="maze-primary" onClick={()=>{run.paused=false;refresh(v=>v+1);}}>계속 탐험</button>:<button className="maze-primary" onClick={start}>새 미로 도전</button>}<button onClick={()=>setRun(null)}>캐릭터 · 난이도 설정</button></section></div>}
      </div>
      <div className="maze-bottom"><div className="maze-tools"><div className="maze-message" role="status">{run.message}</div><div className="maze-actions"><button disabled={run.paused||run.status!=='playing'} onClick={()=>run.action('anchor')}><b>기억 닻 저장</b><small>E · 현재 위치</small></button><button disabled={run.paused||run.status!=='playing'||!run.anchor||!run.returns} onClick={()=>run.action('return')}><b>닻으로 귀환</b><small>R · {run.returns}회 남음</small></button><button disabled={run.paused||run.status!=='playing'||!run.pulses||run.remaining<=4} onClick={()=>run.action('pulse')}><b>메아리</b><small>Space · −4초 · {run.pulses}회</small></button></div><p>방향키 / WASD 이동 · Esc 일시 정지 · 안개 속에서도 EXIT 표시는 보여요.</p></div><div className="maze-dpad" aria-label="터치 이동">{[0,3,2,1].map(d=><button key={d} className={`dir-${d}`} aria-label={['위로 이동','오른쪽 이동','아래로 이동','왼쪽 이동'][d]} disabled={run.paused||run.status!=='playing'} onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);held.current=d;run.move(d);lastMove.current=performance.now();}} onPointerUp={()=>{held.current=null;}} onPointerCancel={()=>{held.current=null;}} onLostPointerCapture={()=>{held.current=null;}} onClick={e=>{if(e.detail===0)run.move(d);}}>{['↑','→','↓','←'][d]}</button>)}</div></div>
    </div>}
  </main>;
}
function MazePreview({source}:{source:string}) {
  const ref=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{ const run=new MazeRun('easy',()=>.42); run.player={x:5,y:5}; run.cells[5][5]=0; const img=new Image();img.src=source;const draw=()=>{if(ref.current)drawMaze(ref.current,run,img);};img.onload=draw;draw();const observer=new ResizeObserver(draw);if(ref.current)observer.observe(ref.current);return()=>{observer.disconnect();img.onload=null;};},[source]);
  return <canvas ref={ref} aria-label="미로와 사진 캐릭터 미리보기"/>;
}
