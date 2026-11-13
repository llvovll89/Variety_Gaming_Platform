import { useCallback, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import type { GameProps } from '../../platform/types';
import { NextGameActions, ScoreFeedback } from '../../platform/PlaySession';
import { CUSTOM_CHARACTER_ID } from '../../shared/profile/useProfile';
import { safeGetItem, safeSetItem } from '../../shared/storage';
import {
  BOSS_FLOOR, NODE_NAMES, NODE_NOTES, RECORD_KEY, RELICS, SAVE_KEY, SNACKS, SNACK_SLOTS, STATUS_INFO,
  act, availableNodes, checkSnack, createRun, cuesForRunChange, currentFloor, loadRecords, loadRun, recordRun, regionOf, runScore,
  type Command, type MapNode, type Mode, type RunState, type StatusId,
} from './engine';
import CombatView from './ui/CombatView';
import PauseMenu from './ui/PauseMenu';
import MapView, { MapLegend } from './ui/MapView';
import { DeckModal, EventScreen, RestScreen, RewardScreen, ShopScreen, TreasureScreen } from './ui/Screens';
import { Conductor, ENEMY_ART, NightSky, Scenery } from './ui/art';
import { Glyph, NODE_GLYPH, SNACK_GLYPH, STATUS_GLYPH } from './ui/glyphs';
import { CardView, Modal, RelicIcon, Stamp } from './ui/parts';
import { loadSoundSettings, saveSoundSettings, sound, type SoundSettings } from './ui/sound';
import './night-train.css';

type Panel = 'help' | 'deck' | 'relics' | 'menu' | 'map' | null;

function removeSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch { /* storage may be blocked */ }
}

/** Key for "the end-of-fight beat for this stop has been shown". */
const outroKey = (run: RunState) => `${run.path.length}:${run.phase}`;

function HelpContent() {
  return (
    <div className="nt-help">
      <p>새벽역까지 열세 개의 역을 지나는 카드 여행이에요. 노선도에서 다음 역을 고르고, 그림자 승객을 카드로 물리치며 덱을 키워 가세요. 체력이 0이 되면 여행이 끝나고, 다음 여행은 새로운 노선으로 출발해요.</p>
      <h3>전투</h3>
      <ul>
        <li>매 턴 증기 3과 카드 5장을 받아요. 카드 왼쪽 위 구멍의 숫자가 필요한 증기예요.</li>
        <li>카드를 적에게 끌어다 놓거나, 한 번 눌러 고른 뒤 한 번 더 눌러 써요. 적이 여럿이면 고른 다음 적을 눌러요.</li>
        <li>적 머리 위 꼬리표가 다음 행동이에요. 칼 표시 숫자만큼 공격하니 방어를 미리 쌓아 두세요.</li>
        <li>방어는 내 다음 턴이 시작되면 사라지고, 남은 손패는 버린 더미로 가요.</li>
        <li>간식은 증기 없이 언제든 먹을 수 있어요. 가방은 세 칸이에요.</li>
      </ul>
      <h3>상태</h3>
      <ul className="nt-help-status">
        {(Object.keys(STATUS_INFO) as StatusId[]).map(id => <li key={id}><Glyph name={STATUS_GLYPH[id]} size={16} /><span><b>{STATUS_INFO[id].name}</b>{STATUS_INFO[id].desc}</span></li>)}
      </ul>
      <h3>역</h3>
      <p>강적 칸은 위험하지만 유물을 줘요. 침대칸에서는 회복하거나 카드를 강화하고, 매점칸에서는 카드·유물·간식을 사거나 카드를 덜어 낼 수 있어요. 덱이 얇을수록 좋은 카드를 자주 뽑아요.</p>
      <h3>키보드</h3>
      <p>1~9·0 카드 고르기 · Enter 사용 · ←/→ 대상 바꾸기 · E 턴 종료 · D 덱 보기 · Esc 메뉴</p>
      <h3>만든 것들</h3>
      <p>캐릭터·카드·아이콘·배경은 모두 이 게임을 위해 새로 그린 그림이에요. 진행 기록은 이 브라우저에만 저장되고 어디로도 보내지 않아요. 내 사진 캐릭터는 이 탭이 열려 있는 동안만 쓰이고 저장되지 않아요.</p>
      <p>효과음과 기차 주행음은 녹음 파일 없이 브라우저에서 바로 합성해요. 화면을 처음 누르기 전에는 소리가 나지 않고, 상단의 스피커 단추와 메뉴에서 끌 수 있어요.</p>
      <p>서체: Pretendard Variable © Kil Hyung-jin · SIL Open Font License 1.1 · <a href="/fonts/OFL-pretendard.txt" target="_blank" rel="noopener noreferrer">라이선스 전문</a></p>
    </div>
  );
}

