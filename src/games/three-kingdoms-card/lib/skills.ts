// 특수능력: 등급에 따라 단계(+, ++, +++)가 제한됩니다. 1~2성은 없음, 3성 +, 4성 ++, 5성 +++.
export type SkillKind = "attack" | "guard" | "initiative" | "tactics" | "fury" | "recover" | "fiscal" | "tutor"
  | "counter" | "desperate" | "ambush" | "awe" | "fire" | "plunder";
export type SkillEffect = { kind: SkillKind; value: number };

export const SKILL_KINDS: Record<SkillKind, { common: string; scope: "battle" | "castle"; values: readonly [number, number, number]; describe: (v: number) => string }> = {
  attack: { common: "공격적 지휘", scope: "battle", values: [0.05, 0.1, 0.15], describe: v => `가하는 피해 +${Math.round(v * 100)}%` },
  guard: { common: "방어적 지휘", scope: "battle", values: [0.04, 0.08, 0.12], describe: v => `받는 피해 -${Math.round(v * 100)}%` },
  initiative: { common: "선제 지휘", scope: "battle", values: [10, 20, 30], describe: v => `선제 판정 통솔 +${v}` },
  tactics: { common: "계략 지휘", scope: "battle", values: [0.05, 0.1, 0.15], describe: v => `계략 발동 확률 +${Math.round(v * 100)}%p` },
  fury: { common: "맹장", scope: "battle", values: [0.08, 0.12, 0.16], describe: v => `${Math.round(v * 100)}% 확률로 피해 1.5배` },
  recover: { common: "군의", scope: "battle", values: [0.01, 0.02, 0.03], describe: v => `매 턴 병력 ${Math.round(v * 100)}% 회복` },
  fiscal: { common: "내정", scope: "castle", values: [0.05, 0.1, 0.15], describe: v => `금 생산 +${Math.round(v * 100)}%` },
  counter: { common: "반격", scope: "battle", values: [0.04, 0.08, 0.12], describe: v => `받은 피해의 ${Math.round(v * 100)}%를 적에게 반사` },
  desperate: { common: "불굴", scope: "battle", values: [0.1, 0.2, 0.3], describe: v => `병력 50% 이하일 때 가하는 피해 +${Math.round(v * 100)}%` },
  ambush: { common: "기습", scope: "battle", values: [0.2, 0.35, 0.5], describe: v => `첫 턴 가하는 피해 +${Math.round(v * 100)}%` },
  awe: { common: "위엄", scope: "battle", values: [0.5, 1, 1.5], describe: v => `매력의 사기 효과 +${Math.round(v * 100)}% (피해 감소 상한 ${20 + Math.round(v * 20)}%)` },
  fire: { common: "화공", scope: "battle", values: [0.2, 0.35, 0.5], describe: v => `계략 발동 시 피해 배율 +${v.toFixed(2)}` },
  plunder: { common: "약탈", scope: "castle", values: [0.1, 0.2, 0.3], describe: v => `토벌 승리 금 보상 +${Math.round(v * 100)}%` },
  tutor: { common: "학습", scope: "castle", values: [0.1, 0.2, 0.3], describe: v => `획득 경험치 +${Math.round(v * 100)}%` },
};

export const SKILL_STEPS = ["", "+", "++", "+++"] as const;
/** 별 등급 → 단계. 1~2성 0(없음), 3성 1, 4성 2, 5성 3. */
export function skillTier(stars: number) { return Math.max(0, Math.min(3, Math.floor(stars) - 2)); }
export function skillLabel(tier: number) { return SKILL_STEPS[Math.max(0, Math.min(3, tier))]; }

export type HeroSkill = { name: string; kind: SkillKind; common: boolean; tier: number; label: string; description: string; effect: SkillEffect };
export function skillEffect(kind: SkillKind, tier: number): SkillEffect | null {
  return tier < 1 ? null : { kind, value: SKILL_KINDS[kind].values[Math.min(3, tier) - 1] };
}
export function makeSkill(name: string, kind: SkillKind, common: boolean, stars: number): HeroSkill | null {
  const tier = skillTier(stars); const effect = skillEffect(kind, tier);
  return effect ? { name, kind, common, tier, label: skillLabel(tier), description: SKILL_KINDS[kind].describe(effect.value), effect } : null;
}
