-- Generated schema + reviewed constraints. Apply once to an empty database.
BEGIN;
-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "BuildingType" AS ENUM ('FARM', 'ADMINISTRATION', 'BARRACKS');

-- CreateEnum
CREATE TYPE "HeroSlot" AS ENUM ('COMMANDER', 'DEPUTY_ONE', 'DEPUTY_TWO');

-- CreateEnum
CREATE TYPE "EquipmentSlot" AS ENUM ('WEAPON', 'ARMOR', 'ACCESSORY');

-- CreateEnum
CREATE TYPE "BattleWinner" AS ENUM ('ATTACKER', 'DEFENDER', 'DRAW');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Castle" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "gold" DECIMAL(18,4) NOT NULL DEFAULT 1000,
    "food" DECIMAL(18,4) NOT NULL DEFAULT 1000,
    "reserves" DECIMAL(18,4) NOT NULL DEFAULT 1000,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Castle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Building" (
    "id" UUID NOT NULL,
    "castleId" UUID NOT NULL,
    "type" "BuildingType" NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Building_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hero" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "name" TEXT NOT NULL,
    "stars" INTEGER NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "experience" INTEGER NOT NULL DEFAULT 0,
    "leadership" INTEGER NOT NULL,
    "strength" INTEGER NOT NULL,
    "intelligence" INTEGER NOT NULL,
    "politics" INTEGER NOT NULL,
    "maxTroops" INTEGER NOT NULL,

    CONSTRAINT "Hero_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "stars" INTEGER NOT NULL,
    "slot" "EquipmentSlot" NOT NULL,
    "leadershipBonus" INTEGER NOT NULL DEFAULT 0,
    "strengthBonus" INTEGER NOT NULL DEFAULT 0,
    "intelligenceBonus" INTEGER NOT NULL DEFAULT 0,
    "politicsBonus" INTEGER NOT NULL DEFAULT 0,
    "heroId" UUID,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Troop" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "name" TEXT NOT NULL,
    "isNpc" BOOLEAN NOT NULL DEFAULT false,
    "pveGoldReward" INTEGER NOT NULL DEFAULT 100,
    "currentTroops" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Troop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TroopHero" (
    "troopId" UUID NOT NULL,
    "heroId" UUID NOT NULL,
    "slot" "HeroSlot" NOT NULL,

    CONSTRAINT "TroopHero_pkey" PRIMARY KEY ("troopId","slot")
);

-- CreateTable
CREATE TABLE "BattleLog" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "requestKey" UUID NOT NULL,
    "attackerId" UUID NOT NULL,
    "defenderId" UUID NOT NULL,
    "winner" "BattleWinner" NOT NULL,
    "turns" INTEGER NOT NULL,
    "logs" TEXT[],
    "attackerRemaining" INTEGER NOT NULL,
    "defenderRemaining" INTEGER NOT NULL,
    "goldReward" INTEGER NOT NULL,
    "experienceReward" INTEGER NOT NULL,
    "result" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BattleLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Castle_userId_key" ON "Castle"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Building_castleId_type_key" ON "Building"("castleId", "type");

-- CreateIndex
CREATE INDEX "Hero_userId_idx" ON "Hero"("userId");

-- CreateIndex
CREATE INDEX "Item_userId_idx" ON "Item"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Item_heroId_slot_key" ON "Item"("heroId", "slot");

-- CreateIndex
CREATE INDEX "Troop_userId_idx" ON "Troop"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TroopHero_heroId_key" ON "TroopHero"("heroId");

-- CreateIndex
CREATE INDEX "BattleLog_attackerId_createdAt_idx" ON "BattleLog"("attackerId", "createdAt");

-- CreateIndex
CREATE INDEX "BattleLog_defenderId_createdAt_idx" ON "BattleLog"("defenderId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BattleLog_userId_requestKey_key" ON "BattleLog"("userId", "requestKey");

-- AddForeignKey
ALTER TABLE "Castle" ADD CONSTRAINT "Castle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Building" ADD CONSTRAINT "Building_castleId_fkey" FOREIGN KEY ("castleId") REFERENCES "Castle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hero" ADD CONSTRAINT "Hero_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_heroId_fkey" FOREIGN KEY ("heroId") REFERENCES "Hero"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Troop" ADD CONSTRAINT "Troop_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TroopHero" ADD CONSTRAINT "TroopHero_troopId_fkey" FOREIGN KEY ("troopId") REFERENCES "Troop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TroopHero" ADD CONSTRAINT "TroopHero_heroId_fkey" FOREIGN KEY ("heroId") REFERENCES "Hero"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BattleLog" ADD CONSTRAINT "BattleLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BattleLog" ADD CONSTRAINT "BattleLog_attackerId_fkey" FOREIGN KEY ("attackerId") REFERENCES "Troop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BattleLog" ADD CONSTRAINT "BattleLog_defenderId_fkey" FOREIGN KEY ("defenderId") REFERENCES "Troop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Execute together with the generated schema in ONE transaction.
ALTER TABLE "Castle" ADD CONSTRAINT castle_resources CHECK (gold >= 0 AND food >= 0 AND reserves >= 0);
ALTER TABLE "Building" ADD CONSTRAINT building_level CHECK (level BETWEEN 1 AND 100);
ALTER TABLE "Hero" ADD CONSTRAINT hero_values CHECK (
  stars BETWEEN 1 AND 5 AND level BETWEEN 1 AND 100 AND experience >= 0
  AND leadership BETWEEN 0 AND 10000 AND strength BETWEEN 0 AND 10000
  AND intelligence BETWEEN 0 AND 10000 AND politics BETWEEN 0 AND 10000
  AND "maxTroops" BETWEEN 0 AND 1000000
);
ALTER TABLE "Item" ADD CONSTRAINT item_values CHECK (
  stars BETWEEN 1 AND 5 AND "leadershipBonus" BETWEEN 0 AND 1000
  AND "strengthBonus" BETWEEN 0 AND 1000 AND "intelligenceBonus" BETWEEN 0 AND 1000
  AND "politicsBonus" BETWEEN 0 AND 1000
);
ALTER TABLE "Troop" ADD CONSTRAINT troop_values CHECK (
  "currentTroops" BETWEEN 0 AND 1000000 AND "pveGoldReward" BETWEEN 0 AND 100000
  AND (("isNpc" AND "userId" IS NULL) OR (NOT "isNpc" AND "userId" IS NOT NULL))
);
ALTER TABLE "BattleLog" ADD CONSTRAINT battle_values CHECK (
  turns BETWEEN 0 AND 10 AND "attackerId" <> "defenderId"
  AND "attackerRemaining" >= 0 AND "defenderRemaining" >= 0
  AND "goldReward" >= 0 AND "experienceReward" >= 0
);

-- No client policies: all reads/writes go through the authenticated server.
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Castle" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Building" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Hero" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Item" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Troop" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TroopHero" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BattleLog" ENABLE ROW LEVEL SECURITY;

COMMIT;
