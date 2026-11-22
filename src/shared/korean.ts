/** '로'인가 '으로'인가: 받침이 없거나 ㄹ 받침이면 '로'다 ('신야로', '낙양성으로'). */
export function toParticle(word: string): string {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  if (code < 0 || code > 11171) return '(으)로';
  const final = code % 28;
  return final === 0 || final === 8 ? '로' : '으로';
}
