import { demoSchema, STORAGE_KEY, type DemoState } from "./demoGame";

export const BACKUP_KEY = `${STORAGE_KEY}-previous`;
export type SaveResult = { status: "saved"; at: number } | { status: "conflict" } | { status: "failed" };
type Storage = Pick<globalThis.Storage, "getItem" | "setItem">;
type Exclusive = <T>(work: () => T) => Promise<T>;

/** Compare and write inside one origin-wide lock, including queued writes from this tab. */
export class LocalSave {
  private expected: string | null;
  private queue: Promise<unknown> = Promise.resolve();
  private conflicted = false;

  constructor(private storage: Storage, initial: string | null, private exclusive: Exclusive) {
    this.expected = initial;
  }

  check() {
    if (this.storage.getItem(STORAGE_KEY) !== this.expected) this.conflicted = true;
    return this.conflicted;
  }

  write(state: DemoState): Promise<SaveResult> {
    const task = this.queue.then(() => this.exclusive<SaveResult>(() => {
      if (this.check()) return { status: "conflict" };
      const at = Date.now();
      const raw = JSON.stringify({ ...state, savedAt: at, saveRevision: crypto.randomUUID() });
      // Preserve only validated records; corrupt originals remain available in the recovery UI.
      if (this.expected) {
        let valid = false;
        try { valid = demoSchema.safeParse(JSON.parse(this.expected)).success; } catch { /* invalid original */ }
        if (valid) this.storage.setItem(BACKUP_KEY, this.expected);
      }
      this.storage.setItem(STORAGE_KEY, raw);
      this.expected = raw;
      return { status: "saved", at };
    })).catch((): SaveResult => ({ status: "failed" }));
    this.queue = task;
    return task;
  }
}

export function browserSave(initial: string | null) {
  return new LocalSave(localStorage, initial, work => {
    // Without atomic cross-tab exclusion, keep progress in memory and offer file backup.
    if (!navigator.locks) return Promise.reject(new Error("이 브라우저는 안전한 탭 간 저장을 지원하지 않습니다."));
    return navigator.locks.request(STORAGE_KEY, work);
  });
}
