import { safeGetItem } from '../../shared/storage';

export const SAVE_KEY = 'ten-seconds-progress-v1';

/** 허브의 "이어하기" 라벨. 한 번이라도 깬 방이 있어야 이어서 할 것이 있다. */
export async function resumeLabel(): Promise<string | null> {
  const raw = safeGetItem(SAVE_KEY);
  if (!raw) return null;
  const { loadProgress, LEVELS } = await import('./engine');
  const progress = loadProgress(raw);
  return Object.keys(progress.best).length ? '방 ' + (progress.unlocked + 1) + ' · ' + LEVELS[progress.unlocked].name : null;
}
