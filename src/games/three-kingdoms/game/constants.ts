/**
 * Every tunable number lives in this file so balancing is a single-file edit.
 * The headless AI-vs-AI simulation in the test suite is the instrument these are
 * tuned against; do not scatter magic numbers into the rules modules.
 */
import type { City, FacilityType, TacticId, TerrainType, UnitType } from "./types";

export const GAME_ID = "three-kingdoms";

/** Odd-r offset dimensions of the 194 Central Plains map. */
export const MAP_WIDTH = 32;
export const MAP_HEIGHT = 20;

/** Hex circumradius in logical pixels at zoom 1. */
export const HEX_SIZE = 34;
export const MIN_ZOOM = 0.6;
export const MAX_ZOOM = 2.0;

/** A pointer that travels further than this before release was a pan, not a tap. */
export const TAP_SLOP_PX = 8;

/** Radius of a city's 영역 — the tiles it may build facilities on. */
export const DOMAIN_RADIUS = 3;

export const SCENARIO_START = { year: 194, month: 6 } as const;
/** Grain comes in once a year. Campaigning in autumn with full granaries is the point. */
export const HARVEST_MONTH = 9;

// --- Ink-wash palette --------------------------------------------------------

export const PALETTE = {
  paper: "#fafafa",
  paperDeep: "#e5e5e5",
  ink: "#171717",
  inkSoft: "rgba(23, 23, 23, 0.35)",
  inkFaint: "rgba(23, 23, 23, 0.16)",
  seal: "#171717",
  plain: "#d9c9a3",
  wasteland: "#cbbfa2",
  forest: "#b3c09a",
  hill: "#bdab84",
  mountain: "#8a7a5e",
  water: "#7d9aa8",
  road: "#e4d7b4",
  neutral: "#8a7a5e",
} as const;

export const TERRAIN_FILL: Record<TerrainType, string> = {
  plain: PALETTE.plain,
  wasteland: PALETTE.wasteland,
  forest: PALETTE.forest,
  hill: PALETTE.hill,
  mountain: PALETTE.mountain,
  water: PALETTE.water,
  road: PALETTE.road,
};

/**
 * Pretendard has no reliable Hanja coverage, so canvas text needs an explicit serif
 * CJK stack. A serif is the right register for ink-wash anyway, and every desktop and
 * mobile platform ships at least one of these, so nothing is downloaded.
 */
export const HANJA_FONT =
  "'Noto Serif KR', 'Nanum Myeongjo', 'Batang', '바탕', 'Songti SC', 'SimSun', serif";

// --- Terrain -----------------------------------------------------------------

/** Movement point cost to enter. Infinity = impassable. */
export const TERRAIN_MOVE_COST: Record<TerrainType, number> = {
  road: 1,
  plain: 2,
  wasteland: 2,
  forest: 3,
  hill: 4,
  mountain: 6,
  water: Infinity,
};

/** Defender multiplier. Higher means the defender takes less damage. */
export const TERRAIN_DEFENSE: Record<TerrainType, number> = {
  road: 0.9,
  plain: 1.0,
  wasteland: 1.0,
  forest: 1.15,
  hill: 1.25,
  mountain: 1.4,
  water: 1.0,
};

/** Per-unit-type attack modifier for the terrain the ATTACKER stands on. */
export const TERRAIN_ATTACK: Partial<Record<TerrainType, Partial<Record<UnitType, number>>>> = {
  forest: { cavalry: 0.7 },
  mountain: { cavalry: 0.7 },
  hill: { cavalry: 0.85, archer: 1.2 },
};

export const TERRAIN_LABEL: Record<TerrainType, string> = {
  plain: "평지",
  wasteland: "황무지",
  forest: "삼림",
  hill: "구릉",
  mountain: "산지",
  water: "하천",
  road: "가도",
};

// --- Unit types --------------------------------------------------------------

export interface UnitTypeSpec {
  label: string;
  hanja: string;
  moves: number;
  range: number;
  counterRate: number;
  siegeMult: number;
}

