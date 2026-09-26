import { test } from "node:test";
import assert from "node:assert/strict";
import { aggregateStats, simulateBattle, type BattleTroop } from "../lib/battleEngine";
import { gainExperience } from "../lib/progression";

const troop = (id: string, soldiers = 1000, leadership = 100, strength = 100, intelligence = 0): BattleTroop => ({
  id, name: id, currentTroops: soldiers, commander: { name: "관우", leadership, strength, intelligence }, deputies: [],
});
test("부장 30% 가중치", () => {
  const t = troop("a"); t.deputies = [{ name: "장비", leadership: 80, strength: 90, intelligence: 60 }];
  assert.deepEqual(aggregateStats(t), { leadership: 124, strength: 127, intelligence: 18 });
});
test("통솔 선공, 물리 공식, 입력 불변", () => {
  const a = troop("a"); const d = troop("d", 1000, 50);
  const before = structuredClone([a, d]);
  const result = simulateBattle(a, d, () => 0.99);
  assert.match(result.logs[0], /^a 부대/);
  assert.match(result.logs[1], /440명 피해. 남은 병력 560명/);
  assert.match(result.logs[2], /264명 피해. 남은 병력 736명/);
  assert.deepEqual([a, d], before);
});
test("계략 1.5배 및 확률 경계", () => {
  const a = troop("a", 1000, 100, 100, 90);
  const d = troop("d", 1000, 50);
  const hit = simulateBattle(a, d, () => 0.299);
  assert.match(hit.logs[1], /주장 \[관우\]의 화공/);
  assert.match(hit.logs[2], /660명 피해/);
  assert.doesNotMatch(simulateBattle(a, d, () => 0.3).logs.join(" "), /화공/);
});
test("동률 선공은 RNG로 양쪽 가능", () => {
  assert.match(simulateBattle(troop("a"), troop("d"), () => 0.1).logs[0], /^a /);
  assert.match(simulateBattle(troop("a"), troop("d"), () => 0.9).logs[0], /^d /);
});
test("최소 피해 10, 초과 피해 제한, 사망 후 반격 없음", () => {
  const r = simulateBattle(troop("a", 1, 100, 0), troop("d", 8, 0, 1000), () => 0.99);
  assert.equal(r.winner, "ATTACKER"); assert.equal(r.defenderRemaining, 0);
  assert.equal(r.attackerRemaining, 1); assert.equal(r.experienceReward, 0);
  assert.match(r.logs[1], /8명 피해/);
});
test("10턴 상한 및 잔여 병력 판정", () => {
  // Near the attrition equilibrium, both armies survive the full ten rounds.
  const r = simulateBattle(troop("a", 819804, 1, 0), troop("d", 1_000_000, 0, 0), () => 0.99);
  assert.equal(r.turns, 10);
  assert.ok(r.attackerRemaining > 0 && r.defenderRemaining > 0);
  assert.equal(r.winner, "DEFENDER");
  assert.equal(r.experienceReward, Math.floor((819804 - r.attackerRemaining) * 0.1));
});
test("빈 부대는 공격 없이 종료하고 경험치를 생성하지 않음", () => {
  assert.equal(simulateBattle(troop("a", 0), troop("d", 0), () => 0).winner, "DRAW");
  const r = simulateBattle(troop("a", 0), troop("d", 50), () => 0);
  assert.equal(r.turns, 0); assert.equal(r.experienceReward, 0);
});
test("잘못된 병력, 스탯, 편성, RNG 거부", () => {
  assert.throws(() => simulateBattle(troop("a", -1), troop("d"), () => 0));
  assert.throws(() => simulateBattle(troop("a", 1.5), troop("d"), () => 0));
  assert.throws(() => simulateBattle(troop("a", 100, NaN), troop("d"), () => 0));
  assert.throws(() => simulateBattle(troop("a"), troop("d"), () => 1));
  const a = troop("a"); a.deputies = Array(3).fill(a.commander);
  assert.throws(() => aggregateStats(a));
});
test("다중 레벨업 및 100레벨 상한", () => {
  assert.deepEqual(gainExperience(1, 90, 220), { level: 3, experience: 10, levelsGained: 2 });
  assert.deepEqual(gainExperience(99, 9890, 100), { level: 100, experience: 0, levelsGained: 1 });
});
