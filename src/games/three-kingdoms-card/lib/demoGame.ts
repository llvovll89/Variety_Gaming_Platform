import { z } from "zod";
import { simulateBattle, type BattleTroop, type BattleResult } from "./battleEngine";
import { gainExperience } from "./progression";
import { aggregateSkills } from "./battleEngine";
import { heroSkillEffects } from "./heroSkills";
import { troopSynergy } from "./synergy";
import { aptitude, FORMATION_KEYS, FORMATIONS, UNIT_KEYS, type Formation, type Unit } from "./tactics";
import { HERO_CATALOG, HERO_ROSTER_LIMIT, baseStats, catalogHero, type HeroKey } from "./heroCatalog";

export const BUILDINGS = {
  ADMINISTRATION: { name: "정방", resource: "gold", label: "금", perMinute: 10, description: "조세를 거두고 영지의 살림을 맡습니다." },
  FARM: { name: "농장", resource: "food", label: "식량", perMinute: 20, description: "백성을 먹이고 원정을 준비합니다." },
  BARRACKS: { name: "병영", resource: "reserves", label: "예비군", perMinute: 8, description: "훈련된 병사를 부대에 보충합니다." },
} as const;
export type BuildingType = keyof typeof BUILDINGS;
export const MAX_BUILDING_LEVEL = 30;
/** 건물이 이 레벨에 도달하는 순간 한 번 지급되는 초빙장. */
export const BUILDING_MILESTONES: Record<number, number> = { 10: 2, 20: 3, 30: 5 };
export const DISMISS_REFUND = [30, 60, 150, 400, 1000] as const;
export const promoteCost = (stars: number) => stars * 500;
const count = z.number().finite().nonnegative();
const stat = z.number().int().min(0).max(10000);
const heroObject = z.object({
  id: z.string(), userId: z.string(), name: z.string(), templateKey: z.string(), stars: z.number().int().min(1).max(5),
  level: z.number().int().min(1).max(100), experience: count.int(), leadership: stat,
  strength: stat, intelligence: stat, politics: stat, charm: stat, maxTroops: count.int(),
  statPoints: count.int().max(100000), spent: z.tuple([stat, stat, stat, stat, stat]),
});
// 매력 도입 이전 저장본은 카탈로그 기준 값으로 채웁니다.
const heroSchema = z.preprocess(raw => {
  if (raw && typeof raw === "object") {
    const h = raw as { templateKey?: string; stars?: number; charm?: number; statPoints?: number; spent?: number[] };
    const known = HERO_CATALOG.some(t => t.key === h.templateKey) && Number.isInteger(h.stars) && h.stars! >= 1 && h.stars! <= 5;
    return { ...raw, charm: h.charm ?? (known ? baseStats(h.templateKey!, h.stars!).charm : 0), statPoints: h.statPoints ?? 0, spent: h.spent ?? [0, 0, 0, 0, 0] };
  }
  return raw;
}, heroObject);
export type DemoHero = z.infer<typeof heroSchema>;
const battleSchema = z.object({
  winner: z.enum(["ATTACKER", "DEFENDER", "DRAW"]), turns: z.number().int().min(0).max(10),
  logs: z.array(z.string()), attackerRemaining: count, defenderRemaining: count,
  experienceReward: count, goldReward: count, id: z.string(), targetName: z.string(), createdAt: z.string(),
});
const troopSchema = z.object({ id: z.string(), name: z.string(), currentTroops: count.int().max(1e6), heroIds: z.tuple([z.string().nullable(), z.string().nullable(), z.string().nullable()]),
  unit: z.enum(UNIT_KEYS).default("spear"), formation: z.enum(FORMATION_KEYS).default("basic") });
