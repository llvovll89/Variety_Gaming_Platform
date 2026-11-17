const NAMESPACE = "arcade";

/** Namespaced localStorage key convention every game should follow, e.g. "arcade:hachuping-jump:highScore". */
export function gameStorageKey(gameId: string, suffix: string): string {
  return `${NAMESPACE}:${gameId}:${suffix}`;
}

export function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** False when the browser refused the write (private mode, storage full, disabled). */
export function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    // persistence is a nice-to-have; callers that care check the result
    return false;
  }
}
