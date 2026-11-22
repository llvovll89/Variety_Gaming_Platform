import { createSnapshotStore, type WritableSnapshotStore } from '../../../shared/kit/snapshotStore';
import type { UISnapshot } from "./types";

export function emptySnapshot(): UISnapshot {
  return { practice: null, status: "playing", score: 0, bestScore: 0, finalScore: null, stars: 0, shieldTime: 0, magnetTime: 0, doubleTime: 0, slowTime: 0, hearts: 0, stage: 0, stageCleared: 0, journeyPhase: 'intro', phaseTime: 2, lastStageScore: 0 };
}
/**
 * 엔진이 React에 넘기는 화면 한 장. 게임마다 같은 클래스를 베껴 두었던 것을 키트의
 * createSnapshotStore 하나로 모았다(shared/hooks/useUISnapshot으로 읽는다).
 */
export type UIStore = WritableSnapshotStore<UISnapshot>;
export const createUIStore = (): UIStore => createSnapshotStore(emptySnapshot());