type TroopState = z.infer<typeof troopSchema>;
const dailySchema = z.object({ date: z.string().max(10), progress: z.tuple([count.int(), count.int(), count.int()]), claimed: z.tuple([z.boolean(), z.boolean(), z.boolean()]), sweeps: count.int().max(99).default(0) });
const emptyTroop = (n: number, name: string): TroopState => ({ id: uid(n), name, currentTroops: 0, heroIds: [null, null, null], unit: "spear", formation: "basic" });
const freshDaily = (date: string) => ({ date, progress: [0, 0, 0] as [number, number, number], claimed: [false, false, false] as [boolean, boolean, boolean], sweeps: 0 });
// 부대가 하나뿐이던 저장본(troop)과 초빙장 시계·일일 과제가 없던 저장본을 현재 형식으로 옮깁니다.
function migrateSave(raw: unknown) {
  if (!raw || typeof raw !== "object") return raw;
  const s = { ...raw } as Record<string, unknown> & { troop?: TroopState; troops?: TroopState[]; castle?: { lastUpdatedAt?: string } };
  if (!s.troops && s.troop) { s.troops = [s.troop, emptyTroop(4, "제2군"), emptyTroop(5, "제3군")]; delete s.troop; }
  s.ticketClock ??= s.castle?.lastUpdatedAt;
  s.daily ??= freshDaily("");
  const heroes = Array.isArray(s.heroes) ? s.heroes as { templateKey?: unknown }[] : [];
  s.collected ??= [...new Set(heroes.map(h => h.templateKey).filter((k): k is string => typeof k === "string"))];
  return s;
}
export const demoSchema = z.preprocess(migrateSave, z.object({
  version: z.literal(2),
  lordName: z.string().max(12), castleName: z.string().max(12), recruitmentTickets: count.int().max(999),
  castle: z.object({ id: z.string(), userId: z.string(), gold: count.max(1e9), food: count.max(1e9), reserves: count.max(1e9), lastUpdatedAt: z.iso.datetime() }),
  buildings: z.array(z.object({ type: z.enum(["ADMINISTRATION", "FARM", "BARRACKS"]), level: z.number().int().min(1).max(MAX_BUILDING_LEVEL) })).length(3),
  stage: count.int().min(1).max(10000).default(1),
  heroes: z.array(heroSchema).max(HERO_ROSTER_LIMIT),
  troops: z.array(troopSchema).length(3), activeTroop: z.number().int().min(0).max(2).default(0),
  ticketClock: z.iso.datetime(), daily: dailySchema, pity: count.int().max(1000).default(0),
  collected: z.array(z.string()).max(1000).default([]), collectionClaimed: count.int().max(100).default(0),
  targets: z.array(z.object({ id: z.string(), name: z.string(), currentTroops: count.int(), goldReward: count.int(), commander: heroSchema, deputies: z.array(heroSchema).max(2).default([]), unit: z.enum(UNIT_KEYS).default("spear") })).length(3),
  battles: z.array(battleSchema).max(10),
}).refine(s => new Set(s.buildings.map(b => b.type)).size === 3
  && new Set(s.heroes.map(h => h.id)).size === s.heroes.length
  && s.troops.flatMap(t => t.heroIds).filter(Boolean).every(id => s.heroes.some(h => h.id === id))
  && new Set(s.troops.flatMap(t => t.heroIds).filter(Boolean)).size === s.troops.flatMap(t => t.heroIds).filter(Boolean).length
  && s.heroes.every(h => HERO_CATALOG.some(template => template.key === h.templateKey))
  && s.troops.every(t => (t.heroIds[0] !== null || (t.heroIds.every(id => id === null) && t.currentTroops === 0))
    && t.currentTroops <= s.heroes.filter(h => t.heroIds.includes(h.id)).reduce((sum, h) => sum + h.maxTroops + h.leadership * 10, 0))));
