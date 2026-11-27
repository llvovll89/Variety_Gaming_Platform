import { useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties } from 'react';
import { ArrowLeftIcon } from '@phosphor-icons/react/dist/icons/ArrowLeft';
import { PauseIcon } from '@phosphor-icons/react/dist/icons/Pause';
import { QuestionIcon } from '@phosphor-icons/react/dist/icons/Question';
import { useRecords } from '../../platform/meta/api';
import { hashSeed, localDateKey, mulberry32 } from '../../platform/meta/daily';
import { hasRewards, RewardStrip } from '../../platform/meta/RewardStrip';
import type { RunRewards } from '../../platform/meta/types';
import type { GameProps } from '../../platform/types';
import { GameDialog } from '../../shared/kit/GameDialog';
import { HelpDialog } from '../../shared/kit/HelpDialog';
import { PauseDialog } from '../../shared/kit/PauseDialog';
import { ResultPanel } from '../../shared/kit/ResultPanel';
import { createSnapshotStore } from '../../shared/kit/snapshotStore';
import { keyOf } from '../../shared/kit/keys';
import { settingsStore } from '../../shared/kit/settings';
import { haptic } from '../../shared/kit/haptics';
import { useAutoPause } from '../../shared/kit/useAutoPause';
import { usePlayClock } from '../../shared/kit/usePlayClock';
import { usePlayReport } from '../../shared/kit/usePlayReport';
import { useUISnapshot } from '../../shared/hooks/useUISnapshot';
import { createSong, DEFAULT_LEVEL, isLevel, LEVEL_IDS, LEVELS, maxScore, praise, settle, startPlay, tap, type LevelId, type PlayState } from './engine';
import { FRIEND_NAMES, ForestFriend, LANE_COLORS } from './ForestFriends';
import { beatAt, chordAt, cuesBetween } from './music';
import { draw, viewOf, type Pop } from './render';
import { playCue, playLane, rhythmSound } from './sound';
import './rhythm.css';

const GAME_ID = 'kids-rhythm';

const KIT_THEME = {
  '--kit-surface': '#fffaf2',
  '--kit-ink': '#3d2b1f',
  '--kit-muted': '#8a7059',
  '--kit-line': '#ecd9bd',
  '--kit-accent': '#e4722f',
  '--kit-on-accent': '#fff',
  '--kit-radius': '26px',
  '--kit-backdrop': '#070f20b8',
} as CSSProperties;

const HELP_PAGES = [
  {
    title: '박자에 맞춰 손뼉!',
    body: <ul className="kr-help">
      <li>빛나는 막대가 아래 하얀 줄에 닿을 때, 그 줄 아래 동물 친구를 눌러요.</li>
      <li>쿵·짝 노래에 맞춰 치면 가락이 생겨요.</li>
      <li>조금 빨라도, 조금 늦어도 괜찮아요. 넉넉하게 봐 줘요.</li>
    </ul>,
  },
  {
    title: '틀려도 괜찮아요',
    body: <ul className="kr-help">
      <li>놓쳐도 노래는 끝까지 가요. 점수가 깎이지도 않아요.</li>
      <li>이어서 맞히면 숫자가 쭉쭉 올라가요.</li>
      <li>키보드로는 ←, ↓, → 또는 1, 2, 3을 눌러도 돼요.</li>
    </ul>,
  },
];

/** 빠르기 단추에 붙이는 그림. 글을 아직 못 읽는 아이도 고를 수 있게 한다. */
const LEVEL_ICONS: Record<LevelId, string> = { easy: '🐢', normal: '🐇' };
/** 키보드로 칠 때 패드 아래 보여 주는 단추 이름. */
const PAD_KEYS = ['←', '↓', '→'];
/** 반주를 몇 밀리초 앞까지 미리 예약하나. 화면이 잠깐 멈칫해도 소리가 끊기지 않을 만큼. */
const LOOKAHEAD_MS = 160;

/** 같은 애니메이션을 다시 틀려면 이름이 바뀌어야 한다. a/b를 번갈아 붙인다. */
function retrigger(el: HTMLElement | null | undefined, key: 'beat' | 'hit') {
  if (el) el.dataset[key] = el.dataset[key] === 'a' ? 'b' : 'a';
}

const emptyHud = { score: 0, combo: 0, hits: 0, total: 0, progress: 0 };

