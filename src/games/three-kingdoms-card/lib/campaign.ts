import type { DemoState } from "./demoGame";

export const RESEARCH_KEYS = ["economy", "logistics", "training"] as const;
export type ResearchKey = typeof RESEARCH_KEYS[number];
export const RESEARCH = {
  economy: { name: "둔전 제도", description: "모든 자원 생산량", perLevel: 5, unit: "%", max: 10 },
  logistics: { name: "군수 정비", description: "부대 최대 병력", perLevel: 3, unit: "%", max: 10 },
  training: { name: "병법 연구", description: "전투에서 받는 피해 감소", perLevel: 1.5, unit: "%", max: 10 },
} as const;
export function researchCost(level: number) {
  return { gold: 600 * (level + 1) ** 2, food: 400 * (level + 1) ** 2, duration: Math.round(30 * (level + 1) ** 1.5) * 60 * 1000 };
}
export const ROUTES = {
  scout: { name: "주변 탐색", minutes: 15, gold: 120, food: 200, experience: 80, description: "짧은 정찰로 군자금과 군량을 확보합니다." },
  trade: { name: "상단 호위", minutes: 60, gold: 700, food: 350, experience: 240, description: "한 시간 동안 상단을 호위합니다." },
  frontier: { name: "변방 순찰", minutes: 240, gold: 2400, food: 2200, experience: 700, description: "장시간 영지를 비울 때 맡기는 순찰입니다." },
} as const;
export type RouteKey = keyof typeof ROUTES;
export const ROUTE_KEYS = Object.keys(ROUTES) as RouteKey[];
export function expeditionReward(state: DemoState, heroId: string, route: RouteKey) {
  const hero = state.heroes.find(h => h.id === heroId);
  if (!hero) throw new Error("파견할 장수를 선택하세요.");
  const rule = ROUTES[route];
  const bonus = 1 + (hero.politics + hero.charm) / 400;
  return { gold: Math.floor(rule.gold * bonus), food: Math.floor(rule.food * bonus), experience: rule.experience };
}
export const busyHeroIds = (state: DemoState) => state.campaign.expeditions.map(e => e.heroId);
export const MILESTONES = [
  { id: "stage2", name: "첫 전선 돌파", goal: 2, metric: "stage", gold: 600, tickets: 2 },
  { id: "stage5", name: "토벌의 선봉", goal: 5, metric: "stage", gold: 3000, tickets: 3 },
  { id: "stage10", name: "일방의 패자", goal: 10, metric: "stage", gold: 8000, tickets: 5 },
  { id: "stage20", name: "중원의 맹주", goal: 20, metric: "stage", gold: 18000, tickets: 8 },
  { id: "collection5", name: "인재의 첫걸음", goal: 5, metric: "collection", gold: 500, tickets: 1 },
  { id: "collection36", name: "군웅 집결", goal: 36, metric: "collection", gold: 6000, tickets: 5 },
  { id: "collection72", name: "천하의 인재", goal: 72, metric: "collection", gold: 20000, tickets: 10 },
  { id: "collection88", name: "천하귀심", goal: 88, metric: "collection", gold: 25000, tickets: 12 },
  { id: "research3", name: "군정의 기틀", goal: 3, metric: "research", gold: 1500, tickets: 2 },
  { id: "research15", name: "부국강병", goal: 15, metric: "research", gold: 10000, tickets: 5 },
  { id: "research30", name: "완성된 병법", goal: 30, metric: "research", gold: 30000, tickets: 10 },
  { id: "dispatch10", name: "영지의 수호자", goal: 10, metric: "dispatch", gold: 2000, tickets: 2 },
  { id: "dispatch50", name: "사통팔달", goal: 50, metric: "dispatch", gold: 10000, tickets: 5 },
] as const;
export function milestoneProgress(state: DemoState, metric: typeof MILESTONES[number]["metric"]) {
  if (metric === "stage") return state.stage;
  if (metric === "collection") return state.collected.length;
  if (metric === "dispatch") return state.campaign.completedExpeditions;
  return RESEARCH_KEYS.reduce((sum, key) => sum + state.campaign.research[key], 0);
}
export function remainingTime(finishesAt: number, now: number) {
  const minutes = Math.ceil(Math.max(0, finishesAt - now) / 60000);
  return minutes === 0 ? "완료" : minutes < 60 ? `${minutes}분 남음` : `${Math.floor(minutes / 60)}시간${minutes % 60 ? ` ${minutes % 60}분` : ""} 남음`;
}
