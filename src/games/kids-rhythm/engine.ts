/**
 * 숲속 리듬단: 동물 친구 셋이 박자에 맞춰 손뼉을 치는 놀이.
 *
 * 아이용이라 실패가 없다. 놓쳐도 노래는 끝까지 가고, 틀린 자리를 세어 보여 주지 않는다.
 * 판정 창도 넉넉하다. 손이 느려도 "잘했어요"가 나오는 쪽이 한 판 더 하게 만든다.
 *
 * DOM도 시계도 쓰지 않는다. 시각은 밖에서 넣어 주고, 무작위도 밖에서 받는다. 그래야 오늘의
 * 도전이 날짜 시드로 같은 노래를 만들어 줄 수 있고 테스트가 그대로 돌릴 수 있다.
 */

export const LANES = 3;

/** 박자에 딱 맞은 창과 그래도 맞은 것으로 쳐 주는 창(밀리초). 아이 손에 맞춰 넉넉하다. */
export const PERFECT_MS = 200;
export const GOOD_MS = 420;

/** 노래가 시작되기 전 숨 고르는 시간. 첫 음표가 갑자기 떨어지지 않게 한다. */
export const LEAD_IN_MS = 2400;

export type LevelId = 'easy' | 'normal';
export interface Level { id: LevelId; label: string; bpm: number; beats: number; density: number; offbeat: number }

export const LEVELS: Record<LevelId, Level> = {
  easy: { id: 'easy', label: '천천히', bpm: 84, beats: 56, density: 0.6, offbeat: 0 },
  normal: { id: 'normal', label: '보통', bpm: 108, beats: 64, density: 0.78, offbeat: 0.18 },
};
export const LEVEL_IDS: readonly LevelId[] = ['easy', 'normal'];
export const DEFAULT_LEVEL: LevelId = 'easy';

export const isLevel = (value: unknown): value is LevelId => typeof value === 'string' && (LEVEL_IDS as readonly string[]).includes(value);

export interface Note { id: number; time: number; lane: number }
export interface Song { level: LevelId; notes: Note[]; durationMs: number }

export type Grade = 'perfect' | 'good' | 'miss';
/** 딱 맞으면 2점, 그래도 맞으면 1점. 놓친 것은 0점이고 깎지 않는다. */
export const POINTS: Record<Grade, number> = { perfect: 2, good: 1, miss: 0 };

/**
 * 박자표 하나. 같은 자리가 세 번 이어지지 않게 해서, 한 손만 쓰지 않고 셋을 고루 치게 한다.
 * `random`은 [0, 1) 값을 주는 함수면 무엇이든 된다(오늘의 노래는 날짜 시드로 만든다).
 */
export function createSong(random: () => number, level: Level): Song {
  const beat = 60000 / level.bpm;
  const notes: Note[] = [];
  let lane = Math.min(LANES - 1, Math.floor(random() * LANES));
  let repeats = 0;
  const place = (time: number) => {
    let next = Math.min(LANES - 1, Math.floor(random() * LANES));
    if (next === lane) {
      repeats++;
      if (repeats >= 2) { next = (lane + 1 + Math.floor(random() * (LANES - 1))) % LANES; repeats = 0; }
    } else repeats = 0;
    lane = next;
    notes.push({ id: notes.length, time: Math.round(LEAD_IN_MS + time), lane });
  };
  for (let i = 0; i < level.beats; i++) {
    // 첫 두 박은 늘 비운다. 음표가 떨어지는 길을 눈으로 좇을 틈을 준다.
    if (i >= 2 && random() < level.density) place(i * beat);
    if (i >= 4 && level.offbeat > 0 && random() < level.offbeat) place(i * beat + beat / 2);
  }
  notes.sort((a, b) => a.time - b.time);
  return { level: level.id, notes: notes.map((n, i) => ({ ...n, id: i })), durationMs: Math.round(LEAD_IN_MS + level.beats * beat + GOOD_MS) };
}

