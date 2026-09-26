import { Prisma } from "@/generated/prisma/client";
import type { BuildingType } from "@/generated/prisma/enums";

export function calculateProduction(elapsedSeconds: number, buildings: { type: BuildingType; level: number }[], politics: number) {
  const seconds = new Prisma.Decimal(Math.max(0, elapsedSeconds));
  const bonus = new Prisma.Decimal(1).plus(new Prisma.Decimal(politics).div(1000));
  const amount = (type: BuildingType, perMinute: number) => seconds.mul(
    buildings.find(b => b.type === type)?.level ?? 0).mul(perMinute).mul(bonus).div(60);
  return { gold: amount("ADMINISTRATION", 10), food: amount("FARM", 20), reserves: amount("BARRACKS", 5) };
}

// Call inside the same serializable transaction BEFORE changing politics/buildings.
export async function syncResources(tx: Prisma.TransactionClient, userId: string, now: Date) {
  const castle = await tx.castle.findUniqueOrThrow({ where: { userId }, include: { buildings: true } });
  const heroes = await tx.hero.findMany({ where: { userId }, include: { equipment: true } });
  const politics = Math.max(0, ...heroes.map(h => h.politics + h.equipment.reduce((s, i) => s + i.politicsBonus, 0)));
  // Whole seconds preserve fractional time across frequent requests.
  const elapsed = Math.max(0, Math.floor((now.getTime() - castle.lastUpdatedAt.getTime()) / 1000));
  const growth = calculateProduction(elapsed, castle.buildings, politics);
  const cap = new Prisma.Decimal(1_000_000_000);
  return tx.castle.update({ where: { id: castle.id }, data: {
    gold: Prisma.Decimal.min(cap, castle.gold.plus(growth.gold)),
    food: Prisma.Decimal.min(cap, castle.food.plus(growth.food)),
    reserves: Prisma.Decimal.min(cap, castle.reserves.plus(growth.reserves)),
    lastUpdatedAt: new Date(castle.lastUpdatedAt.getTime() + elapsed * 1000),
  } });
}
