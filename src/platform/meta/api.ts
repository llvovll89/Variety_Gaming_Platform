import { useContext } from 'react';
import { PlaySession } from '../playSessionContext';
import { evaluate, unlockManual } from './achievements';
import { addDailyRun, addStreakDay, dailyChallenge, localDateKey } from './daily';
import { addProgress, addRun, bestOf } from './records';
import { metaStore } from './store';
import type { DailyChallenge, GameMeta, RunReport, RunRewards, UnlockedAchievement } from './types';

/** What a running game can tell the platform, and ask it. Bound to one game. */
export interface RecordsApi {
  /** Call once when a run ends. Returns what it earned, for the result screen, in the same render. */
  reportRun(run: RunReport): RunRewards;
  /** Furthest point reached (world, chapter). Only ever moves forward. */
  reportProgress(key: string, value: number): UnlockedAchievement[];
  /** For achievements the game decides itself (rule kind 'manual'). */
  unlock(achievementId: string): UnlockedAchievement[];
  best(mode?: string, difficulty?: string): number | null;
  /** Today's challenge for this game, if it has one. */
  daily(): DailyChallenge | null;
}

const NO_REWARDS: RunRewards = { newBest: false, previousBest: null, best: null, unlocked: [], streak: { days: 0, extendedToday: false } };

/** Used outside the arcade shell (tests, previews): records nothing, earns nothing. */
export const offlineRecords: RecordsApi = {
  reportRun: () => NO_REWARDS,
  reportProgress: () => [],
  unlock: () => [],
  best: () => null,
  daily: () => null,
};

export function createRecordsApi(gameId: string, meta: GameMeta | undefined, clock: () => Date = () => new Date()): RecordsApi {
  const order = meta?.scoreOrder ?? 'high';
  const achievements = meta?.achievements ?? [];
  const todays = () => dailyChallenge(localDateKey(clock()), gameId, meta?.daily);
  return {
    reportRun(run) {
      const now = clock();
      const today = localDateKey(now);
      // A run started for yesterday's challenge (and finished after midnight) counts for yesterday.
      const startedOn = run.dailyId?.split(':')[0];
      const challenge = dailyChallenge(startedOn && /^\d{4}-\d{2}-\d{2}$/.test(startedOn) ? startedOn : today, gameId, meta?.daily);
      let rewards: RunRewards = NO_REWARDS;
      metaStore.update(state => {
        const added = addRun(state, gameId, run, now.getTime(), order);
        let next = added.state;
        const daily = challenge ? addDailyRun(next, challenge, run) : undefined;
        if (daily) next = daily.state;
        const streak = addStreakDay(next, today, run);
        next = streak.state;
        const earned = evaluate(next, gameId, achievements, order, now.getTime());
        next = earned.state;
        rewards = {
          newBest: added.newBest,
          previousBest: added.previousBest,
          best: bestOf(next.games[gameId], order, run.mode ?? 'default', run.difficulty ?? '-'),
          unlocked: earned.unlocked,
          daily: daily?.result,
          streak: streak.streak,
        };
        return next;
      });
      return rewards;
    },
    reportProgress(key, value) {
      let unlocked: UnlockedAchievement[] = [];
      metaStore.update(state => {
        const earned = evaluate(addProgress(state, gameId, key, value), gameId, achievements, order, clock().getTime());
        unlocked = earned.unlocked;
        return earned.state;
      });
      return unlocked;
    },
    unlock(achievementId) {
      let unlocked: UnlockedAchievement[] = [];
      metaStore.update(state => {
        const earned = unlockManual(state, gameId, achievements, achievementId, clock().getTime());
        unlocked = earned.unlocked;
        return earned.state;
      });
      return unlocked;
    },
    best: (mode, difficulty) => bestOf(metaStore.get().games[gameId], order, mode, difficulty),
    daily: todays,
  };
}

/** The records API for the running game (a no-op outside the arcade shell). */
export function useRecords(): RecordsApi {
  return useContext(PlaySession)?.records ?? offlineRecords;
}
