import type { Audience } from '../types';
import type { RunRewards } from './types';

const TIER_NAMES = { 1: '브론즈', 2: '실버', 3: '골드' } as const;

/**
 * What a run earned, under the score on a result screen. Same data, two voices:
 * kids get big stickers and stamps with no numbers to fall short of; everyone else gets a compact
 * line of badges. Nothing earned shows nothing (no "you missed it" message).
 */
export function RewardStrip({ rewards, audience }: { rewards: RunRewards | null | undefined; audience: Audience }) {
  if (!rewards) return null;
  const { unlocked, daily, streak } = rewards;
  const dailyDone = daily?.justCompleted;
  const streakNews = streak.extendedToday && streak.days > 1;
  if (!unlocked.length && !dailyDone && !streakNews) return null;

  if (audience === 'kids') {
    return (
      <div className="kit-rewards kit-rewards-kids" role="status">
        {unlocked.length > 0 && <div className="kit-sticker">
          <b>{unlocked.length > 1 ? `새 스티커 ${unlocked.length}개를 받았어요!` : '새 스티커를 받았어요!'}</b>
          {/* All new stickers in one row, so the replay button stays in view. */}
          <ul className="kit-sticker-row">{unlocked.map(a => (
            <li key={a.id}><span className="kit-sticker-art" aria-hidden="true">{a.kids?.sticker ?? '⭐'}</span><small>{a.kids?.title ?? a.title}</small></li>
          ))}</ul>
        </div>}
        {dailyDone && <p className="kit-stamp"><span aria-hidden="true">💮 </span>오늘의 도전 성공! <small>{daily!.label}</small></p>}
        {streakNews && <p className="kit-stamp">도장 {streak.days}개째, 매일 와 줘서 고마워요!</p>}
      </div>
    );
  }
  return (
    <ul className="kit-rewards kit-rewards-badges" role="status" aria-label="이번 판에서 얻은 것">
      {unlocked.map(a => (
        <li key={a.id} data-tier={a.tier}><b>업적 달성 · {a.title}</b><small>{TIER_NAMES[a.tier]} · {a.description}</small></li>
      ))}
      {dailyDone && <li data-tier="daily"><b>오늘의 도전 완료</b><small>{daily!.label}</small></li>}
      {streakNews && <li data-tier="streak"><b>{streak.days}일 연속 플레이</b><small>내일도 이어 가 보세요</small></li>}
    </ul>
  );
}
