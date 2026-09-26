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
