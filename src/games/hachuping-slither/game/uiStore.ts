import { createSnapshotStore, type WritableSnapshotStore } from '../../../shared/kit/snapshotStore';
import { WORLD_SIZE } from "./constants";
import type { UISnapshot } from "./types";
import { createProgression, xpForLevel } from "./progression";

export function emptySnapshot(): UISnapshot {
  return {
    ...createProgression(),
    xpNext: xpForLevel(1),
    pendingUpgrades: 0,
    speed: 160,
    pickupBonus: 0,
    boostDrain: 6,
    status: "menu",
    score: 0,
    rank: 0,
    totalAlive: 0,
    boosting: false,
    canBoost: false,
    leaderboard: [],
    minimap: { worldSize: WORLD_SIZE, player: null, trails: [], viewport: null },
    finalScore: null,
    death: null,
    kills: 0,
    timeLeft: null,
  };
}
/**
 * 엔진이 React에 넘기는 화면 한 장. 게임마다 같은 클래스를 베껴 두었던 것을 키트의
 * createSnapshotStore 하나로 모았다(shared/hooks/useUISnapshot으로 읽는다).
 */
export type UIStore = WritableSnapshotStore<UISnapshot>;
export const createUIStore = (): UIStore => createSnapshotStore(emptySnapshot());
