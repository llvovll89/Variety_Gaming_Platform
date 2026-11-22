import { safeGetItem } from '../../shared/storage';

export const SAVE_KEY = 'gh-arcade:fantasy-tactics:v1';

/** 허브의 "이어하기" 라벨. 게임 자신의 검증기를 그대로 써서 깨진 저장본을 걸러 낸다. */
export async function resumeLabel(): Promise<string | null> {
  const raw = safeGetItem(SAVE_KEY);
  if (!raw) return null;
  const { restore } = await import('./game');
  const battle = restore(raw);
  return battle ? '제' + (battle.stage + 1) + '장 · ' + battle.round + '번째 차례' : null;
}