export const UNIT_TYPES: Record<UnitType, UnitTypeSpec> = {
  spear: { label: "창병", hanja: "槍", moves: 8, range: 1, counterRate: 0.6, siegeMult: 1.0 },
  cavalry: { label: "기병", hanja: "騎", moves: 12, range: 1, counterRate: 0.55, siegeMult: 0.6 },
  archer: { label: "궁병", hanja: "弓", moves: 8, range: 2, counterRate: 0.35, siegeMult: 0.8 },
};

/** 병종 상성: 창 > 기 > 궁 > 창. Indexed [attacker][defender]. */
export const TYPE_COUNTER: Record<UnitType, Record<UnitType, number>> = {
  spear: { spear: 1.0, cavalry: 1.5, archer: 0.75 },
  cavalry: { spear: 0.75, cavalry: 1.0, archer: 1.5 },
  archer: { spear: 1.3, cavalry: 0.8, archer: 1.0 },
};

// --- Tactics -----------------------------------------------------------------

export interface TacticSpec {
  label: string;
  hanja: string;
  /** null = any unit type may use it. */
  unitType: UnitType | null;
  energy: number;
  damageMult: number;
  /** Minimum 지력 / 매력 on the 대장 to have learned it. */
  minInt?: number;
  minCha?: number;
  /** Rolls against 지력; omitted means it always lands. */
  contested?: boolean;
  desc: string;
}

export const TACTICS: Record<TacticId, TacticSpec> = {
  charge: {
    label: "돌격", hanja: "突擊", unitType: "cavalry", energy: 40, damageMult: 1.6,
    desc: "반격 없이 적을 한 칸 밀어낸다. 막히면 충돌 피해 20%",
  },
  pike: {
    label: "돌출", hanja: "突出", unitType: "spear", energy: 35, damageMult: 1.4,
    desc: "사기 -8, 적을 한 칸 밀어낸다. 막히면 충돌 피해 20%",
  },
  volley: {
    label: "화시", hanja: "火矢", unitType: "archer", energy: 35, damageMult: 1.3,
    desc: "지형 방어를 무시한다",
  },
  fire: {
    label: "화계", hanja: "火計", unitType: null, energy: 50, damageMult: 1.0,
    minInt: 70, contested: true, desc: "삼림·황무지에서 위력 1.5배",
  },
  confuse: {
    label: "혼란", hanja: "混亂", unitType: null, energy: 45, damageMult: 0,
    minInt: 75, contested: true, desc: "1~2턴 행동 불가",
  },
  rally: {
    label: "고무", hanja: "鼓舞", unitType: null, energy: 30, damageMult: 0,
    minCha: 70, desc: "자신과 인접 아군 사기 +20",
  },
};

// --- Facilities --------------------------------------------------------------

export interface FacilitySpec {
  label: string;
  hanja: string;
  gold: number;
  baseTurns: number;
  terrain: readonly TerrainType[];
  desc: string;
}

export const FACILITIES: Record<FacilityType, FacilitySpec> = {
  farm: {
    label: "농지", hanja: "農", gold: 300, baseTurns: 3,
    terrain: ["plain", "wasteland"], desc: "농업 상한 +8",
  },
  market: {
    label: "시장", hanja: "市", gold: 400, baseTurns: 3,
    terrain: ["plain"], desc: "상업 상한 +8",
  },
  barracks: {
    label: "병영", hanja: "兵", gold: 500, baseTurns: 4,
    terrain: ["plain", "hill"], desc: "최대 병력 +500, 영역 내 사기 +5",
  },
  fort: {
    label: "진지", hanja: "陣", gold: 200, baseTurns: 2,
    terrain: ["plain", "wasteland", "forest", "hill", "mountain", "road"],
    desc: "방어 1.3배, 기력 회복 +15, 적 보급 차단",
  },
  tower: {
    label: "궁노대", hanja: "弩", gold: 450, baseTurns: 3,
    terrain: ["plain", "hill"], desc: "매 턴 인접 적을 사격",
  },
};

