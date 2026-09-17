/**
 * Turn playback.
 *
 * `turn.ts` hands back one presentable event at a time; this turns those into something the
 * player can watch. Two constraints shape it:
 *
 *  - **A turn must never become a staring contest.** Seven factions moving a dozen armies at
 *    half a second each is a minute and a half of nothing to do. So only events the player
 *    can actually see or actually cares about get animated, the total is hard-capped, and
 *    there is always a 가속 button.
 *  - **Nothing here owns game state.** The rules already ran; these are pure presentation
 *    values that decay on a clock.
 */
import { axialToPixel, type HexCoord, type Point } from "./hex";
import { ANIM, HEX_SIZE } from "./constants";
import type { GameEvent } from "./events";

export interface MoveAnim {
  kind: "move";
  unitId: number;
  from: HexCoord;
  to: HexCoord;
  ms: number;
}

export interface BeatAnim {
  kind: "beat";
  at: HexCoord;
  ms: number;
}

export type BlockingAnim = MoveAnim | BeatAnim;

/** A floating number or word that rises and fades. Never blocks playback. */
export interface Fx {
  at: HexCoord;
  text: string;
  color: string;
  born: number;
  ms: number;
}

export interface ActiveMove {
  unitId: number;
  /** Interpolated world position. */
  point: Point;
}

export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/** Where a moving unit should be drawn right now, in world pixels. */
export function movePoint(anim: MoveAnim, t: number): Point {
  const a = axialToPixel(anim.from, HEX_SIZE);
  const b = axialToPixel(anim.to, HEX_SIZE);
  const k = easeOutCubic(Math.max(0, Math.min(1, t)));
  return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k };
}

export interface Presentation {
  blocking: BlockingAnim | null;
  fx: Fx[];
  /** Pull the camera here before playing, if the event is worth looking at. */
  focus: HexCoord | null;
}

/**
 * Decide how to show one event. `now` stamps the effects so they can age out.
 * Returns nothing to animate for bookkeeping events; the log already carries those.
 */
export function present(event: GameEvent, now: number): Presentation {
  const none: Presentation = { blocking: null, fx: [], focus: null };

  switch (event.kind) {
    case "move":
      return {
        blocking: {
          kind: "move",
          unitId: event.unitId,
          from: event.from,
          to: event.to,
          ms: ANIM.unitMovePerHexMs * 2.2,
        },
        fx: [],
        focus: null,
      };

    case "battle": {
      const fx: Fx[] = [
        { at: event.at, text: `-${event.dealt.toLocaleString()}`, color: "#a33226", born: now, ms: 900 },
      ];
      return { blocking: { kind: "beat", at: event.at, ms: ANIM.attackMs }, fx, focus: event.at };
    }

    case "siege": {
      const fx: Fx[] = [
        { at: event.at, text: `성벽 -${event.dealt.toLocaleString()}`, color: "#7a2020", born: now, ms: 1000 },
      ];
      return { blocking: { kind: "beat", at: event.at, ms: ANIM.attackMs }, fx, focus: event.at };
    }

    case "tactic":
      return {
        blocking: { kind: "beat", at: event.at, ms: ANIM.attackMs * 0.6 },
        fx: [{ at: event.at, text: "전법!", color: "#1f4e79", born: now, ms: 800 }],
        focus: event.at,
      };

    case "capture":
      return {
        blocking: { kind: "beat", at: event.at, ms: ANIM.captureMs },
        fx: [{ at: event.at, text: "함락", color: "#a33226", born: now, ms: 1400 }],
        focus: event.at,
      };

    case "rout":
    case "destroy":
      return {
        blocking: { kind: "beat", at: event.at, ms: ANIM.attackMs * 0.7 },
        fx: [{ at: event.at, text: event.kind === "rout" ? "퇴각" : "궤멸", color: "#6b4a2f", born: now, ms: 1100 }],
        focus: event.at,
      };

    case "starve":
      return {
        blocking: null,
        fx: [{ at: event.at, text: `굶주림 -${event.lost.toLocaleString()}`, color: "#8a6d2f", born: now, ms: 1100 }],
        focus: null,
      };

    case "raze":
      return {
        blocking: { kind: "beat", at: event.at, ms: ANIM.attackMs * 0.6 },
        fx: [{ at: event.at, text: "소실", color: "#a33226", born: now, ms: 1000 }],
        focus: event.at,
      };

    case "dispatch":
      return { blocking: null, fx: [{ at: event.at, text: "출진", color: "#1f5c3a", born: now, ms: 900 }], focus: null };

    default:
      return none;
  }
}

/** Age the effect list, dropping anything that has finished. */
export function ageFx(fx: Fx[], now: number): Fx[] {
  return fx.filter((f) => now - f.born < f.ms);
}

/** 0..1 progress of an effect, for alpha and rise. */
export function fxProgress(f: Fx, now: number): number {
  return Math.max(0, Math.min(1, (now - f.born) / f.ms));
}
