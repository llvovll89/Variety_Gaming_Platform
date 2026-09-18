/**
 * 194년 여름 「중원 쟁패」.
 *
 * Chosen because it packs six real powers into a theatre you can cross in five turns:
 * 여포 holds 복양 and 조조 holds 견성 (the 연주 rebellion, historically exact), 유비 has
 * just inherited 서주, 원소 sits in 업 and 원술 in 수춘. No 강동 means no navy, no 촉 means
 * no mountain slog, and the 황하 becomes a genuine chokepoint rather than scenery.
 *
 * 낙양 and 허창 are neutral, garrisoned but officer-less, and deliberately soft. They are
 * the conquests that teach siege before 조조 comes knocking.
 */
import { MAX_DEFENSE_BY_SCALE } from "./constants";
import { computeCityNeighbors, createMap, type CityAnchor, type RoadLink } from "./map";
import { offsetToAxial } from "./hex";
import type { City, CityId, Faction, FactionId, GameMap } from "./types";

type Scale = City["scale"];

/** [id, 이름, 漢字, col, row, 세력, 규모, 금, 병량, 병사, 최대병사, 상업, 농업, 치안] */
type CityRow = readonly [
  CityId, string, string, number, number, FactionId | null, Scale,
  number, number, number, number, number, number, number,
];

const CITY_ROWS = [
  ["changan",   "장안", "長安",  2,  9, "lijue",    "capital", 1200, 6000, 12000, 24000, 30, 25, 40],
  ["luoyang",   "낙양", "洛陽",  9,  8, null,       "capital",  300,  800,  3000, 24000,  8,  8, 25],
  ["wan",       "완",   "宛",    8, 15, "liubiao",  "mid",      900, 5000,  9000, 14000, 35, 40, 70],
  ["xuchang",   "허창", "許昌", 15, 12, null,       "small",    200, 1500,  4000,  8000, 12, 18, 30],
  ["chenliu",   "진류", "陳留", 16,  7, "caocao",   "large",   1100, 7000, 11000, 20000, 45, 45, 75],
  ["puyang",    "복양", "濮陽", 24,  4, "lubu",     "mid",      700, 3500, 13000, 14000, 30, 28, 45],
  ["juancheng", "견성", "鄄城", 23,  9, "caocao",   "mid",      800, 5500,  9000, 14000, 38, 42, 72],
  ["ye",        "업",   "鄴",   17,  1, "yuanshao", "large",   1500, 9000, 15000, 20000, 50, 50, 78],
  ["xiaopei",   "소패", "小沛", 28, 10, "liubei",   "small",    350, 1800,  5000,  8000, 18, 22, 60],
  ["xiapi",     "하비", "下邳", 29, 15, "liubei",   "mid",      600, 3000,  7000, 14000, 30, 35, 65],
  ["runan",     "여남", "汝南", 19, 16, "yuanshu",  "mid",      700, 4500,  8000, 14000, 32, 38, 55],
  ["shouchun",  "수춘", "壽春", 26, 18, "yuanshu",  "large",   1000, 6500, 10000, 20000, 40, 42, 60],
] as const satisfies readonly CityRow[];

/** [id, 이름, 漢字, 군주, 색, aggression] — lower aggression attacks at a smaller edge. */
type FactionRow = readonly [FactionId, string, string, string, string, number];

const FACTION_ROWS = [
  ["liubei",   "유비", "劉備", "liubei",   "#1f5c3a", 1.0],
  ["caocao",   "조조", "曹操", "caocao",   "#1f4e79", 0.85],
  ["lubu",     "여포", "呂布", "lubu",     "#7a2020", 0.8],
  ["yuanshao", "원소", "袁紹", "yuanshao", "#4a3b6b", 1.1],
  ["yuanshu",  "원술", "袁術", "yuanshu",  "#8a6d2f", 1.15],
  ["liubiao",  "유표", "劉表", "liubiao",  "#2f6b6b", 1.4],
  ["lijue",    "이각", "李傕", "lijue",    "#4a4a4a", 1.3],
] as const satisfies readonly FactionRow[];

/**
 * The 가도 network. Everything south of the 황하 links up along one spine; 업 reaches the
 * south only through two river fords, which is what makes 원소 a slow, deliberate threat.
 */
const ROADS: readonly RoadLink[] = [
  ["changan", "luoyang"],
  ["luoyang", "chenliu"],
  ["luoyang", "wan"],
  ["chenliu", "juancheng"],
  ["chenliu", "xuchang"],
  ["juancheng", "xiaopei"],
  ["juancheng", "puyang"],
  ["xiaopei", "xiapi"],
  ["xuchang", "wan"],
  ["xuchang", "runan"],
  ["runan", "shouchun"],
  ["shouchun", "xiapi"],
  ["ye", "puyang"],
  ["ye", "chenliu"],
] as const;

export const CITY_ANCHORS: readonly CityAnchor[] = CITY_ROWS.map((c) => ({
  id: c[0],
  col: c[3],
  row: c[4],
}));

export const PLAYABLE_FACTIONS = FACTION_ROWS.map((f) => f[0]);
export const DEFAULT_FACTION: FactionId = "liubei";

export function createScenarioMap(): GameMap {
  return createMap(CITY_ANCHORS, ROADS);
}

export function createCities(): Record<CityId, City> {
  const neighbors = computeCityNeighbors(CITY_ANCHORS);
  const out: Record<CityId, City> = {};
  for (const row of CITY_ROWS) {
    const [id, name, hanja, col, r, faction, scale, gold, food, troops, maxTroops, commerce, agriculture, order] = row;
    const maxDefense = MAX_DEFENSE_BY_SCALE[scale];
    out[id] = {
      id, name, hanja,
      coord: offsetToAxial(col, r),
      faction,
      scale,
      gold, food, troops, maxTroops,
      commerce, agriculture, order,
      // A neutral city has been left to rot; it starts with a partly ruined wall so the
      // tutorial conquests do not need a full 15,000-point siege.
      defense: faction === null ? Math.round(maxDefense * 0.45) : maxDefense,
      maxDefense,
      officerIds: [],
      neighborCityIds: neighbors[id] ?? [],
    };
  }
  return out;
}

export function createFactions(playerFactionId: FactionId): Record<FactionId, Faction> {
  const out: Record<FactionId, Faction> = {};
  for (const [id, name, hanja, leaderId, color, aggression] of FACTION_ROWS) {
    out[id] = {
      id, name, hanja, leaderId, color,
      isPlayer: id === playerFactionId,
      alive: true,
      aggression,
    };
  }
  return out;
}

/** Short blurb per faction for the start menu, so picking one is an informed choice. */
export const FACTION_BLURBS: Record<FactionId, string> = {
  liubei: "소패와 하비. 관우·장비·조운을 거느렸으나 곳간이 비었다. 가장 어렵다.",
  caocao: "진류와 견성. 인재와 재정이 모두 넉넉하다. 처음이라면 이쪽.",
  lubu: "복양 하나에 13,000 병력. 천하무쌍이지만 앞뒤가 모두 적이다.",
  yuanshao: "업. 하북 최대 세력이나 황하 건너 두 나루로만 남하할 수 있다.",
  yuanshu: "수춘과 여남. 손책·주유와 함께 풍부한 물자로 세력을 확장한다.",
  liubiao: "완. 남쪽 한켠에서 지키기는 쉽고 나아가기는 어렵다.",
  lijue: "장안. 산에 둘러싸여 안전하지만 가난하고 인망이 없다.",
};