export type DemoState = z.infer<typeof demoSchema>;
export type DemoBattle = z.infer<typeof battleSchema>;
/** 자리를 비운 동안 자원은 최대 12시간분까지만 쌓입니다. */
export const OFFLINE_CAP_SECONDS = 12 * 3600;
export const SWEEP_LIMIT = 3;
/** 도감(만난 장수 수) 달성 보상. 순서대로 한 번씩 받습니다. */
export const COLLECTION_REWARDS = [
  { count: 10, tickets: 2, gold: 1000 }, { count: 20, tickets: 3, gold: 2000 }, { count: 30, tickets: 5, gold: 3000 },
  { count: 40, tickets: 5, gold: 5000 }, { count: 50, tickets: 8, gold: 8000 }, { count: 64, tickets: 15, gold: 15000 },
] as const;
/** 재접속 시 보여줄 방치 보상 요약. */
export function offlineSummary(before: DemoState, after: DemoState) {
  return {
    seconds: Math.max(0, Math.floor((Date.parse(after.castle.lastUpdatedAt) - Date.parse(before.castle.lastUpdatedAt)) / 1000)),
    gold: Math.floor(after.castle.gold - before.castle.gold), food: Math.floor(after.castle.food - before.castle.food),
    reserves: Math.floor(after.castle.reserves - before.castle.reserves), tickets: after.recruitmentTickets - before.recruitmentTickets,
  };
}
/** 소탕: 지난 단계 보상의 일부를 병력 손실 없이 받습니다. */
export function sweepReward(state: DemoState) {
  const previous = [0, 1, 2].map(slot => generateTarget(state.stage - 1, slot));
  const barracks = state.buildings.find(b => b.type === "BARRACKS")!.level;
  return { gold: Math.floor(previous.reduce((sum, t) => sum + t.goldReward, 0) * 0.5), experience: Math.floor((state.stage - 1) * 30 * (1 + barracks * 0.02)) };
}
/** 이 횟수 안에 5성이 반드시 나옵니다. */
export const PITY_LIMIT = 80;
export const TICKET_INTERVAL = 30 * 60 * 1000;
export const TICKET_CAP = 10;
export const DAILY_QUESTS = [
  { name: "토벌 승리", goal: 3, reward: "초빙장 1장" },
  { name: "장수 모집", goal: 5, reward: "금 800" },
  { name: "건물 강화", goal: 2, reward: "식량 1000" },
] as const;
/** 기기 현지 날짜 기준 YYYY-MM-DD. */
export function dayKey(now: number) {
  const d = new Date(now);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
/** 제2군은 정방 10레벨, 제3군은 20레벨에 열립니다. */
export function troopSlots(state: DemoState) {
  const level = state.buildings.find(b => b.type === "ADMINISTRATION")!.level;
  return 1 + (level >= 10 ? 1 : 0) + (level >= 20 ? 1 : 0);
}
export const activeTroop = (state: DemoState) => state.troops[state.activeTroop];
export const assignedIds = (state: DemoState) => state.troops.flatMap(t => t.heroIds).filter((id): id is string => id !== null);
export function nextTicketIn(state: DemoState, now: number) {
  return state.recruitmentTickets >= TICKET_CAP ? null : Math.max(0, Date.parse(state.ticketClock) + TICKET_INTERVAL - now);
}
export const STORAGE_KEY = "three-kingdoms-local-v2";
const uid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
function hero(n: number, name: string, stars: number, stats: number[]): DemoHero {
  return { id: uid(n), userId: uid(1), name, templateKey: "npc", stars, level: 1, experience: 0,
    leadership: stats[0], strength: stats[1], intelligence: stats[2], politics: stats[3], charm: stats[4] ?? 0, maxTroops: stars * 300, statPoints: 0, spent: [0, 0, 0, 0, 0] };
}
export function createDemo(now: number): DemoState {
  return {
    version: 2, lordName: "", castleName: "", recruitmentTickets: 3,
    castle: { id: uid(2), userId: uid(1), gold: 1200, food: 1800, reserves: 1500, lastUpdatedAt: new Date(now).toISOString() },
    buildings: [{ type: "ADMINISTRATION", level: 1 }, { type: "FARM", level: 1 }, { type: "BARRACKS", level: 1 }],
    heroes: [],
    troops: [emptyTroop(3, "제1군"), emptyTroop(4, "제2군"), emptyTroop(5, "제3군")], activeTroop: 0,
    ticketClock: new Date(now).toISOString(), daily: freshDaily(dayKey(now)), pity: 0, collected: [], collectionClaimed: 0,
    targets: [
      { id: uid(20), name: "황건적 잔당", currentTroops: 300, goldReward: 150, commander: hero(21, "황건 두목", 1, [25, 30, 20, 10, 15]), deputies: [], unit: "spear" },
      { id: uid(22), name: "산적의 은신처", currentTroops: 700, goldReward: 300, commander: hero(23, "산적 두령", 2, [58, 65, 40, 20, 30]), deputies: [], unit: "cavalry" },
      { id: uid(24), name: "흑산군 주둔지", currentTroops: 1300, goldReward: 600, commander: hero(25, "장연", 3, [78, 82, 65, 40, 45]), deputies: [], unit: "archer" },
    ], battles: [], stage: 1,
  };
}
/** 단계별 적 병력 배율. 지수 증가는 후반에 벽이 되어 완만한 거듭제곱 곡선을 씁니다(밸런스 시뮬레이션으로 조정). */
export const enemyScale = (stage: number) => (1 + 0.3 * (stage - 1)) ** 1.7;
const TARGET_NAMES = ["선봉대", "주둔군", "본진"] as const;
/** 2단계부터의 토벌 대상. 같은 단계·슬롯이면 항상 같은 적이 나옵니다. */
export function generateTarget(stage: number, slot: number): DemoState["targets"][number] {
  const template = HERO_CATALOG[(stage * 3 + slot) % HERO_CATALOG.length];
  const stars = Math.min(5, 1 + Math.floor(stage / 2));
  const bonus = Math.floor((stage - 1) * 3);
  const base = baseStats(template.key, stars);
  const troops = Math.round(300 * enemyScale(stage) * (1 + slot * 0.6) / 10) * 10;
  const commander: DemoHero = { id: `stage-${stage}-${slot}-commander`, userId: uid(1), name: template.name, templateKey: template.key, stars,
    level: Math.min(100, stage), experience: 0, leadership: base.leadership + bonus, strength: base.strength + bonus, intelligence: base.intelligence + bonus,
    politics: base.politics, charm: base.charm + bonus, maxTroops: base.maxTroops, statPoints: 0, spent: [0, 0, 0, 0, 0] };
  const deputyCount = stage >= 6 ? 2 : stage >= 3 ? 1 : 0;
  const deputies = Array.from({ length: deputyCount }, (_, k) => {
    const t = HERO_CATALOG[(stage * 7 + slot * 3 + k * 5 + 11) % HERO_CATALOG.length]; const s = Math.max(1, stars - 1); const b = baseStats(t.key, s);
    return { ...commander, id: `stage-${stage}-${slot}-deputy-${k}`, name: t.name, templateKey: t.key, stars: s,
      leadership: b.leadership + bonus, strength: b.strength + bonus, intelligence: b.intelligence + bonus, politics: b.politics, charm: b.charm + bonus, maxTroops: b.maxTroops };
  }).filter(d => d.templateKey !== template.key);
  return { id: `stage-${stage}-${slot}`, name: `${template.name}의 ${TARGET_NAMES[slot]}`, currentTroops: Math.min(1e6, troops), goldReward: Math.floor(troops * 0.5), commander, deputies, unit: UNIT_KEYS[(stage + slot) % UNIT_KEYS.length] };
}
/** 모든 대상을 토벌했다면 다음 단계로 넘어갑니다(입력 불변). */
export function advanceStage(state: DemoState): DemoState {
  if (state.targets.some(t => t.currentTroops > 0)) return state;
  const stage = state.stage + 1;
  return { ...state, stage, targets: [0, 1, 2].map(slot => generateTarget(stage, slot)) };
}
/** 영지 효과 계산용: 제1군 기준, 주장 100% + 부장 30% (주장이 없으면 빈 부대). */
function troopForSkills(state: DemoState) {
  const [lead, ...rest] = selectedHeroes(state, 0).map(h => ({ ...h, skills: heroSkillEffects(h.templateKey, h.stars) }));
  return { id: "", name: "", currentTroops: 0, commander: lead ?? { name: "", leadership: 0, strength: 0, intelligence: 0 }, deputies: rest };
}
export function production(state: DemoState) {
  const skills = aggregateSkills(troopForSkills(state));
  const bonus = (1 + Math.max(0, ...state.heroes.map(h => h.politics)) / 1000) * (1 + skills.fiscal);
  const result = { gold: 0, food: 0, reserves: 0 };
  state.buildings.forEach(b => { const rule = BUILDINGS[b.type]; result[rule.resource] = b.level * rule.perMinute * bonus; });
  return result;
}
export function syncDemo(original: DemoState, now: number): DemoState {
  if (!original.lordName) return original;
  let state = advanceStage(original);
  if (state.daily.date !== dayKey(now)) state = { ...state, daily: freshDaily(dayKey(now)) };
  const clock = Date.parse(state.ticketClock);
  if (state.recruitmentTickets >= TICKET_CAP) { if (clock < now) state = { ...state, ticketClock: new Date(now).toISOString() }; }
  else if (now - clock >= TICKET_INTERVAL) {
    const gained = Math.floor((now - clock) / TICKET_INTERVAL); const tickets = Math.min(TICKET_CAP, state.recruitmentTickets + gained);
    state = { ...state, recruitmentTickets: tickets, ticketClock: new Date(tickets >= TICKET_CAP ? now : clock + gained * TICKET_INTERVAL).toISOString() };
  }
  const elapsed = Math.max(0, Math.floor((now - Date.parse(state.castle.lastUpdatedAt)) / 1000));
  if (!elapsed) return state;
  const rate = production(state); const productive = Math.min(elapsed, OFFLINE_CAP_SECONDS);
  const castle = { ...state.castle, lastUpdatedAt: new Date(Date.parse(state.castle.lastUpdatedAt) + elapsed * 1000).toISOString() };
  for (const key of ["gold", "food", "reserves"] as const) castle[key] = Math.min(1e9, castle[key] + rate[key] * productive / 60);
  return { ...state, castle };
}
export function selectedHeroes(state: DemoState, index = state.activeTroop) {
  return state.troops[index].heroIds.flatMap(id => { const h = state.heroes.find(h => h.id === id); return h ? [h] : []; });
}
export function troopCapacity(state: DemoState, index = state.activeTroop) {
  return selectedHeroes(state, index).reduce((sum, h) => sum + h.maxTroops + h.leadership * 10, 0);
}
/** 특수능력을 붙이고, 세력 시너지는 주장 능력에 더합니다. */
function withSynergy(troop: { id: string; name: string; currentTroops: number; commander: DemoHero; deputies: DemoHero[]; unit?: Unit; formation?: Formation }): BattleTroop {
  const withSkills = (h: DemoHero) => ({ ...h, skills: heroSkillEffects(h.templateKey, h.stars) });
  const commander = withSkills(troop.commander);
  const synergy = troopSynergy([troop.commander, ...troop.deputies].map(h => h.templateKey));
  const fit = troop.unit ? aptitude(HERO_CATALOG.find(t => t.key === troop.commander.templateKey)?.role, troop.unit) : null;
  commander.skills = [...commander.skills, ...(synergy ? [synergy.effect] : []), ...(fit ? [fit] : []), ...FORMATIONS[troop.formation ?? "basic"].effects];
  return { id: troop.id, name: troop.name, currentTroops: troop.currentTroops, commander, deputies: troop.deputies.map(withSkills), unit: troop.unit };
}
export function playerTroop(state: DemoState, index = state.activeTroop): BattleTroop {
  const troop = state.troops[index];
  const commander = state.heroes.find(h => h.id === troop.heroIds[0]);
  if (!commander) throw new Error("먼저 장수를 모집하고 주장으로 편성하세요.");
  return withSynergy({ id: troop.id, name: troop.name, currentTroops: troop.currentTroops, commander, unit: troop.unit, formation: troop.formation,
    deputies: selectedHeroes(state, index).filter(h => h.id !== commander.id) });
}
export function createCollectedHero(key: HeroKey, stars: number, id: string): DemoHero {
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) throw new Error("장수 등급은 1~5성입니다.");
  return { id, userId: uid(1), templateKey: key, name: catalogHero(key).name, stars, level: 1, experience: 0, ...baseStats(key, stars), statPoints: 0, spent: [0, 0, 0, 0, 0] };
}
export function recruitmentCost(state: DemoState, amount: number) { return Math.max(0, amount - state.recruitmentTickets) * 300; }
export function upgradeCost(level: number) {
  const scale = level >= 20 ? 4 : level >= 10 ? 2 : 1;
  return { gold: level * 200 * scale, food: level * 100 * scale };
}
export const STAT_KEYS = ["leadership", "strength", "intelligence", "politics", "charm"] as const;
export type StatKey = typeof STAT_KEYS[number];
export const STAT_POINTS_PER_LEVEL = 3;
export const STAT_CAP = 200;
export const resetStatsCost = (level: number) => level * 50;
export type DemoAction =
  | { type: "start"; lordName: string; castleName: string }
  | { type: "upgrade"; building: BuildingType }
  | { type: "reinforce"; count: number }
  | { type: "assign"; slot: number; heroId: string | null }
  | { type: "draw"; amount?: number }
  | { type: "allocate"; heroId: string; stat: StatKey; amount: number }
  | { type: "resetStats"; heroId: string }
  | { type: "promote"; heroId: string; materialId: string }
  | { type: "dismiss"; heroId: string }
  | { type: "selectTroop"; index: number }
  | { type: "claimDaily"; index: number }
  | { type: "battle"; targetId: string }
  | { type: "battleAll"; targetId: string }
  | { type: "sweep" }
  | { type: "setUnit"; unit: Unit }
  | { type: "setFormation"; formation: Formation }
  | { type: "dismissMany"; heroIds: string[] }
  | { type: "claimCollection" };
