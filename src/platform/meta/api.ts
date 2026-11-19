import { useContext } from 'react';
import { PlaySession } from '../playSessionContext';
import { evaluate, unlockManual } from './achievements';
import { addDailyRun, addStreakDay, dailyChallenge, localDateKey } from './daily';
import { addProgress, addRun, bestOf, mergeLegacy } from './records';
import { metaStore } from './store';
import type { DailyChallenge, GameMeta, LegacyParse, RunReport, RunRewards, UnlockedAchievement } from './types';

const legacyParse: LegacyParse = {
  num(raw) { const n = Number(raw); return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0; },
  json(raw) { try { return raw === null ? null : JSON.parse(raw); } catch { return null; } },
};

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
        const daily = challenge ? addDailyRun(next, challenge, run, today) : undefined;
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

/**
 * Brings in each game's own records (bests, progress) and unlocks what they already earn, quietly.
 * Runs on every start: until a game reports to the arcade store itself, its newer scores only reach
 * its old keys. Merging keeps the higher value, so running again never counts anything twice, and
 * with nothing new it writes nothing. Old keys are only read.
 */
export function importLegacyRecords(games: readonly { id: string; meta?: GameMeta }[], get: (key: string) => string | null, now = Date.now()): void {
  metaStore.update(state => {
    let next = state;
    for (const game of games) {
      const legacy = game.meta?.legacy;
      if (!legacy) continue;
      let found;
      try { found = legacy.read(get, legacyParse); } catch { continue; } // unreadable now: try again next start
      const order = game.meta?.scoreOrder ?? 'high';
      next = mergeLegacy(next, game.id, found, legacy.version, order);
      next = evaluate(next, game.id, game.meta?.achievements ?? [], order, now).state;
    }
    return next;
  });
}
