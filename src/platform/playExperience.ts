import type { GameDefinition } from './types';

export interface PlayInfo {
  duration: string;
  minutes: number;
  controls: string;
  experience: string;
  save: string;
}

/** Durations describe a round, puzzle or battle, rather than the entire campaign. */
export const PLAY_INFO: Record<string, PlayInfo> = {
  'kitchen-fighter': { duration: '약 3분 / 경기', minutes: 3, controls: '키보드 권장', experience: '격투 · 콤보', save: '한 판씩 플레이' },
  'ghost-movers': { duration: '약 5분 / 퍼즐', minutes: 5, controls: '터치 · 키보드', experience: '차근차근 퍼즐', save: '완료한 의뢰 저장' },
  'ten-seconds': { duration: '약 5분 / 퍼즐', minutes: 5, controls: '터치 · 키보드', experience: '시간 협동 퍼즐', save: '완료한 방 저장' },
  'fantasy-tactics': { duration: '약 15분 / 전투', minutes: 15, controls: '터치 · 마우스', experience: '턴제 · 동료 성장', save: '진행 자동 저장' },
  'echo-maze': { duration: '약 3분 / 탐험', minutes: 3, controls: '터치 · 키보드', experience: '미로 · 길 찾기', save: '한 판씩 플레이' },
  'three-kingdoms-card': { duration: '5분부터 가볍게', minutes: 5, controls: '한 손 터치', experience: '장수 수집 · 영지', save: '진행 자동 저장' },
  'three-kingdoms': { duration: '20분 이상 몰입', minutes: 20, controls: '마우스 권장', experience: '내정 · 전쟁 전략', save: '턴 진행 저장' },
  'hachuping-slither': { duration: '약 5분 / 도전', minutes: 5, controls: '터치 · 마우스', experience: '성장 · 생존', save: '한 판씩 플레이' },
  'hachuping-dodge': { duration: '약 10분 / 원정', minutes: 10, controls: '한 손 터치', experience: '자동 사격 · 성장', save: '한 판씩 플레이' },
  'hachuping-jump': { duration: '약 3분 / 도전', minutes: 3, controls: '한 손 터치', experience: '타이밍 · 점프', save: '한 판씩 플레이' },
  'hachuping-memory': { duration: '약 3분 / 도전', minutes: 3, controls: '한 손 터치', experience: '패턴 · 기억력', save: '한 판씩 플레이' },
  'hachuping-whack-a-mole': { duration: '30초 / 한 판', minutes: .5, controls: '한 손 터치', experience: '순발력 · 정확도', save: '한 판씩 플레이' },
  'hachuping-color-match': { duration: '약 1분 / 도전', minutes: 1, controls: '한 손 터치', experience: '색깔 · 순발력', save: '한 판씩 플레이' },
  'hachuping-balloon': { duration: '60초 / 한 판', minutes: 1, controls: '한 손 터치', experience: '가볍게 톡톡', save: '한 판씩 플레이' },
};

export type TimeChoice = 'short' | 'medium' | 'long';
export const TIME_CHOICES: { id: TimeChoice; label: string; description: string }[] = [
  { id: 'short', label: '1분 한 판', description: '짧고 가볍게' },
  { id: 'medium', label: '5분 쉬어가기', description: '퍼즐과 짧은 도전' },
  { id: 'long', label: '느긋하게 몰입', description: '전략과 성장' },
];

export function gamesForTime(games: readonly GameDefinition[], choice: TimeChoice) {
  return games.filter(g => !g.disabled && g.releaseStatus !== 'coming-soon').filter(g => {
    const minutes = PLAY_INFO[g.id]?.minutes;
    if (minutes === undefined) return false;
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
