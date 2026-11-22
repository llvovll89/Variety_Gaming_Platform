/**
 * 오늘의 낱말: 두 글자 낱말을 여섯 번 안에 맞히는 추리 게임.
 *
 * 판정은 글자 단위다. 한국어는 한 글자가 뜻의 단위라 자모만 맞히는 판정은 읽기 어렵다.
 * 다만 글자 단위만으로는 단서가 너무 적어서(한글 음절은 1만 자가 넘는다), 맞지 않은 글자에는
 * 초성·중성·종성이 각각 맞았는지를 보조 단서로 함께 준다.
 *
 * DOM도 시계도 쓰지 않는다. 오늘의 낱말은 날짜 시드만으로 정해지므로 서버 없이 모두가 같은
 * 문제를 푼다.
 */

export const WORD_LENGTH = 2;
export const MAX_GUESSES = 6;

const BASE = 0xac00;
const JUNG_COUNT = 21;
const JONG_COUNT = 28;

/** 초성 19자. 인덱스가 곧 음절 코드의 초성 번호다. */
export const CHO = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'] as const;
/** 중성 21자. */
export const JUNG = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'] as const;
/** 종성 28자. 첫 칸은 받침이 없는 경우다. */
export const JONG = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'] as const;

/** 음절 하나의 초·중·종성 번호. 완성형 음절이 아니면 null. */
export function decompose(syllable: string): [number, number, number] | null {
  const code = syllable.codePointAt(0);
  if (code === undefined || code < BASE || code > 0xd7a3) return null;
  const offset = code - BASE;
  return [Math.floor(offset / (JUNG_COUNT * JONG_COUNT)), Math.floor(offset / JONG_COUNT) % JUNG_COUNT, offset % JONG_COUNT];
}

/** 조합이 끝난 두 글자인지. 자모만 입력된 중간 상태('ㄱ', 'ㄱㅏ')는 아직 낱말이 아니다. */
export function isComplete(text: string): boolean {
  return [...text].length === WORD_LENGTH && [...text].every(ch => decompose(ch) !== null);
}

export type TileState = 'hit' | 'move' | 'miss';
export type JamoState = 'hit' | 'near' | 'miss';

export interface Tile {
  syllable: string;
  /** hit: 이 자리에 그 글자. move: 낱말에 있지만 다른 자리. miss: 없는 글자. */
  state: TileState;
  /** 같은 자리 정답 글자와 견준 초·중·종성. 받침이 둘 다 없으면 종성은 hit다. */
  jamo: [JamoState, JamoState, JamoState];
}

/** 한 자모가 정답 어딘가에 쓰였는지. 같은 자리가 아니어도 near다. */
function usedSomewhere(answer: string, slot: 0 | 1 | 2, value: number): boolean {
  return [...answer].some(ch => decompose(ch)?.[slot] === value);
}

/**
 * 한 번의 추측을 정답과 견준다.
 * 글자 단위는 두 번 훑는다. 먼저 자리까지 같은 글자를 hit으로 묶고, 남은 글자 중에서만 move를
 * 찾는다. 그래야 같은 글자가 두 번 나올 때 쓰이지 않은 글자에만 move가 붙는다.
 */
export function judge(guess: string, answer: string): Tile[] {
  const g = [...guess], a = [...answer];
  const taken = a.map((ch, i) => ch === g[i]);
  const states: TileState[] = g.map((ch, i) => {
    if (a[i] === ch) return 'hit';
    const spare = a.findIndex((other, j) => !taken[j] && other === ch);
    if (spare < 0) return 'miss';
    taken[spare] = true;
    return 'move';
  });
  return g.map((syllable, i) => {
    const mine = decompose(syllable), theirs = decompose(a[i] ?? '');
    const jamo: [JamoState, JamoState, JamoState] = [0, 1, 2].map(slot => {
      if (!mine || !theirs) return 'miss';
      const value = mine[slot];
      if (value === theirs[slot]) return 'hit';
      // 받침 없음(0)은 "없다"는 사실이라, 다른 자리에 받침이 없다고 해서 단서가 되지 않는다.
      if (slot === 2 && value === 0) return 'miss';
      return usedSomewhere(answer, slot as 0 | 1 | 2, value) ? 'near' : 'miss';
    }) as [JamoState, JamoState, JamoState];
    return { syllable, state: states[i], jamo };
  });
}

/** 글자 하나하나에 대해 지금까지 알아낸 것 중 가장 좋은 상태. 글자 힌트 줄에 쓴다. */
export function learned(rows: readonly Tile[][]): Map<string, TileState> {
  const rank: Record<TileState, number> = { miss: 0, move: 1, hit: 2 };
  const best = new Map<string, TileState>();
  for (const row of rows) {
    for (const tile of row) {
      const seen = best.get(tile.syllable);
      if (!seen || rank[tile.state] > rank[seen]) best.set(tile.syllable, tile.state);
    }
  }
  return best;
}

export interface Board {
  answer: string;
  rows: Tile[][];
  /** 아직 쓰지 않은 추측이 남았고 아직 맞히지 못한 상태. */
  status: 'playing' | 'won' | 'lost';
}

