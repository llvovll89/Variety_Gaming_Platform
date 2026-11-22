import { useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties } from 'react';
import { ArrowLeftIcon } from '@phosphor-icons/react/dist/icons/ArrowLeft';
import { PauseIcon } from '@phosphor-icons/react/dist/icons/Pause';
import { QuestionIcon } from '@phosphor-icons/react/dist/icons/Question';
import { useRecords } from '../../platform/meta/api';
import { hashSeed, localDateKey } from '../../platform/meta/daily';
import { hasRewards, RewardStrip } from '../../platform/meta/RewardStrip';
import type { RunRewards } from '../../platform/meta/types';
import type { GameProps } from '../../platform/types';
import { GameDialog } from '../../shared/kit/GameDialog';
import { HelpDialog } from '../../shared/kit/HelpDialog';
import { PauseDialog } from '../../shared/kit/PauseDialog';
import { ResultPanel } from '../../shared/kit/ResultPanel';
import { useAutoPause } from '../../shared/kit/useAutoPause';
import { usePlayClock } from '../../shared/kit/usePlayClock';
import { usePlayReport } from '../../shared/kit/usePlayReport';
import { gameStorageKey, safeGetItem, safeSetItem } from '../../shared/storage';
import { guess as applyGuess, isComplete, learned, MAX_GUESSES, newBoard, randomWord, wordForSeed, type Board } from './engine';
import { wordSound } from './sound';
import './words.css';

const GAME_ID = 'hangul-words';

const HELP_PAGES = [
  {
    title: '두 글자를 맞혀 보세요',
    body: <ul className="hw-help">
      <li>두 글자 낱말 하나를 여섯 번 안에 맞히는 놀이예요.</li>
      <li>떠오르는 낱말을 넣고 확인을 누르면, 글자마다 얼마나 가까운지 알려 줘요.</li>
    </ul>,
  },
  {
    title: '색과 점이 알려 줘요',
    body: <ul className="hw-help">
      <li><b>초록</b>은 그 자리에 그 글자가 맞다는 뜻이에요.</li>
      <li><b>노랑</b>은 낱말에 있지만 자리가 다르다는 뜻이에요.</li>
      <li>글자가 틀려도 아래 점 세 개가 초성·중성·종성이 맞았는지 알려 줘요. 왼쪽부터 차례대로예요.</li>
    </ul>,
  },
  {
    title: '오늘의 낱말과 연습',
    body: <ul className="hw-help">
      <li>오늘의 낱말은 하루에 하나, 모두에게 같은 낱말이에요.</li>
      <li>더 풀고 싶으면 연습 낱말을 고르세요. 얼마든지 다시 할 수 있어요.</li>
    </ul>,
  },
];
const TODAY_KEY = gameStorageKey(GAME_ID, 'today');

/** 종이와 잉크. 일시정지·결과 대화상자가 게임판과 같은 색을 쓰도록 키트에 넘긴다. */
const KIT_THEME = {
  '--kit-surface': '#fbf7ef',
  '--kit-ink': '#2b2722',
  '--kit-muted': '#7a7066',
  '--kit-line': '#ded3c2',
  '--kit-accent': '#3f7d5c',
  '--kit-on-accent': '#fff',
  '--kit-radius': '18px',
  '--kit-backdrop': '#2b272299',
} as CSSProperties;

type Mode = 'daily' | 'free';

/** 오늘 푼 자취. 새로 고쳐도 오늘의 낱말을 처음부터 다시 풀게 되지 않는다. */
interface TodaySave { date: string; words: string[] }

function readToday(date: string): string[] {
  try {
    const raw = JSON.parse(safeGetItem(TODAY_KEY) ?? 'null') as Partial<TodaySave> | null;
    if (raw?.date !== date || !Array.isArray(raw.words)) return [];
    return raw.words.filter(w => typeof w === 'string' && isComplete(w)).slice(0, MAX_GUESSES);
  } catch { return []; }
}

function replay(answer: string, words: readonly string[]): Board {
  return words.reduce<Board>((board, word) => applyGuess(board, word), newBoard(answer));
}

