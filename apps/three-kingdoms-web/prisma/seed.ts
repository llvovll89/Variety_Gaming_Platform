import "dotenv/config";
import { z } from "zod";
import { getDb } from "../lib/db";

// Explicit local operator command; never an unauthenticated HTTP endpoint.
const userId = z.uuid().parse(process.env.SEED_USER_ID);
const db = getDb();
try {
  const result = await db.$transaction(async tx => {
    const user = await tx.user.upsert({ where: { id: userId }, update: {}, create: {
      id: userId, name: "신임 군주", castle: { create: { buildings: { create: [
        { type: "FARM" }, { type: "ADMINISTRATION" }, { type: "BARRACKS" },
      ] } } },
    } });
    let player = await tx.troop.findFirst({ where: { userId: user.id } });
    if (!player) player = await tx.troop.create({ data: {
      userId, name: "선봉대", currentTroops: 1000,
      heroes: { create: { slot: "COMMANDER", hero: { create: {
        userId, name: "관우", stars: 4, leadership: 95, strength: 98,
        intelligence: 75, politics: 62, maxTroops: 1500,
      } } } },
    } });
    const npc = await tx.troop.create({ data: {
      name: "황건적 잔당", isNpc: true, currentTroops: 600, pveGoldReward: 100,
      heroes: { create: { slot: "COMMANDER", hero: { create: {
        name: "황건 두목", stars: 1, leadership: 35, strength: 40,
        intelligence: 20, politics: 10, maxTroops: 800,
      } } } },
    } });
    return { attackerTroopId: player.id, defenderTroopId: npc.id };
  });
  console.log(JSON.stringify(result, null, 2));
} finally { await db.$disconnect(); }
