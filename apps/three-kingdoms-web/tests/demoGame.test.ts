import { test } from "node:test";
import assert from "node:assert/strict";
import { actDemo, createCollectedHero, createDemo, demoSchema, playerTroop, production, recruitmentCost, syncDemo, troopCapacity } from "../lib/demoGame";
import { HERO_CATALOG, HERO_ROSTER_LIMIT } from "../lib/heroCatalog";
const start = Date.parse("2026-09-26T00:00:00Z");
function started() { return actDemo(createDemo(start), { type: "start", lordName: "새군주", castleName: "새영지" }, start, () => .5, "start").state; }
function army() {
  const s = started(); s.heroes = [createCollectedHero("guanyu", 4, "a"), createCollectedHero("guanyu", 1, "b")];
  s.troop.heroIds[0] = "a"; s.troop.currentTroops = 800; return s;
}
test("새 게임: 군주 미정, 장수와 병력 0, 초빙장만 지급; 유한한 생산량", () => {
  const s = createDemo(start);
  assert.equal(s.lordName, ""); assert.equal(s.castleName, "");
  assert.deepEqual(s.heroes, []); assert.deepEqual(s.troop.heroIds, [null, null, null]);
  assert.equal(s.troop.currentTroops, 0); assert.equal(s.recruitmentTickets, 3);
  assert.equal(troopCapacity(s), 0); assert.throws(() => playerTroop(s), /주장/);
  assert.deepEqual(production(s), { gold: 10, food: 20, reserves: 5 });
  assert.deepEqual(syncDemo(s, start + 9999999), s);
  assert.equal(demoSchema.safeParse(s).success, true);
});
test("군주·영지 이름 입력 검증 및 재시작 방지", () => {
  assert.equal(started().lordName, "새군주");
  assert.throws(() => actDemo(createDemo(start), { type: "start", lordName: "  ", castleName: "성" }, start, () => 0, "id"), /이름/);
  assert.throws(() => actDemo(started(), { type: "start", lordName: "다른군주", castleName: "성" }, start, () => 0, "id"), /이미 출사/);
});
test("재접속 생산량과 초 미만 시간 보존; 같은 시간 중복 적립 없음", () => {
  const s = started(); const synced = syncDemo(s, start + 60500);
  assert.equal(synced.castle.gold, s.castle.gold + production(s).gold);
  assert.equal(synced.castle.lastUpdatedAt, new Date(start + 60000).toISOString());
  assert.deepEqual(syncDemo(synced, start + 60500), synced);
  assert.deepEqual(syncDemo(synced, start - 1000), synced);
});
test("강화 이전 시간은 이전 레벨로 생산; 원본 상태 불변", () => {
  const s = started(); const before = structuredClone(s);
  const result = actDemo(s, { type: "upgrade", building: "FARM" }, start + 60000, () => .5, "id").state;
  assert.equal(result.castle.food, s.castle.food + production(s).food - 100);
  assert.equal(result.buildings.find(b => b.type === "FARM")!.level, 2); assert.deepEqual(s, before);
});
test("주장 없는 보충·출정 거부, 자원 부족 시 부분 차감 없음", () => {
  const s = started(); const before = structuredClone(s);
  assert.throws(() => actDemo(s, { type: "reinforce", count: 300 }, start, () => 0, "id"), /주장/);
  assert.throws(() => actDemo(s, { type: "battle", targetId: s.targets[0].id }, start, () => 0, "id"), /병력/);
  const noGold = started(); noGold.recruitmentTickets = 0; noGold.castle.gold = 0;
  assert.throws(() => actDemo(noGold, { type: "draw" }, start, () => 0, "id"), /자원/);
  assert.deepEqual(s, before);
});
test("중복 인스턴스 편성 거부; 같은 장수의 다른 카드는 편성 가능", () => {
  const s = army();
  assert.throws(() => actDemo(s, { type: "assign", slot: 1, heroId: "a" }, start, () => 0, "id"), /이미 편성/);
  const both = actDemo(s, { type: "assign", slot: 1, heroId: "b" }, start, () => 0, "id").state;
  assert.deepEqual(both.troop.heroIds, ["a", "b", null]); assert.equal(demoSchema.safeParse(both).success, true);
});
test("통솔 감소 및 주장 해제 시 병력 보존", () => {
  const s = army(); s.troop.currentTroops = troopCapacity(s);
  const lowered = actDemo(s, { type: "assign", slot: 0, heroId: "b" }, start, () => 0, "id").state;
  assert.equal(lowered.troop.currentTroops, troopCapacity(lowered));
  assert.equal(lowered.castle.reserves + lowered.troop.currentTroops, s.castle.reserves + s.troop.currentTroops);
  const cleared = actDemo(s, { type: "assign", slot: 0, heroId: null }, start, () => 0, "id").state;
  assert.equal(cleared.troop.currentTroops, 0); assert.deepEqual(cleared.troop.heroIds, [null, null, null]);
  assert.equal(cleared.castle.reserves, s.castle.reserves + s.troop.currentTroops);
});
test("등급과 장수를 독립 추첨: 같은 관우가 모든 등급에서 등장", () => {
  for (const [roll, stars] of [[0, 1], [.44999, 1], [.45, 2], [.75, 3], [.92, 4], [.99, 5]]) {
    let step = 0;
    const s = actDemo(started(), { type: "draw" }, start, () => step++ % 2 === 0 ? roll : 0, "id").state;
    assert.equal(s.heroes[0].stars, stars); assert.equal(s.heroes[0].name, "관우");
    assert.equal(s.recruitmentTickets, 2); assert.equal(s.castle.gold, 1200);
  }
  for (const [index, template] of HERO_CATALOG.entries()) {
    let step = 0;
    const s = actDemo(started(), { type: "draw" }, start, () => step++ % 2 === 0 ? 0 : (index + .5) / HERO_CATALOG.length, "id").state;
    assert.equal(s.heroes[0].templateKey, template.key); assert.equal(s.heroes[0].stars, 1);
  }
});
test("동일 장수 등급 상승 시 모든 기본 스탯 및 통솔 병력 증가", () => {
  for (const template of HERO_CATALOG) for (let grade = 1; grade < 5; grade++) {
    const low = createCollectedHero(template.key, grade, "low"); const high = createCollectedHero(template.key, grade + 1, "high");
    for (const stat of ["leadership", "strength", "intelligence", "politics", "maxTroops"] as const) assert.ok(high[stat] > low[stat]);
  }
});
test("5회 모집은 초빙장 우선 소비·금 부족 시 원자적으로 거부·각 카드 ID 고유", () => {
  const s = started(); assert.equal(recruitmentCost(s, 5), 600);
  const result = actDemo(s, { type: "draw", amount: 5 }, start, () => .5, "batch").state;
  assert.equal(result.heroes.length, 5); assert.equal(new Set(result.heroes.map(h => h.id)).size, 5);
  assert.equal(result.castle.gold, 600); assert.equal(result.recruitmentTickets, 0);
  s.castle.gold = 599; const before = structuredClone(s);
  assert.throws(() => actDemo(s, { type: "draw", amount: 5 }, start, () => .5, "id"), /자원/);
  assert.deepEqual(s, before);
  assert.throws(() => actDemo(started(), { type: "draw", amount: 100 }, start, () => .5, "id"), /1회/);
});
test("가득 찬 명부와 잘못된 RNG 거부 시 자원 보존", () => {
  const s = started(); s.heroes = Array.from({ length: HERO_ROSTER_LIMIT }, (_, i) => createCollectedHero("guanyu", 1, String(i)));
  assert.throws(() => actDemo(s, { type: "draw" }, start, () => 0, "id"), /명부/);
  const bad = started(); const before = structuredClone(bad);
  assert.throws(() => actDemo(bad, { type: "draw" }, start, () => NaN, "id"), /추첨/); assert.deepEqual(bad, before);
});
test("토벌 병력·보상·경험치 반영 및 재토벌 차단", () => {
  const original = army();
  const s = actDemo(original, { type: "battle", targetId: original.targets[0].id }, start, () => .1, "battle-1").state;
  assert.equal(s.battles[0].winner, "ATTACKER"); assert.equal(s.castle.gold, 1350);
  assert.equal(s.heroes[0].experience, 30); assert.equal(s.targets[0].currentTroops, 0);
  assert.throws(() => actDemo(s, { type: "battle", targetId: original.targets[0].id }, start, () => .1, "battle-2"), /이미 토벌/);
  assert.equal(demoSchema.safeParse(JSON.parse(JSON.stringify(s))).success, true);
});
test("저장 데이터의 중복 편성·주장 없는 병력·누락 건물 거부", () => {
  const s = army(); s.troop.heroIds[1] = s.troop.heroIds[0]; assert.equal(demoSchema.safeParse(s).success, false);
  s.troop.heroIds = [null, null, null]; assert.equal(demoSchema.safeParse(s).success, false);
  const empty = started(); empty.buildings[1].type = "ADMINISTRATION"; assert.equal(demoSchema.safeParse(empty).success, false);
});

