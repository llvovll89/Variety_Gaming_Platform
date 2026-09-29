import { ADDITIONAL_HEROES } from "./additionalHeroes";
import { EXPANSION_HEROES } from "./expansionHeroes";

export const HERO_CATALOG = [
  { key: "guanyu", name: "관우", title: "미염공", faction: "촉", role: "무장", quote: "의리를 저버리는 칼은 들지 않소.", stats: [95, 98, 75, 62], atlas: "original", tile: 0 },
  { key: "zhaoyun", name: "조운", title: "상산의 용", faction: "촉", role: "무장", quote: "이 창이 닿는 곳까지, 주군을 지키겠습니다.", stats: [91, 96, 76, 65], atlas: "original", tile: 1 },
  { key: "lubu", name: "여포", title: "비장", faction: "군웅", role: "무장", quote: "천하의 강자라면, 내 앞에 서 보아라.", stats: [85, 100, 35, 25], atlas: "original", tile: 2 },
  { key: "zhugeliang", name: "제갈량", title: "와룡", faction: "촉", role: "책사", quote: "천하의 형세를 읽는 것이 첫 번째 계책입니다.", stats: [92, 38, 100, 98], atlas: "original", tile: 3 },
  { key: "caocao", name: "조조", title: "난세의 간웅", faction: "위", role: "지휘관", quote: "내게 인재가 있다면, 천하는 멀지 않다.", stats: [98, 74, 93, 94], atlas: "original", tile: 4 },
  { key: "sunshangxiang", name: "손상향", title: "강동의 궁희", faction: "오", role: "궁장", quote: "내 운명은, 내가 겨눈 곳에 있다.", stats: [78, 88, 74, 68], atlas: "original", tile: 5 },
  ...ADDITIONAL_HEROES.map(hero => ({ ...hero, atlas: "expanded" as const })),
  ...EXPANSION_HEROES.map(hero => ({ ...hero, atlas: "expansion2" as const })),
] as const;
export type HeroKey = typeof HERO_CATALOG[number]["key"];
export const FACTIONS = ["촉", "위", "오", "군웅"] as const;
export type HeroFaction = typeof FACTIONS[number];
export const HERO_ROSTER_LIMIT = 300;
export const RARITIES = [
  { stars: 1, name: "일반", color: "#a2b0bd", chance: 45, multiplier: 0.48 },
  { stars: 2, name: "정예", color: "#69bfa0", chance: 30, multiplier: 0.61 },
  { stars: 3, name: "희귀", color: "#69b9ee", chance: 17, multiplier: 0.74 },
  { stars: 4, name: "영웅", color: "#bd91f0", chance: 7, multiplier: 0.87 },
  { stars: 5, name: "전설", color: "#efc571", chance: 1, multiplier: 1 },
] as const;
export function catalogHero(key: string) { return HERO_CATALOG.find(h => h.key === key) ?? HERO_CATALOG[0]; }
export function baseStats(key: string, stars: number) {
  const template = catalogHero(key);
  const scale = RARITIES[stars - 1].multiplier;
  const [leadership, strength, intelligence, politics] = template.stats.map(n => Math.round(n * scale));
  return { leadership, strength, intelligence, politics, maxTroops: stars * 250 };
}
