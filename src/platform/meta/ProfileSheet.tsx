import { useId, useState } from 'react';
import { GameDialog } from '../../shared/kit/GameDialog';
import { audienceOf, type GameDefinition } from '../types';
import { achievementKey, ruleProgress } from './achievements';
import { bestOf } from './records';
import { useMeta } from './store';
import type { GameRecord, MetaState } from './types';

type Tab = 'stickers' | 'achievements' | 'records';
const TABS: { id: Tab; label: string }[] = [
  { id: 'stickers', label: '스티커북' },
  { id: 'achievements', label: '업적' },
  { id: 'records', label: '기록' },
];

/** "3/6 업적" or "스티커 2/6" for a game card; null for a game never played. */
export function cardProgress(game: GameDefinition, meta: MetaState): { best: string | null; earned: string } | null {
  const record = game.meta && meta.games[game.id];
  const defs = game.meta?.achievements ?? [];
  const earned = defs.filter(a => meta.achievements[achievementKey(game.id, a.id)]).length;
  if (!record && !earned) return null;
  const best = record ? bestOf(record, game.meta?.scoreOrder ?? 'high') : null;
  const unit = game.meta?.scoreUnit ?? '';
  return {
    best: best === null ? null : `최고 ${best.toLocaleString()}${unit}`,
    earned: audienceOf(game) === 'kids' ? `스티커 ${earned}/${defs.length}` : `업적 ${earned}/${defs.length}`,
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
  const kidsGames = games.filter(g => audienceOf(g) === 'kids' && g.meta?.achievements.length);
  const otherGames = games.filter(g => audienceOf(g) === 'general' && g.meta?.achievements.length);
  // Open on whatever the player plays most.
  const [tab, setTab] = useState<Tab>(() => playMsBy(meta, games, 'general') > playMsBy(meta, games, 'kids') ? 'achievements' : 'stickers');
  const played = games.filter(g => meta.games[g.id]);
  const totalMs = games.reduce((sum, g) => sum + (meta.games[g.id]?.playMs ?? 0), 0);

  return (
    <GameDialog labelledBy={titleId} onClose={onClose} closeOnBackdrop className="hub-settings hub-profile">
      <p className="kit-eyebrow">내 기록</p>
      <h2 id={titleId} className="kit-title">{name || '플레이어'}</h2>
      <dl className="kit-stats">
        <div><dt>연속</dt><dd>{meta.days.streak}일</dd></div>
        <div><dt>최장 연속</dt><dd>{meta.days.bestStreak}일</dd></div>
        <div><dt>즐긴 시간</dt><dd>{minutes(totalMs)}</dd></div>
      </dl>
      <div className="hub-profile-tabs" role="tablist" aria-label="내 기록 보기">
        {TABS.map(t => <button key={t.id} type="button" role="tab" id={`${titleId}-${t.id}`} aria-selected={tab === t.id} aria-controls={`${titleId}-panel`} onClick={() => setTab(t.id)}>{t.label}</button>)}
      </div>
      <div id={`${titleId}-panel`} role="tabpanel" aria-labelledby={`${titleId}-${tab}`} className="hub-profile-panel">
        {tab === 'stickers' && kidsGames.map(game => (
          <section key={game.id}>
            <h3>{game.title}</h3>
            <ul className="hub-sticker-book">{game.meta!.achievements.map(a => {
              const got = !!meta.achievements[achievementKey(game.id, a.id)];
              return <li key={a.id} data-got={got} title={got ? a.kids?.title ?? a.title : a.description}>
                <span aria-hidden="true">{got ? a.kids?.sticker ?? '⭐' : '?'}</span>
                <small>{got ? a.kids?.title ?? a.title : a.description}</small>
              </li>;
            })}</ul>
          </section>
        ))}
        {tab === 'achievements' && otherGames.map(game => (
          <section key={game.id}>
            <h3>{game.title}</h3>
            <ul className="hub-achievements">{game.meta!.achievements.map(a => {
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
            return <tr key={game.id}><th scope="row">{game.title}</th><td>{record.runs}</td><td>{best === null ? '-' : `${best.toLocaleString()}${game.meta?.scoreUnit ?? ''}`}</td><td>{record.playMs ? minutes(record.playMs) : '-'}</td></tr>;
          })}</tbody>
        </table> : <p className="kit-summary">아직 기록이 없어요. 한 판 하고 오면 여기에 쌓여요.</p>)}
      </div>
      <div className="kit-actions"><button type="button" className="kit-btn kit-btn-primary" onClick={onClose}>닫기</button></div>
    </GameDialog>
  );
}