test("기존 v2 장수 60명 보존 후 새 장수 모집·편성·저장 가능", () => {
  const legacy = started();
  const originalKeys = ["guanyu", "zhaoyun", "lubu", "zhugeliang", "caocao", "sunshangxiang"] as const;
  legacy.heroes = Array.from({ length: 60 }, (_, i) => createCollectedHero(originalKeys[i % 6], i % 5 + 1, `old-${i}`));
  legacy.troop.heroIds = ["old-0", "old-1", "old-2"];
  legacy.troop.currentTroops = 500;
  const restored = demoSchema.parse(JSON.parse(JSON.stringify(legacy)));
  let step = 0;
  const recruited = actDemo(restored, { type: "draw" }, start, () => step++ % 2 === 0 ? .99 : .999999, "new").state;
  assert.equal(recruited.heroes.length, 61);
  assert.deepEqual(recruited.heroes.slice(0, 60), legacy.heroes);
  assert.deepEqual(recruited.troop, legacy.troop);
  assert.equal(recruited.heroes[60].templateKey, "yuanshao");
  const assigned = actDemo(recruited, { type: "assign", slot: 0, heroId: recruited.heroes[60].id }, start, () => 0, "assign").state;
  assert.equal(playerTroop(assigned).commander.name, "원소");
  assert.equal(demoSchema.safeParse(JSON.parse(JSON.stringify(assigned))).success, true);
});

test("확장 명부의 마지막 5자리 모집과 초과 모집 원자성", () => {
  const s = started();
  s.heroes = Array.from({ length: HERO_ROSTER_LIMIT - 5 }, (_, i) => createCollectedHero("liubei", 1, `old-${i}`));
  const full = actDemo(s, { type: "draw", amount: 5 }, start, () => .5, "last-five").state;
  assert.equal(full.heroes.length, HERO_ROSTER_LIMIT);
  assert.equal(demoSchema.safeParse(full).success, true);
  s.heroes.push(createCollectedHero("liubei", 1, "one-more"));
  const before = structuredClone(s);
  assert.throws(() => actDemo(s, { type: "draw", amount: 5 }, start, () => .5, "overflow"), /명부/);
  assert.deepEqual(s, before);
  const overflow = structuredClone(full);
  overflow.heroes.push(createCollectedHero("liubei", 1, "overflow"));
  assert.equal(demoSchema.safeParse(overflow).success, false);
});
