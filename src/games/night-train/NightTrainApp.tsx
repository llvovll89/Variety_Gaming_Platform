import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowCounterClockwise, BookOpen, Cards, Coins, Heart, House, List, MapTrifold, Play, SignOut, Train } from '@phosphor-icons/react';
import type { GameProps } from '../../platform/types';
import { NextGameActions, ScoreFeedback } from '../../platform/PlaySession';
import { CUSTOM_CHARACTER_ID } from '../../shared/profile/useProfile';
import { safeGetItem, safeSetItem } from '../../shared/storage';
import {
  BOSS_FLOOR, CARDS, RECORD_KEY, RELICS, SAVE_KEY, STATUS_INFO, act, createRun, currentFloor, loadRecords, loadRun, recordRun, runScore,
  type Command, type Mode, type RunState, type StatusId,
} from './engine';
import CombatView from './ui/CombatView';
import MapView, { MapLegend } from './ui/MapView';
import { DeckModal, EventScreen, RestScreen, RewardScreen, ShopScreen, TreasureScreen } from './ui/Screens';
import { Conductor, ENEMY_ART, NightSky } from './ui/art';
import { Modal, RelicIcon } from './ui/parts';
import './night-train.css';

type Panel = 'help' | 'deck' | 'relics' | 'menu' | 'map' | null;

function removeSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch { /* storage may be blocked */ }
}

