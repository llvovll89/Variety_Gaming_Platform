import { useId, useState } from 'react';
import { GameDialog } from '../../shared/kit/GameDialog';
import { audienceOf, type GameDefinition } from '../types';
import { achievementKey, ruleProgress } from './achievements';
import { currentStreak, localDateKey } from './daily';
import { bestOf } from './records';
import { useMeta } from './store';
import type { GameRecord, MetaState } from './types';

type Tab = 'stickers' | 'achievements' | 'records';
const TABS: { id: Tab; label: string }[] = [
  { id: 'stickers', label: '스티커북' },
  { id: 'achievements', label: '업적' },
  { id: 'records', label: '기록' },
];

/**
 * Achievements a player can see for a game. A game that does not report its runs yet can only
 * earn what its old records prove, so only those already earned are shown, never a locked promise.
 */
export function visibleAchievements(game: GameDefinition, meta: MetaState) {
  const defs = game.meta?.achievements ?? [];
  return game.meta?.reportsRuns ? defs : defs.filter(a => meta.achievements[achievementKey(game.id, a.id)]);
}

/** "업적 3/6" or "스티커 2/6" for a game card; null for a game never played. */
export function cardProgress(game: GameDefinition, meta: MetaState): { best: string | null; earned: string | null } | null {
  const record = game.meta && meta.games[game.id];
  const defs = game.meta?.achievements ?? [];
  const earned = defs.filter(a => meta.achievements[achievementKey(game.id, a.id)]).length;
  if (!record && !earned) return null;
  const best = record ? bestOf(record, game.meta?.scoreOrder ?? 'high') : null;
  const unit = game.meta?.scoreUnit ?? '';
  const noun = audienceOf(game) === 'kids' ? '스티커' : '업적';
  return {
    best: best === null ? null : `최고 ${best.toLocaleString()}${unit}`,
    // Out of the total only where every one can be earned; otherwise just what was earned.
    earned: game.meta?.reportsRuns ? `${noun} ${earned}/${defs.length}` : earned ? `${noun} ${earned}개` : null,
  };
}

const minutes = (ms: number) => ms < 60_000 ? '1분 미만' : ms < 3_600_000 ? `${Math.round(ms / 60_000)}분` : `${(ms / 3_600_000).toFixed(1)}시간`;

function playMsBy(meta: MetaState, games: readonly GameDefinition[], audience: 'kids' | 'general') {
  return games.filter(g => audienceOf(g) === audience).reduce((sum, g) => sum + (meta.games[g.id]?.playMs ?? 0), 0);
}

/** The player's sticker book, achievements and records across every game. */
export function ProfileSheet({ games, name, onClose }: { games: readonly GameDefinition[]; name: string; onClose: () => void }) {
  const meta = useMeta();
  const titleId = useId();
  const kidsGames = games.filter(g => audienceOf(g) === 'kids' && visibleAchievements(g, meta).length);
  const otherGames = games.filter(g => audienceOf(g) === 'general' && visibleAchievements(g, meta).length);
  const streak = currentStreak(meta.days, localDateKey());
  // Open on whatever the player plays most.
  const [tab, setTab] = useState<Tab>(() => playMsBy(meta, games, 'general') > playMsBy(meta, games, 'kids') ? 'achievements' : 'stickers');
  const played = games.filter(g => meta.games[g.id]);
  const totalMs = games.reduce((sum, g) => sum + (meta.games[g.id]?.playMs ?? 0), 0);

  return (
    <GameDialog labelledBy={titleId} onClose={onClose} closeOnBackdrop className="hub-settings hub-profile">
      <p className="kit-eyebrow">내 기록</p>
      <h2 id={titleId} className="kit-title">{name || '플레이어'}</h2>
      <dl className="kit-stats">
        <div><dt>연속</dt><dd>{streak}일</dd></div>
        <div><dt>최장 연속</dt><dd>{meta.days.bestStreak}일</dd></div>
        <div><dt>즐긴 시간</dt><dd>{minutes(totalMs)}</dd></div>
      </dl>
      <div className="hub-profile-tabs" role="tablist" aria-label="내 기록 보기">
        {TABS.map(t => <button key={t.id} type="button" role="tab" id={`${titleId}-${t.id}`} aria-selected={tab === t.id} aria-controls={`${titleId}-panel`} onClick={() => setTab(t.id)}>{t.label}</button>)}
      </div>
      <div id={`${titleId}-panel`} role="tabpanel" aria-labelledby={`${titleId}-${tab}`} className="hub-profile-panel">
        {tab === 'stickers' && !kidsGames.length && <p className="kit-summary">아직 받은 스티커가 없어요. 아이 게임을 한 판 하면 여기에 모여요.</p>}
        {tab === 'stickers' && kidsGames.map(game => (
          <section key={game.id}>
            <h3>{game.title}</h3>
            <ul className="hub-sticker-book">{visibleAchievements(game, meta).map(a => {
              const got = !!meta.achievements[achievementKey(game.id, a.id)];
              const caption = got ? a.kids?.title ?? a.title : a.hidden ? '숨겨진 스티커' : a.description;
              return <li key={a.id} data-got={got} title={caption}>
                <span aria-hidden="true">{got ? a.kids?.sticker ?? '⭐' : '?'}</span>
                <small>{caption}</small>
              </li>;
            })}</ul>
          </section>
        ))}
        {tab === 'achievements' && !otherGames.length && <p className="kit-summary">아직 업적이 없어요. 게임을 하다 보면 여기에 쌓여요.</p>}
        {tab === 'achievements' && otherGames.map(game => (
          <section key={game.id}>
            <h3>{game.title}</h3>
            <ul className="hub-achievements">{visibleAchievements(game, meta).map(a => {
              const got = meta.achievements[achievementKey(game.id, a.id)];
              const progress = got ? null : ruleProgress(a.rule, meta.games[game.id], game.meta?.scoreOrder);
              const hidden = a.hidden && !got;
              return <li key={a.id} data-got={!!got} data-tier={a.tier}>
                <b>{hidden ? '숨겨진 업적' : a.title}</b>
                <small>{hidden ? '조건을 만족하면 공개돼요' : a.description}</small>
                {progress && !hidden && game.meta?.scoreOrder !== 'low' && <progress value={Math.min(progress.current, progress.target)} max={progress.target} aria-label={`${a.title} 진행도`} />}
              </li>;
            })}</ul>
          </section>
        ))}
        {tab === 'records' && (played.length ? <table className="hub-records">
          <thead><tr><th scope="col">게임</th><th scope="col">판</th><th scope="col">최고</th><th scope="col">시간</th></tr></thead>
          <tbody>{played.map(game => {
            const record = meta.games[game.id] as GameRecord;
            const best = bestOf(record, game.meta?.scoreOrder ?? 'high');
            return <tr key={game.id}><th scope="row">{game.title}</th><td>{record.runs || '-'}</td><td>{best === null ? '-' : `${best.toLocaleString()}${game.meta?.scoreUnit ?? ''}`}</td><td>{record.playMs ? minutes(record.playMs) : '-'}</td></tr>;
          })}</tbody>
        </table> : <p className="kit-summary">아직 기록이 없어요. 한 판 하고 오면 여기에 쌓여요.</p>)}
      </div>
      <div className="kit-actions"><button type="button" className="kit-btn kit-btn-primary" onClick={onClose}>닫기</button></div>
    </GameDialog>
  );
}