export interface PlayState {
  song: Song;
  /** 음표 번호 → 판정. 아직 지나지 않은 음표는 여기에 없다. */
  results: Record<number, Grade>;
  combo: number;
  bestCombo: number;
  perfect: number;
  good: number;
  missed: number;
  score: number;
  /** settle이 여기까지 훑었다. 같은 음표를 두 번 놓친 것으로 세지 않기 위한 표시다. */
  settledTo: number;
}

export function startPlay(song: Song): PlayState {
  return { song, results: {}, combo: 0, bestCombo: 0, perfect: 0, good: 0, missed: 0, score: 0, settledTo: 0 };
}

export function gradeFor(deltaMs: number): Grade {
  const off = Math.abs(deltaMs);
  return off <= PERFECT_MS ? 'perfect' : off <= GOOD_MS ? 'good' : 'miss';
}

/** 그 자리에서 아직 판정되지 않은 음표 중, 지금 시각에 가장 가까운 것. 창 밖이면 null. */
export function nearestNote(state: PlayState, lane: number, timeMs: number): Note | null {
  let best: Note | null = null, bestOff = Infinity;
  for (const note of state.song.notes) {
    if (note.lane !== lane || state.results[note.id] !== undefined) continue;
    const off = Math.abs(note.time - timeMs);
    if (off <= GOOD_MS && off < bestOff) { best = note; bestOff = off; }
  }
  return best;
}

export interface TapResult { state: PlayState; grade: Grade | null; note: Note | null }

/**
 * 한 번 두드렸다. 가까운 음표가 없으면 아무 일도 없다 — 아이가 신나서 마구 두드려도 깎이지 않는다.
 */
export function tap(state: PlayState, lane: number, timeMs: number): TapResult {
  const note = nearestNote(state, lane, timeMs);
  if (!note) return { state, grade: null, note: null };
  const grade = gradeFor(note.time - timeMs);
  const combo = state.combo + 1;
  return {
    state: {
      ...state,
      results: { ...state.results, [note.id]: grade },
      combo,
      bestCombo: Math.max(state.bestCombo, combo),
      perfect: state.perfect + (grade === 'perfect' ? 1 : 0),
      good: state.good + (grade === 'good' ? 1 : 0),
      score: state.score + POINTS[grade],
    },
    grade,
    note,
  };
}

/** 지나가 버린 음표를 놓친 것으로 정리한다. 화면이 새로 그려질 때마다 부른다. */
export function settle(state: PlayState, timeMs: number): PlayState {
  let next = state, changed = false;
  for (let i = state.settledTo; i < state.song.notes.length; i++) {
    const note = state.song.notes[i];
    if (note.time + GOOD_MS >= timeMs) break;
    next = { ...next, settledTo: i + 1 };
    if (next.results[note.id] !== undefined) continue;
    next = { ...next, results: { ...next.results, [note.id]: 'miss' }, missed: next.missed + 1, combo: 0 };
    changed = true;
  }
  return changed || next.settledTo !== state.settledTo ? next : state;
}

export const isOver = (state: PlayState, timeMs: number) => timeMs >= state.song.durationMs;

/** 한 판에서 얻을 수 있는 가장 높은 점수. 결과 화면이 "몇 점 중 몇 점"을 말할 때 쓴다. */
export const maxScore = (song: Song) => song.notes.length * POINTS.perfect;

/** 아이에게 보여 줄 칭찬. 놓친 수가 아니라 해낸 수로 말한다. */
export function praise(state: PlayState): string {
  const hit = state.perfect + state.good;
  const total = state.song.notes.length;
  if (total === 0 || hit === total) return '하나도 빠뜨리지 않았어요!';
  if (hit >= total * 0.8) return '박자를 정말 잘 맞췄어요!';
  if (hit >= total * 0.5) return '손뼉이 척척 맞았어요!';
  if (hit > 0) return '잘했어요! 한 번 더 해 볼까요?';
  return '천천히 해도 괜찮아요. 같이 해 봐요!';
}
