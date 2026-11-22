import { safeGetItem } from '../../shared/storage';

export const SAVE_KEY = 'arcade:three-kingdoms:save';

/** 허브의 "이어하기" 라벨. 세력 이름과 턴 수를 보여 준다. */
export async function resumeLabel(): Promise<string | null> {
  if (!safeGetItem(SAVE_KEY)) return null;
  const { loadGame } = await import('./game/save');
  const saved = loadGame();
  return saved ? saved.factions[saved.playerFactionId].name + ' · ' + saved.turn + '번째 턴' : null;
}
