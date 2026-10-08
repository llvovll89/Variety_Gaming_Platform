import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Camera, Pause, SpeakerHigh, SpeakerSlash, Play } from '@phosphor-icons/react';
import type { GameProps } from '../../platform/types';
import { safeGetItem, safeSetItem } from '../../shared/storage';
import { Fight, WEAPONS, type Move, type Weapon } from './engine';
import { KitchenScene, type Portrait } from './scene';
import { FightAudio } from './audio';
import { movementInput } from './controls';
import './fighter-ui.css';

type Character = { name: string; weapon: Weapon; photo: string; zoom: number; x: number; y: number };
const key = 'arcade:kitchen-fighter:characters';
function readCharacters(name: string): [Character, Character] {
  const defaults: [Character, Character] = [
    { name: name || '주걱 고수', weapon: 'spatula', photo: '', zoom: 1, x: 0, y: 0 },
    { name: '동네 챔피언', weapon: 'swatter', photo: '', zoom: 1, x: 0, y: 0 },
  ];
  try {
    const saved = JSON.parse(safeGetItem(key) || 'null');
    if (Array.isArray(saved) && saved.length === 2) return defaults.map((d, i) => {
      const s = saved[i]; if (!s || typeof s !== 'object') return d;
      return { name: typeof s.name === 'string' ? s.name.slice(0, 14) : d.name,
        weapon: Object.hasOwn(WEAPONS, s.weapon) ? s.weapon : d.weapon,
        photo: typeof s.photo === 'string' && s.photo.startsWith('data:image/') ? s.photo : '',
        zoom: typeof s.zoom === 'number' && s.photoVersion === 2 ? Math.max(.5, Math.min(2, s.zoom)) : 1,
        x: typeof s.x === 'number' && s.photoVersion === 2 ? Math.max(-2, Math.min(2, s.x)) : 0, y: typeof s.y === 'number' && s.photoVersion === 2 ? Math.max(-2, Math.min(2, s.y)) : 0 };
    }) as [Character, Character];
  } catch { /* Invalid old saves fall back to the default fighters. */ }
  return defaults;
}
const attacks: Record<string, [number, Move]> = {
  KeyJ: [0, 'jab'], KeyK: [0, 'heavy'], KeyL: [0, 'low'], KeyU: [0, 'skill'], KeyI: [0, 'ultimate'],
  Digit1: [1, 'jab'], Digit2: [1, 'heavy'], Digit3: [1, 'low'], Digit4: [1, 'skill'], Digit5: [1, 'ultimate'],
  Numpad1: [1, 'jab'], Numpad2: [1, 'heavy'], Numpad3: [1, 'low'], Numpad4: [1, 'skill'], Numpad5: [1, 'ultimate'],
};
const moveLabels: [Move, string, string][] = [['jab', '찰싹', 'J'], ['heavy', '강타', 'K'], ['low', '하단', 'L'], ['skill', '띄우기', 'U'], ['ultimate', '필살기', 'I']];

