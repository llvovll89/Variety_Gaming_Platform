import { HERO_CATALOG, type HeroFaction } from "./heroCatalog";
import { SKILL_KINDS, type SkillEffect, type SkillKind } from "./skills";

// 같은 세력 장수를 2명 이상 편성하면 발동합니다. 2명 +, 3명 ++ 단계이며 주장에게 100% 적용됩니다.
export const FACTION_SYNERGY: Record<HeroFaction, { name: string; kind: SkillKind }> = {
  촉: { name: "도원결의", kind: "attack" },
  위: { name: "패업", kind: "initiative" },
  오: { name: "강동의 결속", kind: "tactics" },
  군웅: { name: "난세의 호걸", kind: "fury" },
};

export type Synergy = { faction: HeroFaction; name: string; count: number; label: string; description: string; effect: SkillEffect };

export function troopSynergy(templateKeys: readonly string[]): Synergy | null {
  const counts = new Map<HeroFaction, number>();
  for (const key of templateKeys) {
    const template = HERO_CATALOG.find(h => h.key === key);
    if (template) counts.set(template.faction, (counts.get(template.faction) ?? 0) + 1);
  }
  const [faction, count] = [...counts].sort((a, b) => b[1] - a[1])[0] ?? [];
  if (!faction || !count || count < 2) return null;
  const { name, kind } = FACTION_SYNERGY[faction];
  const tier = Math.min(2, count - 1);
  const value = SKILL_KINDS[kind].values[tier - 1];
  return { faction, name, count, label: "+".repeat(tier), description: SKILL_KINDS[kind].describe(value), effect: { kind, value } };
}

export const HERO_BONDS: readonly { name: string; keys: readonly string[]; required: number; description: string; effects: readonly SkillEffect[] }[] = [
  { name: "도원의 맹세", keys: ["liubei", "guanyu", "zhangfei"], required: 3, description: "피해 +8% · 받는 피해 −4%", effects: [{ kind: "attack", value: 0.08 }, { kind: "guard", value: 0.04 }] },
  { name: "와룡과 봉추", keys: ["zhugeliang", "pangtong"], required: 2, description: "계략 확률 +8%p", effects: [{ kind: "tactics", value: 0.08 }] },
  { name: "오자양장의 군율", keys: ["zhangliao", "yujin", "zhanghe", "xuhuang", "yuejin"], required: 2, description: "선제 통솔 +10 · 피해 +4%", effects: [{ kind: "initiative", value: 10 }, { kind: "attack", value: 0.04 }] },
  { name: "강동의 원로", keys: ["chengpu", "huanggai", "handang"], required: 2, description: "받는 피해 −6% · 반격 피해 +4%", effects: [{ kind: "guard", value: 0.06 }, { kind: "counter", value: 0.04 }] },
  { name: "함진의 계책", keys: ["gaoshun", "chengong"], required: 2, description: "첫 턴 피해 +10% · 받는 피해 −4%", effects: [{ kind: "ambush", value: 0.1 }, { kind: "guard", value: 0.04 }] },
  { name: "북벌의 뜻", keys: ["zhugeliang", "jiangwei"], required: 2, description: "계략 확률 +6%p · 병력 회복 +1%", effects: [{ kind: "tactics", value: 0.06 }, { kind: "recover", value: 0.01 }] },
  { name: "서량의 기마", keys: ["machao", "madai", "pangde"], required: 2, description: "첫 턴 피해 +12%", effects: [{ kind: "ambush", value: 0.12 }] },
  { name: "강동의 외교", keys: ["zhouyu", "lusu"], required: 2, description: "계략 확률 +6%p · 받는 피해 −4%", effects: [{ kind: "tactics", value: 0.06 }, { kind: "guard", value: 0.04 }] },
];
export function troopBonds(templateKeys: readonly string[]) {
  const unique = new Set(templateKeys);
  return HERO_BONDS.map(bond => ({ ...bond, count: bond.keys.filter(k => unique.has(k)).length })).filter(bond => bond.count >= bond.required);
}
