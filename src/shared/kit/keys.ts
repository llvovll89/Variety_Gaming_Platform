/**
 * The key a player pressed, as a lowercase letter where it is one.
 * - A plain Latin letter or digit is used as typed, so Dvorak or Colemak users get the letter printed
 *   on the key (and Shift+1 stays '!').
 * - Anything else typed as one character that is not ASCII (Hangul jamo such as 'ㅈ' for W, or an
 *   IME 'Process' key) falls back to the physical key (event.code), so letter controls keep
 *   working with a Korean keyboard layout.
 * - Other keys (arrows, Escape, Enter, Space) come back as event.key.
 */
export function keyOf(event: { key: string; code?: string }): string {
  if (/^[A-Za-z0-9]$/.test(event.key)) return event.key.toLowerCase();
  const code = event.code ?? '';
  const notLatin = event.key === 'Process' || (event.key.length === 1 && event.key.charCodeAt(0) > 0x7f);
  if (notLatin && /^Key[A-Z]$/.test(code)) return code.slice(3).toLowerCase();
  if (notLatin && /^Digit[0-9]$/.test(code)) return code.slice(5);
  return event.key.length === 1 ? event.key.toLowerCase() : event.key;
}
