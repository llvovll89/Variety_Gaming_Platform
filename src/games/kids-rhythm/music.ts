/**
 * 반주 악보. 음표가 떨어지는 박과 같은 박 위에 쿵·짝 반주와 화음이 깔린다.
 *
 * 리듬 게임이 리듬 게임처럼 느껴지는 건 화면보다 소리 쪽이다. 반주가 없으면 "선에 맞춰 누르기"일
 * 뿐이고, 반주가 있으면 몸이 먼저 박을 탄다. 음표 시각(engine의 createSong)은 그대로 두고,
 * 그 박 격자 위에 반주를 얹는다. DOM도 소리도 쓰지 않는 순수 계산이라 테스트가 그대로 돌린다.
 */
import { LEAD_IN_MS, LEVELS, type LevelId } from './engine';

/** 한 마디에 네 박, 네 마디마다 같은 화음 진행(도-솔-라단조-파)을 돈다. */
export const BEATS_PER_BAR = 4;
export const CHORD_COUNT = 4;
/** 첫 박 전에 세어 주는 박 수. "셋, 둘, 하나" 다음 첫 박에 반주가 들어온다. */
export const COUNT_IN = 3;

export type ChordId = 0 | 1 | 2 | 3;
export type CueId = 'count' | 'kick' | 'snare' | 'hat' | `bass${ChordId}` | `pad${ChordId}`;
export interface Cue { at: number; id: CueId }

export const beatMs = (level: LevelId) => 60000 / LEVELS[level].bpm;

/** 노래 시각 → 박 번호(소수). 0번 박이 LEAD_IN_MS이고, 그 전은 음수다. */
export const beatAt = (level: LevelId, timeMs: number) => (timeMs - LEAD_IN_MS) / beatMs(level);

/** 그 시각에 울리는 화음. 첫 박 전에는 첫 화음이다. */
export function chordAt(level: LevelId, timeMs: number): ChordId {
  const beat = Math.max(0, Math.floor(beatAt(level, timeMs)));
  return (Math.floor(beat / BEATS_PER_BAR) % CHORD_COUNT) as ChordId;
}

/**
 * [from, to) 사이에 울려야 할 반주. 화면이 그려질 때마다 조금 앞까지 미리 불러 예약한다.
 * 같은 구간을 두 번 부르지 않는 건 부르는 쪽 몫이다(구간이 반열림이라 이어 붙이면 겹치지 않는다).
 */
export function cuesBetween(level: LevelId, beats: number, from: number, to: number): Cue[] {
  const beat = beatMs(level);
  const cues: Cue[] = [];
  for (let k = COUNT_IN; k >= 1; k--) {
    const at = LEAD_IN_MS - k * beat;
    if (at >= from && at < to) cues.push({ at, id: 'count' });
  }
  // 반 박 단위로 훑는다. 정박은 쿵/짝, 엇박은 찰랑.
  const firstHalf = Math.max(0, Math.ceil(((from - LEAD_IN_MS) / beat) * 2));
  for (let half = firstHalf; half < beats * 2; half++) {
    const at = LEAD_IN_MS + (half * beat) / 2;
    if (at >= to) break;
    if (at < from) continue;
    if (half % 2) { cues.push({ at, id: 'hat' }); continue; }
    const index = half / 2;
    const inBar = index % BEATS_PER_BAR;
    const chord = (Math.floor(index / BEATS_PER_BAR) % CHORD_COUNT) as ChordId;
    if (inBar === 0) cues.push({ at, id: `pad${chord}` });
    if (inBar % 2 === 0) cues.push({ at, id: 'kick' }, { at, id: `bass${chord}` });
    else cues.push({ at, id: 'snare' });
  }
  return cues;
}
