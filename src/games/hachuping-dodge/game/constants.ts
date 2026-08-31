// Logical viewport — square, unlike the side-scrollers, because orbs arrive from every
// direction and a square keeps every edge equidistant from the center.
export const LOGICAL_WIDTH = 720;
export const LOGICAL_HEIGHT = 720;
export const ARENA_CENTER_X = LOGICAL_WIDTH / 2;
export const ARENA_CENTER_Y = LOGICAL_HEIGHT / 2;

// Player — smaller than before so the arena reads as roomier and mistakes are less
// forgiving; the hitbox keeps roughly the same forgiveness ratio vs the visual sprite.
export const PLAYER_RADIUS = 15; // visual sprite radius
export const PLAYER_HITBOX_RADIUS = 10; // a bit of forgiveness, same idea as hachuping-jump
export const MOVE_MAX_SPEED = 320; // logical units / s
export const MOVE_ACCEL_RATE = 16; // exponential smoothing rate toward the input-driven target velocity

// Orbs (glowing energy spheres) — smaller reference size, but each spawn randomizes its own
// size and speed around this baseline (see ORB_*_VARIANCE/_JITTER below) so waves don't feel
// uniform. Hitbox radius always scales with the orb's actual rolled radius (see collision.ts).
export const ORB_RADIUS = 13;
export const ORB_HITBOX_RADIUS = 9; // glow/spark ring reads bigger than the lethal core
export const ORB_RADIUS_VARIANCE_MIN = 0.7;
export const ORB_RADIUS_VARIANCE_MAX = 1.5; // occasional oversized "elite" orbs
export const ORB_SPEED_JITTER_MIN = 0.8;
export const ORB_SPEED_JITTER_MAX = 1.3;
export const ORB_SPAWN_MARGIN = 40;
export const ORB_SPAWN_RADIUS = Math.hypot(LOGICAL_WIDTH, LOGICAL_HEIGHT) / 2 + ORB_SPAWN_MARGIN;
export const ORB_AIM_SPREAD = Math.min(LOGICAL_WIDTH, LOGICAL_HEIGHT) * 0.55; // wide spread → less predictable chords
// Must clear the worst-case spawn overshoot, not just the orb's own size: an orb spawned
// along a near-axis angle sits (ORB_SPAWN_RADIUS - arena half-size) past the near edge before
// it has moved at all. A margin smaller than that (e.g. a flat ORB_RADIUS multiple) culls most
// spawns on their very first advance step, before they ever cross into the visible arena.
export const ORB_CULL_MARGIN =
  ORB_SPAWN_RADIUS - Math.min(LOGICAL_WIDTH, LOGICAL_HEIGHT) / 2 + ORB_RADIUS * 4;

// Orb difficulty ramp — same "randomized interval, gentle bump, hard cap" philosophy as
// hachuping-jump's scroll-speed ramp and hachuping-slither's bot-population growth, tuned to
// escalate noticeably faster/harder than the first pass.
export const ORB_SPEED_BASE = 190;
export const ORB_SPEED_MAX = 560;
export const ORB_SPEED_INCREMENT_MIN = 14;
export const ORB_SPEED_INCREMENT_MAX = 30;

export const SPAWN_INTERVAL_START = 0.9; // seconds between spawn waves
export const SPAWN_INTERVAL_MIN = 0.16;
export const SPAWN_INTERVAL_SHRINK_MIN = 0.05;
export const SPAWN_INTERVAL_SHRINK_MAX = 0.11;
// Each wave's actual wait is jittered within this fraction of spawnInterval, so spawns never
// fall into a predictable metronome.
export const SPAWN_INTERVAL_JITTER_MIN = 0.75;
export const SPAWN_INTERVAL_JITTER_MAX = 1.15;

export const ORBS_PER_WAVE_START = 1;
export const ORBS_PER_WAVE_MAX = 6;
export const RAMP_TICKS_PER_WAVE_BUMP = 3; // only bump wave size every 3rd ramp tick

export const RAMP_INTERVAL_MIN = 4;
export const RAMP_INTERVAL_MAX = 6;

// Bonus star (ties into the "별" motif shared with the other two games)
export const STAR_RADIUS = 13;
export const STAR_SPAWN_INTERVAL_MIN = 4;
export const STAR_SPAWN_INTERVAL_MAX = 7;
export const STAR_LIFETIME = 5; // despawns if not collected, so it keeps pulling the player around
export const STAR_BONUS_SCORE = 15;
export const STAR_MIN_DIST_FROM_PLAYER = 120;

// Scoring
export const SCORE_PER_SECOND = 10; // continuous survival tick-up
export const ORB_DODGE_BONUS = 2; // per orb that clears the arena while the player is still alive

// Simulation stepping (matches the other two games)
export const MAX_DT = 1 / 30;

// UI
export const UI_PUBLISH_INTERVAL = 0.12;

// Input — touch/mouse steer continuously toward the pointer's world position (like
// hachuping-slither) rather than a delta-based virtual joystick, which read as imprecise on
// touch. Below this distance (logical units) the player is considered "arrived" so tiny
// pointer jitter right on top of the player doesn't cause direction flicker.
export const POINTER_ARRIVE_DEADZONE = 6;
