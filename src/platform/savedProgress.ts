import { safeGetItem } from '../shared/storage';

/** '로' or '으로' after a word: '으로' after a final consonant other than ㄹ ('신야로', '낙양성으로'). */
export function toParticle(word: string): string {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  if (code < 0 || code > 11171) return '(으)로';
  const final = code % 28;
  return final === 0 || final === 8 ? '로' : '으로';
}

/** Use each game's own validator, and load its rules only when a save exists. */
export async function savedProgressLabel(id: string): Promise<string | null> {
  try {
    if (id === 'night-train') {
      const raw = safeGetItem('arcade:night-train:run');
      if (!raw) return null;
      const { loadRun, currentFloor, BOSS_FLOOR } = await import('../games/night-train/engine');
      const run = loadRun(raw);
      return run ? Math.min(currentFloor(run), BOSS_FLOOR + 1) + '번째 역 · 체력 ' + run.hp + '/' + run.maxHp : null;
    }
    if (id === 'ghost-movers') {
      const raw = safeGetItem('gh-ghost-movers-v1');
      if (!raw) return null;
      const { loadProgress, LEVELS } = await import('../games/ghost-movers/engine');
      const progress = loadProgress(raw);
      return Object.keys(progress.best).length ? '의뢰 ' + (progress.unlocked + 1) + ' · ' + LEVELS[progress.unlocked].name : null;
    }
    if (id === 'ten-seconds') {
      const raw = safeGetItem('ten-seconds-progress-v1');
      if (!raw) return null;
      const { loadProgress, LEVELS } = await import('../games/ten-seconds/engine');
      const progress = loadProgress(raw);
      return Object.keys(progress.best).length ? '방 ' + (progress.unlocked + 1) + ' · ' + LEVELS[progress.unlocked].name : null;
    }
    if (id === 'fantasy-tactics') {
      const raw = safeGetItem('gh-arcade:fantasy-tactics:v1');
      if (!raw) return null;
      const { restore } = await import('../games/fantasy-tactics/game');
      const battle = restore(raw);
      return battle ? '제' + (battle.stage + 1) + '장 · ' + battle.round + '번째 차례' : null;
    }
    if (id === 'three-kingdoms') {
      if (!safeGetItem('arcade:three-kingdoms:save')) return null;
      const { loadGame } = await import('../games/three-kingdoms/game/save');
      const saved = loadGame();
      return saved ? saved.factions[saved.playerFactionId].name + ' · ' + saved.turn + '번째 턴' : null;
    }
    if (id === 'three-kingdoms-card') {
      if (!safeGetItem('three-kingdoms-local-v2')) return null;
      const { STORAGE_KEY, demoSchema } = await import('../games/three-kingdoms-card/lib/demoGame');
      const raw = safeGetItem(STORAGE_KEY);
      if (!raw) return null;
      // Opening the game saves even before a lord is named; that empty land is nothing to resume.
      const parsed = demoSchema.safeParse(JSON.parse(raw));
      if (!parsed.success || !parsed.data.lordName) return null;
      const castle = parsed.data.castleName.trim();
      return castle ? `${castle}${toParticle(castle)} 돌아가기` : '저장된 영지로 돌아가기';
    }
  } catch { /* Broken saves and blocked storage must leave the hub usable. */ }
  return null;
}
