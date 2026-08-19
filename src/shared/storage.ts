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

export function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // private mode / storage full / disabled — silently ignore, persistence is a nice-to-have
  }
}