function SnackBag({ run, onUse, onDrop, aiming }: { run: RunState; onUse: (index: number) => void; onDrop: (index: number) => void; aiming: number | null }) {
  const [open, setOpen] = useState<number | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (open === null) return;
    const close = (event: PointerEvent) => { if (!wrap.current?.contains(event.target as Node)) setOpen(null); };
    window.addEventListener('pointerdown', close);
    return () => window.removeEventListener('pointerdown', close);
  }, [open]);
  const snack = open !== null ? SNACKS[run.snacks[open]] : undefined;
  const check = open !== null ? checkSnack(run, open) : null;
  const usable = !!check && (check.ok || (snack?.target && run.phase === 'combat'));
  return (
    <div className="nt-snacks" ref={wrap} role="group" aria-label={`간식 가방 ${run.snacks.length}/${SNACK_SLOTS}`}>
      {Array.from({ length: SNACK_SLOTS }, (_, index) => {
        const id = run.snacks[index];
        return (
          <button key={index} type="button" className={`nt-snack${id ? ' is-filled' : ''}${aiming === index || open === index ? ' is-active' : ''}`} disabled={!id}
            aria-label={id ? `${SNACKS[id].name}: ${SNACKS[id].desc}` : '빈 간식 칸'} onClick={() => setOpen(open === index ? null : index)}>
            {id ? <Glyph name={SNACK_GLYPH[id]} size={18} /> : <Glyph name="bag" size={14} />}
          </button>
        );
      })}
      {snack && open !== null && (
        <div className="nt-snack-pop" role="dialog" aria-label={snack.name}>
          <h3>{snack.name}</h3>
          <p>{snack.desc}{!usable && check && !check.ok ? ` (${check.reason})` : ''}</p>
          <div className="nt-row">
            <button type="button" className="nt-btn nt-btn-ink nt-btn-sm" disabled={!usable} onClick={() => { onUse(open); setOpen(null); }}>먹기</button>
            <button type="button" className="nt-btn nt-btn-paper-line nt-btn-sm" onClick={() => { onDrop(open); setOpen(null); }}>버리기</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NightTrainApp({ onExit, launchIntent, profile }: GameProps) {
  const [run, setRun] = useState<RunState | null>(() => (launchIntent === 'resume' ? loadRun(safeGetItem(SAVE_KEY)) : null));
  const [hasSave, setHasSave] = useState(() => loadRun(safeGetItem(SAVE_KEY)) !== null);
  const [records, setRecords] = useState(() => loadRecords(safeGetItem(RECORD_KEY)));
  const [previousBest, setPreviousBest] = useState(records.bestScore);
  const [mode, setMode] = useState<Mode>('normal');
  const [panel, setPanel] = useState<Panel>(null);
  const [saveError, setSaveError] = useState(false);
  const [confirmNew, setConfirmNew] = useState(false);
  const [peek, setPeek] = useState<MapNode | null>(null);
  const [aimSnack, setAimSnack] = useState<number | null>(null);
  // A run loaded from a save should not replay a fight that already ended.
  const [outroDone, setOutroDone] = useState<string | null>(() => (run ? outroKey(run) : null));
  const [soundSettings, setSoundSettings] = useState<SoundSettings>(loadSoundSettings);
  const recorded = useRef<RunState | null>(null);
  const previousRun = useRef<RunState | null>(run);
  const root = useRef<HTMLElement>(null);
  const photo = profile.characterId === CUSTOM_CHARACTER_ID ? profile.characterImage : null;

  const send = useCallback((command: Command) => setRun(current => (current ? act(current, command) : current)), []);

  useEffect(() => {
    if (!run) return;
    if (run.phase === 'victory' || run.phase === 'defeat') {
      removeSave();
      setHasSave(false);
      if (recorded.current === run) return;
      recorded.current = run;
      setPreviousBest(records.bestScore);
      const next = recordRun(records, { won: run.phase === 'victory', floor: currentFloor(run), score: runScore(run) });
      setRecords(next);
      safeSetItem(RECORD_KEY, JSON.stringify(next));
      return;
    }
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(run));
      setSaveError(false);
      setHasSave(true);
    } catch {
      setSaveError(true);
    }
  }, [run, records]);

  useEffect(() => { root.current?.scrollTo({ top: 0 }); setPeek(null); setAimSnack(null); }, [run?.phase]);

  // ── Sound: unlock on the first gesture (autoplay policy), follow settings, pause when hidden ──
  useEffect(() => {
    sound.configure(soundSettings);
    saveSoundSettings(soundSettings);
  }, [soundSettings]);
  useEffect(() => {
    const unlock = () => sound.unlock();
    const visibility = () => (document.hidden ? sound.suspend() : sound.resume());
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      document.removeEventListener('visibilitychange', visibility);
      sound.setAmbientWanted(false);
    };
  }, []);
  useEffect(() => { sound.setAmbientWanted(!!run && (run.phase === 'map' || run.phase === 'combat')); }, [run?.phase, run]);
  useEffect(() => {
    cuesForRunChange(previousRun.current, run).forEach((cue, i) => sound.play(cue, 0.7, i * 0.12));
    previousRun.current = run;
  }, [run]);
  const toggleSfx = () => setSoundSettings(s => ({ ...s, sfx: !s.sfx }));
  const toggleAmbient = () => setSoundSettings(s => ({ ...s, ambient: !s.ambient }));
  // A soft tick for ordinary buttons; cards, enemies and turn controls have their own sounds.
  const tapCapture = (event: ReactMouseEvent) => {
    const button = (event.target as HTMLElement).closest('button');
    if (button && !button.disabled && !button.closest('.nt-card, .nt-enemy-button, .nt-end, .nt-node')) sound.play('tap');
  };

  const start = (chosen: Mode) => {
    removeSave();
    recorded.current = null;
    setConfirmNew(false);
    setPanel(null);
    setOutroDone(null);
    setRun(createRun((Date.now() ^ Math.floor(Math.random() * 2 ** 31)) >>> 0, chosen));
  };
  const resume = () => {
    const saved = loadRun(safeGetItem(SAVE_KEY));
    if (saved) { setOutroDone(outroKey(saved)); setRun(saved); } else setHasSave(false);
  };
  const toTitle = () => { setPanel(null); setRun(null); };

  const eatSnack = (index: number) => {
    if (!run) return;
    const id = run.snacks[index];
    if (run.phase === 'combat' && SNACKS[id]?.target && checkSnack(run, index).ok === false) { setAimSnack(index); return; }
    send({ t: 'useSnack', index });
  };

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
      if (/INPUT|TEXTAREA|SELECT/.test((event.target as HTMLElement).tagName)) return;
      if (!run || panel || document.querySelector('dialog[open]')) return;
      if (event.key === 'Escape') { event.preventDefault(); setPanel('menu'); }
      else if (event.key.toLowerCase() === 'd') { event.preventDefault(); setPanel('deck'); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  const onEnded = useCallback(() => setOutroDone(run ? outroKey(run) : null), [run]);

  const finished = !!run && (run.phase === 'victory' || run.phase === 'defeat');
  const inOutro = !!run && !!run.combat && run.phase !== 'combat' && run.phase !== 'map' && outroDone !== outroKey(run);
  const showCombat = !!run && !!run.combat && (run.phase === 'combat' || inOutro);
  const ending = run && inOutro ? (run.phase === 'defeat' ? 'lose' : 'win') : null;
  const floor = run ? currentFloor(run) : 0;
  const region = regionOf(Math.min(floor, BOSS_FLOOR));
  const nextStops = run && run.phase === 'map' ? availableNodes(run.map, run.path) : [];
  const shownStop = peek ?? (nextStops.length === 1 ? nextStops[0] : null);

  return (
    <main className="nt-app" ref={root} onClickCapture={tapCapture}>
      <NightSky />
      <div className="nt-shell">
        <header className="nt-header">
          <button type="button" className="nt-brand" onClick={() => (run && !finished ? setPanel('menu') : toTitle())} aria-label="별빛 야간열차 메뉴">
            <span className="nt-brand-mark"><Glyph name="locomotive" size={22} /></span>
            <span className="nt-brand-text"><b>별빛 야간열차</b><small>NIGHT EXPRESS</small></span>
          </button>
          {run && !finished ? (
            <div className="nt-hud">
              <span className="nt-stat nt-stat-hp" role="img" aria-label={`체력 ${run.hp} / ${run.maxHp}`}>
                <Glyph name="heart" size={18} />
                <span className="nt-stat-stack"><b>{run.hp}<small>/{run.maxHp}</small></b><span className="nt-hp-mini"><span style={{ width: `${(run.hp / run.maxHp) * 100}%` }} /></span></span>
              </span>
              <span className="nt-stat nt-stat-gold" role="img" aria-label={`골드 ${run.gold}`}><Glyph name="coin" size={18} /><b>{run.gold}</b></span>
              <span className="nt-stat nt-stat-floor" role="img" aria-label={`${Math.min(floor, BOSS_FLOOR + 1)}번째 역, ${region.name}`}>
                <Glyph name="route" size={18} />
                <span className="nt-stat-stack"><b>{Math.min(floor, BOSS_FLOOR + 1)}<small>/{BOSS_FLOOR + 1}</small></b><small>{region.name}</small></span>
              </span>
              <SnackBag run={run} aiming={aimSnack} onUse={eatSnack} onDrop={index => send({ t: 'dropSnack', index })} />
              <button type="button" className="nt-relic-strip" onClick={() => setPanel('relics')} aria-label={`유물 ${run.relics.length}개 보기`}>
                {run.relics.slice(0, 5).map(id => <span key={id} title={`${RELICS[id].name}: ${RELICS[id].desc}`}><RelicIcon id={id} size={18} /></span>)}
                {run.relics.length > 5 && <small>+{run.relics.length - 5}</small>}
              </button>
              <button type="button" className="nt-tool" onClick={() => setPanel('deck')} aria-label={`덱 ${run.deck.length}장 보기`}><Glyph name="deck" size={18} /><span className="nt-tool-count">{run.deck.length}</span></button>
              {run.phase !== 'map' && <button type="button" className="nt-tool" onClick={() => setPanel('map')} aria-label="노선도 보기"><Glyph name="route" size={18} /></button>}
              <button type="button" className="nt-tool nt-tool-sound" onClick={toggleSfx} aria-pressed={soundSettings.sfx} aria-label={soundSettings.sfx ? '효과음 끄기' : '효과음 켜기'}><Glyph name={soundSettings.sfx ? 'sound' : 'mute'} size={18} /></button>
              <button type="button" className="nt-tool" onClick={() => setPanel('menu')} aria-label="메뉴"><Glyph name="menu" size={18} /></button>
            </div>
          ) : (
            <div className="nt-hud">
              <button type="button" className="nt-tool" onClick={toggleSfx} aria-pressed={soundSettings.sfx} aria-label={soundSettings.sfx ? '효과음 끄기' : '효과음 켜기'}><Glyph name={soundSettings.sfx ? 'sound' : 'mute'} size={18} /></button>
              <button type="button" className="nt-tool" onClick={() => setPanel('help')} aria-label="게임 방법"><Glyph name="book" size={18} /></button>
              <button type="button" className="nt-tool" onClick={onExit} aria-label="게임 목록으로"><Glyph name="home" size={18} /></button>
            </div>
          )}
        </header>
        {saveError && <p className="nt-banner" role="alert">이 브라우저에서는 저장이 막혀 있어요. 창을 닫으면 진행이 사라집니다.</p>}

        {!run ? (
          <section className="nt-title" aria-labelledby="nt-title-heading">
            <div>
              <div className="nt-timetable" aria-label="운행 정보">
                <span>열차<b>별빛 7호</b></span><span>출발<b>23:58</b></span><span>종착<b>새벽역</b></span><span>정차<b>13개 역</b></span>
              </div>
              <h1 id="nt-title-heading">별빛<br /><em>야간</em>열차</h1>
              <p className="nt-title-lead">그림자 승객이 몰래 올라탄 마지막 밤 열차. 견습 차장이 되어 카드 한 장 한 장으로 객차를 지키고, 새벽이 오기 전에 종착역에 닿으세요.</p>
              <div className="nt-pass">
                <div className="nt-pass-main">
                  <div className="nt-pass-head"><b>승차권</b><span>NIGHT EXPRESS · No.{String(records.runs + 1).padStart(4, '0')}</span></div>
                  <div className="nt-fare" role="radiogroup" aria-label="좌석 등급(난이도)">
                    <button type="button" role="radio" aria-checked={mode === 'normal'} onClick={() => setMode('normal')}><b>일반석</b><small>체력 70 · 정석 난이도</small></button>
                    <button type="button" role="radio" aria-checked={mode === 'easy'} onClick={() => setMode('easy')}><b>침대석</b><small>체력 85 · 적 체력 -25%</small></button>
                  </div>
                </div>
                <div className="nt-pass-stub">
                  <small>{mode === 'easy' ? '침대석 · 여유' : '일반석 · 보통'}</small>
                  <button type="button" className="nt-btn nt-btn-ink" onClick={() => (hasSave ? setConfirmNew(true) : start(mode))}><Glyph name="play" size={16} />출발</button>
                </div>
              </div>
              <div className="nt-title-more">
                {hasSave && <button type="button" className="nt-btn nt-btn-brass" onClick={resume}><Glyph name="retry" size={18} />이어서 타기</button>}
                <button type="button" className="nt-text-btn" onClick={() => setPanel('help')}>게임 방법</button>
                <button type="button" role="switch" aria-checked={soundSettings.ambient} className="nt-text-btn" onClick={toggleAmbient}>기차 주행음 {soundSettings.ambient ? '켬' : '끔'}</button>
              </div>
              <table className="nt-log">
                <caption>운행 기록</caption>
                <tbody>
                  <tr><th scope="row">탑승</th><td>{records.runs}회</td></tr>
                  <tr><th scope="row">새벽역 도착</th><td>{records.wins}회</td></tr>
                  <tr><th scope="row">가장 멀리 간 역</th><td>{records.bestFloor ? `${records.bestFloor}번째 역` : '—'}</td></tr>
                  <tr><th scope="row">최고 점수</th><td>{records.bestScore || '—'}</td></tr>
                </tbody>
              </table>
            </div>
            <div className="nt-poster" aria-hidden="true">
              <div className="nt-poster-frame">
                <div className="nt-poster-glass">
                  <div className="nt-poster-moon" />
                  <Scenery />
                  <div className="nt-poster-cast">
                    <span className="nt-poster-hero"><Conductor photo={photo} /></span>
                    <span className="nt-poster-foe">{ENEMY_ART.ticketless()}</span>
                  </div>
                </div>
              </div>
              <div className="nt-poster-caption"><span>별빛선 · STARLIGHT LINE</span><span>운행 23:58 — 05:12</span></div>
              <div className="nt-poster-cards">
                {(['lantern-flash', 'umbrella', 'shooting-star'] as const).map((id, index) => (
                  <span key={id} style={{ ['--r' as string]: `${(index - 1) * 8}deg` }}><CardView card={{ uid: -1 - index, id, up: false }} size="compact" /></span>
                ))}
              </div>
            </div>
          </section>
        ) : showCombat ? (
          <CombatView run={run} onCommand={send} photo={photo} locked={panel !== null} ending={ending} onEnded={onEnded}
            aimSnack={aimSnack} onCancelSnack={() => setAimSnack(null)} />
        ) : run.phase === 'map' ? (
          <section className="nt-map-layout" aria-label="노선도">
            <div className="nt-map-aside">
              <div className="nt-board nt-sheet">
                <p className="nt-modal-kicker">{region.name} · {run.path.length === 0 ? '출발 준비' : `${floor}번째 역 통과`}</p>
                <h1>다음 역을 고르세요</h1>
                <p>{region.note}. 검은 테두리 역으로만 갈 수 있어요.</p>
                <div className="nt-next" aria-live="polite">
                  {shownStop ? (
                    <>
                      <div className="nt-next-head"><Stamp glyph={NODE_GLYPH[shownStop.type]} size={20} /><span><small>{shownStop.floor === BOSS_FLOOR ? '종착역' : `${shownStop.floor + 1}번째 역`}</small><b>{NODE_NAMES[shownStop.type]}</b></span></div>
                      <p>{NODE_NOTES[shownStop.type]}</p>
                    </>
                  ) : <p>역에 마우스를 올리면 무엇이 있는지 알려 드려요. 갈 수 있는 역 {nextStops.length}곳.</p>}
                </div>
              </div>
              <MapLegend />
            </div>
            <div className="nt-map-sheet nt-sheet">
              <div className="nt-map-title"><h2>별빛선 노선도</h2><span>STARLIGHT LINE · 13 STATIONS</span></div>
              <MapView run={run} onCommand={send} locked={panel !== null} onPeek={setPeek} />
            </div>
          </section>
        ) : run.phase === 'reward' ? <RewardScreen run={run} send={send} />
          : run.phase === 'rest' ? <RestScreen run={run} send={send} />
            : run.phase === 'shop' ? <ShopScreen run={run} send={send} />
              : run.phase === 'event' ? <EventScreen run={run} send={send} />
                : run.phase === 'treasure' ? <TreasureScreen run={run} send={send} />
                  : null}
      </div>

      {finished && run && !inOutro && !panel && (
        <Modal label={run.phase === 'victory' ? '새벽역 도착' : '여행 종료'}>
          <div className="nt-result-art" aria-hidden="true">{run.phase === 'victory' ? <Conductor photo={photo} /> : ENEMY_ART['black-engine']()}</div>
          <p className="nt-modal-kicker">{run.phase === 'victory' ? '종착역 · 새벽역 05:12' : `${floor}번째 역 · 운행 중단`}</p>
          <h2>{run.phase === 'victory' ? '새벽이 밝았어요' : '열차가 멈춰 섰어요'}</h2>
          <p>{run.phase === 'victory' ? '검은 기관차를 물리치고 모든 승객을 새벽역에 내려 줬어요.' : '다음 여행은 다른 노선, 다른 카드로 시작해요.'}</p>
          <dl className="nt-result-stats">
            <div><dt>점수</dt><dd>{runScore(run)}</dd></div>
            <div><dt>이긴 전투</dt><dd>{run.stats.battles}</dd></div>
            <div><dt>준 피해</dt><dd>{run.stats.damageDealt}</dd></div>
            <div><dt>덱</dt><dd>{run.deck.length}장</dd></div>
          </dl>
          <ScoreFeedback score={runScore(run)} previousBest={previousBest} />
          <div className="nt-modal-actions">
            <button type="button" className="nt-btn nt-btn-ink" onClick={() => start(run.mode)}><Glyph name="retry" size={18} />새 승차권으로 출발</button>
            <button type="button" className="nt-btn nt-btn-paper-line" onClick={() => setPanel('deck')}>마지막 덱 보기</button>
          </div>
          <NextGameActions />
        </Modal>
      )}

      {panel === 'help' && <Modal label="게임 방법" onClose={() => setPanel(null)} wide><p className="nt-modal-kicker">차장 수첩</p><h2>게임 방법</h2><HelpContent /></Modal>}
      {panel === 'deck' && run && <DeckModal deck={run.deck} kicker={`내 덱 · ${run.deck.length}장`} title="지금 들고 있는 카드" onClose={() => setPanel(null)} />}
      {panel === 'map' && run && (
        <Modal label="노선도" onClose={() => setPanel(null)} wide>
          <p className="nt-modal-kicker">별빛선 노선도</p><h2>지나온 길과 남은 길</h2>
          <div className="nt-map-modal"><MapView run={run} readOnly /></div>
        </Modal>
      )}
      {panel === 'relics' && run && (
        <Modal label="유물" onClose={() => setPanel(null)}>
          <p className="nt-modal-kicker">유물 {run.relics.length}개</p><h2>가방 속 유물</h2>
          <ul className="nt-relic-list">
            {run.relics.map(id => <li key={id}><RelicIcon id={id} size={24} /><span><b>{RELICS[id].name}</b><small>{RELICS[id].desc}</small></span></li>)}
          </ul>
        </Modal>
      )}
      {panel === 'menu' && run && (
        <PauseMenu run={run} sound={soundSettings} onResume={() => setPanel(null)} onToggleSfx={toggleSfx} onToggleAmbient={toggleAmbient}
          onHelp={() => setPanel('help')} onMap={() => setPanel('map')} onTitle={toTitle} onExit={onExit} />
      )}
      {confirmNew && (
        <Modal label="새 여행 확인" onClose={() => setConfirmNew(false)}>
          <p className="nt-modal-kicker">아직 쓰지 않은 승차권이 있어요</p>
          <h2>새로 출발할까요?</h2>
          <p>지금 저장된 여행은 사라져요.</p>
          <div className="nt-modal-actions">
            <button type="button" className="nt-btn nt-btn-ink" onClick={() => start(mode)}>새로 출발</button>
            <button type="button" className="nt-btn nt-btn-paper-line" onClick={() => { setConfirmNew(false); resume(); }}>이어서 타기</button>
          </div>
        </Modal>
      )}
    </main>
  );
}
