import type { SkillEffect, SkillKind } from "./skills";

export type HeroStats = {
  name: string; leadership: number; strength: number; intelligence: number; charm?: number; skills?: SkillEffect[];
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
  const stats = { leadership: 0, strength: 0, intelligence: 0, charm: 0 };
  [troop.commander, ...troop.deputies].forEach((hero, index) => {
    for (const key of Object.keys(stats) as (keyof typeof stats)[]) {
      const value = hero[key] ?? 0;
      if (!Number.isFinite(value) || value < 0 || value > 10_000)
        throw new Error("유효하지 않은 장수 능력치입니다.");
      stats[key] += value * (index === 0 ? 1 : 0.3);
    }
  });
  return stats;
}

/** 특수능력 합산: 주장 100%, 부장 30%. */
export function aggregateSkills(troop: BattleTroop) {
  const totals: Record<SkillKind, number> = { attack: 0, guard: 0, initiative: 0, tactics: 0, fury: 0, recover: 0, fiscal: 0, tutor: 0, counter: 0, desperate: 0, ambush: 0, awe: 0, fire: 0, plunder: 0 };
  [troop.commander, ...troop.deputies].forEach((hero, index) => {
    for (const skill of hero.skills ?? []) totals[skill.kind] += skill.value * (index === 0 ? 1 : 0.3);
  });
  return totals;
}

// RNG is explicit: no clock, database, input mutation, or hidden randomness.
export function simulateBattle(attacker: BattleTroop, defender: BattleTroop, random: () => number): BattleResult {
  if (attacker.id === defender.id) throw new Error("같은 부대끼리 전투할 수 없습니다.");
  const roll = () => {
    const value = random();
    if (!Number.isFinite(value) || value < 0 || value >= 1) throw new Error("RNG는 [0, 1) 값을 반환해야 합니다.");
    return value;
  };
  const a = { troop: attacker, stats: aggregateStats(attacker), skills: aggregateSkills(attacker), soldiers: attacker.currentTroops, start: attacker.currentTroops };
  const d = { troop: defender, stats: aggregateStats(defender), skills: aggregateSkills(defender), soldiers: defender.currentTroops, start: defender.currentTroops };
  const logs: string[] = [];
  let turns = 0;
  if (a.soldiers > 0 && d.soldiers > 0) {
    const aLead = a.stats.leadership + a.skills.initiative; const dLead = d.stats.leadership + d.skills.initiative;
    const first = aLead === dLead ? (roll() < 0.5 ? a : d) : aLead > dLead ? a : d;
    const second = first === a ? d : a;
    logs.push(`${first.troop.name} 부대가 선제 공격권을 얻었습니다.`);
    for (let turn = 1; turn <= 10 && a.soldiers > 0 && d.soldiers > 0; turn++) {
      turns = turn;
      if (turn > 1) for (const side of [a, d]) {
        const heal = Math.floor(side.soldiers * side.skills.recover);
        if (heal > 0 && side.soldiers > 0) { side.soldiers += Math.min(heal, side.start - side.soldiers); logs.push(`${turn}턴: ${side.troop.name} 군의 치료로 병력이 회복되었습니다.`); }
      }
      for (const [source, target] of [[first, second], [second, first]]) {
        if (source.soldiers <= 0 || target.soldiers <= 0) break;
        const skill = roll() < Math.min(1, source.stats.intelligence / 300 + source.skills.tactics);
        const base = source.stats.strength * 0.5 + source.soldiers * 0.4 - target.stats.strength * 0.1;
        const morale = 1 - Math.min(0.2 + target.skills.awe * 0.2, target.stats.charm / 1500 * (1 + target.skills.awe));
        const fury = source.skills.fury > 0 && roll() < source.skills.fury;
        const multiplier = (1 + source.skills.attack) * (1 - Math.min(0.5, target.skills.guard)) * (fury ? 1.5 : 1)
          * (turn === 1 ? 1 + source.skills.ambush : 1) * (source.soldiers <= source.start / 2 ? 1 + source.skills.desperate : 1);
        const damage = Math.min(target.soldiers, Math.max(10, Math.floor(base * (skill ? 1.5 + source.skills.fire : 1) * morale * multiplier)));
        if (fury) logs.push(`${turn}턴: 주장 [${source.troop.commander.name}]의 맹장 일격!`);
        if (skill) logs.push(`${turn}턴: 주장 [${source.troop.commander.name}]의 화공 계략 발동!`);
        target.soldiers -= damage;
        const reflected = Math.min(source.soldiers, Math.floor(damage * target.skills.counter));
        if (reflected > 0) { source.soldiers -= reflected; logs.push(`${turn}턴: ${target.troop.name}의 반격! ${reflected}명 피해를 되돌렸습니다.`); }
        logs.push(`${turn}턴: ${source.troop.name} → ${target.troop.name}, ${damage}명 피해. 남은 병력 ${target.soldiers}명.`);
      }
    }
  }
  const winner = a.soldiers === d.soldiers ? "DRAW" : a.soldiers > d.soldiers ? "ATTACKER" : "DEFENDER";
  const destroyed = winner === "ATTACKER" ? defender.currentTroops - d.soldiers
    : winner === "DEFENDER" ? attacker.currentTroops - a.soldiers : 0;
  logs.push(winner === "DRAW" ? "전투 종료: 무승부." : `전투 종료: ${winner === "ATTACKER" ? attacker.name : defender.name} 승리.`);
  return { winner, turns, logs, attackerRemaining: a.soldiers, defenderRemaining: d.soldiers,
    experienceReward: Math.floor(destroyed * 0.3) };
}