export function newBoard(answer: string): Board {
  return { answer, rows: [], status: 'playing' };
}

/** 추측 하나를 더한 새 판. 완성되지 않은 글자나 이미 끝난 판은 그대로 돌려준다. */
export function guess(board: Board, word: string): Board {
  if (board.status !== 'playing' || !isComplete(word)) return board;
  const rows = [...board.rows, judge(word, board.answer)];
  const won = word === board.answer;
  return { ...board, rows, status: won ? 'won' : rows.length >= MAX_GUESSES ? 'lost' : 'playing' };
}

/**
 * 오늘의 낱말. 허브가 주는 날짜 시드로 고르므로 같은 날에는 모두가 같은 낱말을 푼다.
 * 낱말 수보다 날이 많아지면 한 바퀴 돌아 다시 나온다.
 */
export function wordForSeed(seed: number): string {
  return WORDS[Math.abs(Math.trunc(seed)) % WORDS.length];
}

/** 연습용 낱말. 오늘의 낱말과 겹치면 다음 낱말로 비킨다. */
export function randomWord(random: () => number, avoid?: string): string {
  // [0, 1)을 벗어나는 값이 와도 목록 밖을 가리키지 않게 양쪽을 자른다.
  const raw = Math.floor(random() * WORDS.length);
  const index = Number.isFinite(raw) ? Math.min(WORDS.length - 1, Math.max(0, raw)) : 0;
  const picked = WORDS[index];
  return picked === avoid ? WORDS[(index + 1) % WORDS.length] : picked;
}

/** 두 글자 일상어. 받침 유무와 모음이 고루 섞이도록 골랐다. */
export const WORDS: readonly string[] = [
  '가방', '가을', '가족', '간장', '감기', '감자', '강물', '거울', '거품', '건물',
  '겨울', '결혼', '경찰', '계단', '계란', '고개', '고기', '고래', '고추', '공원',
  '공주', '과일', '과자', '구름', '국수', '군인', '귀신', '그림', '극장', '근육',
  '기름', '기분', '기차', '기침', '김밥', '김치', '까치', '꼬리', '꽃밭', '나무',
  '나비', '나이', '낙엽', '날개', '냄비', '냄새', '노래', '노을', '녹차', '논밭',
  '농구', '누나', '눈물', '눈썹', '느낌', '늑대', '다리', '단추', '달력', '담요',
  '당근', '대문', '대추', '덕분', '도시', '도장', '독서', '동네', '동생', '돼지',
  '된장', '두부', '뒷산', '등대', '딸기', '땅콩', '떡국', '뚜껑', '라면', '레몬',
  '마늘', '마을', '마음', '만두', '말씀', '망치', '매미', '맥주', '머리', '먼지',
  '메모', '명절', '모래', '모자', '목욕', '몸살', '문어', '문제', '물감', '물결',
  '미소', '바다', '바람', '바위', '박수', '반달', '반지', '발목', '방석', '방울',
  '배구', '배낭', '배추', '백조', '버섯', '버스', '번개', '벌집', '베개', '벼락',
  '변화', '별빛', '병원', '보리', '보물', '봄날', '부엌', '북극', '분수', '불빛',
  '비누', '빗물', '빨래', '사과', '사슴', '사자', '사진', '산책', '상자', '새벽',
  '새우', '색깔', '생선', '서랍', '선물', '선생', '설탕', '성격', '세계', '세수',
  '소금', '소리', '손님', '손톱', '수박', '수업', '수염', '숙제', '순대', '숲길',
  '시간', '시계', '시골', '시장', '식당', '신발', '신호', '실수', '심장', '쌀밥',
  '썰매', '아기', '아침', '안개', '안경', '야구', '약국', '양말', '양파', '어깨',
  '어제', '얼굴', '얼음', '엄마', '여름', '여우', '역사', '연기', '연필', '열쇠',
  '영화', '오늘', '오리', '오이', '오후', '온도', '옷장', '와인', '왕자', '요리',
  '우산', '우유', '운동', '월급', '유리', '육지', '은행', '음악', '의자', '이마',
  '이불', '이사', '인형', '일기', '입술', '자두', '자유', '작가', '잔디', '잠옷',
  '장갑', '장미', '저녁', '전화', '절벽', '점심', '정원', '제비', '조개', '조카',
  '종이', '주말', '주방', '죽순', '줄기', '중국', '지갑', '지도', '지붕', '지하',
  '진주', '질문', '짜장', '책상', '천둥', '천사', '철도', '청소', '체육', '초록',
  '추석', '축구', '출발', '충전', '치마', '친구', '칠판', '침대', '칫솔', '카드',
  '커피', '토끼', '파도', '파리', '팥죽', '포도', '표정', '풍선', '하늘', '하루',
  '학교', '한글', '항구', '해변', '햇살', '행복', '허리', '호두', '호수', '혼자',
  '화분', '화살', '황소', '회사', '휴지', '희망',
];
