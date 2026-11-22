import type { GameDefinition } from './types';

export type TimeChoice = 'short' | 'medium' | 'long';
export const TIME_CHOICES: { id: TimeChoice; label: string; description: string }[] = [
  { id: 'short', label: '1분 한 판', description: '짧고 가볍게' },
  { id: 'medium', label: '5분 쉬어가기', description: '퍼즐과 짧은 도전' },
  { id: 'long', label: '느긋하게 몰입', description: '전략과 성장' },
];

export function gamesForTime(games: readonly GameDefinition[], choice: TimeChoice) {
  return games.filter(g => !g.disabled && g.releaseStatus !== 'coming-soon').filter(g => {
    const minutes = g.play.minutes;
    return choice === 'short' ? minutes <= 1 : choice === 'medium' ? minutes > 1 && minutes <= 5 : minutes > 5;
  });
}

export function recommendNext(games: readonly GameDefinition[], currentId: string, kind: 'similar' | 'different') {
  const current = games.find(g => g.id === currentId);
  const candidates = games.filter(g => g.id !== currentId && !g.disabled && g.releaseStatus !== 'coming-soon');
  const affinity = (game: GameDefinition) => current ? game.genres.filter(g => current.genres.includes(g)).length * 2 + game.tags.filter(t => current.tags.includes(t)).length : 0;
  return candidates.sort((a, b) => kind === 'similar' ? affinity(b) - affinity(a) : affinity(a) - affinity(b))[0];
}

export function scoreMessage(score: number, previousBest: number, unit = '점') {
  if (!Number.isFinite(score) || !Number.isFinite(previousBest) || score < 0 || previousBest < 0) return '';
  if (previousBest === 0) return score > 0 ? '첫 기록을 남겼어요! 다음 한 판도 도전해 보세요.' : '첫 기록에 도전해 보세요!';
  if (score > previousBest) return '새 최고 기록! 이전보다 ' + (score - previousBest).toLocaleString('ko-KR') + unit + ' 더 해냈어요.';
  if (score === previousBest) return '최고 기록과 같아요! 다음 한 판에서 넘어 볼까요?';
  return '내 최고 기록까지 ' + (previousBest - score).toLocaleString('ko-KR') + unit + ' 남았어요!';
}
