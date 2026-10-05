import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowCounterClockwise, Sword, Footprints, Sparkle, Hourglass, Flask, Pause, GridFour, Shield, FloppyDisk, TreasureChest } from '@phosphor-icons/react';
import type { GameProps } from '../../platform/types';
import { Battle, FINAL_STAGE, ROLE_LABEL, STAGES, key, restore, serialize, type Mode, type Point, type Unit } from './game';
import { VIEW_H, VIEW_W, clampCursor, drawBattle, pickTile, pickUnit } from './render';
import { artReady } from './art';
import { Portrait } from './Portrait';
import { eventDuration } from './animation';
import { CampScreen } from './CampScreen';
import { GearPanel } from './GearPanel';
import { JOBS, jobName } from './progression';
import { TerrainPanel } from './TerrainPanel';
import './tactics.css';

const SAVE_KEY = 'gh-arcade:fantasy-tactics:v1';
function readSave() { try { const raw = localStorage.getItem(SAVE_KEY); return raw ? restore(raw) : null; } catch { return null; } }

export default function FantasyTacticsApp({ onExit }: GameProps) {
  const [gearOpen,setGearOpen] = useState(false);
  const [saved, setSaved] = useState(readSave);
  const [battle, setBattle] = useState(() => new Battle());
  const [screen, setScreen] = useState<'title' | 'battle'>('title');
  const [revision, setRevision] = useState(0), [mode, setMode] = useState<Mode>('move');
  const [hover, setHover] = useState<Point | null>(null), [grid, setGrid] = useState(false);
  const [paused, setPaused] = useState(false), [help, setHelp] = useState(false), [confirmNew, setConfirmNew] = useState(false);
  const [storageMessage, setStorageMessage] = useState(''), [hint, setHint] = useState('');
  const [busy, setBusy] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<'unit' | 'log' | null>(null);
  const dialog = useRef<HTMLDivElement>(null), board = useRef<HTMLCanvasElement>(null), busyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const overlay = screen === 'title' ? (confirmNew ? 'new' : '') : gearOpen ? 'gear' : help ? 'help' : paused ? 'paused' : (!busy && ['intro', 'won', 'lost', 'ending'].includes(battle.phase)) ? battle.phase : '';
  const update = () => setRevision(n => n + 1);
  const resetMode = () => { setMode('move'); setHover(null); setHint(''); };
  const start = (resume = false) => {
    setMobilePanel(null);
    setGearOpen(false); setBattle(resume && saved ? saved : new Battle()); setScreen('battle'); setBusy(false); setPaused(false); setConfirmNew(false); resetMode(); update();
  };
  useEffect(() => {
    if (screen !== 'battle') return;
    try { localStorage.setItem(SAVE_KEY, serialize(battle)); setSaved(restore(serialize(battle))); setStorageMessage('원정이 자동 저장됩니다.'); }
    catch { setStorageMessage('저장 공간을 사용할 수 없어요. 이 화면에서 계속 플레이할 수 있어요.'); }
  }, [battle, revision, screen]);
  useEffect(() => {
    if (screen !== 'battle' || battle.phase !== 'enemy' || paused || help || gearOpen || busy) return;
    const timer = setTimeout(() => { battle.aiStep(); if (battle.lastEvent) lockBriefly(); update(); }, Math.max(650, eventDuration(battle.lastEvent) + 80));
    return () => clearTimeout(timer);
  }, [battle, revision, screen, paused, help, gearOpen, busy]);
  useEffect(() => {
    const stop = () => { if (screen === 'battle' && ['player', 'enemy'].includes(battle.phase)) setPaused(true); };
    const visibility = () => { if (document.hidden) stop(); };
    document.addEventListener('visibilitychange', visibility);
    return () => { document.removeEventListener('visibilitychange', visibility); };
  }, [screen, battle]);
  useEffect(() => () => { if (busyTimer.current) clearTimeout(busyTimer.current); }, []);
  useEffect(() => {
    if (!overlay) return;
    dialog.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();
  }, [overlay, battle.dialogue]);
  function dialogKeys(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { if (gearOpen) setGearOpen(false); else if (help) setHelp(false); else if (paused) setPaused(false); else if (confirmNew) setConfirmNew(false); }
    if (e.key !== 'Tab') return;
    const buttons = [...(dialog.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [])];
    if (!buttons.length) return;
    if (e.shiftKey && document.activeElement === buttons[0]) { e.preventDefault(); buttons.at(-1)?.focus(); }
    else if (!e.shiftKey && document.activeElement === buttons.at(-1)) { e.preventDefault(); buttons[0].focus(); }
  }
  const select = (u: Unit) => {
    if (u.team !== 'ally' || u.hp === 0 || battle.phase !== 'player' || busy || overlay) return;
    battle.selected = u.id; resetMode(); setHover({ x: u.x, y: u.y }); update();
  };
  const lockBriefly = () => {
    setBusy(true); if (busyTimer.current) clearTimeout(busyTimer.current);
    busyTimer.current = setTimeout(() => { setBusy(false); }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 80 : Math.max(120, eventDuration(battle.lastEvent)));
  };
  const actAt = (p: Point) => {
    if (overlay || busy || screen !== 'battle' || battle.phase !== 'player') return;
    const u = battle.at(p);
    if (mode === 'move' && u?.team === 'ally') { select(u); return; }
    if (battle.act(p, mode)) { lockBriefly(); setHint(''); if (mode !== 'move') setMode('move'); update(); }
    else setHint(mode === 'chest' ? '상자의 인접 칸으로 이동하세요. 적이 서 있는 상자는 열 수 없어요.' : mode === 'move' ? '파란 이동 칸을 선택하세요. 이동 후에는 공격하거나 대기할 수 있어요.' : '사거리, 마나와 대상의 상태를 확인하세요.');
  };
  const actor = battle.actor, actorStats = battle.stats(battle.actor), skill = battle.skill(mode), canAct = screen === 'battle' && battle.canAct() && !busy && !overlay;
  const targetTeam = skill?.effect === 'heal' || skill?.effect === 'ward' ? 'ally' : 'enemy';
  const placingTrap=actor.role==='ranger'&&mode==='skill0';
  const nativeTargets = placingTrap || mode === 'move' || mode === 'chest' || mode === 'rescue' || mode === 'cut' || mode === 'ignite' ? [] : battle.units.filter(u => u.hp > 0 && u.team === targetTeam);
  const hovered = hover ? battle.at(hover) : null;
  const stage = STAGES[battle.stage];
  const rescueDialogue = [{speaker:'노아',text:'숲길에 주민 세 분이 남아 있어요. 어두워지기 전에 안전한 길로 안내해야 해요.'},{speaker:'테오',text:'시간은 여덟 차례뿐이야. 내가 적을 막을 테니 나눠서 주민들을 찾아보자.'},{speaker:'아린',text:'주민 옆 칸으로 이동한 뒤 구출하자! 적을 전부 물리치는 것보다 사람들을 먼저 돕는 거야.'}];
  const line = (battle.sideQuest ? rescueDialogue : stage.dialogue)[battle.dialogue];
  const speaker = battle.roster.find(u => u.name === line.speaker);

  return <main className={`ft-app ft-${screen}-screen ${mobilePanel ? `ft-mobile-${mobilePanel}` : ''}`}>
    <header className="ft-header"><button onClick={onExit}><ArrowLeft size={17} />게임 목록</button><span className="ft-brand">별빛 원정대</span><div>{screen === 'battle' && <button disabled={!!overlay} onClick={()=>setGearOpen(true)}>장비·가방</button>}<button onClick={() => setHelp(true)} disabled={screen === 'title' || !!overlay}>게임 방법</button>{screen === 'battle' && <button onClick={() => setPaused(true)} disabled={!!overlay} aria-label="일시 정지"><Pause size={19} /></button>}</div></header>
    {screen === 'battle' && battle.phase === 'camp' ? <CampScreen battle={battle} revision={revision} locked={!!overlay} onGear={()=>setGearOpen(true)} onUpdate={update} onSideQuest={() => { const next=battle.startSideQuest();if(next){setBattle(next);resetMode();update();} }} onDepart={() => { const next = battle.nextStage(); if (next) { setBattle(next); resetMode(); update(); } }} /> : <div className="ft-shell">
      <div className="ft-chapter"><div><span>{screen === 'title' ? '별의 등대를 찾아서' : battle.sideQuest ? '외전 · 별빛 구출 작전' : `${battle.stage>=3?'2부':'1부'} · 제${battle.stage + 1}장 · ${stage.place}`}</span><h1>{screen === 'title' ? '별빛 원정대' : battle.sideQuest ? '숲길의 작은 영웅들' : stage.name}</h1></div>{screen === 'battle' && <div className={`ft-turn ${battle.phase === 'enemy' ? 'is-enemy' : ''}`}><b>{battle.round}</b><span>번째 차례<strong>{battle.phase === 'enemy' ? '적이 움직입니다' : battle.phase === 'player' ? '아군의 차례' : '별빛 원정대'}</strong></span></div>}</div>
      <div className={`ft-layout ${screen === 'title' ? 'ft-title-layout' : ''}`}>
        <section className="ft-field" aria-label={`${stage.place} 전장`}>
          <div className="ft-map-caption"><span>{screen === 'title' ? '여울숲의 오래된 다리' : battle.objective}</span><button onClick={() => setGrid(v => !v)} aria-pressed={grid} aria-label="격자와 높이 표시"><GridFour size={18} /></button></div>
          <BattleCanvas battle={battle} mode={screen === 'title' ? 'move' : mode} hover={hover} grid={grid} revision={revision} canvasRef={board} interactive={screen === 'battle' && !overlay && !busy && battle.phase === 'player'}
            onHover={setHover} onCell={actAt} onCancel={() => { resetMode(); if (battle.undoMove()) update(); }} />
          {screen === 'battle' && <div className="ft-mobile-controls" inert={!!overlay}>
            <label>동료<select aria-label="전장의 동료 선택" value={actor.id} disabled={battle.phase !== 'player' || busy} onChange={e => { const u = battle.allies.find(v => v.id === e.target.value); if (u) select(u); }}>{battle.allies.map(u => <option key={u.id} value={u.id} disabled={u.hp === 0}>{u.name}{u.hp === 0 ? ' · 쓰러짐' : u.acted ? ' · 완료' : ''}</option>)}</select></label>
            <label>행동<select aria-label="전장의 행동 선택" value={mode} disabled={!canAct} onChange={e => { setMode(e.target.value as Mode); setHint(''); }}><option value="move" disabled={actor.moved}>이동</option><option value="attack">공격</option><option value="chest">보물상자 열기</option>{battle.sideQuest&&<option value="rescue">주민 구출</option>}{battle.environmentEnabled&&<><option value="cut" disabled={!battle.targets('cut').length}>다리 끊기</option><option value="push" disabled={!battle.targets('push').length}>밀어내기</option><option value="ignite" disabled={!battle.targets('ignite').length}>불붙이기</option></>}{battle.skills(actor).map((s, i) => <option key={s.name} value={`skill${i}`} disabled={actor.mp < battle.skillCost(`skill${i}` as Mode)}>{s.name} · MP {battle.skillCost(`skill${i}` as Mode)}</option>)}</select></label>
            <button disabled={!canAct} onClick={() => { battle.wait(); resetMode(); update(); }}>대기</button>
            <button disabled={!canAct || !battle.canUndo()} onClick={() => { battle.undoMove(); resetMode(); update(); }} aria-label="전장에서 이동 취소"><ArrowCounterClockwise size={18} /></button>
            <div className="ft-mobile-status" role="status" aria-live="polite"><span>{actor.name} · HP {actor.hp}/{actor.maxHp} · MP {actor.mp}/{actor.maxMp}</span><b>{hint || (battle.phase === 'enemy' ? '적이 움직이고 있어요' : actor.acted ? '다른 동료를 선택하세요' : mode === 'move' ? '파란 칸을 눌러 이동하세요' : mode === 'rescue' ? '인접한 주민 칸을 눌러 구출하세요' : mode === 'chest' ? '인접한 상자를 누르세요' : `${skill?.name ?? '공격'} · 대상을 누르세요`)}</b></div>
            <div className="ft-mobile-actions">
              <button disabled={!canAct || !battle.potions || actor.hp === actor.maxHp} onClick={() => { if (battle.potion()) { lockBriefly(); update(); resetMode(); } }}><Flask size={16} />회복 {battle.potions}</button>
              <button aria-expanded={mobilePanel === 'unit'} aria-controls="ft-unit-panel" onClick={() => setMobilePanel(p => p === 'unit' ? null : 'unit')}>상세</button>
              <button aria-expanded={mobilePanel === 'log'} aria-controls="ft-battle-log" onClick={() => setMobilePanel(p => p === 'log' ? null : 'log')}>기록</button>
              <button className="ft-mobile-end-turn" disabled={battle.phase !== 'player' || !!overlay || busy} onClick={() => { battle.endTurn(); resetMode(); update(); }}>차례 종료</button>
            </div>
          </div>}
          {screen==='battle'&&battle.environmentEnabled&&<TerrainPanel battle={battle} mode={mode} locked={!!overlay||busy} onMode={m=>{setMode(m);setHint('');}} onTarget={actAt} onHover={setHover}/>}
          {battle.bossWarning.length>0&&<p className="ft-boss-warning" role="status">{battle.bossName} {battle.bossPhase}페이즈 · 다음 적 차례에 붉은 칸 공격! 이동하거나 보호 마법으로 대비하세요.</p>}<div className="ft-map-footer"><span><i className="ft-blue" /> 이동 가능</span><span><i className="ft-gold" /> 선택한 동료</span><span><i className="ft-red" /> 공격 범위</span><span>고지에서 공격하면 피해 증가</span></div>
          {screen === 'title' && <div className="ft-title-plaque"><span>별의 등대를 찾아서</span><strong>별빛 원정대</strong><p>제1장 · 여울숲의 약속</p></div>}
        </section>
        {screen === 'title' ? <aside className="ft-travel">
          <h2>별빛 원정대</h2><p>TACTICAL ROLE PLAYING GAME</p>
          <div className="ft-title-party">{battle.allies.map(u => <Portrait key={u.id} role={u.role} />)}</div>
          {saved && <button className="ft-primary" onClick={() => start(true)}>원정 이어하기 <small>제{saved.stage + 1}장 · {saved.phase === 'camp' ? '야영지' : `${saved.round}번째 차례`}</small></button>}
          <button className={saved ? 'ft-secondary' : 'ft-primary'} onClick={() => saved ? setConfirmNew(true) : start()}>새 원정 시작</button><small className="ft-save-note">진행 상황 자동 저장</small>
        </aside> : <aside id="ft-unit-panel" className="ft-inspector" inert={!!overlay}>
          <div className="ft-unit-heading"><Portrait promoted={actor.promoted} role={actor.role} /><div><span>{jobName(actor)||ROLE_LABEL[actor.role]}</span><h2>{actor.name} <small>Lv.{actor.level}</small></h2><p>{actor.hp === 0 ? '전투 불능' : actor.acted ? '행동 완료' : actor.moved ? '이동 완료 · 행동 가능' : '이동과 행동 가능'}</p></div></div>
          <Meter label="HP" value={actor.hp} max={actor.maxHp} /><Meter label="MP" value={actor.mp} max={actor.maxMp} mana />
          <div className="ft-stat-line"><span>공격 <b>{actorStats.attack}</b></span><span>방어 <b>{actorStats.defense}</b></span><span>이동 <b>{actorStats.move}</b></span></div>
          {actor.ward > 0 && <p className="ft-ward"><Shield size={16} />빛의 보호 · 피해 35% 감소</p>}
          <div className="ft-commands" aria-label="동료 행동">
            <button aria-pressed={mode === 'move'} disabled={!canAct || actor.moved} onClick={() => { setMode('move'); setHint(''); }}><Footprints size={21} /><span>이동<small>파란 칸 선택</small></span></button>
            <button aria-pressed={mode === 'attack'} disabled={!canAct} onClick={() => { setMode('attack'); setHint(''); }}><Sword size={21} /><span>공격<small>{battle.attackRange(actor)}칸 이내</small></span></button>
            {battle.skills(actor).map((s, i) => <button key={s.name} aria-pressed={mode === `skill${i}`} disabled={!canAct || actor.mp < battle.skillCost(`skill${i}` as Mode)} onClick={() => { setMode(`skill${i}` as Mode); setHint(''); }}><Sparkle size={21} /><span>{s.name}<small>MP {battle.skillCost(`skill${i}` as Mode)} · {s.range}칸</small></span></button>)}
            <button aria-pressed={mode==='chest'} disabled={!canAct} onClick={()=>{setMode('chest');setHint('상자 칸 또는 아래 상자 목록을 선택하세요. 인접한 상자를 열면 행동 1회를 사용합니다.');}}><TreasureChest size={21}/><span>보물상자<small>인접 1칸 · 행동 1회</small></span></button>
            <button disabled={!canAct || !battle.potions || actor.hp === actor.maxHp} onClick={() => { if (battle.potion()) { lockBriefly(); update(); resetMode(); } }}><Flask size={21} /><span>회복약<small>HP +30 · {battle.potions}개</small></span></button>
            <button disabled={!canAct} onClick={() => { battle.wait(); resetMode(); update(); }}><Hourglass size={21} /><span>대기<small>행동 마치기</small></span></button>
          </div>
          <p className="ft-growth-note">{actor.promoted ? `전직 완료 · ${actor.level>=5 ? JOBS[actor.role]?.hidden.name+' 해금' : 'Lv.5 히든스킬'}` : 'Lv.3 야영지 전직 · Lv.5 히든스킬'}</p><div className="ft-command-help"><b>{mode === 'chest' ? '보물상자를 선택하세요' : mode === 'move' ? '이동할 곳을 선택하세요' : mode === 'attack' ? '공격할 적을 선택하세요' : skill?.name}</b><p>{hint || (mode === 'chest' ? '인접한 상자를 열면 행동 1회를 씁니다. 장비는 캠프에서 장착하세요.' : '') || skill?.description || (mode === 'move' ? '이동 후 공격·마법·아이템 중 한 번 행동할 수 있어요.' : '적을 가리키면 예상 피해를 확인할 수 있어요. 직선으로 3칸 이동한 근접 공격은 돌진이 됩니다.')}</p></div>
          {placingTrap&&<div className="ft-targets" aria-label="덫 설치 위치">{battle.targets(mode).map(p=><button key={key(p)} disabled={!canAct} onClick={()=>actAt(p)}>({p.x+1}, {p.y+1})<small>덫 설치</small></button>)}</div>}
          {nativeTargets.length > 0 && <div className="ft-targets" aria-label="대상 선택">{nativeTargets.map(u => <button key={u.id} disabled={!canAct || !battle.targets(mode).some(t => key(t) === key(u)) || (skill?.effect === 'heal' && u.hp === u.maxHp)} onClick={() => actAt(u)} onMouseEnter={() => setHover(u)}>{u.name}<small>{battle.preview(u, mode)}</small></button>)}</div>}
          {battle.sideQuest&&<div className="ft-rescue-list" aria-label="주민 구출">{battle.civilians.map(v=><button key={v.id} disabled={!canAct||battle.rescued.includes(v.id)} onClick={()=>{if(battle.rescue(v.id)){resetMode();update();}else setHint('주민의 인접 칸으로 이동하세요. 구출은 행동 1회를 사용합니다.');}}>{v.name}<small>{battle.rescued.includes(v.id)?'구출 완료':'인접 칸에서 구출'}</small></button>)}</div>}<div className="ft-chest-list" aria-label="전장의 보물상자">{battle.treasures.map(t=><button key={t.id} disabled={!canAct||!battle.canOpen(t.id)} onClick={()=>{if(battle.openChest(t.id)){resetMode();update();}}}>{t.name}<small>{battle.opened.includes(t.id)?'개봉 완료':battle.canOpen(t.id)?'열기':'가까이 이동'}</small></button>)}</div>
          <div className="ft-action-bottom"><button disabled={!canAct || !battle.canUndo()} onClick={() => { battle.undoMove(); resetMode(); update(); }}><ArrowCounterClockwise size={16} />이동 취소</button><span>EXP {actor.xp} / 80</span></div>
          <button className="ft-primary" disabled={battle.phase !== 'player' || !!overlay || busy} onClick={() => { battle.endTurn(); resetMode(); update(); }}>아군 차례 마치기</button>
        </aside>}
      </div>
      {screen === 'battle' && <section id="ft-battle-log" className="ft-bottom" inert={!!overlay}>
        <div className="ft-party" aria-label="원정대 동료">{battle.allies.map(u => <button key={u.id} className={`${u.id === actor.id ? 'is-selected' : ''} ${u.hp === 0 ? 'is-fallen' : ''}`} aria-pressed={u.id === actor.id} disabled={battle.phase !== 'player' || busy || u.hp === 0} onClick={() => select(u)}><Portrait promoted={u.promoted} role={u.role} /><div><b>{u.name}<small>Lv.{u.level}</small></b><span>{u.hp === 0 ? '전투 불능' : u.acted ? '행동 완료' : `${u.hp} / ${u.maxHp} HP`}</span><div className="ft-mini-meter"><i style={{ width: `${u.hp / u.maxHp * 100}%` }} /></div></div></button>)}</div>
        <div className="ft-report"><div className="ft-report-heading"><b>전투 기록</b><span>{hovered ? `${hovered.name} · HP ${hovered.hp}/${hovered.maxHp}` : hover ? `높이 ${battle.tile(hover).height} · ${mode === 'move' ? '이동 칸 확인' : battle.preview(hover, mode)}` : '동료와 지형을 살펴보세요'}</span></div><p role="status" aria-live="polite">{battle.log.at(-1)}</p><details><summary>이전 기록 보기</summary>{battle.log.slice(0, -1).map((entry, i) => <p key={i}>{entry}</p>)}</details></div>
      </section>}
      <footer className="ft-footer"><span>칸 클릭으로 조작 · 방향키로 칸 선택 · Enter 결정 · Esc 이동 취소</span><span><FloppyDisk size={14} />{storageMessage || '동료를 지휘하는 작은 모험'}</span></footer>
    </div>}
    {!!overlay && <div className={`ft-overlay ${overlay === 'intro' ? 'ft-dialogue-overlay' : overlay === 'gear' ? 'ft-gear-overlay' : ''}`}><div ref={dialog} className={`ft-modal ${overlay === 'intro' ? 'ft-dialogue' : ''}`} role="dialog" aria-modal="true" aria-label={overlay === 'intro' ? `${line.speaker}의 대화` : '원정 안내'} onKeyDown={dialogKeys}>
      {overlay === 'gear' ? <><GearPanel battle={battle} onUpdate={update}/><button className="ft-secondary" onClick={()=>setGearOpen(false)}>장비창 닫기</button></> : overlay === 'intro' ? <><Portrait promoted={speaker?.promoted} role={speaker?.role ?? 'sword'} large /><div className="ft-dialogue-copy"><span>{stage.name}</span><h2>{line.speaker}</h2><p>{line.text}</p><div className="ft-dialogue-actions"><small>{battle.dialogue + 1} / {stage.dialogue.length}</small><button className="ft-primary" onClick={() => { battle.advanceDialogue(); update(); if (battle.phase === 'player') board.current?.focus({ preventScroll: true }); }}>{battle.dialogue === stage.dialogue.length - 1 ? '전투 시작' : '다음 대화'}</button></div></div></>
        : overlay === 'won' ? <><Sparkle className="ft-result-icon" size={45} weight="duotone" /><span className="ft-modal-kicker">제{battle.stage + 1}장 완료</span><h2>{battle.sideQuest?'주민 구출 성공':'전투 승리'}</h2><p>{battle.victoryText}</p><div className="ft-rewards"><span>동료 모두 경험치 +{battle.sideQuest?(battle.stage===0?120:160):25}</span>{!battle.sideQuest&&<span>보물상자 {battle.treasures.filter(t=>battle.opened.includes(t.id)).length} / 3 개봉</span>}{!battle.sideQuest&&<span>{battle.stage===0?'집중의 수정 획득':battle.stage===2?'등대 수호갑 획득':'획득 장비는 캠프에서 장착'}</span>}<span>{battle.stage === 2 ? '별의 등대에 빛을 되찾았어요' : '다음 전투 전 HP·MP 회복'}</span></div><button className="ft-secondary" onClick={()=>setGearOpen(true)}>획득 장비 보기</button><button className="ft-primary" onClick={() => { if(battle.sideQuest){const next=battle.returnFromSideQuest();if(next)setBattle(next);} else if (battle.stage===2||battle.stage===FINAL_STAGE) battle.phase='ending'; else battle.enterCamp(); resetMode(); update(); }}>{battle.sideQuest?'야영지로 귀환':battle.stage === 2 ? '1부를 마치고 다음 이야기' : battle.stage===FINAL_STAGE ? '원정의 끝' : '야영지로 이동'}</button></>
        : overlay === 'lost' ? <><Shield className="ft-result-icon" size={44} /><h2>{battle.sideQuest?'구출 작전 실패':'전투 패배'}</h2>{battle.sideQuest&&<><p>8턴 안에 주민 3명을 구출하세요. 적을 모두 처치해도 구출 임무는 계속됩니다.</p><button className="ft-secondary" onClick={()=>{const next=battle.returnFromSideQuest();if(next){setBattle(next);resetMode();update();}}}>야영지로 귀환</button></>}<p>원정이 잠시 멈췄어요. 회복과 보호 마법을 활용하고, 적이 모였을 때 범위 마법을 사용해 보세요.</p><button className="ft-primary" onClick={() => { setBattle(battle.retryStage()); resetMode(); update(); }}>이 전투 다시 도전</button><button className="ft-secondary" onClick={() => setScreen('title')}>시작 화면으로</button></>
        : overlay === 'ending' ? <><Sparkle className="ft-result-icon" size={48} weight="duotone" /><span className="ft-modal-kicker">{battle.stage===2?'1부 완료 · 바다 건너에서 온 응답':'2부 완료 · 바다를 잇는 별빛'}</span><h2>{battle.stage===2?'우리의 빛은 꺼지지 않아.':'어떤 별도 혼자 남지 않도록.'}</h2><p>{stage.after}</p>{battle.stage===2&&<><p>등대에 돌아온 별빛에 바다 건너 신호가 응답했습니다. 성장과 장비를 이어 새 원정을 떠나세요.</p><button className="ft-primary" onClick={()=>{if(battle.continuePartTwo()){resetMode();update();}}}>2부 · 바다 건너의 별빛으로</button></>}<div className="ft-ending-party">{battle.allies.map(u => <div key={u.id}><Portrait promoted={u.promoted} role={u.role} /><b>{u.name} · Lv.{u.level}</b></div>)}</div><button className="ft-secondary" onClick={()=>setGearOpen(true)}>획득 장비 보기</button><button className="ft-primary" onClick={() => setScreen('title')}>원정을 마치기</button><button className="ft-secondary" onClick={onExit}>게임 목록으로</button></>
        : overlay === 'new' ? <><h2>새 원정을 시작할까요?</h2><p>기존 원정의 저장 기록이 새 이야기로 바뀝니다.</p><button className="ft-primary" onClick={() => start()}>처음부터 시작</button><button className="ft-secondary" onClick={() => setConfirmNew(false)}>돌아가기</button></>
        : overlay === 'help' ? <><h2>동료와 함께 싸우는 법</h2><ol><li>동료를 선택하고 파란 칸으로 이동하세요. 이동 후 한 번 행동할 수 있어요.</li><li>공격이나 마법을 고른 뒤 대상을 선택하세요. 마법은 MP를 소모합니다.</li><li>높은 곳에서 공격하면 피해가 커집니다. 직선 3칸 이동 후 앞의 적을 근접 공격하면 돌진합니다.</li><li>노아의 치유와 보호, 리아의 범위 마법을 활용하세요. 물은 건널 수 없고 동료도 통과할 수 없어요.</li><li>Lv.3부터 야영지에서 전직과 기술 강화를 선택합니다. 전직 후 Lv.5가 되면 히든스킬이 열립니다. 외전에서는 주민 옆으로 이동한 뒤 구출 버튼을 누르세요.</li><li>2부에서는 지형 전술을 사용하세요. 낡은 빈 다리는 옆에서 끊고, 인접 적을 밀어 낙하 피해를 줍니다. 보스는 밀어내기 면역이에요. 점화와 리아의 불꽃 마법은 풀밭을 태웁니다. 불은 아군 차례 종료마다 8 피해를 두 번 주며 아군도 다칩니다.</li><li>보스의 붉은 공격 예고 칸을 피하세요. 체력이 절반 이하가 되면 2페이즈로 강화됩니다.</li><li>모두 행동하면 적의 차례가 됩니다. 일찍 마치려면 ‘아군 차례 마치기’를 누르세요.</li></ol><p>키보드: 전장을 선택한 뒤 방향키로 칸 이동, Enter로 결정. 동료와 명령 버튼은 Tab으로 선택할 수 있어요.</p><button className="ft-primary" onClick={() => { setHelp(false); board.current?.focus({ preventScroll: true }); }}>이제 알겠어요</button></>
        : <><h2>일시 정지</h2><p>진행 상황은 이 브라우저에 저장됩니다.</p><button className="ft-primary" onClick={() => { setPaused(false); board.current?.focus({ preventScroll: true }); }}>계속하기</button><button className="ft-secondary" onClick={() => { setPaused(false); setScreen('title'); }}>시작 화면으로</button></>}
    </div></div>}
  </main>;
}

