import { createGameSound, type Recipe } from '../../shared/kit/sound';

/**
 * 자리마다 다른 음. 장조 5음 음계라 아무 순서로 쳐도 듣기 좋고, 아이가 눈이 아니라 귀로도
 * 자리를 구별할 수 있다. 아케이드 공용 소리 설정을 그대로 따른다.
 */
const LANE_NOTES = [523.25, 659.25, 783.99];
const clap = (f: number): Recipe => [
  { f, dur: 0.18, type: 'triangle', gain: 0.22 },
  { kind: 'noise', dur: 0.06, filter: 'bandpass', freq: f * 2, gain: 0.08 },
];

type SoundId = 'lane0' | 'lane1' | 'lane2' | 'good' | 'beat' | 'finish';

const recipes: Record<SoundId, Recipe> = {
  lane0: clap(LANE_NOTES[0]),
  lane1: clap(LANE_NOTES[1]),
  lane2: clap(LANE_NOTES[2]),
  // 딱 맞았을 때만 얹는 반짝임. 그래도 맞은 것과 귀로 구별된다.
  good: [{ f: 1567.98, dur: 0.1, type: 'sine', gain: 0.12 }],
  beat: [{ f: 196, dur: 0.05, type: 'sine', gain: 0.07 }],
  finish: [{ f: 523.25, dur: 0.14, gain: 0.2 }, { f: 659.25, dur: 0.14, gain: 0.2, at: 0.13 }, { f: 783.99, dur: 0.14, gain: 0.2, at: 0.26 }, { f: 1046.5, dur: 0.34, gain: 0.22, at: 0.39 }],
};

export const rhythmSound = createGameSound<SoundId>('kids-rhythm', recipes);

export function playLane(lane: number, perfect: boolean): void {
  rhythmSound.play(`lane${Math.min(2, Math.max(0, lane))}` as SoundId);
  if (perfect) rhythmSound.play('good');
}