export function actDemo(original: DemoState, action: DemoAction, now: number, random: () => number, id: string): { state: DemoState; message: string } {
  const state = structuredClone(syncDemo(original, now));
  const pay = (gold: number, food = 0) => {
    if (state.castle.gold < gold || state.castle.food < food) throw new Error("자원이 부족합니다. 생산을 기다리거나 다른 행동을 선택하세요.");
    state.castle.gold -= gold; state.castle.food -= food;
  };
  const troop = state.troops[state.activeTroop];
  const barracks = state.buildings.find(b => b.type === "BARRACKS")!.level;
  const grantExperience = (heroes: DemoHero[], experience: number) => {
    const sorted = [...heroes].sort((a, b) => a.id.localeCompare(b.id));
    sorted.forEach((h, index) => {
      const reward = Math.floor(experience / sorted.length) + (index < experience % sorted.length ? 1 : 0);
      const tutor = heroSkillEffects(h.templateKey, h.stars).filter(e => e.kind === "tutor").reduce((sum, e) => sum + e.value, 0);
      const growth = gainExperience(h.level, h.experience, Math.floor(reward * (1 + tutor)));
      h.level = growth.level; h.experience = growth.experience;
      h.statPoints += growth.levelsGained * STAT_POINTS_PER_LEVEL; h.maxTroops += growth.levelsGained * 50;
    });
  };
  /** index 부대로 target을 공격합니다. 전투 기록·보상·단계 진행까지 처리합니다. */
  const fight = (index: number, target: DemoState["targets"][number], battleId: string) => {
    const attacker = state.troops[index];
    const result: BattleResult = simulateBattle(playerTroop(state, index), withSynergy(target), random);
    const won = result.winner === "ATTACKER";
    const plunder = 1 + aggregateSkills(playerTroop(state, index)).plunder;
    const goldReward = won ? Math.min(Math.floor(target.goldReward * plunder), Math.floor(1e9 - state.castle.gold)) : 0;
    state.castle.gold += goldReward; attacker.currentTroops = result.attackerRemaining; target.currentTroops = result.defenderRemaining;
    const experience = won ? Math.floor((result.experienceReward + state.stage * 40) * (1 + barracks * 0.02)) : 0;
    if (won) {
      state.recruitmentTickets = Math.min(999, state.recruitmentTickets + 1); state.daily.progress[0]++;
      grantExperience(selectedHeroes(state, index), experience);
    }
    const cleared = won && state.targets.every(t => t.currentTroops <= 0);
    if (cleared) { state.recruitmentTickets = Math.min(999, state.recruitmentTickets + 2); Object.assign(state, advanceStage(state)); }
    state.battles.unshift({ ...result, experienceReward: experience, goldReward, id: battleId, targetName: `${target.name} (${attacker.name})`, createdAt: new Date(now).toISOString() });
    state.battles = state.battles.slice(0, 10);
    return { result, won, cleared, goldReward };
  };
  let message = "";
  switch (action.type) {
    case "selectTroop": {
      if (!Number.isInteger(action.index) || action.index < 0 || action.index >= troopSlots(state)) throw new Error("아직 열리지 않은 부대입니다. 정방을 강화하세요.");
      state.activeTroop = action.index; message = `${state.troops[action.index].name}을(를) 선택했습니다.`; break;
    }
    case "claimDaily": {
      const quest = DAILY_QUESTS[action.index];
      if (!quest) throw new Error("없는 과제입니다.");
      if (state.daily.claimed[action.index]) throw new Error("이미 보상을 받았습니다.");
      if (state.daily.progress[action.index] < quest.goal) throw new Error("아직 과제를 완료하지 않았습니다.");
      state.daily.claimed[action.index] = true;
      if (action.index === 0) state.recruitmentTickets = Math.min(999, state.recruitmentTickets + 1);
      if (action.index === 1) state.castle.gold = Math.min(1e9, state.castle.gold + 800);
      if (action.index === 2) state.castle.food = Math.min(1e9, state.castle.food + 1000);
      message = `일일 과제 보상: ${quest.reward}`; break;
    }
    case "start": {
      if (state.lordName) throw new Error("이미 출사한 군주입니다.");
      const lordName = action.lordName.trim(); const castleName = action.castleName.trim();
      if (!lordName || lordName.length > 12 || !castleName || castleName.length > 12) throw new Error("군주와 영지 이름을 각각 1~12자로 입력하세요.");
      state.lordName = lordName; state.castleName = castleName; state.castle.lastUpdatedAt = new Date(now).toISOString(); state.ticketClock = state.castle.lastUpdatedAt;
      message = `${lordName} 군주님, 초빙장으로 첫 인연을 만나세요.`; break;
    }
    case "allocate": {
      const h = state.heroes.find(x => x.id === action.heroId); const index = STAT_KEYS.indexOf(action.stat);
      if (!h || index < 0) throw new Error("장수 또는 능력치를 찾을 수 없습니다.");
      if (!Number.isInteger(action.amount) || action.amount < 1) throw new Error("배분할 포인트는 1 이상의 정수여야 합니다.");
      if (action.amount > h.statPoints) throw new Error("남은 포인트가 부족합니다.");
      if (h[action.stat] + action.amount > STAT_CAP) throw new Error(`능력치는 ${STAT_CAP}을 넘을 수 없습니다.`);
      h[action.stat] += action.amount; h.spent[index] += action.amount; h.statPoints -= action.amount;
      message = `${h.name}의 능력치를 강화했습니다.`; break;
    }
    case "resetStats": {
      const h = state.heroes.find(x => x.id === action.heroId);
      if (!h) throw new Error("장수를 찾을 수 없습니다.");
      const refund = h.spent.reduce((a, b) => a + b, 0);
      if (!refund) throw new Error("초기화할 배분 포인트가 없습니다.");
      pay(resetStatsCost(h.level));
      STAT_KEYS.forEach((k, i) => { h[k] -= h.spent[i]; h.spent[i] = 0; });
      h.statPoints += refund; message = `${h.name}의 능력치를 초기화했습니다. ${refund}포인트를 돌려받았습니다.`; break;
    }
    case "upgrade": {
      const building = state.buildings.find(b => b.type === action.building)!;
      if (building.level >= MAX_BUILDING_LEVEL) throw new Error(`건물은 ${MAX_BUILDING_LEVEL}레벨까지 강화할 수 있습니다.`);
      const cost = upgradeCost(building.level); pay(cost.gold, cost.food); building.level++;
      const tickets = BUILDING_MILESTONES[building.level] ?? 0;
      state.recruitmentTickets = Math.min(999, state.recruitmentTickets + tickets); state.daily.progress[2]++;
      message = `${BUILDINGS[building.type].name}이 ${building.level}레벨로 올랐습니다.${tickets ? ` 기념으로 초빙장 ${tickets}장을 받았습니다.` : ""}`; break;
    }
    case "promote": {
      const h = state.heroes.find(x => x.id === action.heroId); const material = state.heroes.find(x => x.id === action.materialId);
      if (!h || !material || h.id === material.id) throw new Error("승급할 장수와 재료 장수를 확인하세요.");
      if (h.templateKey !== material.templateKey || h.stars !== material.stars) throw new Error("같은 장수, 같은 등급의 카드만 재료로 쓸 수 있습니다.");
      if (h.stars >= 5) throw new Error("이미 최고 등급입니다.");
      if (assignedIds(state).includes(material.id)) throw new Error("편성 중인 장수는 재료로 쓸 수 없습니다.");
      pay(promoteCost(h.stars));
      const before = baseStats(h.templateKey, h.stars); const after = baseStats(h.templateKey, h.stars + 1);
      for (const key of [...STAT_KEYS, "maxTroops"] as const) h[key] = after[key] + h[key] - before[key];
      h.stars++; state.heroes = state.heroes.filter(x => x.id !== material.id);
      message = `${h.name}이(가) ${h.stars}성으로 승급했습니다!`; break;
    }
    case "dismiss": {
      const h = state.heroes.find(x => x.id === action.heroId);
      if (!h) throw new Error("장수를 찾을 수 없습니다.");
      if (assignedIds(state).includes(h.id)) throw new Error("편성 중인 장수는 방출할 수 없습니다.");
      const refund = DISMISS_REFUND[h.stars - 1];
      state.heroes = state.heroes.filter(x => x.id !== h.id); state.castle.gold = Math.min(1e9, state.castle.gold + refund);
      message = `${h.name}을(를) 방출하고 금 ${refund}을 받았습니다.`; break;
    }
    case "reinforce": {
      if (!troop.heroIds[0]) throw new Error("주장을 편성한 뒤 병력을 보충하세요.");
      if (!Number.isSafeInteger(action.count) || action.count <= 0) throw new Error("보충할 병력을 1명 이상 입력하세요.");
      if (action.count > Math.floor(state.castle.reserves)) throw new Error("예비군이 부족합니다.");
      if (troop.currentTroops + action.count > troopCapacity(state)) throw new Error("부대의 최대 통솔 병력을 초과합니다.");
      pay(0, action.count); state.castle.reserves -= action.count; troop.currentTroops += action.count;
      message = `${action.count}명을 보충했습니다.`; break;
    }
    case "assign": {
      if (![0, 1, 2].includes(action.slot)) throw new Error("올바른 편성 위치를 선택하세요.");
      if (action.slot > 0 && action.heroId && !troop.heroIds[0]) throw new Error("주장부터 편성하세요.");
      if (action.heroId && (!state.heroes.some(h => h.id === action.heroId) || state.troops.some((t, ti) => t.heroIds.some((id, i) => id === action.heroId && !(ti === state.activeTroop && i === action.slot)))))
        throw new Error("이미 편성된 장수이거나 보유하지 않은 장수입니다.");
      troop.heroIds[action.slot] = action.heroId;
      if (action.slot === 0 && !action.heroId) troop.heroIds = [null, null, null];
      const excess = Math.max(0, troop.currentTroops - troopCapacity(state));
      troop.currentTroops -= excess; state.castle.reserves = Math.min(1e9, state.castle.reserves + excess);
      message = excess ? `편성을 변경하고 초과 병력 ${excess}명을 예비군으로 돌려보냈습니다.` : "부대 편성을 변경했습니다."; break;
    }
    case "draw": {
      const amount = action.amount ?? 1;
      if (amount !== 1 && amount !== 5) throw new Error("1회 또는 5회 모집만 가능합니다.");
      if (state.heroes.length + amount > HERO_ROSTER_LIMIT) throw new Error(`장수 명부가 가득 찼습니다. 최대 ${HERO_ROSTER_LIMIT}명까지 보유할 수 있습니다.`);
      pay(recruitmentCost(state, amount)); state.recruitmentTickets = Math.max(0, state.recruitmentTickets - amount); state.daily.progress[1] += amount;
      const roll = () => { const n = random(); if (!Number.isFinite(n) || n < 0 || n >= 1) throw new Error("모집 추첨을 다시 시도하세요."); return n; };
      const drawn: number[] = [];
      for (let i = 0; i < amount; i++) {
        const rarity = roll();
        let stars = rarity < 0.45 ? 1 : rarity < 0.75 ? 2 : rarity < 0.92 ? 3 : rarity < 0.99 ? 4 : 5;
        if (state.pity + 1 >= PITY_LIMIT) stars = 5;
        else if (amount === 5 && i === 4 && stars < 3 && drawn.every(s => s < 3)) stars = 3;
        state.pity = stars === 5 ? 0 : state.pity + 1; drawn.push(stars);
        const template = HERO_CATALOG[Math.floor(roll() * HERO_CATALOG.length)];
        state.heroes.push(createCollectedHero(template.key, stars, `${id}:${i}`));
        if (!state.collected.includes(template.key)) state.collected.push(template.key);
      }
      message = `${amount}명의 장수가 새롭게 합류했습니다.`; break;
    }
    case "battleAll": {
      const target = state.targets.find(t => t.id === action.targetId);
      if (!target || target.currentTroops <= 0) throw new Error("이미 토벌했거나 없는 대상입니다.");
      const lines: string[] = [];
      for (let index = 0; index < troopSlots(state) && target.currentTroops > 0; index++) {
        const t = state.troops[index];
        if (!t.heroIds[0] || t.currentTroops <= 0) continue;
        const { result, won, cleared } = fight(index, target, `${id}:${index}`);
        lines.push(`${t.name} ${won ? "승리" : result.winner === "DRAW" ? "무승부" : "패배"}`);
        if (cleared) lines.push(`${state.stage}단계 개방`);
      }
      if (!lines.length) throw new Error("출정할 수 있는 부대가 없습니다. 주장과 병력을 확인하세요.");
      message = `전군 출정: ${lines.join(" → ")}`; break;
    }
    case "sweep": {
      if (state.stage < 2) throw new Error("1단계를 모두 토벌하면 소탕할 수 있습니다.");
      if (state.daily.sweeps >= SWEEP_LIMIT) throw new Error(`오늘의 소탕 횟수(${SWEEP_LIMIT}회)를 모두 사용했습니다.`);
      if (!troop.heroIds[0]) throw new Error("주장을 편성한 부대로 소탕할 수 있습니다.");
      const reward = sweepReward(state);
      state.castle.gold = Math.min(1e9, state.castle.gold + reward.gold); grantExperience(selectedHeroes(state), reward.experience);
      state.daily.sweeps++;
      message = `${state.stage - 1}단계 소탕 완료! 금 ${reward.gold}, 경험치 ${reward.experience}를 얻었습니다. (${state.daily.sweeps}/${SWEEP_LIMIT})`; break;
    }
    case "setUnit": {
      if (!UNIT_KEYS.includes(action.unit)) throw new Error("없는 병종입니다.");
      troop.unit = action.unit; message = "병종을 변경했습니다."; break;
    }
    case "setFormation": {
      if (!FORMATION_KEYS.includes(action.formation)) throw new Error("없는 진형입니다.");
      troop.formation = action.formation; message = `${FORMATIONS[action.formation].name}으로 진형을 바꿨습니다.`; break;
    }
    case "dismissMany": {
      const ids = new Set(action.heroIds);
      if (!ids.size) throw new Error("방출할 장수를 선택하세요.");
      const targets = state.heroes.filter(h => ids.has(h.id));
      if (targets.length !== ids.size) throw new Error("보유하지 않은 장수가 포함되어 있습니다.");
      if (targets.some(h => assignedIds(state).includes(h.id))) throw new Error("편성 중인 장수는 방출할 수 없습니다.");
      const refund = targets.reduce((sum, h) => sum + DISMISS_REFUND[h.stars - 1], 0);
      state.heroes = state.heroes.filter(h => !ids.has(h.id)); state.castle.gold = Math.min(1e9, state.castle.gold + refund);
      message = `${targets.length}명을 방출하고 금 ${refund}을 받았습니다.`; break;
    }
    case "claimCollection": {
      const reward = COLLECTION_REWARDS[state.collectionClaimed];
      if (!reward) throw new Error("모든 도감 보상을 받았습니다.");
      if (state.collected.length < reward.count) throw new Error(`장수 ${reward.count}명을 만나면 받을 수 있습니다.`);
      state.collectionClaimed++; state.recruitmentTickets = Math.min(999, state.recruitmentTickets + reward.tickets);
      state.castle.gold = Math.min(1e9, state.castle.gold + reward.gold);
      message = `도감 ${reward.count}명 달성 보상: 초빙장 ${reward.tickets}장, 금 ${reward.gold}`; break;
    }
    case "battle": {
      const target = state.targets.find(t => t.id === action.targetId);
      if (!target || target.currentTroops <= 0) throw new Error("이미 토벌했거나 없는 대상입니다.");
      if (troop.currentTroops <= 0) throw new Error("먼저 부대에 병력을 보충하세요.");
      const { result, won, cleared, goldReward } = fight(state.activeTroop, target, id);
      message = won ? `${target.name} 토벌 승리! 금 ${goldReward}, 초빙장 1장을 얻었습니다.${cleared ? ` ${state.stage}단계가 열렸습니다! (초빙장 +2)` : ""}` : result.winner === "DRAW" ? "무승부입니다. 병력을 보충하고 다시 도전하세요." : "패배했습니다. 장수 편성과 병력을 점검하세요.";
      break;
    }
  }
  return { state, message };
}
