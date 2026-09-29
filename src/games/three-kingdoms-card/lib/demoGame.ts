import { z } from "zod";
import { simulateBattle, type BattleTroop, type BattleResult } from "./battleEngine";
import { gainExperience } from "./progression";
import { HERO_CATALOG, HERO_ROSTER_LIMIT, baseStats, catalogHero, type HeroKey } from "./heroCatalog";

export const BUILDINGS = {
  ADMINISTRATION: { name: "정방", resource: "gold", label: "금", perMinute: 10, description: "조세를 거두고 영지의 살림을 맡습니다." },
  FARM: { name: "농장", resource: "food", label: "식량", perMinute: 20, description: "백성을 먹이고 원정을 준비합니다." },
  BARRACKS: { name: "병영", resource: "reserves", label: "예비군", perMinute: 5, description: "훈련된 병사를 부대에 보충합니다." },
} as const;
export type BuildingType = keyof typeof BUILDINGS;
const count = z.number().finite().nonnegative();
const stat = z.number().int().min(0).max(10000);
const heroSchema = z.object({
  id: z.string(), userId: z.string(), name: z.string(), templateKey: z.string(), stars: z.number().int().min(1).max(5),
  level: z.number().int().min(1).max(100), experience: count.int(), leadership: stat,
  strength: stat, intelligence: stat, politics: stat, maxTroops: count.int(),
});
export type DemoHero = z.infer<typeof heroSchema>;
const battleSchema = z.object({
  winner: z.enum(["ATTACKER", "DEFENDER", "DRAW"]), turns: z.number().int().min(0).max(10),
  logs: z.array(z.string()), attackerRemaining: count, defenderRemaining: count,
  experienceReward: count, goldReward: count, id: z.string(), targetName: z.string(), createdAt: z.string(),
});
export const demoSchema = z.object({
  version: z.literal(2),
  lordName: z.string().max(12), castleName: z.string().max(12), recruitmentTickets: count.int().max(999),
  castle: z.object({ id: z.string(), userId: z.string(), gold: count.max(1e9), food: count.max(1e9), reserves: count.max(1e9), lastUpdatedAt: z.iso.datetime() }),
  buildings: z.array(z.object({ type: z.enum(["ADMINISTRATION", "FARM", "BARRACKS"]), level: z.number().int().min(1).max(10) })).length(3),
  heroes: z.array(heroSchema).max(HERO_ROSTER_LIMIT),
  troop: z.object({ id: z.string(), name: z.string(), currentTroops: count.int().max(1e6), heroIds: z.tuple([z.string().nullable(), z.string().nullable(), z.string().nullable()]) }),
  targets: z.array(z.object({ id: z.string(), name: z.string(), currentTroops: count.int(), goldReward: count.int(), commander: heroSchema })).length(3),
  battles: z.array(battleSchema).max(10),
}).refine(s => new Set(s.buildings.map(b => b.type)).size === 3
  && new Set(s.heroes.map(h => h.id)).size === s.heroes.length
  && s.troop.heroIds.filter(Boolean).every(id => s.heroes.some(h => h.id === id))
  && new Set(s.troop.heroIds.filter(Boolean)).size === s.troop.heroIds.filter(Boolean).length
  && s.heroes.every(h => HERO_CATALOG.some(template => template.key === h.templateKey))
  && (s.troop.heroIds[0] !== null || (s.troop.heroIds.every(id => id === null) && s.troop.currentTroops === 0))
  && s.troop.currentTroops <= s.heroes.filter(h => s.troop.heroIds.includes(h.id)).reduce((sum, h) => sum + h.maxTroops + h.leadership * 10, 0));
