import { createSnapshotStore, type WritableSnapshotStore } from '../../../shared/kit/snapshotStore';
import type { UISnapshot } from './types';
export function emptySnapshot(): UISnapshot {
  return {status: 'idle', score: 0, timeRemaining: 30, countdown: 3, round: 1, totalMolesHit: 0, attempts: 0, combo: 0, bestCombo: 0, lastPoints: 0, finalScore: null, bestScore: 0, difficulty: 'normal', activeMoles: []};
}
/**
 * 엔진이 React에 넘기는 화면 한 장. 게임마다 같은 클래스를 베껴 두었던 것을 키트의
 * createSnapshotStore 하나로 모았다(shared/hooks/useUISnapshot으로 읽는다).
 */
export type UIStore = WritableSnapshotStore<UISnapshot>;
export const createUIStore = (): UIStore => createSnapshotStore(emptySnapshot());
