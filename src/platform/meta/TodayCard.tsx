import { CheckCircleIcon, PlayIcon } from '@phosphor-icons/react';
import { audienceOf, type GameDefinition } from '../types';
import { PLAY_INFO } from '../playExperience';
import { dailyChallenge, daysBetween, featuredDailies, localDateKey } from './daily';
import { useMeta } from './store';

const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일'];

/** Monday to Sunday of the week that holds `today`, as date keys. */
export function weekOf(today: string): string[] {
  const [y, m, d] = today.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const monday = new Date(y, m - 1, d - ((date.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => localDateKey(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i)));
}

/**
 * The hub's reason to come back today: three daily challenges (a kids game, a short one and a long
 * one, the same for everyone today) and this week's play stamps.
 */
export function TodayCard({ games, onSelect, today = localDateKey() }: { games: readonly GameDefinition[]; onSelect: (gameId: string) => void; today?: string }) {
  const meta = useMeta();
  const candidates = games.filter(game => game.meta?.reportsRuns && game.meta.daily?.length && PLAY_INFO[game.id])
    .map(game => ({ id: game.id, audience: audienceOf(game), minutes: PLAY_INFO[game.id].minutes }));
  const picks = featuredDailies(today, candidates).flatMap(id => {
    const game = games.find(g => g.id === id);
    const challenge = game && dailyChallenge(today, id, game.meta?.daily);
    return game && challenge ? [{ game, challenge, done: meta.daily[today]?.[id]?.done === true }] : [];
  });
  if (!picks.length) return null;
  const done = picks.filter(p => p.done).length;
  const week = weekOf(today);
  const played = new Set(meta.days.recent);
  const alive = meta.days.last !== null && daysBetween(meta.days.last, today) <= 1;
  const streak = alive ? meta.days.streak : 0;

  return (
    <section className="hub-today" aria-labelledby="today-title">
      <div className="hub-today-head">
        <h2 id="today-title">오늘의 도전 <span>{done}/{picks.length}</span></h2>
        <p>매일 바뀌어요. 끝까지 한 판 하면 도장이 찍혀요.</p>
      </div>
      <ol className="hub-today-list">
        {picks.map(({ game, challenge, done: finished }) => (
          <li key={game.id}>
            <button type="button" onClick={() => onSelect(game.id)} aria-label={`${game.title}: ${challenge.label}${finished ? ' (완료)' : ''}`}>
              <img src={game.previewThumbnail ?? game.thumbnail} alt="" width={64} height={36} loading="lazy" />
              <span><small>{game.title}</small><strong>{challenge.label}</strong></span>
              {finished ? <CheckCircleIcon className="hub-today-done" size={22} weight="fill" aria-hidden="true" /> : <PlayIcon size={16} weight="fill" aria-hidden="true" />}
            </button>
          </li>
        ))}
      </ol>
      <div className="hub-today-week" aria-label={`이번 주 도장 ${week.filter(d => played.has(d)).length}개${streak > 1 ? `, ${streak}일 연속` : ''}`}>
        <ol>{week.map((date, i) => <li key={date} data-on={played.has(date)} data-today={date === today}><span aria-hidden="true">{played.has(date) ? '★' : ''}</span><small>{WEEKDAYS[i]}</small></li>)}</ol>
        <p>{streak > 1 ? `${streak}일 연속으로 놀았어요` : played.has(today) ? '오늘 도장을 찍었어요' : '오늘 한 판 하면 도장이 찍혀요'}</p>
      </div>
    </section>
  );
}