function HelpContent() {
  return (
    <div className="nt-help">
      <p>새벽역까지 열세 개의 역을 지나는 카드 여행이에요. 노선도에서 다음 역을 고르고, 그림자 승객을 카드로 물리쳐 덱을 키워 가세요. 체력이 0이 되면 여행이 끝나고, 처음부터 새로운 노선으로 다시 출발해요.</p>
      <h3>전투</h3>
      <ul>
        <li>매 턴 에너지 3과 카드 5장을 받아요. 카드 왼쪽 위 숫자가 필요한 에너지예요.</li>
        <li>카드를 한 번 누르면 고르고, 한 번 더 누르면 사용해요. 적이 여럿이면 카드를 고른 뒤 적을 눌러요.</li>
        <li>적 머리 위의 말풍선이 다음 행동이에요. 칼 모양 숫자만큼 공격하니 방어를 미리 쌓아 두세요.</li>
        <li>방어는 내 다음 턴이 시작되면 사라져요. 남은 카드는 턴이 끝나면 버린 카드 더미로 가요.</li>
      </ul>
      <h3>상태</h3>
      <ul className="nt-help-status">
        {(Object.keys(STATUS_INFO) as StatusId[]).map(id => <li key={id}><b>{STATUS_INFO[id].name}</b> {STATUS_INFO[id].desc}</li>)}
      </ul>
      <h3>역 종류</h3>
      <p>강적 칸은 위험하지만 유물을 줘요. 침대칸에서는 회복하거나 카드를 강화하고, 매점칸에서는 카드·유물을 사거나 카드를 뺄 수 있어요. 덱이 얇을수록 좋은 카드를 자주 뽑아요.</p>
      <h3>키보드</h3>
      <p>1~9·0 카드 고르기 · Enter 사용 · ←/→ 대상 바꾸기 · E 턴 종료 · D 덱 보기 · Esc 메뉴</p>
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
  const recorded = useRef<RunState | null>(null);
  const root = useRef<HTMLElement>(null);
  const photo = profile.characterId === CUSTOM_CHARACTER_ID ? profile.characterImage : null;

  const send = useCallback((command: Command) => setRun(current => (current ? act(current, command) : current)), []);

  // Autosave after every change, and record finished runs exactly once.
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

  useEffect(() => { root.current?.scrollTo({ top: 0 }); }, [run?.phase]);

  const start = (chosen: Mode) => {
    removeSave();
    recorded.current = null;
    setConfirmNew(false);
    setPanel(null);
    setRun(createRun((Date.now() ^ Math.floor(Math.random() * 2 ** 31)) >>> 0, chosen));
  };
  const resume = () => {
    const saved = loadRun(safeGetItem(SAVE_KEY));
    if (saved) setRun(saved);
    else setHasSave(false);
  };
  const toTitle = () => { setPanel(null); setRun(null); };

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

  const finished = run && (run.phase === 'victory' || run.phase === 'defeat');
  const floor = run ? currentFloor(run) : 0;

  return (
    <main className="nt-app" ref={root}>
      <NightSky />
      <div className="nt-shell">
        <header className="nt-header">
          <button type="button" className="nt-brand" onClick={() => (run && !finished ? setPanel('menu') : toTitle())} aria-label="별빛 야간열차 메뉴">
            <span className="nt-brand-mark"><Train size={22} weight="fill" aria-hidden="true" /></span>
            <span>별빛 야간열차<small>새벽역까지 카드 원정</small></span>
          </button>
          {run && !finished ? (
            <div className="nt-hud">
              <span className="nt-hud-item nt-hud-hp" aria-label={`체력 ${run.hp} / ${run.maxHp}`}><Heart size={16} weight="fill" aria-hidden="true" />{run.hp}<small>/{run.maxHp}</small></span>
              <span className="nt-hud-item nt-hud-gold" aria-label={`골드 ${run.gold}`}><Coins size={16} weight="fill" aria-hidden="true" />{run.gold}</span>
              <span className="nt-hud-item" aria-label={`${Math.min(floor, BOSS_FLOOR + 1)}번째 역, 전체 ${BOSS_FLOOR + 1}역`}><MapTrifold size={16} weight="fill" aria-hidden="true" />{Math.min(floor, BOSS_FLOOR + 1)}<small>/{BOSS_FLOOR + 1}역</small></span>
              <button type="button" className="nt-hud-relics" onClick={() => setPanel('relics')} aria-label={`유물 ${run.relics.length}개 보기`}>
                {run.relics.slice(0, 6).map(id => <span key={id} title={`${RELICS[id].name}: ${RELICS[id].desc}`}><RelicIcon id={id} size={18} /></span>)}
                {run.relics.length > 6 && <small>+{run.relics.length - 6}</small>}
              </button>
              <button type="button" className="nt-icon-button" onClick={() => setPanel('deck')} aria-label={`덱 ${run.deck.length}장 보기`}><Cards size={20} aria-hidden="true" /><span className="nt-icon-count">{run.deck.length}</span></button>
              {run.phase !== 'map' && <button type="button" className="nt-icon-button" onClick={() => setPanel('map')} aria-label="노선도 보기"><MapTrifold size={20} aria-hidden="true" /></button>}
              <button type="button" className="nt-icon-button" onClick={() => setPanel('menu')} aria-label="메뉴"><List size={20} aria-hidden="true" /></button>
            </div>
          ) : (
            <div className="nt-hud">
              <button type="button" className="nt-icon-button" onClick={() => setPanel('help')} aria-label="게임 방법"><BookOpen size={20} aria-hidden="true" /></button>
              <button type="button" className="nt-icon-button" onClick={onExit} aria-label="게임 목록으로"><House size={20} aria-hidden="true" /></button>
            </div>
          )}
        </header>
        {saveError && <p className="nt-banner" role="alert">이 브라우저에서는 저장이 막혀 있어요. 창을 닫으면 진행이 사라집니다.</p>}

        {!run ? (
          <section className="nt-title" aria-labelledby="nt-title-heading">
            <div className="nt-title-copy">
              <p className="nt-kicker">로그라이크 덱빌딩 · 13개 역</p>
              <h1 id="nt-title-heading">별빛<br />야간열차</h1>
              <p className="nt-title-text">그림자 승객이 몰래 올라탄 마지막 밤 열차.<br />견습 차장이 되어 카드로 객차를 지키고, 새벽역까지 달려요.</p>
              <div className="nt-mode" role="radiogroup" aria-label="난이도">
                <button type="button" role="radio" aria-checked={mode === 'normal'} className={mode === 'normal' ? 'is-on' : ''} onClick={() => setMode('normal')}><b>보통</b><small>체력 70 · 정석 난이도</small></button>
                <button type="button" role="radio" aria-checked={mode === 'easy'} className={mode === 'easy' ? 'is-on' : ''} onClick={() => setMode('easy')}><b>여유</b><small>체력 85 · 적 체력 -20%</small></button>
              </div>
              <div className="nt-title-actions">
                <button type="button" className="nt-primary" onClick={() => (hasSave ? setConfirmNew(true) : start(mode))}><Play size={18} weight="fill" aria-hidden="true" />새 여행 출발</button>
                {hasSave && <button type="button" className="nt-secondary" onClick={resume}><ArrowCounterClockwise size={18} aria-hidden="true" />이어서 하기</button>}
                <button type="button" className="nt-link-button" onClick={() => setPanel('help')}>게임 방법</button>
              </div>
              <dl className="nt-records">
                <div><dt>여행</dt><dd>{records.runs}회</dd></div>
                <div><dt>새벽 도착</dt><dd>{records.wins}회</dd></div>
                <div><dt>최고 도달</dt><dd>{records.bestFloor ? `${records.bestFloor}역` : '-'}</dd></div>
                <div><dt>최고 점수</dt><dd>{records.bestScore || '-'}</dd></div>
              </dl>
            </div>
            <div className="nt-title-scene" aria-hidden="true">
              <div className="nt-window">
                <div className="nt-window-cast">
                  <span className="nt-cast-hero"><Conductor photo={photo} /></span>
                  <span className="nt-cast-foe">{ENEMY_ART.ticketless()}</span>
                  <span className="nt-cast-foe nt-cast-small">{ENEMY_ART.moth()}</span>
                </div>
              </div>
              <div className="nt-title-cards">
                {(['lantern-flash', 'umbrella', 'shooting-star'] as const).map((id, index) => (
                  <span key={id} className={`nt-mini-card nt-card-${CARDS[id].type}`} style={{ ['--r' as string]: `${(index - 1) * 9}deg` }}>
                    <b>{CARDS[id].cost}</b>{CARDS[id].name}
                  </span>
                ))}
              </div>
            </div>
          </section>
        ) : run.phase === 'map' ? (
          <section className="nt-map-layout" aria-label="노선도">
            <div className="nt-map-side">
              <p className="nt-kicker">{run.path.length === 0 ? '출발 준비' : `${floor}번째 역 통과`}</p>
              <h1>다음 역을 고르세요</h1>
              <p className="nt-muted">빛나는 역으로만 갈 수 있어요. 위로 갈수록 새벽역에 가까워집니다.</p>
              <MapLegend />
            </div>
            <MapView run={run} onCommand={send} locked={panel !== null} />
          </section>
        ) : run.phase === 'combat' && run.combat ? (
          <CombatView run={run} onCommand={send} photo={photo} locked={panel !== null} onOpenDeck={() => setPanel('deck')} />
        ) : run.phase === 'reward' ? <RewardScreen run={run} send={send} />
          : run.phase === 'rest' ? <RestScreen run={run} send={send} />
            : run.phase === 'shop' ? <ShopScreen run={run} send={send} />
              : run.phase === 'event' ? <EventScreen run={run} send={send} />
                : run.phase === 'treasure' ? <TreasureScreen run={run} send={send} />
                  : null}
      </div>

      {finished && run && !panel && (
        <Modal label={run.phase === 'victory' ? '새벽역 도착' : '여행 종료'}>
          <div className="nt-result-art" aria-hidden="true">{run.phase === 'victory' ? <Conductor photo={photo} /> : ENEMY_ART['black-engine']()}</div>
          <p className="nt-modal-kicker">{run.phase === 'victory' ? '종착역 · 새벽역' : `${floor}번째 역에서 멈췄어요`}</p>
          <h2>{run.phase === 'victory' ? '새벽이 밝았어요!' : '열차가 멈춰 섰어요'}</h2>
          <p>{run.phase === 'victory' ? '검은 기관차를 물리치고 모든 승객을 무사히 새벽역에 내려 줬어요.' : '다음 여행에서는 다른 노선과 다른 카드로 도전해 보세요.'}</p>
          <dl className="nt-result-stats">
            <div><dt>점수</dt><dd>{runScore(run)}</dd></div>
            <div><dt>이긴 전투</dt><dd>{run.stats.battles}</dd></div>
            <div><dt>준 피해</dt><dd>{run.stats.damageDealt}</dd></div>
            <div><dt>덱</dt><dd>{run.deck.length}장</dd></div>
          </dl>
          <ScoreFeedback score={runScore(run)} previousBest={previousBest} />
          <div className="nt-modal-actions">
            <button type="button" className="nt-primary" onClick={() => start(run.mode)}><ArrowCounterClockwise size={18} aria-hidden="true" />새 여행 출발</button>
            <button type="button" className="nt-secondary" onClick={() => { setPanel('deck'); }}>마지막 덱 보기</button>
          </div>
          <NextGameActions />
        </Modal>
      )}

      {panel === 'help' && <Modal label="게임 방법" onClose={() => setPanel(null)} wide><p className="nt-modal-kicker">차장 수첩</p><h2>게임 방법</h2><HelpContent /></Modal>}
      {panel === 'deck' && run && <DeckModal deck={run.deck} kicker={`내 덱 · ${run.deck.length}장`} title="지금 들고 있는 카드" onClose={() => setPanel(null)} />}
      {panel === 'map' && run && (
        <Modal label="노선도" onClose={() => setPanel(null)} wide>
          <p className="nt-modal-kicker">노선도</p><h2>지나온 길과 남은 길</h2>
          <div className="nt-map-modal"><MapView run={run} readOnly /></div>
        </Modal>
      )}
      {panel === 'relics' && run && (
        <Modal label="유물" onClose={() => setPanel(null)}>
          <p className="nt-modal-kicker">유물 {run.relics.length}개</p><h2>가방 속 유물</h2>
          <ul className="nt-relic-list">
            {run.relics.map(id => <li key={id}><RelicIcon id={id} size={26} /><span><b>{RELICS[id].name}</b><small>{RELICS[id].desc}</small></span></li>)}
          </ul>
        </Modal>
      )}
      {panel === 'menu' && run && (
        <Modal label="메뉴" onClose={() => setPanel(null)}>
          <p className="nt-modal-kicker">잠깐 멈춤 · 진행은 자동 저장돼요</p>
          <h2>열차는 기다려 줄게요</h2>
          <div className="nt-modal-actions is-column">
            <button type="button" className="nt-primary" onClick={() => setPanel(null)}><Play size={18} weight="fill" aria-hidden="true" />계속하기</button>
            <button type="button" className="nt-secondary" onClick={() => setPanel('help')}><BookOpen size={18} aria-hidden="true" />게임 방법</button>
            <button type="button" className="nt-secondary" onClick={toTitle}><Train size={18} aria-hidden="true" />시작 화면으로</button>
            <button type="button" className="nt-secondary" onClick={onExit}><SignOut size={18} aria-hidden="true" />게임 목록으로</button>
          </div>
        </Modal>
      )}
      {confirmNew && (
        <Modal label="새 여행 확인" onClose={() => setConfirmNew(false)}>
          <p className="nt-modal-kicker">저장된 여행이 있어요</p>
          <h2>새로 출발할까요?</h2>
          <p>지금 저장된 여행은 사라져요.</p>
          <div className="nt-modal-actions">
            <button type="button" className="nt-primary" onClick={() => start(mode)}>새로 출발</button>
            <button type="button" className="nt-secondary" onClick={() => { setConfirmNew(false); resume(); }}>이어서 하기</button>
          </div>
        </Modal>
      )}
    </main>
  );
}
