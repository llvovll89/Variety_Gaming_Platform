import type { SkillEffect } from "./skills";
export const EQUIPMENT_KEYS = ["vanguardBlade", "vanguardArmor", "vanguardHorse", "sageFan", "sageRobe", "sageScroll", "guardianSpear", "guardianArmor", "guardianSeal"] as const;
export type EquipmentKey = typeof EQUIPMENT_KEYS[number];
export const EQUIPMENT_SLOTS = ["weapon", "armor", "treasure"] as const;
export const SLOT_NAMES = { weapon: "무기", armor: "방어구", treasure: "보물" } as const;
export const EQUIPMENT_SETS = {
  vanguard: { name: "선봉", two: "가하는 피해 +4%", three: "선제 통솔 +10", effects2: [{ kind: "attack", value: 0.04 }], effects3: [{ kind: "initiative", value: 10 }] },
  sage: { name: "책략", two: "계략 확률 +4%p", three: "계략 피해 배율 +0.15", effects2: [{ kind: "tactics", value: 0.04 }], effects3: [{ kind: "fire", value: 0.15 }] },
  guardian: { name: "수호", two: "받는 피해 −4%", three: "매 턴 병력 회복 +1%", effects2: [{ kind: "guard", value: 0.04 }], effects3: [{ kind: "recover", value: 0.01 }] },
} satisfies Record<string, { name: string; two: string; three: string; effects2: SkillEffect[]; effects3: SkillEffect[] }>;
export type EquipmentSet = keyof typeof EQUIPMENT_SETS;
type Bonuses = { leadership: number; strength: number; intelligence: number };
export const EQUIPMENT: Record<EquipmentKey, { name: string; slot: typeof EQUIPMENT_SLOTS[number]; set: EquipmentSet; symbol: string; stats: Partial<Bonuses>; effects: SkillEffect[] }> = {
  vanguardBlade: { name: "선봉 장도", slot: "weapon", set: "vanguard", symbol: "刃", stats: { strength: 5 }, effects: [] },
  vanguardArmor: { name: "선봉 전갑", slot: "armor", set: "vanguard", symbol: "甲", stats: { leadership: 2 }, effects: [{ kind: "guard", value: 0.008 }] },
  vanguardHorse: { name: "선봉 군마", slot: "treasure", set: "vanguard", symbol: "馬", stats: {}, effects: [{ kind: "initiative", value: 2 }] },
  sageFan: { name: "책략 우선", slot: "weapon", set: "sage", symbol: "扇", stats: { intelligence: 5 }, effects: [] },
  sageRobe: { name: "책략 학창의", slot: "armor", set: "sage", symbol: "衣", stats: { intelligence: 2 }, effects: [{ kind: "guard", value: 0.005 }] },
  sageScroll: { name: "책략 병서", slot: "treasure", set: "sage", symbol: "卷", stats: {}, effects: [{ kind: "tactics", value: 0.008 }] },
  guardianSpear: { name: "수호 장창", slot: "weapon", set: "guardian", symbol: "槍", stats: { leadership: 3, strength: 2 }, effects: [] },
  guardianArmor: { name: "수호 중갑", slot: "armor", set: "guardian", symbol: "盾", stats: {}, effects: [{ kind: "guard", value: 0.012 }] },
  guardianSeal: { name: "수호 군인", slot: "treasure", set: "guardian", symbol: "印", stats: { leadership: 2 }, effects: [{ kind: "counter", value: 0.008 }] },
};
export type EquipmentItem = { id: string; key: EquipmentKey; level: number; heroId: string | null };
export const EQUIPMENT_LIMIT = 300;
export const EQUIPMENT_MAX_LEVEL = 10;
export const CRAFT_COST = { gold: 300, materials: 15 };
export function equipmentUpgradeCost(level: number) { return { gold: 150 * level * level, materials: 5 * level }; }
export function equipmentEffectDescription(effect: SkillEffect) {
  const percent = Number((effect.value * 100).toFixed(1));
  switch (effect.kind) {
    case "guard": return `받는 피해 -${percent}%`;
    case "counter": return `받은 피해의 ${percent}% 반사`;
    case "tactics": return `계략 발동 확률 +${percent}%p`;
    case "initiative": return `선제 판정 통솔 +${effect.value}`;
    default: return `${effect.kind} +${effect.value}`;
  }
}
export function salvageMaterials(item: EquipmentItem) { return Math.floor((CRAFT_COST.materials + 5 * (item.level - 1) * item.level / 2) / 2); }
export function equipmentStats(items: readonly EquipmentItem[], heroId: string): Bonuses {
  const stats = { leadership: 0, strength: 0, intelligence: 0 };
  for (const item of items.filter(item => item.heroId === heroId)) for (const key of Object.keys(stats) as (keyof Bonuses)[]) stats[key] += (EQUIPMENT[item.key].stats[key] ?? 0) * item.level;
  return stats;
}
export function effectiveHero<T extends Bonuses & { id: string }>(items: readonly EquipmentItem[], hero: T): T {
  const bonus = equipmentStats(items, hero.id);
  return { ...hero, leadership: hero.leadership + bonus.leadership, strength: hero.strength + bonus.strength, intelligence: hero.intelligence + bonus.intelligence };
}
export function equipmentSetCounts(items: readonly EquipmentItem[], heroId: string) {
  return Object.keys(EQUIPMENT_SETS).map(key => ({ key: key as EquipmentSet, count: items.filter(item => item.heroId === heroId && EQUIPMENT[item.key].set === key).length }));
}
export function equipmentEffects(items: readonly EquipmentItem[], heroId: string): SkillEffect[] {
  const effects = items.filter(item => item.heroId === heroId).flatMap(item => EQUIPMENT[item.key].effects.map(effect => ({ ...effect, value: effect.value * item.level })));
  for (const set of equipmentSetCounts(items, heroId)) {
    if (set.count >= 2) effects.push(...EQUIPMENT_SETS[set.key].effects2);
    if (set.count >= 3) effects.push(...EQUIPMENT_SETS[set.key].effects3);
  }
  return effects;
}
