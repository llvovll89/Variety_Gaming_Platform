// Logical viewport — portrait, like a phone screen, since balloons only ever travel
// bottom-to-top (no omnidirectional spawn concern like hachuping-dodge's square arena).
export const LOGICAL_WIDTH = 420;
export const LOGICAL_HEIGHT = 760;

// Balloons
export const BALLOON_RADIUS_MIN = 30;
export const BALLOON_RADIUS_MAX = 42; // big, forgiving tap targets for small hands
export const BALLOON_HIT_PADDING = 8; // extra tap-hitbox forgiveness beyond the visual radius
export const BALLOON_SWAY_AMPLITUDE_MIN = 10;
export const BALLOON_SWAY_AMPLITUDE_MAX = 30;
export const BALLOON_SWAY_SPEED_MIN = 0.6;
export const BALLOON_SWAY_SPEED_MAX = 1.4;
export const BALLOON_STRING_LENGTH = 26;

// There is no fail state — this ramp only exists to keep the toy feeling lively over a long
// session, not to threaten the player. Bounds are deliberately gentle.
export const RISE_SPEED_START = 75;
export const RISE_SPEED_MAX = 170;
export const RISE_SPEED_INCREMENT_MIN = 6;
export const RISE_SPEED_INCREMENT_MAX = 12;
// Each balloon's own rise speed is jittered within this range of the current ramp value, so
// balloons spawned back-to-back don't all glide up at the same identical pace.
export const BALLOON_SPEED_JITTER_MIN = 0.65;
export const BALLOON_SPEED_JITTER_MAX = 1.5;

export const SPAWN_INTERVAL_START = 0.85; // seconds between spawn waves
export const SPAWN_INTERVAL_MIN = 0.35;
export const SPAWN_INTERVAL_SHRINK_MIN = 0.03;
export const SPAWN_INTERVAL_SHRINK_MAX = 0.06;
// Each wave's actual wait is jittered within this fraction of spawnInterval, so balloons
// never fall into a metronomic, evenly-spaced rhythm.
export const SPAWN_INTERVAL_JITTER_MIN = 0.5;
export const SPAWN_INTERVAL_JITTER_MAX = 1.7;

// balloonsPerWave (below) is the CAP a wave can roll up to, not a fixed count — each wave
// spawns a random amount between 1 and that cap, so quantity varies wave to wave too.
export const BALLOONS_PER_WAVE_START = 1;
export const BALLOONS_PER_WAVE_MAX = 4;
export const RAMP_TICKS_PER_WAVE_BUMP = 4;

export const RAMP_INTERVAL_MIN = 8;
export const RAMP_INTERVAL_MAX = 12;

// Pop effect
export const POP_EFFECT_LIFETIME = 0.4; // seconds

// Mascot (decorative, non-interactive character bobbing at the bottom of the arena)
export const MASCOT_RADIUS = 34;

// Simulation stepping (matches the other games)
export const MAX_DT = 1 / 30;

// UI
export const UI_PUBLISH_INTERVAL = 0.12;

// Session length — was endless with no way to finish; a fixed round gives it a clear end.
export const GAME_DURATION_SECONDS = 60;
