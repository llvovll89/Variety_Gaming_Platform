export const MAX_LEVEL = 20;
export const UPGRADE_KEYS = ['agility', 'magnet', 'efficiency'] as const;
export type UpgradeKey = typeof UPGRADE_KEYS[number];
export type Upgrades = Record<UpgradeKey, number>;

export const UPGRADES = {
  agility: { name: '바람 걸음', description: '이동 속도 +5%, 회전 속도 +8%', detail: '빠르게 돌아 상대의 빈틈을 노리세요.' },
  magnet: { name: '별의 인력', description: '별 수집 반경 +14', detail: '조금 떨어진 별까지 넓게 수집하세요.' },
  efficiency: { name: '오래 달리기', description: '부스트 길이 소모 12% 감소', detail: '같은 길이로 더 오래 질주하세요.' },
} as const;

export function createProgression() {
  return { level: 1, xp: 0, upgrades: { agility: 0, magnet: 0, efficiency: 0 } as Upgrades };
}
export type Progression = ReturnType<typeof createProgression>;
// Slower early levels, with a steeper curve as collection builds become stronger.
export function xpForLevel(level: number): number { return 40 + (level - 1) * 20 + (level - 1) ** 2 * 4; }
export function awardExperience(p: Progression, amount: number): void {
  if (p.level >= MAX_LEVEL || !Number.isFinite(amount) || amount <= 0) return;
  p.xp += amount;
  while (p.level < MAX_LEVEL && p.xp >= xpForLevel(p.level)) {
    p.xp -= xpForLevel(p.level);
    p.level++;
  }
  if (p.level === MAX_LEVEL) p.xp = 0;
}
export function pendingUpgrades(p: Progression): number {
  return p.level - 1 - UPGRADE_KEYS.reduce((sum, key) => sum + p.upgrades[key], 0);
}
export function chooseUpgrade(p: Progression, key: UpgradeKey): boolean {
  if (!UPGRADE_KEYS.includes(key) || pendingUpgrades(p) <= 0) return false;
  p.upgrades[key]++;
  return true;
}
export function statsFor(p: Progression) {
  return {
    speedMultiplier: 1 + p.upgrades.agility * .05,
    turnMultiplier: 1 + p.upgrades.agility * .08,
    pickupBonus: p.upgrades.magnet * 14,
    drainMultiplier: Math.pow(.88, p.upgrades.efficiency),
  };
}
