import { simulateBattle, type BattleTroop } from "./battleEngine";
import { baseStats, catalogHero } from "./heroCatalog";
import { heroSkillEffects } from "./heroSkills";
import { FORMATIONS, FORMATION_KEYS, UNITS, UNIT_KEYS, type Unit } from "./tactics";
import type { SkillEffect } from "./skills";

export const TOWER_FLOORS = 30;
export const DAILY_CHALLENGE_LIMIT = 3;
export const TRAINING_TROOPS = 1000;
export const BATTLEFIELDS: readonly { name: string; description: string; unit: Unit | null; effect: SkillEffect; opponent: string }[] = [
  { name: "중원 합동전", description: "모든 병종 병력 회복 +1%", unit: null, effect: { kind: "recover", value: 0.01 }, opponent: "caocao" },
  { name: "철벽 공방전", description: "도순병 받는 피해 −8%", unit: "sword", effect: { kind: "guard", value: 0.08 }, opponent: "gaoshun" },
  { name: "평원 돌격전", description: "기병 가하는 피해 +8%", unit: "cavalry", effect: { kind: "attack", value: 0.08 }, opponent: "machao" },
  { name: "군략 대항전", description: "노병 계략 피해 배율 +0.15", unit: "crossbow", effect: { kind: "fire", value: 0.15 }, opponent: "zhugeliang" },
  { name: "장강 사격전", description: "궁병 가하는 피해 +8%", unit: "archer", effect: { kind: "attack", value: 0.08 }, opponent: "handang" },
  { name: "기동 추격전", description: "궁기병 선제 통솔 +15", unit: "mountedArcher", effect: { kind: "initiative", value: 15 }, opponent: "sunshangxiang" },
  { name: "관문 방어전", description: "창병 반격 피해 +8%", unit: "spear", effect: { kind: "counter", value: 0.08 }, opponent: "guanyu" },
];
export function battlefield(now: number) { return BATTLEFIELDS[new Date(now).getDay()]; }
export function towerReward(floor: number) { return { gold: floor * 250, experience: 80 + floor * 20, medals: 5 + floor * 2 }; }
export function dailyWarReward(tier: number) { return { gold: [600, 1400, 2600][tier - 1], experience: [200, 400, 700][tier - 1], medals: tier * 10 }; }
export const WAR_SHOP = {
  tickets: { name: "초빙장 2장", price: 20, limit: 2, description: "새로운 장수를 모집할 초빙장을 받습니다." },
  manual: { name: "병법서", price: 15, limit: 3, description: "선택한 장수에게 경험치 500을 지급합니다." },
  officer: { name: "3성 장수 초빙", price: 120, limit: 1, description: "요화·이전·한당·고순 중 한 명을 선택합니다." },
} as const;
export type WarShopItem = keyof typeof WAR_SHOP;
export const WAR_SHOP_KEYS = ["tickets", "manual", "officer"] as const;
export const WAR_OFFICERS = ["liaohua", "lidian", "handang", "gaoshun"] as const;
const TOWER_OFFICERS = ["guanyu", "zhangliao", "pangtong", "ganning", "gaoshun", "lidian", "machao", "zhouyu"] as const;

export function challengeOpponent(mode: "tower" | "daily", level: number, now: number): BattleTroop {
  if (!Number.isInteger(level) || level < 1 || level > (mode === "tower" ? TOWER_FLOORS : 3)) throw new Error("도전 단계를 확인하세요.");
  const key = mode === "tower" ? TOWER_OFFICERS[(level - 1) % TOWER_OFFICERS.length] : battlefield(now).opponent;
  const stars = mode === "tower" ? Math.min(5, 2 + Math.floor((level - 1) / 8)) : level + 1;
  const bonus = mode === "tower" ? (level - 1) * 3 : (level - 1) * 18;
  const stats = baseStats(key, stars);
  const formation = FORMATION_KEYS[mode === "tower" ? (level - 1) % FORMATION_KEYS.length : level];
  const unit = mode === "tower" ? UNIT_KEYS[(level - 1) % UNIT_KEYS.length] : battlefield(now).unit ?? "spear";
  const commander = { name: catalogHero(key).name, leadership: stats.leadership + bonus, strength: stats.strength + bonus, intelligence: stats.intelligence + bonus, charm: stats.charm,
    skills: [...heroSkillEffects(key, stars), ...FORMATIONS[formation].effects, ...UNITS[unit].effects] };
  const deputies = mode === "tower" && level >= 11 ? [
    { name: "좌군 참모", leadership: 40 + level, strength: 40 + level, intelligence: 40 + level },
    ...(level >= 21 ? [{ name: "우군 참모", leadership: 40 + level, strength: 40 + level, intelligence: 40 + level }] : []),
  ] : [];
  return { id: `training-enemy-${mode}-${level}`, name: mode === "tower" ? `연무탑 ${level}층` : `${battlefield(now).name} ${level}단계`, currentTroops: TRAINING_TROOPS, commander, deputies, unit };
}
function seededRandom(seed: string) {
  let value = 2166136261;
  for (const c of seed) value = Math.imul(value ^ c.charCodeAt(0), 16777619) >>> 0;
  return () => { value = (Math.imul(value, 1664525) + 1013904223) >>> 0; return value / 4294967296; };
}
export function runChallenge(player: BattleTroop, mode: "tower" | "daily", level: number, now: number, date: string) {
  const enemy = challengeOpponent(mode, level, now);
  const attacker = structuredClone(player); attacker.currentTroops = TRAINING_TROOPS;
  if (mode === "daily") {
    const field = battlefield(now);
    for (const army of [attacker, enemy]) if (!field.unit || army.unit === field.unit) army.commander.skills = [...(army.commander.skills ?? []), field.effect];
  }
  const result = simulateBattle(attacker, enemy, seededRandom(mode === "tower" ? `tower-${level}` : `${date}-${level}`));
  return { result, enemy, reward: mode === "tower" ? towerReward(level) : dailyWarReward(level) };
}
