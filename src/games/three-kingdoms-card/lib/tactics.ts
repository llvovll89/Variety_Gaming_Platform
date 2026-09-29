import type { SkillEffect } from "./skills";

// 병종 상성: 창병 > 기병 > 궁병 > 창병. 유리하면 가하는 피해 ×1.25, 불리하면 ×0.8.
export const UNIT_KEYS = ["spear", "cavalry", "archer"] as const;
export type Unit = typeof UNIT_KEYS[number];
export const UNITS: Record<Unit, { name: string; symbol: string; beats: Unit; role: string }> = {
  spear: { name: "창병", symbol: "槍", beats: "cavalry", role: "무장" },
  cavalry: { name: "기병", symbol: "騎", beats: "archer", role: "기장" },
  archer: { name: "궁병", symbol: "弓", beats: "spear", role: "궁장" },
};
export const UNIT_ADVANTAGE = 1.25;
export const UNIT_DISADVANTAGE = 0.8;
export function unitMultiplier(attacker?: Unit, defender?: Unit) {
  if (!attacker || !defender) return 1;
  if (UNITS[attacker].beats === defender) return UNIT_ADVANTAGE;
  if (UNITS[defender].beats === attacker) return UNIT_DISADVANTAGE;
  return 1;
}
/** 주장의 역할이 병종과 맞으면(무장-창병, 기장-기병, 궁장-궁병) 가하는 피해 +10%. */
export const APTITUDE_BONUS = 0.1;
export function aptitude(role: string | undefined, unit: Unit): SkillEffect | null {
  return role === UNITS[unit].role ? { kind: "attack", value: APTITUDE_BONUS } : null;
}

// 진형: 부대마다 하나를 고릅니다. 음수 효과는 약점입니다(방어 -0.1 = 받는 피해 +10%).
export const FORMATION_KEYS = ["basic", "fish", "circle", "wedge"] as const;
export type Formation = typeof FORMATION_KEYS[number];
export const FORMATIONS: Record<Formation, { name: string; description: string; effects: SkillEffect[] }> = {
  basic: { name: "기본진", description: "보정 없음", effects: [] },
  fish: { name: "어린진", description: "가하는 피해 +15% · 받는 피해 +10%", effects: [{ kind: "attack", value: 0.15 }, { kind: "guard", value: -0.1 }] },
  circle: { name: "방원진", description: "받는 피해 -15% · 가하는 피해 -10%", effects: [{ kind: "guard", value: 0.15 }, { kind: "attack", value: -0.1 }] },
  wedge: { name: "추행진", description: "선제 통솔 +25 · 첫 턴 피해 +15% · 받는 피해 +5%", effects: [{ kind: "initiative", value: 25 }, { kind: "ambush", value: 0.15 }, { kind: "guard", value: -0.05 }] },
};