export type DemoState = z.infer<typeof demoSchema>;
export type DemoBattle = z.infer<typeof battleSchema>;
export const STORAGE_KEY = "three-kingdoms-local-v2";
const uid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
function hero(n: number, name: string, stars: number, stats: number[]): DemoHero {
  return { id: uid(n), userId: uid(1), name, templateKey: "npc", stars, level: 1, experience: 0,
    leadership: stats[0], strength: stats[1], intelligence: stats[2], politics: stats[3], maxTroops: stars * 300 };
}
export function createDemo(now: number): DemoState {
  return {
    version: 2, lordName: "", castleName: "", recruitmentTickets: 3,
    castle: { id: uid(2), userId: uid(1), gold: 1200, food: 1800, reserves: 1000, lastUpdatedAt: new Date(now).toISOString() },
    buildings: [{ type: "ADMINISTRATION", level: 1 }, { type: "FARM", level: 1 }, { type: "BARRACKS", level: 1 }],
    heroes: [],
    troop: { id: uid(3), name: "제1군", currentTroops: 0, heroIds: [null, null, null] },
    targets: [
      { id: uid(20), name: "황건적 잔당", currentTroops: 300, goldReward: 150, commander: hero(21, "황건 두목", 1, [25, 30, 20, 10]) },
      { id: uid(22), name: "산적의 은신처", currentTroops: 1100, goldReward: 300, commander: hero(23, "산적 두령", 2, [58, 65, 40, 20]) },
      { id: uid(24), name: "흑산군 주둔지", currentTroops: 2200, goldReward: 600, commander: hero(25, "장연", 3, [78, 82, 65, 40]) },
    ], battles: [],
  };
}
export function production(state: DemoState) {
  const bonus = 1 + Math.max(0, ...state.heroes.map(h => h.politics)) / 1000;
  const result = { gold: 0, food: 0, reserves: 0 };
  state.buildings.forEach(b => { const rule = BUILDINGS[b.type]; result[rule.resource] = b.level * rule.perMinute * bonus; });
  return result;
}
export function syncDemo(state: DemoState, now: number): DemoState {
  if (!state.lordName) return state;
  const elapsed = Math.max(0, Math.floor((now - Date.parse(state.castle.lastUpdatedAt)) / 1000));
  if (!elapsed) return state;
  const rate = production(state);
  const castle = { ...state.castle, lastUpdatedAt: new Date(Date.parse(state.castle.lastUpdatedAt) + elapsed * 1000).toISOString() };
  for (const key of ["gold", "food", "reserves"] as const) castle[key] = Math.min(1e9, castle[key] + rate[key] * elapsed / 60);
  return { ...state, castle };
}
export function selectedHeroes(state: DemoState) {
  return state.troop.heroIds.flatMap(id => { const h = state.heroes.find(h => h.id === id); return h ? [h] : []; });
}
export function troopCapacity(state: DemoState) {
  return selectedHeroes(state).reduce((sum, h) => sum + h.maxTroops + h.leadership * 10, 0);
}
export function playerTroop(state: DemoState): BattleTroop {
  const commander = state.heroes.find(h => h.id === state.troop.heroIds[0]);
  if (!commander) throw new Error("먼저 장수를 모집하고 주장으로 편성하세요.");
  return { id: state.troop.id, name: state.troop.name, currentTroops: state.troop.currentTroops, commander,
    deputies: selectedHeroes(state).filter(h => h.id !== commander.id) };
}
export function createCollectedHero(key: HeroKey, stars: number, id: string): DemoHero {
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) throw new Error("장수 등급은 1~5성입니다.");
  return { id, userId: uid(1), templateKey: key, name: catalogHero(key).name, stars, level: 1, experience: 0, ...baseStats(key, stars) };
}
export function recruitmentCost(state: DemoState, amount: number) { return Math.max(0, amount - state.recruitmentTickets) * 300; }
export function upgradeCost(level: number) { return { gold: level * 200, food: level * 100 }; }
export type DemoAction =
  | { type: "start"; lordName: string; castleName: string }
  | { type: "upgrade"; building: BuildingType }
  | { type: "reinforce"; count: number }
  | { type: "assign"; slot: number; heroId: string | null }
  | { type: "draw"; amount?: number }
  | { type: "battle"; targetId: string };
