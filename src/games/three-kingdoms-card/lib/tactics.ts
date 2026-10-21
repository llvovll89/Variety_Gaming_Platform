import type { SkillEffect } from "./skills";

// 병종 상성: 창병 > 기병 > 궁병 > 창병. 유리하면 가하는 피해 ×1.25, 불리하면 ×0.8.
export const UNIT_KEYS = ["spear", "cavalry", "archer", "sword", "crossbow", "mountedArcher"] as const;
export type Unit = typeof UNIT_KEYS[number];
export const UNITS: Record<Unit, { name: string; symbol: string; beats: Unit; advantages: readonly Unit[]; role: string; description: string; effects: SkillEffect[] }> = {
  spear: { name: "창병", symbol: "槍", beats: "cavalry", advantages: ["cavalry", "mountedArcher"], role: "무장", description: "기마 부대의 돌격을 저지하는 보병", effects: [] },
  cavalry: { name: "기병", symbol: "騎", beats: "archer", advantages: ["archer", "crossbow"], role: "기장", description: "궁병과 노병의 진지를 돌파하는 기마병", effects: [] },
  archer: { name: "궁병", symbol: "弓", beats: "spear", advantages: ["spear", "sword"], role: "궁장", description: "보병을 원거리에서 제압하는 궁수", effects: [] },
  sword: { name: "도순병", symbol: "盾", beats: "crossbow", advantages: ["crossbow", "cavalry"], role: "지휘관", description: "받는 피해 −8% · 가하는 피해 −4%", effects: [{ kind: "guard", value: 0.08 }, { kind: "attack", value: -0.04 }] },
  crossbow: { name: "노병", symbol: "弩", beats: "mountedArcher", advantages: ["mountedArcher", "spear"], role: "책사", description: "계략 피해 배율 +0.15 · 선제 통솔 −10", effects: [{ kind: "fire", value: 0.15 }, { kind: "initiative", value: -10 }] },
  mountedArcher: { name: "궁기병", symbol: "驍", beats: "sword", advantages: ["sword", "archer"], role: "궁장", description: "첫 턴 피해 +10% · 받는 피해 +4%", effects: [{ kind: "ambush", value: 0.1 }, { kind: "guard", value: -0.04 }] },
};
export const UNIT_ADVANTAGE = 1.25;
export const UNIT_DISADVANTAGE = 0.8;
export function unitMultiplier(attacker?: Unit, defender?: Unit) {
  if (!attacker || !defender) return 1;
  if (UNITS[attacker].advantages.includes(defender)) return UNIT_ADVANTAGE;
  if (UNITS[defender].advantages.includes(attacker)) return UNIT_DISADVANTAGE;
  return 1;
}
/** 주장의 역할이 병종과 맞으면(무장-창병, 기장-기병, 궁장-궁병) 가하는 피해 +10%. */
export const APTITUDE_BONUS = 0.1;
export function aptitude(role: string | undefined, unit: Unit): SkillEffect | null {
  return role === UNITS[unit].role ? { kind: "attack", value: APTITUDE_BONUS } : null;
}

// 진형: 부대마다 하나를 고릅니다. 음수 효과는 약점입니다(방어 -0.1 = 받는 피해 +10%).
export const FORMATION_KEYS = ["basic", "fish", "circle", "wedge", "goose", "crane", "square", "eight"] as const;
export type Formation = typeof FORMATION_KEYS[number];
export const FORMATIONS: Record<Formation, { name: string; description: string; effects: SkillEffect[] }> = {
  basic: { name: "기본진", description: "보정 없음", effects: [] },
  fish: { name: "어린진", description: "가하는 피해 +15% · 받는 피해 +10%", effects: [{ kind: "attack", value: 0.15 }, { kind: "guard", value: -0.1 }] },
  circle: { name: "방원진", description: "받는 피해 -15% · 가하는 피해 -10%", effects: [{ kind: "guard", value: 0.15 }, { kind: "attack", value: -0.1 }] },
  wedge: { name: "추행진", description: "선제 통솔 +25 · 첫 턴 피해 +15% · 받는 피해 +5%", effects: [{ kind: "initiative", value: 25 }, { kind: "ambush", value: 0.15 }, { kind: "guard", value: -0.05 }] },
  goose: { name: "안행진", description: "계략 확률 +8%p · 피해 +8% · 받는 피해 +5%", effects: [{ kind: "tactics", value: 0.08 }, { kind: "attack", value: 0.08 }, { kind: "guard", value: -0.05 }] },
  crane: { name: "학익진", description: "반격 피해 +8% · 피해 +5% · 선제 통솔 −10", effects: [{ kind: "counter", value: 0.08 }, { kind: "attack", value: 0.05 }, { kind: "initiative", value: -10 }] },
  square: { name: "방진", description: "받는 피해 −12% · 병력 회복 1% · 선제 통솔 −15", effects: [{ kind: "guard", value: 0.12 }, { kind: "recover", value: 0.01 }, { kind: "initiative", value: -15 }] },
  eight: { name: "팔괘진", description: "계략 확률 +6%p · 받는 피해 −6%", effects: [{ kind: "tactics", value: 0.06 }, { kind: "guard", value: 0.06 }] },
};

export const FORMATION_RESONANCE: Record<Formation, { requirement: string; description: string; effects: SkillEffect[] }> = {
  basic: { requirement: "추가 조건 없음", description: "추가 효과 없음", effects: [] },
  fish: { requirement: "무장·기장 합계 2명 이상", description: "피해 +5%", effects: [{ kind: "attack", value: 0.05 }] },
  circle: { requirement: "지휘관 1명 이상", description: "받는 피해 −5%", effects: [{ kind: "guard", value: 0.05 }] },
  wedge: { requirement: "기장 1명 이상", description: "선제 통솔 +15", effects: [{ kind: "initiative", value: 15 }] },
  goose: { requirement: "궁장·책사 합계 2명 이상", description: "계략 확률 +5%p", effects: [{ kind: "tactics", value: 0.05 }] },
  crane: { requirement: "서로 다른 세력 장수 3명", description: "반격 피해 +4%", effects: [{ kind: "counter", value: 0.04 }] },
  square: { requirement: "주장과 부장 2명 모두 배치", description: "병력 회복 +1%", effects: [{ kind: "recover", value: 0.01 }] },
  eight: { requirement: "주장 지력 80 이상·3명 편성", description: "계략 확률 +5%p · 받는 피해 −3%", effects: [{ kind: "tactics", value: 0.05 }, { kind: "guard", value: 0.03 }] },
};
export function formationResonates(formation: Formation, members: readonly { role: string; faction: string; intelligence: number }[]) {
  if (formation === "basic") return false;
  if (formation === "fish") return members.filter(h => ["무장", "기장"].includes(h.role)).length >= 2;
  if (formation === "circle") return members.some(h => h.role === "지휘관");
  if (formation === "wedge") return members.some(h => h.role === "기장");
  if (formation === "goose") return members.filter(h => ["궁장", "책사"].includes(h.role)).length >= 2;
  if (formation === "crane") return new Set(members.map(h => h.faction)).size >= 3;
  if (formation === "square") return members.length === 3;
  return members.length === 3 && members[0].intelligence >= 80;
}
