import { createGameSound, type Recipe } from '../../shared/kit/sound';

/**
 * 타일이 한 칸씩 뒤집히는 소리와 결과음. 아케이드 공용 소리 설정을 그대로 따른다.
 * 뒤집는 소리는 결과에 따라 음높이가 달라서, 화면을 보지 않아도 맞았는지 알 수 있다.
 */
type SoundId = 'hit' | 'move' | 'miss' | 'win' | 'lose' | 'type';

const recipes: Record<SoundId, Recipe> = {
  hit: [{ f: 784, dur: 0.14, type: 'triangle', gain: 0.2 }],
  move: [{ f: 523.25, dur: 0.14, type: 'triangle', gain: 0.18 }],
  miss: [{ f: 196, dur: 0.12, type: 'sine', gain: 0.12 }],
  win: [{ f: 523.25, dur: 0.12, gain: 0.18 }, { f: 659.25, dur: 0.12, gain: 0.18, at: 0.11 }, { f: 783.99, dur: 0.26, gain: 0.2, at: 0.22 }],
  lose: [{ f: 349.23, to: 196, dur: 0.45, type: 'sawtooth', gain: 0.11 }],
  type: [{ f: 880, dur: 0.05, type: 'square', gain: 0.07 }],
};

export const wordSound = createGameSound<SoundId>('hangul-words', recipes);