export function actDemo(original: DemoState, action: DemoAction, now: number, random: () => number, id: string): { state: DemoState; message: string } {
  const state = structuredClone(syncDemo(original, now));
  const pay = (gold: number, food = 0) => {
    if (state.castle.gold < gold || state.castle.food < food) throw new Error("자원이 부족합니다. 생산을 기다리거나 다른 행동을 선택하세요.");
    state.castle.gold -= gold; state.castle.food -= food;
  };
  let message = "";
  switch (action.type) {
    case "start": {
      if (state.lordName) throw new Error("이미 출사한 군주입니다.");
      const lordName = action.lordName.trim(); const castleName = action.castleName.trim();
      if (!lordName || lordName.length > 12 || !castleName || castleName.length > 12) throw new Error("군주와 영지 이름을 각각 1~12자로 입력하세요.");
      state.lordName = lordName; state.castleName = castleName; state.castle.lastUpdatedAt = new Date(now).toISOString();
      message = `${lordName} 군주님, 초빙장으로 첫 인연을 만나세요.`; break;
    }
    case "upgrade": {
      const building = state.buildings.find(b => b.type === action.building)!;
      if (building.level >= 10) throw new Error("체험판의 건물은 10레벨까지 강화할 수 있습니다.");
      const cost = upgradeCost(building.level); pay(cost.gold, cost.food); building.level++;
      message = `${BUILDINGS[building.type].name}이 ${building.level}레벨로 올랐습니다.`; break;
    }
    case "reinforce": {
      if (!state.troop.heroIds[0]) throw new Error("주장을 편성한 뒤 병력을 보충하세요.");
      if (!Number.isSafeInteger(action.count) || action.count <= 0) throw new Error("보충할 병력을 1명 이상 입력하세요.");
      if (action.count > Math.floor(state.castle.reserves)) throw new Error("예비군이 부족합니다.");
      if (state.troop.currentTroops + action.count > troopCapacity(state)) throw new Error("부대의 최대 통솔 병력을 초과합니다.");
      pay(0, action.count); state.castle.reserves -= action.count; state.troop.currentTroops += action.count;
      message = `${action.count}명을 보충했습니다.`; break;
    }
    case "assign": {
      if (![0, 1, 2].includes(action.slot)) throw new Error("올바른 편성 위치를 선택하세요.");
      if (action.slot > 0 && action.heroId && !state.troop.heroIds[0]) throw new Error("주장부터 편성하세요.");
      if (action.heroId && (!state.heroes.some(h => h.id === action.heroId) || state.troop.heroIds.some((id, i) => id === action.heroId && i !== action.slot)))
        throw new Error("이미 편성된 장수이거나 보유하지 않은 장수입니다.");
      state.troop.heroIds[action.slot] = action.heroId;
      if (action.slot === 0 && !action.heroId) state.troop.heroIds = [null, null, null];
      const excess = Math.max(0, state.troop.currentTroops - troopCapacity(state));
      state.troop.currentTroops -= excess; state.castle.reserves = Math.min(1e9, state.castle.reserves + excess);
      message = excess ? `편성을 변경하고 초과 병력 ${excess}명을 예비군으로 돌려보냈습니다.` : "부대 편성을 변경했습니다."; break;
    }
    case "draw": {
      const amount = action.amount ?? 1;
      if (amount !== 1 && amount !== 5) throw new Error("1회 또는 5회 모집만 가능합니다.");
      if (state.heroes.length + amount > HERO_ROSTER_LIMIT) throw new Error(`장수 명부가 가득 찼습니다. 최대 ${HERO_ROSTER_LIMIT}명까지 보유할 수 있습니다.`);
      pay(recruitmentCost(state, amount)); state.recruitmentTickets = Math.max(0, state.recruitmentTickets - amount);
      const roll = () => { const n = random(); if (!Number.isFinite(n) || n < 0 || n >= 1) throw new Error("모집 추첨을 다시 시도하세요."); return n; };
      for (let i = 0; i < amount; i++) {
        const rarity = roll();
        const stars = rarity < 0.45 ? 1 : rarity < 0.75 ? 2 : rarity < 0.92 ? 3 : rarity < 0.99 ? 4 : 5;
        const template = HERO_CATALOG[Math.floor(roll() * HERO_CATALOG.length)];
        state.heroes.push(createCollectedHero(template.key, stars, `${id}:${i}`));
      }
      message = `${amount}명의 장수가 새롭게 합류했습니다.`; break;
    }
    case "battle": {
      const target = state.targets.find(t => t.id === action.targetId);
      if (!target || target.currentTroops <= 0) throw new Error("이미 토벌했거나 없는 대상입니다.");
      if (state.troop.currentTroops <= 0) throw new Error("먼저 부대에 병력을 보충하세요.");
      const result: BattleResult = simulateBattle(playerTroop(state), { ...target, deputies: [] }, random);
      const won = result.winner === "ATTACKER";
      const goldReward = won ? Math.min(target.goldReward, Math.floor(1e9 - state.castle.gold)) : 0;
      state.castle.gold += goldReward; state.troop.currentTroops = result.attackerRemaining; target.currentTroops = result.defenderRemaining;
      if (won) {
        const heroes = selectedHeroes(state).sort((a, b) => a.id.localeCompare(b.id));
        heroes.forEach((h, index) => {
          const reward = Math.floor(result.experienceReward / heroes.length) + (index < result.experienceReward % heroes.length ? 1 : 0);
          const growth = gainExperience(h.level, h.experience, reward);
          h.level = growth.level; h.experience = growth.experience;
          h.leadership += growth.levelsGained; h.strength += growth.levelsGained; h.intelligence += growth.levelsGained;
          h.politics += growth.levelsGained; h.maxTroops += growth.levelsGained * 50;
        });
      }
      state.battles.unshift({ ...result, experienceReward: won ? result.experienceReward : 0, goldReward, id, targetName: target.name, createdAt: new Date(now).toISOString() });
      state.battles = state.battles.slice(0, 10);
      message = won ? `${target.name} 토벌 승리! 금 ${goldReward}을 얻었습니다.` : result.winner === "DRAW" ? "무승부입니다. 병력을 보충하고 다시 도전하세요." : "패배했습니다. 장수 편성과 병력을 점검하세요.";
      break;
    }
  }
  return { state, message };
}
