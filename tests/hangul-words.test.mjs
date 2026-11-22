import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

const compiled = await build({ entryPoints: ['src/games/hangul-words/engine.ts'], bundle: true, write: false, format: 'esm', platform: 'node' });
const { WORDS, MAX_GUESSES, decompose, isComplete, judge, learned, newBoard, guess, wordForSeed, randomWord } =
  await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));

const states = (g, a) => judge(g, a).map(t => t.state);
const jamo = (g, a) => judge(g, a).map(t => t.jamo);

test('every answer is two complete Hangul syllables, and none repeats', () => {
  assert.ok(WORDS.length >= 200, `${WORDS.length} words is enough for a year of play`);
  assert.equal(new Set(WORDS).size, WORDS.length, 'no duplicates');
  for (const word of WORDS) assert.ok(isComplete(word), `${word} is two finished syllables`);
});

test('a half-typed syllable is not a word yet', () => {
  // A Korean keyboard reports 'ㄱ' and 'ㄱㅏ' while the syllable is still being composed.
  for (const text of ['', '가', 'ㄱ', 'ㄱㅏ', '가ㅂ', '가방이', 'ab', '가 ', '１２']) assert.equal(isComplete(text), false, text);
  for (const text of ['가방', '왕밤', '흙빛']) assert.equal(isComplete(text), true, text);
});

test('decompose splits a syllable and rejects anything else', () => {
  assert.deepEqual(decompose('가'), [0, 0, 0]);
  assert.deepEqual(decompose('힣'), [18, 20, 27]);
  assert.deepEqual(decompose('강'), [0, 0, 21]);
  for (const ch of ['ㄱ', 'a', '1', ' ', '漢']) assert.equal(decompose(ch), null, ch);
});

test('a syllable in the wrong place is a move, and a repeat is only credited once', () => {
  assert.deepEqual(states('가방', '가방'), ['hit', 'hit']);
  assert.deepEqual(states('방가', '가방'), ['move', 'move']);
  assert.deepEqual(states('가을', '가방'), ['hit', 'miss']);
  // Both guessed syllables are '가' but the answer holds only one: the placed one wins it.
  assert.deepEqual(states('가가', '가방'), ['hit', 'miss']);
  assert.deepEqual(states('가가', '방가'), ['miss', 'hit']);
});

test('a wrong syllable still reports which jamo were right', () => {
  // 바 vs 바: same everywhere. 다 vs 람: ㄷ≠ㄹ and ㄷ is nowhere, ㅏ matches, 다 has no final but 람 has ㅁ.
  assert.deepEqual(jamo('바다', '바람'), [['hit', 'hit', 'hit'], ['miss', 'hit', 'miss']]);
  // 늘(ㄴ/ㅡ/ㄹ) against 람(ㄹ/ㅏ/ㅁ): nothing lines up, and ㄴ/ㅡ/ㄹ are nowhere else either.
  assert.deepEqual(jamo('하늘', '바람')[1], ['miss', 'miss', 'miss']);
  // A jamo used elsewhere in the answer is 'near': ㄹ is the final of 람, here it is a lead.
  assert.deepEqual(judge('라면', '바람')[0].jamo[0], 'near');
});

test('having no final is only a hint when the answer has none either', () => {
  // 가(받침 없음) vs 방(받침 ㅇ): "no final" must not read as a match.
  assert.equal(judge('가을', '방울')[0].jamo[2], 'miss');
  // Both sides without a final do agree, and that is worth saying.
  assert.equal(judge('가치', '바다')[0].jamo[2], 'hit');
});

test('a board ends on the answer or after six tries, and ignores anything else', () => {
  let board = newBoard('가방');
  for (let i = 0; i < MAX_GUESSES - 1; i++) board = guess(board, '구름');
  assert.equal(board.status, 'playing');
  assert.equal(board.rows.length, MAX_GUESSES - 1);
  // A half-typed word changes nothing at all.
  assert.equal(guess(board, 'ㄱ'), board);
  assert.equal(guess(board, '가'), board);

  const lost = guess(board, '구름');
  assert.equal(lost.status, 'lost');
  assert.equal(lost.rows.length, MAX_GUESSES);
  assert.equal(guess(lost, '가방'), lost, 'a finished board takes no more guesses');

  const won = guess(board, '가방');
  assert.equal(won.status, 'won');
  assert.equal(guess(won, '구름'), won);
});

test('the letter hints keep the best thing learned about each syllable', () => {
  let board = newBoard('가방');
  board = guess(board, '방울');
  board = guess(board, '방가');
  const known = learned(board.rows);
  assert.equal(known.get('방'), 'move', '방 was never in the right place');
  assert.equal(known.get('울'), 'miss');
  // 가 was a miss on the first row and a hit on the second: the hit is what the player knows now.
  board = guess(newBoard('가방'), '가울');
  assert.equal(learned(board.rows).get('가'), 'hit');
});

test('the day decides the word, so everyone gets the same one', () => {
  for (const seed of [0, 1, 7, 4294967295, -12345, 2.7]) {
    const word = wordForSeed(seed);
    assert.ok(WORDS.includes(word), `${seed} → ${word}`);
    assert.equal(wordForSeed(seed), word, 'the same seed always gives the same word');
  }
  // Over a stretch of seeds the whole list comes up, rather than a handful of words repeating.
  const seen = new Set(Array.from({ length: WORDS.length }, (_, i) => wordForSeed(i)));
  assert.equal(seen.size, WORDS.length);
});

test('a practice word never hands back the word of the day', () => {
  const today = WORDS[0];
  assert.notEqual(randomWord(() => 0, today), today);
  // Out-of-range randoms must still land on a real word.
  for (const value of [0, 0.999999, 1, -1]) assert.ok(WORDS.includes(randomWord(() => value)));
});
