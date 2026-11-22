import { safeGetItem } from '../shared/storage';
import type { GameDefinition } from './types';

/**
 * 허브의 "이어하기" 라벨.
 *
 * 라벨을 만드는 규칙은 게임마다 다르므로 게임 폴더에 둔다(각 게임의 resume.ts). 허브는 화면에
 * 보이는 모든 게임에 대해 이것을 부르기 때문에, 먼저 저장 열쇠만 들여다보고 저장본이 없는
 * 게임은 규칙을 불러오지 않는다.
 */
export async function savedProgressLabel(game: Pick<GameDefinition, 'resume'>): Promise<string | null> {
  const resume = game.resume;
  if (!resume || !safeGetItem(resume.key)) return null;
  // 깨진 저장본과 막힌 저장소가 허브를 못 쓰게 만들어서는 안 된다.
  try { return await resume.label(); } catch { return null; }
}
