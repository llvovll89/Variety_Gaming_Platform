import { STATUS_INFO } from './cards';
import type { Fx, RunState, StatusId } from './types';

/** Named sound cues. The engine only decides *which* cue fits an event; ui/sound.ts makes the noise. */
export type Cue =
  | 'tap' | 'flick' | 'whoosh' | 'hit' | 'hitBig' | 'hurt' | 'clink' | 'clank' | 'heal' | 'buff' | 'debuff'
  | 'whistle' | 'horn' | 'victory' | 'defeat' | 'lever' | 'buzz' | 'deal' | 'clack' | 'coin' | 'relic'
  | 'snack' | 'bite' | 'register' | 'chime' | 'page' | 'roar' | 'scissors' | 'upgrade';

export interface CueEvent {
  cue: Cue;
  /** Seconds after "now"; matches the stagger of the floating numbers on screen. */
  delay: number;
  /** 0..1, used for hit weight. */
  intensity: number;
}

const MAX_PER_BATCH = 5;
const STAGGER = 0.12;

/** Turns the visible combat effects of one beat into a short, de-duplicated list of cues. */
export function cuesForFx(fx: readonly Fx[]): CueEvent[] {
  const out: CueEvent[] = [];
  const seen = new Set<string>();
  fx.forEach((item, index) => {
    let cue: Cue | null = null;
    if (item.kind === 'damage') cue = item.target === 'player' ? 'hurt' : item.amount >= 15 ? 'hitBig' : 'hit';
    else if (item.kind === 'block') cue = 'clink';
    else if (item.kind === 'blocked') cue = 'clank';
    else if (item.kind === 'heal') cue = 'heal';
    else if (item.kind === 'status' && item.label && item.label in STATUS_INFO) cue = STATUS_INFO[item.label as StatusId].debuff ? 'debuff' : 'buff';
    if (!cue) return;
    // Hits always sound; repeated non-hit cues (e.g. block on three allies) collapse into one.
    const key = cue === 'hit' || cue === 'hitBig' || cue === 'hurt' ? `${cue}-${index}` : cue;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ cue, delay: index * STAGGER, intensity: item.kind === 'damage' ? Math.min(1, 0.35 + item.amount / 24) : 0.6 });
  });
  return out.slice(0, MAX_PER_BATCH);
}

/** Cues for changes outside the fight: travelling, loot, shopping, resting and events. */
export function cuesForRunChange(prev: RunState | null, next: RunState | null): Cue[] {
  if (!prev || !next || prev === next) return [];
  const cues: Cue[] = [];
  if (prev.path.length < next.path.length) cues.push('clack');
  if (next.phase === 'combat' || prev.phase === 'combat') {
    if (next.snacks.length < prev.snacks.length) cues.push('bite');
    return cues;
  }
  if (next.gold > prev.gold) cues.push('coin');
  if (next.gold < prev.gold && next.phase === 'shop') cues.push('register');
  if (next.relics.length > prev.relics.length) cues.push('relic');
  if (next.snacks.length > prev.snacks.length) cues.push('snack');
  if (next.snacks.length < prev.snacks.length) cues.push(next.hp > prev.hp ? 'bite' : 'tap');
  if (next.deck.length > prev.deck.length) cues.push('flick');
  if (next.deck.length < prev.deck.length) cues.push('scissors');
  if (next.deck.filter(c => c.up).length > prev.deck.filter(c => c.up).length) cues.push('upgrade');
  if (next.hp > prev.hp && next.phase === 'rest') cues.push('chime');
  if (prev.event?.result === null && next.event?.result) cues.push('page');
  return [...new Set(cues)];
}
