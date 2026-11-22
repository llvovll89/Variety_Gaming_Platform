import { createSnapshotStore, type WritableSnapshotStore } from '../../../shared/kit/snapshotStore';
import type { UISnapshot } from "./types";

export function emptySnapshot(): UISnapshot {
  return {
    status: "idle",
    score: 0,
    timeRemaining: 0,
    duration: 30,
    streak: 0,
    bestStreak: 0,
    totalCorrect: 0,
    totalWrong: 0,
    level: 1,
    round: 0,
    targetColorId: "",
    options: [],
    answerProgress: 1,
    wrongOptionIds: [],
    events: [],
    finalScore: null,
    bestScore: 0,
  };
}
/**
 * 엔진이 React에 넘기는 화면 한 장. 게임마다 같은 클래스를 베껴 두었던 것을 키트의
 * createSnapshotStore 하나로 모았다(shared/hooks/useUISnapshot으로 읽는다).
 */
export type UIStore = WritableSnapshotStore<UISnapshot>;
export const createUIStore = (): UIStore => createSnapshotStore(emptySnapshot());
