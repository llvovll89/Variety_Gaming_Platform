/**
 * The key a player pressed, as a lowercase letter or digit read from the physical key (event.code).
 * With a Korean keyboard layout event.key is the Hangul jamo ('ㅈ' for W), so letter controls
 * compared against event.key do nothing until the player switches to English. Other keys
 * (arrows, Escape, Enter, Space) come back as event.key.
 */
export function keyOf(event: { key: string; code?: string }): string {
  const code = event.code ?? '';
  if (/^Key[A-Z]$/.test(code)) return code.slice(3).toLowerCase();
  if (/^Digit[0-9]$/.test(code)) return code.slice(5);
  return event.key.length === 1 ? event.key.toLowerCase() : event.key;
}
