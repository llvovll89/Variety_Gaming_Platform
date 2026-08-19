import {
  HEAD_HIT_RADIUS_FACTOR,
  HEAD_ON_ALIGNMENT_EPSILON,
  SELF_COLLISION_SKIP_FACTOR,
  SEGMENT_GRID_CELL_SIZE,
} from "./constants";
import { SpatialHashGrid } from "./spatialGrid";
import type { Snake, Star } from "./types";
import { getSegmentsFromNeck } from "./snake";
import { distance } from "../../../utils/math";

export interface DeathEvent {
  victimId: number;
  killerId: number | null;
}

export interface StarPickupEvent {
  snakeId: number;
  starId: number;
}

let segEntryCounter = 0;

interface SegmentTag {
  snakeId: number;
}

export function buildSegmentGrid(snakes: Snake[]): SpatialHashGrid<SegmentTag> {
  const grid = new SpatialHashGrid<SegmentTag>(SEGMENT_GRID_CELL_SIZE);
  for (const snake of snakes) {
    if (!snake.alive) continue;
    for (const seg of getSegmentsFromNeck(snake)) {
      grid.insert(segEntryCounter++, seg.x, seg.y, { snakeId: snake.id });
    }
  }
  return grid;
}

export function findStarPickups(
  snakes: Snake[],
  starGrid: SpatialHashGrid<Star>,
  maxStarRadius: number,
): StarPickupEvent[] {
  const events: StarPickupEvent[] = [];
  const consumed = new Set<number>();
  for (const snake of snakes) {
    if (!snake.alive) continue;
    const candidates = starGrid.queryRadius(
      snake.head.x,
      snake.head.y,
      snake.radius + maxStarRadius,
    );
    for (const entry of candidates) {
      if (consumed.has(entry.id)) continue;
      const star = entry.data;
      const d = distance(snake.head, { x: entry.x, y: entry.y });
      if (d < snake.radius + star.radius) {
        consumed.add(entry.id);
        events.push({ snakeId: snake.id, starId: entry.id });
      }
    }
  }
  return events;
}

export function findBodyCollisions(
  snakes: Snake[],
  segmentGrid: SpatialHashGrid<SegmentTag>,
): DeathEvent[] {
  const events: DeathEvent[] = [];
  const byId = new Map(snakes.map((s) => [s.id, s]));

  for (const attacker of snakes) {
    if (!attacker.alive) continue;
    const selfSkipRadius = attacker.radius * SELF_COLLISION_SKIP_FACTOR;
    const queryRadius = attacker.radius * (1 + HEAD_HIT_RADIUS_FACTOR) + 40;
    const candidates = segmentGrid.queryRadius(
      attacker.head.x,
      attacker.head.y,
      queryRadius,
    );

    for (const entry of candidates) {
      const owner = byId.get(entry.data.snakeId);
      if (!owner || !owner.alive) continue;

      const isSelf = owner.id === attacker.id;
      // A head-to-head clash between attacker and owner is exclusively resolved by
      // findHeadOnCollisions ("whoever rammed wins"). Without this, the owner's own
      // neck segment — only a fraction of a radius behind its head — would otherwise
      // also register as a body hit here and kill both sides regardless of who aimed
      // more directly at the other.
      if (!isSelf && distance(attacker.head, owner.head) < attacker.radius + owner.radius) {
        continue;
      }

      const d = distance(attacker.head, { x: entry.x, y: entry.y });
      if (isSelf && d < selfSkipRadius) continue;

      const hitRadius = owner.radius + attacker.radius * HEAD_HIT_RADIUS_FACTOR;
      if (d < hitRadius) {
        events.push({ victimId: attacker.id, killerId: isSelf ? null : owner.id });
        break;
      }
    }
  }
  return events;
}

/**
 * Head-on collisions are resolved by "whoever rammed wins": compare how directly each
 * snake's heading points at the other's head at the moment of impact. The one more
 * squarely aimed at its opponent is the aggressor and survives; near-equal alignment
 * (a true face-to-face collision) kills both.
 */
export function findHeadOnCollisions(snakes: Snake[]): DeathEvent[] {
  const events: DeathEvent[] = [];
  const alive = snakes.filter((s) => s.alive);

  for (let i = 0; i < alive.length; i++) {
    for (let j = i + 1; j < alive.length; j++) {
      const a = alive[i];
      const b = alive[j];
      const d = distance(a.head, b.head);
      if (d >= a.radius + b.radius) continue;

      const alignment = (self: Snake, other: Snake): number => {
        const toOther = Math.atan2(other.head.y - self.head.y, other.head.x - self.head.x);
        return Math.cos(self.heading - toOther);
      };

      const alignA = alignment(a, b);
      const alignB = alignment(b, a);

      if (Math.abs(alignA - alignB) < HEAD_ON_ALIGNMENT_EPSILON) {
        events.push({ victimId: a.id, killerId: null });
        events.push({ victimId: b.id, killerId: null });
      } else if (alignA > alignB) {
        events.push({ victimId: b.id, killerId: a.id });
      } else {
        events.push({ victimId: a.id, killerId: b.id });
      }
    }
  }
  return events;
}

/** Dedupes death events so each snake dies at most once per frame. */
export function resolveDeaths(events: DeathEvent[]): DeathEvent[] {
  const seen = new Map<number, DeathEvent>();
  for (const event of events) {
    if (!seen.has(event.victimId)) seen.set(event.victimId, event);
  }
  return Array.from(seen.values());
}
