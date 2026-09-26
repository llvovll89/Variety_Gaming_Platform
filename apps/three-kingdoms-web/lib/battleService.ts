import { randomInt } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { getDb } from "./db";
import { simulateBattle, type BattleTroop } from "./battleEngine";
import { gainExperience } from "./progression";
import { syncResources } from "./resources";

export class GameError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
const includeTroop = { heroes: { include: { hero: { include: { equipment: true } } } } } satisfies Prisma.TroopInclude;
type LoadedTroop = Prisma.TroopGetPayload<{ include: typeof includeTroop }>;
export function toBattleTroop(troop: LoadedTroop): BattleTroop {
  const commander = troop.heroes.find(h => h.slot === "COMMANDER");
  if (!commander || troop.heroes.length > 3 || troop.currentTroops <= 0)
    throw new GameError(409, "주장과 출전 병력이 필요합니다.");
  if (troop.heroes.some(h => h.hero.userId !== troop.userId || h.hero.equipment.some(i => i.userId !== h.hero.userId)))
    throw new GameError(409, "장수 또는 장비의 소유권이 올바르지 않습니다.");
  const stats = (entry: typeof commander) => {
    const h = entry.hero;
    return { name: h.name,
      leadership: h.leadership + h.equipment.reduce((sum, i) => sum + i.leadershipBonus, 0),
      strength: h.strength + h.equipment.reduce((sum, i) => sum + i.strengthBonus, 0),
      intelligence: h.intelligence + h.equipment.reduce((sum, i) => sum + i.intelligenceBonus, 0) };
  };
  const capacity = troop.heroes.reduce((sum, h) => sum + h.hero.maxTroops + stats(h).leadership * 10, 0);
  if (troop.currentTroops > capacity) throw new GameError(409, "최대 통솔 병력을 초과했습니다.");
  return { id: troop.id, name: troop.name, currentTroops: troop.currentTroops,
    commander: stats(commander), deputies: troop.heroes.filter(h => h.slot !== "COMMANDER").map(stats) };
}

export type BattleCommand = { attackerTroopId: string; defenderTroopId: string; requestKey: string };
export async function executeBattle(userId: string, input: BattleCommand) {
  if (input.attackerTroopId === input.defenderTroopId) throw new GameError(400, "같은 부대는 공격할 수 없습니다.");
  const db = getDb();
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await db.$transaction(async tx => {
        const previous = await tx.battleLog.findUnique({ where: { userId_requestKey: { userId, requestKey: input.requestKey } } });
        if (previous) {
          if (previous.attackerId !== input.attackerTroopId || previous.defenderId !== input.defenderTroopId)
            throw new GameError(409, "이미 다른 전투에 사용한 요청 키입니다.");
          return { battleId: previous.id, result: previous.result, replayed: true };
        }
        const attacker = await tx.troop.findUnique({ where: { id: input.attackerTroopId }, include: includeTroop });
        if (!attacker || attacker.userId !== userId || attacker.isNpc) throw new GameError(403, "자신의 부대만 출전할 수 있습니다.");
        const defender = await tx.troop.findUnique({ where: { id: input.defenderTroopId }, include: includeTroop });
        if (!defender) throw new GameError(404, "대상 부대를 찾을 수 없습니다.");
        if (defender.userId === userId) throw new GameError(400, "자신의 부대를 공격할 수 없습니다.");
        if ((!defender.isNpc && !defender.userId) || (defender.isNpc && defender.userId))
          throw new GameError(409, "대상 부대 설정이 올바르지 않습니다.");
        const result = simulateBattle(toBattleTroop(attacker), toBattleTroop(defender), () => randomInt(0, 2 ** 32) / 2 ** 32);
        const now = new Date();
        // Serializable reads cover both castles, equipment, and heroes. A conflict retries the entire action.
        const castles = new Map<string, Awaited<ReturnType<typeof syncResources>>>();
        for (const owner of [userId, ...(defender.userId ? [defender.userId] : [])].sort())
          castles.set(owner, await syncResources(tx, owner, now));
        const winningTroop = result.winner === "ATTACKER" ? attacker : result.winner === "DEFENDER" ? defender : null;
        const losingTroop = result.winner === "ATTACKER" ? defender : attacker;
        let goldReward = 0;
        const heroRewards: { heroId: string; experience: number; level: number }[] = [];
        if (winningTroop?.userId) {
          if (losingTroop.isNpc) goldReward = losingTroop.pveGoldReward;
          else {
            const loser = castles.get(losingTroop.userId!)!;
            goldReward = Math.min(1000, loser.gold.mul(0.1).floor().toNumber());
          }
          const winnerCastle = castles.get(winningTroop.userId)!;
          goldReward = Math.max(0, Math.min(goldReward, new Prisma.Decimal(1_000_000_000).minus(winnerCastle.gold).floor().toNumber()));
          if (!losingTroop.isNpc) await tx.castle.update({ where: { userId: losingTroop.userId! }, data: { gold: { decrement: goldReward } } });
          await tx.castle.update({ where: { userId: winningTroop.userId }, data: { gold: { increment: goldReward } } });
          const heroes = [...winningTroop.heroes].sort((a, b) => a.heroId.localeCompare(b.heroId));
          for (const [index, entry] of heroes.entries()) {
            const reward = Math.floor(result.experienceReward / heroes.length) + (index < result.experienceReward % heroes.length ? 1 : 0);
            const growth = gainExperience(entry.hero.level, entry.hero.experience, reward);
            await tx.hero.update({ where: { id: entry.heroId }, data: {
              level: growth.level, experience: growth.experience,
              leadership: { increment: growth.levelsGained }, strength: { increment: growth.levelsGained },
              intelligence: { increment: growth.levelsGained }, politics: { increment: growth.levelsGained },
              maxTroops: { increment: growth.levelsGained * 50 },
            } });
            heroRewards.push({ heroId: entry.heroId, experience: reward, level: growth.level });
          }
        }
        for (const troop of [attacker, defender].sort((a, b) => a.id.localeCompare(b.id)))
          await tx.troop.update({ where: { id: troop.id }, data: { currentTroops: troop.id === attacker.id ? result.attackerRemaining : result.defenderRemaining } });
        const persisted = { ...result, experienceReward: winningTroop?.userId ? result.experienceReward : 0,
          goldReward, rewardUserId: winningTroop?.userId ?? null, heroRewards,
          mode: defender.isNpc ? "PVE" : "PVP", rulesVersion: 1 };
        const log = await tx.battleLog.create({ data: {
          userId, requestKey: input.requestKey, attackerId: attacker.id, defenderId: defender.id,
          winner: result.winner, turns: result.turns, logs: result.logs,
          attackerRemaining: result.attackerRemaining, defenderRemaining: result.defenderRemaining,
          goldReward, experienceReward: persisted.experienceReward, result: persisted,
        } });
        return { battleId: log.id, result: persisted, replayed: false };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 5000, timeout: 15000 });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && ["P2034", "P2002"].includes(error.code)) {
        if (attempt < 2) continue;
        throw new GameError(409, "동시에 다른 행동이 진행되었습니다. 동일 요청 키로 재시도하세요.");
      }
      throw error;
    }
  }
  throw new GameError(409, "전투를 다시 요청하세요.");
}