export default function HangulWordsApp({ onExit }: GameProps) {
  const records = useRecords();
  const today = localDateKey();
  // 허브의 오늘의 도전과 같은 시드를 써서, 서버 없이 모두가 같은 낱말을 푼다.
  const todayWord = useMemo(() => wordForSeed(hashSeed(`${today}:${GAME_ID}`)), [today]);

  const [screen, setScreen] = useState<'menu' | 'playing'>('menu');
  const [mode, setMode] = useState<Mode>('daily');
  const [board, setBoard] = useState<Board>(() => newBoard(todayWord));
  const [draft, setDraft] = useState('');
  const [hint, setHint] = useState('');
  const [paused, setPaused] = useState(false);
  const [help, setHelp] = useState(false);
  const [rewards, setRewards] = useState<RunRewards | null>(null);
  const field = useRef<HTMLInputElement>(null);
  const resultTitle = useId();
  const boardLabel = useId();

  const playing = screen === 'playing' && board.status === 'playing';
  const clock = usePlayClock(playing && !paused && !help);
  const play = usePlayReport(clock, records, playing);
  const counted = useRef<Board | null>(null);

  const todaysGuesses = useMemo(() => readToday(today), [today]);
  const todayDone = useMemo(() => replay(todayWord, todaysGuesses).status !== 'playing', [todayWord, todaysGuesses]);

  const open = useCallback((next: Mode) => {
    play.reset();
    setRewards(null); setHint(''); setDraft(''); setPaused(false);
    setMode(next);
    setBoard(next === 'daily' ? replay(todayWord, readToday(today)) : newBoard(randomWord(Math.random, todayWord)));
    setScreen('playing');
  }, [play, today, todayWord]);

  const toMenu = useCallback(() => { play.flush(); setScreen('menu'); setPaused(false); setHint(''); }, [play]);

  useAutoPause({ active: playing && !help, onPause: () => setPaused(true) });

  // 판이 끝나면 한 번만 보고한다. 같은 판 객체는 두 번 세지 않는다.
  useEffect(() => {
    if (screen !== 'playing' || board.status === 'playing' || counted.current === board) return;
    counted.current = board;
    const won = board.status === 'won';
    wordSound.play(won ? 'win' : 'lose');
    const challenge = records.daily();
    setRewards(records.reportRun({
      mode,
      score: won ? board.rows.length : undefined,
      durationMs: clock.elapsed(), reportedMs: play.reportedMs(),
      outcome: won ? 'win' : 'lose',
      stats: { guesses: board.rows.length, solved: won ? 1 : 0 },
      dailyId: challenge?.mode === mode ? challenge.id : undefined,
    }));
  }, [screen, board, mode, records, clock, play]);

  function submit() {
    if (board.status !== 'playing') return;
    const word = draft.trim();
    if (!isComplete(word)) { setHint('받침까지 갖춘 두 글자를 넣어 주세요.'); return; }
    if (board.rows.some(row => row.map(t => t.syllable).join('') === word)) { setHint('이미 써 본 낱말이에요.'); return; }
    const next = applyGuess(board, word);
    const row = next.rows.at(-1)!;
    wordSound.play(row.every(t => t.state === 'hit') ? 'hit' : row.some(t => t.state !== 'miss') ? 'move' : 'miss');
    setBoard(next); setDraft(''); setHint('');
    if (mode === 'daily') safeSetItem(TODAY_KEY, JSON.stringify({ date: today, words: next.rows.map(r => r.map(t => t.syllable).join('')) } satisfies TodaySave));
  }

  const known = learned(board.rows);
  const rows = Array.from({ length: MAX_GUESSES }, (_, i) => board.rows[i] ?? null);

  return (
    <div className="hw-root" style={KIT_THEME}>
      <header className="hw-top">
        <button type="button" className="hw-icon" onClick={screen === 'menu' ? onExit : toMenu} aria-label={screen === 'menu' ? '게임 목록' : '처음 화면으로'}>
          <ArrowLeftIcon size={20} weight="bold" />
        </button>
        <h1>오늘의 낱말</h1>
        <div className="hw-top-right">
          <button type="button" className="hw-icon" onClick={() => setHelp(true)} aria-label="게임 방법"><QuestionIcon size={20} /></button>
          {screen === 'playing' && <button type="button" className="hw-icon" onClick={() => setPaused(true)} aria-label="잠시 멈추기"><PauseIcon size={20} weight="fill" /></button>}
        </div>
      </header>

      {screen === 'menu' ? (
        <main className="hw-menu">
          <p className="hw-lead">두 글자 낱말을 여섯 번 안에 맞혀 보세요.<br />글자가 맞으면 초록, 자리만 다르면 노랑이에요.</p>
          <button type="button" className="hw-primary" onClick={() => open('daily')}>
            오늘의 낱말<small>{todayDone ? '오늘은 이미 풀었어요 · 다시 보기' : '하루에 하나, 모두가 같은 낱말'}</small>
          </button>
          <button type="button" className="hw-secondary" onClick={() => open('free')}>
            연습 낱말<small>얼마든지 다시 도전할 수 있어요</small>
          </button>
        </main>
      ) : (
        <main className="hw-play">
          <p className="hw-mode">{mode === 'daily' ? `오늘의 낱말 · ${today}` : '연습 낱말'}</p>
          <ol className="hw-board" aria-label="추측한 낱말" aria-describedby={boardLabel}>
            {rows.map((row, i) => (
              <li key={i} className="hw-row">
                {Array.from({ length: 2 }, (_, j) => {
                  const tile = row?.[j];
                  return (
                    <div key={j} className="hw-tile" data-state={tile?.state ?? 'empty'}>
                      <span className="hw-syllable">{tile?.syllable ?? ''}</span>
                      {tile && <span className="hw-jamo" aria-hidden="true">{tile.jamo.map((j2, k) => <i key={k} data-jamo={j2} />)}</span>}
                    </div>
                  );
                })}
                {row && <span className="hw-sr">{row.map(t => `${t.syllable} ${t.state === 'hit' ? '정답' : t.state === 'move' ? '자리가 달라요' : '없는 글자'}, 초성 중성 종성 ${t.jamo.map(j2 => j2 === 'hit' ? '맞음' : j2 === 'near' ? '다른 자리' : '아님').join(' ')}`).join('. ')}</span>}
              </li>
            ))}
          </ol>
          <p id={boardLabel} className="hw-sr">여섯 번 안에 두 글자 낱말을 맞히세요. 글자 아래 점 세 개는 왼쪽부터 초성, 중성, 종성이 맞았는지를 알려 줍니다.</p>

          {board.status === 'playing' ? (
            <form className="hw-entry" onSubmit={e => { e.preventDefault(); submit(); }}>
              <label className="hw-sr" htmlFor="hw-input">두 글자 낱말</label>
              <input id="hw-input" ref={field} className="hw-input" value={draft} maxLength={2} autoComplete="off" autoCapitalize="off" spellCheck={false}
                onChange={e => { setDraft(e.target.value); if (hint) setHint(''); }} placeholder="두 글자" />
              <button type="submit" className="hw-primary hw-submit">확인</button>
            </form>
          ) : (
            <p className="hw-closed">{board.status === 'won' ? `${board.rows.length}번 만에 맞혔어요!` : `정답은 ${board.answer}였어요.`}</p>
          )}
          <p className="hw-hint" role="status">{hint}</p>

          {known.size > 0 && (
            <div className="hw-known" aria-label="지금까지 써 본 글자">
              {[...known].map(([syllable, state]) => <span key={syllable} data-state={state}>{syllable}</span>)}
            </div>
          )}
        </main>
      )}

      {help && <HelpDialog firstRunKey={GAME_ID} onClose={() => setHelp(false)} pages={HELP_PAGES} />}

      {paused && <PauseDialog title="잠깐 멈췄어요" summary={`${board.rows.length}번 써 봤어요`} onResume={() => setPaused(false)} onQuit={toMenu} onHelp={() => { setPaused(false); setHelp(true); }} quitLabel="처음 화면으로" />}

      {screen === 'playing' && board.status !== 'playing' && !paused && !help && (
        <GameDialog labelledBy={resultTitle} onClose={toMenu}>
          <ResultPanel
            titleId={resultTitle}
            eyebrow={mode === 'daily' ? '오늘의 낱말' : '연습 낱말'}
            headline={board.status === 'won' ? '맞혔어요!' : `정답은 ${board.answer}`}
            score={board.status === 'won' ? { value: board.rows.length, unit: '번' } : undefined}
            stats={[{ label: '낱말', value: board.answer }, { label: '쓴 횟수', value: `${board.rows.length}번` }]}
            rewards={hasRewards(rewards) ? <RewardStrip rewards={rewards} audience="general" /> : undefined}
            primary={mode === 'daily' && todayDone
              ? { label: '연습 낱말 풀기', onClick: () => open('free') }
              : { label: '한 번 더', onClick: () => open(mode === 'daily' ? 'free' : 'free') }}
            secondary={[{ label: '처음 화면으로', onClick: toMenu }]}
          />
        </GameDialog>
      )}
    </div>
  );
}
