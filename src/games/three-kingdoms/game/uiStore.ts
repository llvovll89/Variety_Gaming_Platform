import { createSnapshotStore, type WritableSnapshotStore } from '../../../shared/kit/snapshotStore';
import type { UISnapshot } from "./types";

export function emptySnapshot(): UISnapshot {
  return {
    save: { status: 'idle', savedAt: null, turn: null },
    screen: "menu",
    year: 194,
    month: 6,
    turn: 1,
    result: "playing",
    player: null,
    selected: { kind: "none" },
    placement: null,
    pendingTactic: null,
    log: [],
    busy: false,
    standings: [],
  };
}
/**
 * 엔진이 React에 넘기는 화면 한 장. 게임마다 같은 클래스를 베껴 두었던 것을 키트의
 * createSnapshotStore 하나로 모았다(shared/hooks/useUISnapshot으로 읽는다).
 */
export type UIStore = WritableSnapshotStore<UISnapshot>;
export const createUIStore = (): UIStore => createSnapshotStore(emptySnapshot());
