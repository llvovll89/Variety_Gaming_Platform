import type { BattleEvent, Point } from './game';

export type Facing = 'se' | 'sw' | 'ne' | 'nw';
export const STEP_MS = 130;
export const ACTION_MS = 620;
export function facing(from: Point, to: Point): Facing {
  const dx = to.x - from.x, dy = to.y - from.y;
  return Math.abs(dx) >= Math.abs(dy) ? dx >= 0 ? 'se' : 'nw' : dy >= 0 ? 'sw' : 'ne';
}
export function moveDuration(event: BattleEvent | null) { return Math.max(0, (event?.path?.length ?? 1) - 1) * STEP_MS; }
export function eventDuration(event: BattleEvent | null) { return event ? moveDuration(event) + (event.kind === 'move' ? 0 : ACTION_MS) : 0; }
export function motion(event: BattleEvent, elapsed: number) {
  const path = event.path ?? [event.from], time = Math.max(0, elapsed);
  const segment = Math.min(Math.max(0, path.length - 2), Math.floor(time / STEP_MS));
  const from = path[segment], to = path[Math.min(segment + 1, path.length - 1)];
  const fraction = path.length < 2 ? 1 : Math.min(1, (time - segment * STEP_MS) / STEP_MS);
  return { from, to, fraction, walking: time < moveDuration(event), actionTime: time - moveDuration(event) };
}