/**
 * Development ceiling before any facility is built, by city scale. A big city can be grown
 * further by administration alone; a small one hits its ceiling fast and has to build its
 * way past it. A single flat base does not work here: the scenario starts 업 at 상업 50 and
 * 소패 at 18, and one number cannot leave both of them room without making 소패 a metropolis.
 */
export const DEV_CAP_BY_SCALE: Record<City["scale"], number> = {
  small: 30,
  mid: 45,
  large: 60,
  capital: 65,
};
export const DEV_CAP_PER_FACILITY = 8;

/**
 * Facility slots per city. Capping this is a design decision, not a technical one: it bounds
 * how many decisions a month costs the player, which is the main thing that makes a city
 * builder tiring rather than interesting.
 */
export const FACILITY_SLOTS = 6;

// --- Balance -----------------------------------------------------------------

export const BALANCE = {
  /** Field damage scale. casualties = attackPower / defensePower. */
  attackBase: 150,
  /** Officer contribution: 대장 dominates, 부장 add at the margin. */
  deputyWeight: 0.15,
  statCeiling: 120,
  minCasualties: 30,

  /** Extra movement points to LEAVE a hex adjacent to an enemy (제압/ZOC). */
  zocPenalty: 4,

  energyPerAttack: 10,
  energyRegen: 20,
  energyRegenOwnDomain: 30,
  energyRegenFort: 40,
  energyForcedMarch: 5,
  minCounterEnergy: 10,

  moraleBase: 60,
  moraleWin: 2,
  moraleLoss: 3,
  moraleDriftUp: 4,
  moraleDriftDown: 2,
  moraleTrainBonus: 8,
  moraleRallyBonus: 20,
  moraleBarracksBonus: 5,
  /** Rout: retreat, lose this fraction, come back at 25 morale. */
  routTroopLoss: 0.2,
  routMorale: 25,
  /** Below this the unit simply ceases to exist. */
  destroyTroops: 300,
  officerEscapeBase: 0.4,

  /** Siege: the attacker bleeds this fraction of its own troops on the walls. */
  siegeWallBleed: 0.02,
  /** Fraction of wall damage that also hits the garrison while the wall still stands. */
  siegeGarrisonBleed: 0.25,
  cityCounterBase: 15,
  /** A garrison-less city's wall crumbles on its own. */
  emptyCityDecay: 100,
  cityRegen: 2,
  captureOrder: 20,
  captureDefenseFraction: 0.45,
  /** Share of the storming army left behind as the new garrison. */
  captureGarrisonShare: 0.3,
  captureStoreLoss: 0.5,

  /** Supply: months of food carried on 출진, and how far a corridor reaches. */
  supplyMonths: 6,
  supplyRange: 6,
  starveTroopMult: 0.92,
  starveMorale: 15,

  /** Economy. */
  incomeCommerceMult: 8,
  harvestAgricultureMult: 30,
  cityUpkeepDivisor: 200,
  unitUpkeepDivisor: 100,
  dispatchGoldPerTroop: 0.05,
  draftGoldPerTroop: 0.3,
  draftFoodPerTroop: 0.3,
  repairGoldPerPoint: 0.3,
  trainGold: 100,

  /** Conscripts raised per month per point of weighted 매력, scaled by 치안. */
  draftPerCharisma: 7,

  /** AI. */
  aiGoldReserve: 500,
  aiCommitMargin: 1.0,
  aiRetreatTroopFraction: 0.35,
  aiRetreatMorale: 30,
  aiRetreatUnsupplied: 2,
} as const;

/** Wall strength by city scale. */
export const MAX_DEFENSE_BY_SCALE = {
  small: 4000,
  mid: 6000,
  large: 9000,
  capital: 12000,
} as const;

// --- Presentation timings ----------------------------------------------------

export const ANIM = {
  unitMovePerHexMs: 130,
  attackMs: 420,
  captureMs: 700,
  /** Hard cap on how long one AI turn may spend animating before it fast-forwards. */
  aiBudgetMs: 4000,
} as const;
