import { safeGetItem } from '../../shared/storage';
import { toParticle } from '../../shared/korean';

export const SAVE_KEY = 'three-kingdoms-local-v2';

/** 허브의 "이어하기" 라벨. 성 이름에 맞춰 '로/으로'를 고른다. */
export async function resumeLabel(): Promise<string | null> {
  const raw = safeGetItem(SAVE_KEY);
  if (!raw) return null;
  const { demoSchema } = await import('./lib/demoGame');
  // 군주 이름을 짓기 전에도 저장되므로, 비어 있는 영지는 이어서 할 것이 없다.
  const parsed = demoSchema.safeParse(JSON.parse(raw));
  if (!parsed.success || !parsed.data.lordName) return null;
  const castle = parsed.data.castleName.trim();
  return castle ? `${castle}${toParticle(castle)} 돌아가기` : '저장된 영지로 돌아가기';
}
