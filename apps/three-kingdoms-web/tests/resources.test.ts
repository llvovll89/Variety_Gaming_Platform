import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateProduction } from "../lib/resources";
test("건물 레벨과 정치 보너스 및 소수 자원", () => {
  const buildings = [{ type: "FARM" as const, level: 2 }, { type: "ADMINISTRATION" as const, level: 1 }];
  const r = calculateProduction(60, buildings, 100);
  assert.equal(r.gold.toString(), "11"); assert.equal(r.food.toString(), "44");
  assert.equal(r.reserves.toString(), "0");
  assert.equal(calculateProduction(-1, buildings, 0).gold.toString(), "0");
  assert.ok(calculateProduction(1, buildings, 0).gold.greaterThan(0));
});