function Meter({ label, value, max, mana = false }: { label: string; value: number; max: number; mana?: boolean }) {
  return <div className={`ft-meter ${mana ? 'ft-mana' : ''}`}><div><span>{label}</span><b>{value} <small>/ {max}</small></b></div><div className="ft-meter-track"><i style={{ width: `${value / Math.max(1, max) * 100}%` }} /></div></div>;
}
function BattleCanvas({ battle, mode, hover, grid, revision, canvasRef, interactive, onHover, onCell, onCancel }: {
  battle: Battle; mode: Mode; hover: Point | null; grid: boolean; revision: number; canvasRef: React.RefObject<HTMLCanvasElement | null>; interactive: boolean;
  onHover: (p: Point | null) => void; onCell: (p: Point) => void; onCancel: () => void;
}) {
  const eventTime = useRef(0), lastEvent = useRef<Battle['lastEvent']>(null), cursor = useRef<Point>({ x: 2, y: 5 });
  useEffect(() => {
    const canvas = canvasRef.current, c = canvas?.getContext('2d'); if (!canvas || !c) return;
    if (lastEvent.current !== battle.lastEvent) { lastEvent.current = battle.lastEvent; eventTime.current = performance.now(); }
    let frame = 0;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const draw = (now: number) => {
      const elapsed = reduce ? Infinity : now - eventTime.current;
      drawBattle(c, battle, mode, hover, grid, elapsed);
      if (battle.lastEvent && elapsed < eventDuration(battle.lastEvent)) frame = requestAnimationFrame(draw);
    };
    let active = true; draw(performance.now()); void artReady.then(() => { if (active) draw(performance.now()); }); return () => { active = false; cancelAnimationFrame(frame); };
  }, [battle, mode, hover, grid, revision, canvasRef]);
  const position = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const bounds = e.currentTarget.getBoundingClientRect(); return { x: (e.clientX - bounds.left) / bounds.width * VIEW_W, y: (e.clientY - bounds.top) / bounds.height * VIEW_H };
  };
  return <canvas ref={canvasRef} width={VIEW_W} height={VIEW_H} className="ft-canvas" tabIndex={interactive ? 0 : -1}
    aria-label={`전술 전장. 방향키로 칸 선택, Enter로 결정. ${hover ? `${hover.x + 1}열 ${hover.y + 1}행, 높이 ${battle.tile(hover).height}` : '동료와 이동할 칸을 선택하세요.'}`}
    onPointerMove={e => { if (!interactive) return; const p = position(e); const unit = pickUnit(battle, p); const tile = unit ? battle.tile(unit) : pickTile(battle, p); if (key(tile ?? { x: -1, y: -1 }) !== key(hover ?? { x: -1, y: -1 })) onHover(tile); }}
    onPointerLeave={() => onHover(null)} onClick={e => { if (!interactive) return; const bounds = e.currentTarget.getBoundingClientRect(), p = { x: (e.clientX - bounds.left) / bounds.width * VIEW_W, y: (e.clientY - bounds.top) / bounds.height * VIEW_H }; const unit = pickUnit(battle, p), tile = unit ? battle.tile(unit) : pickTile(battle, p); if (tile) { cursor.current = tile; onHover(tile); onCell(tile); } }}
    onFocus={() => { cursor.current = { x: battle.actor.x, y: battle.actor.y }; onHover(cursor.current); }}
    onKeyDown={e => {
      if (!interactive) return;
      const d: Record<string, Point> = { ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 }, ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 } };
      if (d[e.key]) { e.preventDefault(); cursor.current = clampCursor({ x: cursor.current.x + d[e.key].x, y: cursor.current.y + d[e.key].y }); onHover(cursor.current); }
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onCell(cursor.current); }
      if (e.key === 'Escape') { e.preventDefault(); onCancel(); }
    }} />;
}
