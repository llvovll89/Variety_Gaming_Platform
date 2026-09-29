export type HeroStats = {
  name: string; leadership: number; strength: number; intelligence: number;
};
export type BattleTroop = {
  id: string; name: string; currentTroops: number;
  commander: HeroStats; deputies: HeroStats[];
};
export type Side = "ATTACKER" | "DEFENDER";
export type BattleResult = {
  winner: Side | "DRAW"; turns: number; logs: string[];
  attackerRemaining: number; defenderRemaining: number;
  experienceReward: number;
};

export function aggregateStats(troop: BattleTroop) {
  if (troop.deputies.length > 2 || !Number.isSafeInteger(troop.currentTroops)
    || troop.currentTroops < 0 || troop.currentTroops > 1_000_000) {
    throw new Error("유효하지 않은 부대 편성입니다.");
  }
  const stats = { leadership: 0, strength: 0, intelligence: 0 };
  [troop.commander, ...troop.deputies].forEach((hero, index) => {
    for (const key of Object.keys(stats) as (keyof typeof stats)[]) {
      if (!Number.isFinite(hero[key]) || hero[key] < 0 || hero[key] > 10_000)
        throw new Error("유효하지 않은 장수 능력치입니다.");
      stats[key] += hero[key] * (index === 0 ? 1 : 0.3);
    }
  });
  return stats;
}

// RNG is explicit: no clock, database, input mutation, or hidden randomness.
export function simulateBattle(attacker: BattleTroop, defender: BattleTroop, random: () => number): BattleResult {
  if (attacker.id === defender.id) throw new Error("같은 부대끼리 전투할 수 없습니다.");
  const roll = () => {
    const value = random();
    if (!Number.isFinite(value) || value < 0 || value >= 1) throw new Error("RNG는 [0, 1) 값을 반환해야 합니다.");
    return value;
  };
  const a = { troop: attacker, stats: aggregateStats(attacker), soldiers: attacker.currentTroops };
  const d = { troop: defender, stats: aggregateStats(defender), soldiers: defender.currentTroops };
  const logs: string[] = [];
  let turns = 0;
  if (a.soldiers > 0 && d.soldiers > 0) {
    const first = a.stats.leadership === d.stats.leadership ? (roll() < 0.5 ? a : d)
      : a.stats.leadership > d.stats.leadership ? a : d;
    const second = first === a ? d : a;
    logs.push(`${first.troop.name} 부대가 선제 공격권을 얻었습니다.`);
    for (let turn = 1; turn <= 10 && a.soldiers > 0 && d.soldiers > 0; turn++) {
      turns = turn;
      for (const [source, target] of [[first, second], [second, first]]) {
        if (source.soldiers <= 0 || target.soldiers <= 0) break;
        const skill = roll() < Math.min(1, source.stats.intelligence / 300);
        const base = source.stats.strength * 0.5 + source.soldiers * 0.4 - target.stats.strength * 0.1;
        const damage = Math.min(target.soldiers, Math.max(10, Math.floor(base * (skill ? 1.5 : 1))));
        if (skill) logs.push(`${turn}턴: 주장 [${source.troop.commander.name}]의 화공 계략 발동!`);
        target.soldiers -= damage;
        logs.push(`${turn}턴: ${source.troop.name} → ${target.troop.name}, ${damage}명 피해. 남은 병력 ${target.soldiers}명.`);
      }
    }
  }
  const winner = a.soldiers === d.soldiers ? "DRAW" : a.soldiers > d.soldiers ? "ATTACKER" : "DEFENDER";
  const destroyed = winner === "ATTACKER" ? defender.currentTroops - d.soldiers
    : winner === "DEFENDER" ? attacker.currentTroops - a.soldiers : 0;
  logs.push(winner === "DRAW" ? "전투 종료: 무승부." : `전투 종료: ${winner === "ATTACKER" ? attacker.name : defender.name} 승리.`);
  return { winner, turns, logs, attackerRemaining: a.soldiers, defenderRemaining: d.soldiers,
    experienceReward: Math.floor(destroyed * 0.1) };
}
