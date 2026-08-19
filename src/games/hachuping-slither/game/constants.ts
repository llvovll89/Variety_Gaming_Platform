// World
export const WORLD_SIZE = 9000; // world is a WORLD_SIZE x WORLD_SIZE square, centered at (0,0)
export const WORLD_HALF = WORLD_SIZE / 2;
export const WALL_KILL_MARGIN = 4; // how far past the boundary before death registers

// Growth / size (score === size, via a diminishing curve so it stays playable)
export const R_MIN = 11;
export const GROWTH_K = 1.0; // lower = size tracks score more gradually (was 2.1 — grew too fast early on)
export const SEGMENT_SPACING_FACTOR = 0.55; // spacing between body points, relative to radius
export const SEGMENT_SCORE_UNIT = 6; // 1 extra segment per this many score points (was 4 — body lengthened too fast)
export const MIN_SEGMENTS = 6;
export const MAX_SEGMENTS = 260;
export const START_SCORE = 8;

// Movement
export const BASE_SPEED = 160; // world units / sec
export const BOOST_MULTIPLIER = 1.75;
export const MAX_TURN_RATE = 3.6; // radians / sec, scaled down for larger snakes
export const MIN_TURN_RATE = 1.6;
export const TURN_RATE_SIZE_FALLOFF = 0.012; // how quickly turn rate drops as radius grows

// Boost cost
export const BOOST_MIN_SCORE = 22; // can't boost below this score
export const BOOST_DRAIN_PER_SEC = 6; // score drained per second while boosting
export const BOOST_TRAIL_INTERVAL = 0.12; // seconds between boost-trail star drops

// Stars
export const STAR_TARGET_COUNT = 1700;
export const STAR_MIN_VALUE = 1;
export const STAR_MAX_VALUE = 5;
export const STAR_MIN_RADIUS = 4;
export const STAR_RADIUS_PER_VALUE = 1.3;

// Death drop
export const DEATH_DROP_RECOVERY_RATIO = 1.0; // full score becomes eatable stars
export const DEATH_DROP_MIN_STARS = 6;
export const DEATH_DROP_MAX_STARS = 80;
export const DEATH_DROP_STAR_VALUE = 4;
export const DEATH_DROP_SCATTER_RADIUS = 26;

// Collision
export const HEAD_HIT_RADIUS_FACTOR = 0.5; // attacker head contributes half its radius to hit range
export const SELF_COLLISION_SKIP_FACTOR = 2.5; // ignore own segments within this many radii of the head
export const HEAD_ON_ALIGNMENT_EPSILON = 0.12; // if alignment scores are this close, treat as a mutual kill

// Spatial grids
export const STAR_GRID_CELL_SIZE = 140;
export const SEGMENT_GRID_CELL_SIZE = 100;

// Bots
export const BOT_TARGET_COUNT_INITIAL = 13;
export const BOT_TARGET_COUNT_MAX = 40; // population cap the random growth can reach
export const BOT_GROWTH_INTERVAL_MIN = 18; // seconds of play time between population bumps
export const BOT_GROWTH_INTERVAL_MAX = 35;
export const BOT_GROWTH_AMOUNT_MIN = 1;
export const BOT_GROWTH_AMOUNT_MAX = 3;
export const BOT_MIN_SPAWN_DISTANCE_FROM_PLAYER = 900;
export const BOT_RESPAWN_DELAY = 1.5;
export const BOT_THINK_INTERVAL_MIN = 0.15;
export const BOT_THINK_INTERVAL_MAX = 0.25;
export const BOT_PERCEPTION_RADIUS = 520;
export const BOT_FLEE_SIZE_RATIO = 1.35; // flee snakes at least this many times bigger
export const BOT_WANDER_TURN_STEP = 0.6; // max random heading nudge per think-tick

// Camera
export const CAMERA_ZOOM_MIN = 0.55;
export const CAMERA_ZOOM_MAX = 1.05;
export const CAMERA_ZOOM_FACTOR = 0.0035;
export const CAMERA_ZOOM_SMOOTHING = 6; // higher = camera zoom catches up to target faster
export const CAMERA_BOOST_ZOOM_OUT = 0.9; // extra zoom-out multiplier while boosting, for a speed "punch"

// Simulation stepping
export const MAX_DT = 1 / 30;
export const SUBSTEP_DT_THRESHOLD = 1 / 40;

// UI
export const UI_PUBLISH_INTERVAL = 0.16; // seconds between throttled UI snapshot publishes
export const LEADERBOARD_SIZE = 5;
export const MINIMAP_TRAIL_POINTS = 14; // recent path points per snake sent for the minimap "terrain" look

// Rendering
export const HEX_TILE_SIZE = 46; // background floor hex radius, world units

export const SNAKE_NAME_POOL = [
  "핑크봇",
  "구름이",
  "별사탕",
  "하트링",
  "몽글이",
  "솜사탕",
  "복숭아",
  "젤리곰",
  "달콤이",
  "포롱이",
  "꼬물이",
  "방울이",
  "나비핑",
  "새콤이",
  "토닥이",
];