export default function KidsRhythmApp({ onExit }: GameProps) {
  const hud = useRef(createSnapshotStore(emptyHud)).current;
  const records = useRecords();
  const today = localDateKey();
  const daily = records.daily();

  const [level, setLevel] = useState<LevelId>(() => {
    // 허브의 오늘의 도전이 빠르기를 정해 주면 그 빠르기로 연다.
    const saved = settingsStore.get().games[GAME_ID]?.extra?.difficulty;
    return isLevel(saved) ? saved : DEFAULT_LEVEL;
  });
  const [screen, setScreen] = useState<'menu' | 'playing' | 'done'>('menu');
  const [paused, setPaused] = useState(false);
  const [help, setHelp] = useState(false);
  const [rewards, setRewards] = useState<RunRewards | null>(null);
  const [finished, setFinished] = useState<PlayState | null>(null);
  const resultTitle = useId();

  const canvas = useRef<HTMLCanvasElement>(null);
  const state = useRef<PlayState | null>(null);
  const started = useRef(0);
  const elapsedAt = useRef(0);
  const flash = useRef<number[]>([0, 0, 0]);
  const pops = useRef<Pop[]>([]);
  const pads = useRef<(HTMLButtonElement | null)[]>([]);
  const friends = useRef<(HTMLDivElement | null)[]>([]);
  const stage = useRef<HTMLDivElement>(null);
  const scheduledTo = useRef(0);
  const lastBeat = useRef(-Infinity);
  const snapshot = useUISnapshot(hud, emptyHud);

  const running = screen === 'playing' && !paused && !help;
  const clock = usePlayClock(running);
  const play = usePlayReport(clock, records, screen === 'playing');

  // 오늘의 노래는 날짜 시드로 만든다. 빠르기가 달라도 같은 날이면 같은 가락이다.
  const song = useMemo(() => (lv: LevelId) => createSong(mulberry32(hashSeed(`${today}:${GAME_ID}`)), LEVELS[lv]), [today]);

  const chooseLevel = (next: LevelId) => {
    setLevel(next);
    settingsStore.setGame(GAME_ID, { extra: { difficulty: next } });
  };

  const start = useCallback((lv: LevelId) => {
    play.reset();
    setRewards(null); setFinished(null); setPaused(false);
    state.current = startPlay(song(lv));
    started.current = performance.now();
    elapsedAt.current = 0;
    flash.current = [0, 0, 0];
    pops.current = [];
    scheduledTo.current = 0;
    lastBeat.current = -Infinity;
    hud.publish({ score: 0, combo: 0, hits: 0, total: state.current.song.notes.length, progress: 0 });
    rhythmSound.unlock();
    setScreen('playing');
  }, [hud, play, song]);

  const toMenu = useCallback(() => { play.flush(); state.current = null; setScreen('menu'); setPaused(false); }, [play]);

  useAutoPause({ active: screen === 'playing' && !help, onPause: () => setPaused(true) });

  /** 노래 안에서 흐른 시간. 멈춘 동안은 흐르지 않는다. */
  const songTime = useCallback(() => elapsedAt.current + (running ? performance.now() - started.current : 0), [running]);

  // 멈췄다 다시 시작할 때 노래 시각이 건너뛰지 않게 이어 붙인다.
  useEffect(() => {
    if (screen !== 'playing') return;
    if (running) { started.current = performance.now(); return; }
    elapsedAt.current += performance.now() - started.current;
  }, [running, screen]);

  useEffect(() => {
    if (screen !== 'playing') return;
    const el = canvas.current;
    if (!el) return;
    const ctx = el.getContext('2d');
    if (!ctx) return;
    let frame = 0;
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const render = () => {
      frame = requestAnimationFrame(render);
      const current = state.current;
      if (!current) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const box = el.getBoundingClientRect();
      if (el.width !== Math.round(box.width * dpr) || el.height !== Math.round(box.height * dpr)) {
        el.width = Math.round(box.width * dpr); el.height = Math.round(box.height * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const now = songTime();
      const settled = settle(current, now);
      if (settled !== current) state.current = settled;
      const s = state.current!;
      const level = s.song.level;
      if (running) {
        // 반주는 조금 앞까지 미리 예약한다. 멈췄다 돌아오면 지난 구간은 건너뛴다.
        if (scheduledTo.current < now - 40) scheduledTo.current = now;
        const until = now + LOOKAHEAD_MS;
        for (const cue of cuesBetween(level, LEVELS[level].beats, scheduledTo.current, until)) playCue(cue.id, (cue.at - now) / 1000);
        scheduledTo.current = until;
        // 무대 위 친구들이 박마다 까딱인다. React를 거치지 않고 DOM에 박 표시만 바꾼다.
        const beatNow = Math.floor(beatAt(level, now));
        if (beatNow !== lastBeat.current && beatNow >= -3 && beatNow < LEVELS[level].beats) { lastBeat.current = beatNow; retrigger(stage.current, 'beat'); }
      }
      const view = viewOf(el, dpr, stage.current?.offsetHeight ?? 0, calm);
      draw(ctx, view, s, now, flash.current, pops.current);
      hud.publish({ score: s.score, combo: s.combo, hits: s.perfect + s.good, total: s.song.notes.length, progress: Math.min(1, now / s.song.durationMs) });
      if (running && now >= s.song.durationMs) { setFinished(s); setScreen('done'); }
    };
    frame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frame);
  }, [hud, screen, running, songTime]);

  const hit = useCallback((lane: number) => {
    const current = state.current;
    if (!current || !running) return;
    const now = songTime();
    const result = tap(current, lane, now);
    flash.current = flash.current.map((v, i) => (i === lane ? now : v));
    // 키보드로 쳐도 패드가 눌린 것처럼 보이게. 매 손뼉마다 React를 다시 그리지 않으려고 DOM에 직접 표시한다.
    retrigger(pads.current[lane], 'hit');
    const chord = chordAt(current.song.level, now);
    if (result.grade && result.grade !== 'miss') {
      state.current = result.state;
      pops.current = [...pops.current.filter(p => now - p.at < 600), { lane, at: now, grade: result.grade }];
      retrigger(friends.current[lane], 'hit');
      playLane(lane, chord, result.grade);
      haptic(result.grade === 'perfect' ? 18 : 10);
    } else playLane(lane, chord, null);
  }, [running, songTime]);

  useEffect(() => {
    if (!running) return;
    const keys: Record<string, number> = { ArrowLeft: 0, ArrowDown: 1, ArrowRight: 2, ' ': 1, '1': 0, '2': 1, '3': 2, a: 0, s: 1, d: 2 };
    const onKey = (event: KeyboardEvent) => {
      const lane = keys[keyOf(event)];
      if (lane === undefined || event.repeat) return;
      event.preventDefault();
      hit(lane);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [running, hit]);

  // 노래가 끝나면 한 번만 보고한다.
  const counted = useRef<PlayState | null>(null);
  useEffect(() => {
    if (screen !== 'done' || !finished || counted.current === finished) return;
    counted.current = finished;
    rhythmSound.play('finish');
    const challenge = records.daily();
    setRewards(records.reportRun({
      mode: 'daily',
      difficulty: finished.song.level,
      score: finished.score,
      durationMs: clock.elapsed(), reportedMs: play.reportedMs(),
      // 아이용이라 지는 판이 없다. 노래를 끝까지 들으면 그걸로 한 판을 마친 것이다.
      outcome: 'complete',
      stats: { hits: finished.perfect + finished.good, perfect: finished.perfect, combo: finished.bestCombo },
      dailyId: challenge?.id,
    }));
  }, [screen, finished, records, clock, play]);

  return (
    <div className="kr-root" style={KIT_THEME}>
      <header className="kr-top">
        <button type="button" className="kr-icon" onClick={screen === 'menu' ? onExit : toMenu} aria-label={screen === 'menu' ? '게임 목록' : '처음 화면으로'}>
          <ArrowLeftIcon size={20} weight="bold" />
        </button>
        {screen === 'menu' ? <span className="kr-top-gap" /> : <h1>숲속 리듬단</h1>}
        <div className="kr-top-right">
          <button type="button" className="kr-icon" onClick={() => setHelp(true)} aria-label="게임 방법"><QuestionIcon size={20} /></button>
          {screen === 'playing' && <button type="button" className="kr-icon" onClick={() => setPaused(true)} aria-label="잠시 멈추기"><PauseIcon size={20} weight="fill" /></button>}
        </div>
      </header>

      {screen === 'menu' ? (
        <main className="kr-menu">
          <div className="kr-hero">
            <h1 className="kr-title">숲속<br />리듬단</h1>
            <p className="kr-lead">빛나는 막대가 하얀 줄에 닿을 때<br />동물 친구를 눌러요!</p>
          </div>
          <div className="kr-stage" aria-hidden="true">
            {LANE_COLORS.map((_, i) => (
              <span key={i} className="kr-player" style={{ '--kr-delay': `${i * 0.12}s` } as CSSProperties}>
                <ForestFriend lane={i} />
              </span>
            ))}
          </div>
          <div className="kr-panel">
            <fieldset className="kr-levels">
              <legend>빠르기 고르기</legend>
              {LEVEL_IDS.map(id => {
                const best = records.best('daily', id);
                return (
                  <button key={id} type="button" aria-pressed={level === id} onClick={() => chooseLevel(id)}>
                    <span className="kr-level-icon" aria-hidden="true">{LEVEL_ICONS[id]}</span>
                    <b>{LEVELS[id].label}</b>
                    <small>{best === null ? '처음이에요' : `최고 ${best}점`}</small>
                  </button>
                );
              })}
            </fieldset>
            {daily && <p className="kr-daily"><span aria-hidden="true">🌟</span> 오늘의 도전: {daily.label}</p>}
            <button type="button" className="kr-primary" onClick={() => start(level)}>{LEVELS[level].label} 노래 시작하기</button>
            <p className="kr-note">오늘의 노래는 하루 동안 같아요.</p>
          </div>
        </main>
      ) : (
        <main className="kr-play" aria-label="박자 맞추기">
          <div className="kr-hud">
            <span><b>{snapshot.score}</b>점</span>
            <div className="kr-bar" role="progressbar" aria-label="노래 진행" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(snapshot.progress * 100)}><i style={{ width: `${snapshot.progress * 100}%` }} /></div>
            <span><b>{snapshot.hits}</b>/{snapshot.total}</span>
          </div>
          <div className="kr-arena">
            <canvas ref={canvas} className="kr-canvas" aria-hidden="true" />
            {/* 트랙 먼 끝의 무대. 박마다 까딱이고, 자기 음표를 맞히면 뛰어오른다. 콤보가 쌓이면 웃는다. */}
            <div ref={stage} className="kr-band" data-mood={snapshot.combo >= 10 ? 'party' : undefined} aria-hidden="true">
              {LANE_COLORS.map((_, lane) => (
                <div key={lane} ref={el => { friends.current[lane] = el; }} className="kr-friend">
                  <ForestFriend lane={lane} />
                </div>
              ))}
            </div>
          </div>
          <div className="kr-pads">
            {LANE_COLORS.map((color, lane) => (
              <button key={lane} ref={el => { pads.current[lane] = el; }} type="button" className="kr-pad" style={{ '--kr-lane': color } as CSSProperties}
                onPointerDown={e => { e.preventDefault(); hit(lane); }}
                aria-label={`${FRIEND_NAMES[lane]} 손뼉`}>
                <ForestFriend lane={lane} head className="kr-pad-face" />
                <kbd aria-hidden="true">{PAD_KEYS[lane]}</kbd>
              </button>
            ))}
          </div>
        </main>
      )}

      {help && <HelpDialog firstRunKey={GAME_ID} onClose={() => setHelp(false)} pages={HELP_PAGES} />}

      {paused && <PauseDialog title="잠깐 쉬어 가요" summary={`지금까지 ${snapshot.score}점`} onResume={() => setPaused(false)} onQuit={toMenu} onHelp={() => { setPaused(false); setHelp(true); }} quitLabel="처음 화면으로" />}

      {screen === 'done' && finished && !help && (
        <GameDialog labelledBy={resultTitle} onClose={toMenu}>
          <ResultPanel
            titleId={resultTitle}
            eyebrow={`숲속 리듬단 · ${LEVELS[finished.song.level].label}`}
            headline={praise(finished)}
            score={{ value: finished.score, unit: '점' }}
            stats={[
              { label: '맞힌 손뼉', value: `${finished.perfect + finished.good}/${finished.song.notes.length}` },
              { label: '이어서', value: `${finished.bestCombo}번` },
              { label: '가장 높은 점수', value: `${maxScore(finished.song)}점` },
            ]}
            rewards={hasRewards(rewards) ? <RewardStrip rewards={rewards} audience="kids" /> : undefined}
            primary={{ label: '한 번 더', onClick: () => start(level) }}
            secondary={[{ label: '처음 화면으로', onClick: toMenu }]}
          />
        </GameDialog>
      )}
    </div>
  );
}
