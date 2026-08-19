// Logical viewport (portrait, letterboxed onto whatever the real canvas shape is)
export const LOGICAL_WIDTH = 400;
export const LOGICAL_HEIGHT = 700;

// Player
export const PLAYER_X = LOGICAL_WIDTH * 0.3;
export const PLAYER_RADIUS = 18; // visual sprite radius
export const PLAYER_HITBOX_RADIUS = 14; // slightly smaller than the sprite — a bit of forgiveness

// Physics
export const GRAVITY = 1800; // logical units / s^2
export const FLAP_IMPULSE = -520; // vy is SET to this on flap, not added — additive would let spam-tap moonwalk upward
export const MAX_FALL_SPEED = 900;
export const ROTATION_MIN = (-25 * Math.PI) / 180; // nose-up cap, snapped to on flap
export const ROTATION_MAX = (90 * Math.PI) / 180; // nose-down cap, full dive on freefall
export const ROTATION_PER_VELOCITY = ROTATION_MAX / MAX_FALL_SPEED;
export const ROTATION_SMOOTHING = 12; // exponential smoothing rate toward the fall-based target angle

// Ground / ceiling
export const GROUND_HEIGHT = 60;
export const CEILING_Y = 0;
export const GROUND_Y = LOGICAL_HEIGHT - GROUND_HEIGHT;

// Obstacles (glowing capsule pillars)
export const PIPE_WIDTH = 70;
export const GAP_MARGIN_TOP = 60; // don't let a gap start right at the very top
export const GAP_MARGIN_BOTTOM = 60; // leave room above the ground strip
export const GAP_HEIGHT_START = 210;
export const GAP_HEIGHT_MIN = 145;
export const SPAWN_INTERVAL_DISTANCE = 260; // logical units of scroll between obstacle spawns

// Bonus stars (ties into the "별" motif from hachuping-slither)
export const STAR_SPAWN_CHANCE = 0.4;
export const STAR_RADIUS = 11;
export const STAR_BONUS_SCORE = 5;

// Difficulty ramp — same "randomized interval, gentle bump, hard cap" philosophy as the
// slither game's bot-population growth, so the platform's games feel consistent.
export const SCROLL_SPEED_BASE = 220;
export const SCROLL_SPEED_MAX = 340;
export const SCROLL_SPEED_INCREMENT_MIN = 6;
export const SCROLL_SPEED_INCREMENT_MAX = 14;
export const GAP_SHRINK_PER_RAMP = 4;
export const RAMP_INTERVAL_MIN = 6;
export const RAMP_INTERVAL_MAX = 10;

// Simulation stepping (matches hachuping-slither's engine)
export const MAX_DT = 1 / 30;

// UI
export const UI_PUBLISH_INTERVAL = 0.12;

// Rendering
export const HEX_TILE_SIZE = 34;
