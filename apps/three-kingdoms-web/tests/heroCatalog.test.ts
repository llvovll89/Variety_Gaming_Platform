import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { HERO_CATALOG, FACTIONS, baseStats } from "../lib/heroCatalog";
import { portraitStyle } from "../lib/heroPortrait";

test("확장 장수 36명의 고유 이름·키·초상과 유효한 기본 능력치", () => {
  assert.equal(HERO_CATALOG.length, 36);
  assert.equal(new Set(HERO_CATALOG.map(h => h.key)).size, 36);
  assert.equal(new Set(HERO_CATALOG.map(h => h.name)).size, 36);
  assert.equal(new Set(HERO_CATALOG.map(h => `${h.atlas}:${h.tile}`)).size, 36);
  for (const faction of FACTIONS) assert.ok(HERO_CATALOG.some(h => h.faction === faction));
  for (const hero of HERO_CATALOG) {
    assert.equal(hero.stats.length, 4);
    for (const value of hero.stats) assert.ok(Number.isInteger(value) && value > 0 && value <= 100);
    for (let stars = 1; stars <= 5; stars++) {
      for (const value of Object.values(baseStats(hero.key, stars))) assert.ok(Number.isFinite(value) && value > 0);
    }
    const style = portraitStyle(hero.key);
    assert.ok(!JSON.stringify(style).includes("NaN"));
    const positions = style.backgroundPosition.match(/[\d.]+/g)!.map(Number);
    assert.ok(positions.every(value => value >= 0 && value <= 100));
  }
});

test("초상 아틀라스 파일 크기와 좌표 메타데이터 일치", () => {
  for (const [file, width, height] of [["heroes.png", 1536, 1024], ["heroes-expanded.png", 1145, 1374]] as const) {
    const png = readFileSync(new URL(`../public/art/${file}`, import.meta.url));
    assert.equal(png.toString("ascii", 1, 4), "PNG");
    assert.equal(png.readUInt32BE(16), width);
    assert.equal(png.readUInt32BE(20), height);
  }
});