export default function KitchenFighterApp({ onExit, profile }: GameProps) {
  const [characters, setCharacters] = useState<[Character, Character]>(() => readCharacters(profile.name));
  const [mode, setMode] = useState<'cpu' | 'local'>('cpu');
  const [difficulty, setDifficulty] = useState<'easy' | 'normal'>('normal');
  const [screen, setScreen] = useState<'setup' | 'battle'>('setup');
  const [paused, setPaused] = useState(false); const pauseRef = useRef(false);
  const [muted, setMuted] = useState(false); const [error, setError] = useState('');
  const [loading, setLoading] = useState<number | null>(null);
  const [activeControls, setActiveControls] = useState<string[]>([]);
  const [hud, setHud] = useState({ hp: [100, 100], gauge: [0, 0], wins: [0, 0], time: 60, phase: 'ready', round: 1, winner: null as number | null });
  const canvas = useRef<HTMLCanvasElement>(null), fight = useRef(new Fight('cpu', ['spatula', 'swatter']));
  const portraits = useRef<[Portrait, Portrait]>([{ image: null, zoom: 1, x: 0, y: 0 }, { image: null, zoom: 1, x: 0, y: 0 }]);
  const keys = useRef(new Set<string>()), touch = useRef(new Set<string>()), audio = useRef<FightAudio | null>(null);
  const direction = useRef<{ time: number; forward: boolean } | null>(null);
  useEffect(() => {
    safeSetItem(key, JSON.stringify(characters.map(ch => ({ ...ch, photoVersion: 2 }))));
    portraits.current = characters.map(ch => { const image = ch.photo ? new Image() : null; if (image) image.src = ch.photo; return { image, zoom: ch.zoom, x: ch.x, y: ch.y }; }) as [Portrait, Portrait];
    if (screen === 'setup') fight.current = new Fight(mode, characters.map(ch => ch.weapon) as [Weapon, Weapon], difficulty);
  }, [characters, mode, difficulty, screen]);
  useEffect(() => { const a = new FightAudio(); audio.current = a; return () => { a.dispose(); audio.current = null; }; }, []);
  function pause(value: boolean) { pauseRef.current = value; setPaused(value); keys.current.clear(); touch.current.clear(); }
  function perform(index: number, move: Move) {
    if (pauseRef.current || (index === 1 && fight.current.mode === 'cpu')) return;
    audio.current?.unlock();
    if (index === 0 && move === 'jab' && direction.current?.forward && fight.current.elapsed - direction.current.time < .55) move = 'skill';
    fight.current.attack(index, move, true);
  }
  useEffect(() => {
    if (screen !== 'battle') return;
    const down = (event: KeyboardEvent) => {
      if (!(event.code in attacks) && !['KeyA', 'KeyD', 'KeyW', 'KeyS', 'KeyQ', 'KeyE', 'KeyC', 'KeyO', 'ShiftLeft', 'ShiftRight', 'Space', 'Home', 'End', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Digit0', 'Numpad0', 'Period', 'NumpadDecimal', 'Escape'].includes(event.code)) return;
      event.preventDefault();
      if (event.repeat) return;
      if (event.code === 'Escape') { pause(!pauseRef.current); return; }
      if (pauseRef.current) return;
      keys.current.add(event.code);
      const soloArrow = fight.current.mode === 'cpu';
      if (event.code === 'KeyA' || event.code === 'KeyD') fight.current.tapDirection(0, event.code === 'KeyA' ? -1 : 1);
      if (event.code === 'KeyQ' || event.code === 'KeyE') fight.current.sidestep(0, event.code === 'KeyQ' ? -1 : 1);
      if (!soloArrow && (event.code === 'Home' || event.code === 'End')) fight.current.sidestep(1, event.code === 'Home' ? -1 : 1);
      if (event.code === 'ArrowLeft' || event.code === 'ArrowRight') fight.current.tapDirection(soloArrow ? 0 : 1, event.code === 'ArrowLeft' ? -1 : 1);
      if (event.code === 'KeyS' || (soloArrow && event.code === 'ArrowDown')) direction.current = { time: fight.current.elapsed, forward: false };
      const facingRight = fight.current.fighters[0].facing > 0;
      if ((event.code === (facingRight ? 'KeyD' : 'KeyA') || (soloArrow && event.code === (facingRight ? 'ArrowRight' : 'ArrowLeft'))) && direction.current && fight.current.elapsed - direction.current.time < .4) direction.current.forward = true;
      if (attacks[event.code]) perform(...attacks[event.code]);
    };
    const up = (event: KeyboardEvent) => keys.current.delete(event.code);
    const blur = () => { if (fight.current.phase !== 'matchover') pause(true); };
    const visibility = () => { if (document.hidden) blur(); };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', blur); document.addEventListener('visibilitychange', visibility);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', blur); document.removeEventListener('visibilitychange', visibility); };
  }, [screen]);
  useEffect(() => {
    let raf = 0, previous = 0, uiTime = 0;
    const el = canvas.current; if (!el) return;
    let scene: KitchenScene;
    try { scene = new KitchenScene(el); } catch { setError('3D 경기장을 시작할 수 없습니다. 브라우저의 하드웨어 가속을 켜고 다시 열어 주세요.'); return; }
    const frame = (now: number) => {
      const dt = previous ? Math.min((now - previous) / 1000, .05) : 0; previous = now;
      const f = fight.current, pressed = (code: string) => keys.current.has(code) || touch.current.has(code);
      if (screen === 'battle' && !pauseRef.current) {
        f.fighters[0].input = movementInput(pressed, f.mode, 0);
        if (f.mode === 'local') f.fighters[1].input = movementInput(pressed, f.mode, 1);
        f.step(dt); while (f.sounds.length) audio.current?.play(f.sounds.shift()!);
        uiTime += dt;
        if (uiTime > .06) { uiTime = 0; setHud({ hp: f.fighters.map(p => p.hp), gauge: f.fighters.map(p => p.gauge), wins: f.fighters.map(p => p.wins), time: Math.ceil(f.time), phase: f.phase, round: f.round, winner: f.winner });
          const input = f.fighters[0].input; setActiveControls([...(input.x < 0 ? ['KeyA'] : input.x > 0 ? ['KeyD'] : []), ...(input.z < 0 ? ['KeyQ'] : input.z > 0 ? ['KeyE'] : []), ...(input.guard ? ['ShiftLeft'] : []), ...(input.crouch ? ['KeyS'] : []), ...(input.jump ? ['KeyW'] : [])]); }
      } else if (screen === 'setup') f.elapsed += dt;
      el.dataset.playerOneX = f.fighters[0].x.toFixed(2); el.dataset.playerOneZ = f.fighters[0].z.toFixed(2); el.dataset.playerTwoX = f.fighters[1].x.toFixed(2);
      el.dataset.playerOneGuard = String(f.fighters[0].input.guard); el.dataset.playerOneCrouch = String(f.fighters[0].input.crouch); el.dataset.playerOneAir = f.fighters[0].air.toFixed(2); el.dataset.phase = f.phase;
      scene.render(f, portraits.current);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame); return () => { cancelAnimationFrame(raf); scene.dispose(); };
  }, [screen]);
  function update(index: number, patch: Partial<Character>) { setCharacters(old => old.map((ch, i) => i === index ? { ...ch, ...patch } : ch) as [Character, Character]); }
  async function upload(index: number, file?: File) {
    if (!file) return; setError('');
    if (!file.type.startsWith('image/') || file.size > 12 * 1024 * 1024) { setError('12MB 이하의 이미지 파일을 선택해 주세요.'); return; }
    setLoading(index); const url = URL.createObjectURL(file);
    try {
      const img = new Image(); img.src = url; await img.decode();
      const el = document.createElement('canvas'), scale = Math.min(1, 1024 / Math.max(img.naturalWidth, img.naturalHeight));
      el.width = Math.max(1, Math.round(img.naturalWidth * scale)); el.height = Math.max(1, Math.round(img.naturalHeight * scale));
      const c = el.getContext('2d'); if (!c) throw new Error('canvas'); c.drawImage(img, 0, 0, el.width, el.height);
      update(index, { photo: el.toDataURL(file.type === 'image/png' || file.type === 'image/webp' ? 'image/png' : 'image/jpeg', .92), zoom: 1, x: 0, y: 0 });
    } catch { setError('사진을 읽을 수 없습니다. JPG, PNG 또는 WebP로 다시 선택해 주세요.'); }
    finally { URL.revokeObjectURL(url); setLoading(null); }
  }
  function start() {
    fight.current = new Fight(mode, characters.map(ch => ch.weapon) as [Weapon, Weapon], difficulty);
    direction.current = null; pause(false); audio.current?.unlock(); setHud({ hp: [100, 100], gauge: [0, 0], wins: [0, 0], time: 60, phase: 'ready', round: 1, winner: null }); setScreen('battle');
  }
  const holdButton = (code: string, label: string, keyLabel: string) => <button key={code} className={`kf-touch ${activeControls.includes(code) ? 'held' : ''}`} onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); touch.current.add(code); } }} onKeyUp={() => touch.current.delete(code)} onBlur={() => touch.current.delete(code)} onPointerDown={e => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); touch.current.add(code); audio.current?.unlock(); if (code === 'KeyQ' || code === 'KeyE') fight.current.sidestep(0, code === 'KeyQ' ? -1 : 1); if (code === 'KeyA' || code === 'KeyD') fight.current.tapDirection(0, code === 'KeyA' ? -1 : 1); }} onPointerUp={() => touch.current.delete(code)} onPointerCancel={() => touch.current.delete(code)} onLostPointerCapture={() => touch.current.delete(code)}><kbd>{keyLabel}</kbd>{label}</button>;
  return <main className="kf-app">
    <header className="kf-header"><button className="kf-back" onClick={onExit}><ArrowLeft size={19} /> 게임 허브</button><span className="kf-brand">밥상 대격돌 <small>Kitchen Fighter</small></span><div className="kf-header-actions">
      {screen === 'battle' && <button aria-label="일시정지" onClick={() => pause(!paused)}><Pause size={20} /></button>}
      <button aria-label={muted ? '소리 켜기' : '소리 끄기'} onClick={() => { setMuted(!muted); if (audio.current) { audio.current.muted = !muted; audio.current.unlock(); } }}>{muted ? <SpeakerSlash size={21} /> : <SpeakerHigh size={21} />}</button>
    </div></header>
    <div className={`kf-content ${screen === 'setup' ? 'kf-setup' : 'kf-battle'}`}>
      {screen === 'setup' && <div className="kf-intro"><h1>선수 선택</h1><p>주걱, 파리채, 골프채. 오늘은 뭘 들고 붙을까요?</p></div>}
      <div className={`kf-arena ${screen === 'setup' ? 'kf-preview' : ''}`}>
        <canvas ref={canvas} aria-label="사진 캐릭터가 주방에서 대결하는 격투 경기장" />
        {screen === 'setup' ? <div className="kf-preview-label"><span>1P · {characters[0].name || '선수 1'}</span><b>VS</b><span>2P · {characters[1].name || '선수 2'}</span></div> : <>
          <div className="kf-hud">{characters.map((ch, i) => <div key={i} className={`kf-player-hud kf-player-${i}`}><div className="kf-hud-name"><strong>{ch.name || `선수 ${i + 1}`}</strong><span>{i === 1 && mode === 'cpu' ? 'CPU' : `${i + 1}P`} · {WEAPONS[ch.weapon].short}</span></div><div className="kf-health" role="meter" aria-label={`${ch.name} 체력`} aria-valuenow={hud.hp[i]} aria-valuemin={0} aria-valuemax={100}><div style={{ width: `${hud.hp[i]}%` }} /></div><div className="kf-meter-row"><div className={`kf-gauge ${hud.gauge[i] === 100 ? 'full' : ''}`}><div style={{ width: `${hud.gauge[i]}%` }} /></div><span>{hud.gauge[i] === 100 ? '필살기 준비!' : `${hud.gauge[i]}%`}</span><span className="kf-wins">{[0, 1].map(n => <i className={hud.wins[i] > n ? 'won' : ''} key={n} />)}</span></div></div>)}<div className="kf-timer"><b>{hud.time}</b><small>ROUND {hud.round}</small></div></div>
          {hud.phase === 'ready' && <div className="kf-round-banner"><small>ROUND {hud.round}</small><strong>준비!</strong></div>}
          {hud.phase === 'roundover' && <div className="kf-round-banner"><strong>{hud.winner === null ? '무승부!' : 'K.O.'}</strong><small>{hud.winner === null ? '다시 한 판!' : `${characters[hud.winner].name} 라운드 승리`}</small></div>}
          {hud.phase === 'matchover' && <div className="kf-overlay"><div className="kf-result"><p>오늘의 주방 챔피언</p><h2>{hud.winner === null ? '무승부' : characters[hud.winner].name}</h2><p>{hud.wins[0]} : {hud.wins[1]} · 밥상은 내가 접수한다!</p><button className="kf-primary" onClick={start}>한 판 더</button><button className="kf-secondary" onClick={() => { pause(false); setScreen('setup'); }}>캐릭터 선택</button></div></div>}
          {paused && hud.phase !== 'matchover' && <div className="kf-overlay"><div className="kf-result"><h2>잠깐, 밥 먹고!</h2><p>경기가 일시정지되었습니다.</p><button className="kf-primary" onClick={() => { pause(false); audio.current?.unlock(); }}><Play weight="fill" /> 계속하기</button><button className="kf-secondary" onClick={() => { pause(false); setScreen('setup'); }}>캐릭터 선택</button></div></div>}
        </>}
      </div>
      <div className="kf-keyguide"><span><kbd>A</kbd><kbd>D</kbd> 이동</span><span><kbd>Q</kbd><kbd>E</kbd> 사이드스텝</span><span><kbd>W</kbd> 점프</span><span><kbd>S</kbd> 앉기</span><span><kbd>Shift</kbd> 가드</span><span><kbd>A A</kbd><kbd>D D</kbd> 대시</span></div>
      {screen === 'setup' ? <>
        <div className="kf-selection">{characters.map((ch, i) => <section className={`kf-character kf-character-${i}`} key={i}><div className="kf-character-heading"><span>{i + 1}P</span><input aria-label={`${i + 1}P 이름`} value={ch.name} maxLength={14} onChange={e => update(i, { name: e.target.value })} /><label className="kf-upload"><Camera size={18} />{loading === i ? '읽는 중…' : ch.photo ? '사진 바꾸기' : '내 사진 넣기'}<input type="file" accept="image/*" disabled={loading !== null} onChange={e => { void upload(i, e.target.files?.[0]); e.target.value = ''; }} /></label></div>
          <div className="kf-weapons">{(Object.keys(WEAPONS) as Weapon[]).map(weapon => <button key={weapon} className={ch.weapon === weapon ? 'selected' : ''} aria-pressed={ch.weapon === weapon} onClick={() => update(i, { weapon })}><span>{WEAPONS[weapon].short}</span><small>{weapon === 'spatula' ? '균형 잡힌 찰싹' : weapon === 'swatter' ? '빠른 연속 타격' : '묵직한 긴 사거리'}</small></button>)}</div>
          <p className="kf-skill-note">띄우기: {WEAPONS[ch.weapon].skill} <span>필살기: {WEAPONS[ch.weapon].ultimate}</span></p>
          {ch.photo && <div className="kf-photo-adjust"><label>크기<input type="range" min=".5" max="2" step=".05" value={ch.zoom} onChange={e => update(i, { zoom: Number(e.target.value) })} /></label><label>좌우<input type="range" min="-2" max="2" step=".05" value={ch.x} onChange={e => update(i, { x: Number(e.target.value) })} /></label><label>상하<input type="range" min="-2" max="2" step=".05" value={ch.y} onChange={e => update(i, { y: Number(e.target.value) })} /></label><button onClick={() => update(i, { photo: '', zoom: 1, x: 0, y: 0 })}>사진 지우기</button></div>}
        </section>)}</div>
        {error && <p className="kf-error" role="alert">{error}</p>}
        <div className="kf-start-row"><div className="kf-mode"><button aria-pressed={mode === 'cpu'} className={mode === 'cpu' ? 'selected' : ''} onClick={() => setMode('cpu')}>혼자 · CPU 대전</button><button aria-pressed={mode === 'local'} className={mode === 'local' ? 'selected' : ''} onClick={() => setMode('local')}>둘이 · 같은 키보드</button></div>{mode === 'cpu' && <select aria-label="CPU 난이도" value={difficulty} onChange={e => setDifficulty(e.target.value as 'easy' | 'normal')}><option value="easy">CPU 쉬움</option><option value="normal">CPU 보통</option></select>}<button className="kf-primary kf-start" disabled={loading !== null} onClick={start}>한 판 붙기 <Play weight="fill" /></button></div>
        <p className="kf-privacy">사진 전체를 자르지 않고 사용합니다. 전신 사진이나 배경이 투명한 PNG를 넣으면 더 자연스럽습니다. 사진은 이 브라우저에만 저장됩니다.</p>
      </> : <div className="kf-touch-controls"><div className="kf-direction">{holdButton('KeyA', '왼쪽', 'A')}{holdButton('KeyD', '오른쪽', 'D')}{holdButton('KeyQ', '안쪽', 'Q')}{holdButton('KeyE', '바깥쪽', 'E')}{holdButton('KeyW', '점프', 'W')}{holdButton('ShiftLeft', '가드', 'Shift')}{holdButton('KeyS', '앉기', 'S')}</div><div className="kf-attack-buttons">{moveLabels.map(([move, label, letter]) => <button key={move} className={move === 'ultimate' ? 'kf-super' : ''} disabled={paused || hud.phase !== 'fight' || (move === 'ultimate' && hud.gauge[0] < 100)} onClick={e => { if (e.detail === 0) perform(0, move); }} onPointerDown={e => { e.preventDefault(); perform(0, move); }}><kbd>{letter}</kbd>{label}</button>)}</div></div>}
      <details className="kf-help"><summary>기술과 조작법 <span>60초, 2선승</span></summary><div className="kf-help-grid"><p><b>1P</b> A/D 이동, W 점프, S 앉기<br />Q/E 톡 치면 사이드스텝, 누르고 있으면 옆걸음<br />Shift 또는 Space 가드. 뒤로 걸어도 자동 가드.<br />J 약공격, K 강공격, L 하단, U 띄우기, I 필살기<br />CPU 대전에서는 방향키 좌우 이동, ↑ 점프, ↓ 앉기.</p><p><b>연결 기술</b> A A / D D 빠르게 입력하면 백대시 / 대시.<br />S → 상대 방향(A/D) → J: 띄우기.<br />공격이 끝나기 직전에 다음 공격을 입력하면 연결됩니다.<br />S + Shift 하단 가드. 게이지 100%에서 I.</p><p><b>{mode === 'local' ? '2P' : '모바일'}</b>{mode === 'local' ? <><br />←/→ 이동, ↑ 점프, ↓ 앉기, Home/End 옆걸음<br />1/2/3 공격, 4 띄우기, 5 필살기, 0 가드</> : <><br />버튼을 누르고 있으면 이동·가드·앉기.<br />여러 버튼을 함께 눌러도 됩니다.</>}<br />Esc 일시정지</p></div></details>
    </div>
  </main>;
}
