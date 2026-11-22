import { safeGetItem } from '../../shared/storage';

export const RUN_KEY = 'arcade:night-train:run';

/** 허브의 "이어하기" 라벨. 저장본이 있을 때만 불리므로 여기서 규칙을 읽어 와도 된다. */
export async function resumeLabel(): Promise<string | null> {
  const raw = safeGetItem(RUN_KEY);
  if (!raw) return null;
  const { loadRun, currentFloor, BOSS_FLOOR } = await import('./engine');
  const run = loadRun(raw);
  return run ? Math.min(currentFloor(run), BOSS_FLOOR + 1) + '번째 역 · 체력 ' + run.hp + '/' + run.maxHp : null;
}
