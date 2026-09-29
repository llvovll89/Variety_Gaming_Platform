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
