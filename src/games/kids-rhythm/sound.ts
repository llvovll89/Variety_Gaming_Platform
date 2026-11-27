import { createGameSound, type Recipe } from '../../shared/kit/sound';
import type { ChordId, CueId } from './music';

/**
 * 반주와 손뼉 소리. 손뼉은 그때 울리는 화음의 음(근음·3음·5음)을 자리마다 하나씩 낸다.
 * 그래서 박에 맞춰 치면 반주 위에 가락이 완성되고, 아무 자리나 쳐도 화음에서 벗어나지 않는다.
 * 아케이드 공용 소리 설정을 그대로 따른다.
 */

/** 화음마다 자리별 가락 음(낮은 자리 → 높은 자리). 도 / 솔 / 라단조 / 파. */
const MELODY: Record<ChordId, readonly [number, number, number]> = {
  0: [523.25, 659.25, 783.99],
  1: [493.88, 587.33, 783.99],
  2: [440.0, 523.25, 659.25],
  3: [440.0, 523.25, 698.46],
};
const BASS: Record<ChordId, number> = { 0: 130.81, 1: 98.0, 2: 110.0, 3: 87.31 };

const melody = (f: number): Recipe => [
  { f, dur: 0.26, type: 'triangle', gain: 0.24 },
  { f: f * 2, dur: 0.12, type: 'sine', gain: 0.05 },
];
const pad = (chord: ChordId): Recipe => MELODY[chord].map(f => ({ f: f / 2, dur: 1.9, type: 'sine' as const, gain: 0.035, attack: 0.12 }));
const bass = (chord: ChordId): Recipe => [{ f: BASS[chord], dur: 0.32, type: 'triangle', gain: 0.22 }];

type LaneId = `m${ChordId}${0 | 1 | 2}`;
type SoundId = CueId | LaneId | 'sparkle' | 'tap' | 'finish';

const chords = [0, 1, 2, 3] as const;
const recipes = {
  count: [{ f: 1046.5, dur: 0.07, type: 'square', gain: 0.07 }],
  kick: [{ f: 150, to: 45, dur: 0.2, type: 'sine', gain: 0.5 }],
  snare: [{ kind: 'noise', dur: 0.12, filter: 'bandpass', freq: 1900, gain: 0.16 }, { f: 210, dur: 0.06, type: 'triangle', gain: 0.08 }],
  hat: [{ kind: 'noise', dur: 0.04, filter: 'highpass', freq: 7200, gain: 0.05 }],
  // 딱 맞았을 때만 얹는 반짝임. 그래도 맞은 것과 귀로 구별된다.
  sparkle: [{ f: 1567.98, dur: 0.1, type: 'sine', gain: 0.1 }, { f: 2093.0, dur: 0.12, type: 'sine', gain: 0.06, at: 0.05 }],
  // 음표가 없는 데를 친 소리. 가락을 흐트러뜨리지 않게 짧은 손뼉만 낸다.
  tap: [{ kind: 'noise', dur: 0.05, filter: 'bandpass', freq: 2400, gain: 0.07 }],
  finish: [{ f: 523.25, dur: 0.14, gain: 0.2 }, { f: 659.25, dur: 0.14, gain: 0.2, at: 0.13 }, { f: 783.99, dur: 0.14, gain: 0.2, at: 0.26 }, { f: 1046.5, dur: 0.34, gain: 0.22, at: 0.39 }],
  ...Object.fromEntries(chords.flatMap(c => [[`pad${c}`, pad(c)], [`bass${c}`, bass(c)], ...MELODY[c].map((f, lane) => [`m${c}${lane}`, melody(f)])])),
} as Record<SoundId, Recipe>;

export const rhythmSound = createGameSound<SoundId>('kids-rhythm', recipes);

export function playCue(id: CueId, delaySec: number): void {
  rhythmSound.play(id, { delay: Math.max(0, delaySec) });
}

/** 음표를 맞히면 가락 음을, 빈 곳을 치면 짧은 손뼉을 낸다. */
export function playLane(lane: number, chord: ChordId, grade: 'perfect' | 'good' | null): void {
  if (!grade) { rhythmSound.play('tap'); return; }
  rhythmSound.play(`m${chord}${Math.min(2, Math.max(0, lane)) as 0 | 1 | 2}`);
  if (grade === 'perfect') rhythmSound.play('sparkle');
}
