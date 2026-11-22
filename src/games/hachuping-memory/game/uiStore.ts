import { createSnapshotStore } from '../../../shared/kit/snapshotStore';
import type { GameState } from "./types";

export interface UISnapshot {
  status: "idle" | "playing" | "paused" | "game-over";
  score: number;
  highScore: number;
  gameState: GameState;
}

export function emptySnapshot(gameState: GameState): UISnapshot {
  return {
    status: gameState.status,
    score: gameState.score,
    highScore: gameState.highScore,
    gameState,
  };
}
/**
 * 엔진이 React에 넘기는 화면 한 장. 이 게임은 엔진 상태를 그대로 넘기고 여기서 화면에 필요한
 * 값만 추려 낸다. 듣는 쪽을 챙기는 일은 키트의 createSnapshotStore가 맡는다
 * (shared/hooks/useUISnapshot으로 읽는다).
 */
export function createUIStore(initial: GameState) {
  const store = createSnapshotStore(emptySnapshot(initial));
  return {
    getSnapshot: store.getSnapshot,
    subscribe: store.subscribe,
    publish: (state: GameState): void => store.publish({ status: state.status, score: state.score, highScore: state.highScore, gameState: state }),
  };
}
export type UIStore = ReturnType<typeof createUIStore>;
