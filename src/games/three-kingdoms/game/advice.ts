/**
 * "What should I do now?"
 *
 * A strategy game hands the player twelve cities, thirty-nine officers and no instructions,
 * and the first session dies right there. This module looks at the board and names the single
 * most useful next action, in order of urgency: danger first, then idle capacity, then growth,
 * then end the month.
 *
 * It is advice, never enforcement — nothing here changes the game state.
 */
import { hexDistance, type HexCoord } from "./hex";
import { citiesOf, idleOfficers, unitsOf } from "./state";
import { developmentCap } from "./internal";
import { isSupplied } from "./supply";
import { UNIT_TYPES } from "./constants";
import type { GameState } from "./types";

export interface Advice {
  /** One sentence, imperative, naming the place. */
  text: string;
  /** Where to look, if anywhere. */
  focus: HexCoord | null;
  tone: "danger" | "action" | "growth" | "done";
}

export interface Objective {
  text: string;
  owned: number;
  total: number;
}

export function currentObjective(state: GameState): Objective {
  const total = Object.keys(state.cities).length;
  const owned = citiesOf(state, state.playerFactionId).length;
  return {
    text: owned === total ? "천하가 통일되었다." : "중원의 모든 성을 차지하라.",
    owned,
    total,
  };
}

/**
 * Up to `limit` suggestions, most urgent first. The first one is what the header shows.
 */
export function adviceFor(state: GameState, limit = 3): Advice[] {
  const me = state.playerFactionId;
  const out: Advice[] = [];
  const cities = citiesOf(state, me);
  const units = unitsOf(state, me);

  if (state.result !== "playing" || state.phase !== "player") return out;

  // 1. Somebody is at the gates.
  for (const city of cities) {
    const attackers = Object.values(state.units).filter(
      (u) => u.faction !== me && hexDistance(u.coord, city.coord) <= 2,
    );
    if (attackers.length === 0) continue;
    const strength = attackers.reduce((sum, u) => sum + u.troops, 0);
    out.push({
      text: `${city.name}에 적군 ${strength.toLocaleString()}이 다가왔다. 수비를 서두르십시오.`,
      focus: city.coord,
      tone: "danger",
    });
  }

  // 2. An army about to fall apart.
  for (const unit of units) {
    if (unit.morale < 35) {
      out.push({
        text: `${leader(state, unit.id)} 부대의 사기가 ${Math.round(unit.morale)}입니다. 도시로 물리십시오.`,
        focus: unit.coord,
        tone: "danger",
      });
    } else if (!isSupplied(state, unit) && unit.food < unit.troops / 50) {
      out.push({
        text: `${leader(state, unit.id)} 부대의 보급이 끊겼습니다. 병량이 떨어지면 무너집니다.`,
        focus: unit.coord,
        tone: "danger",
      });
    }
  }

  // 3. A wall down next door — free city.
  for (const city of Object.values(state.cities)) {
    if (city.faction === me || city.defense > 0) continue;
    const mine = units.find((u) => hexDistance(u.coord, city.coord) === 1);
    if (mine) {
      out.push({
        text: `${city.name}의 성벽이 무너졌습니다. 지금 입성하십시오.`,
        focus: city.coord,
        tone: "action",
      });
    }
  }

  // 4. An army that has not moved this month.
  for (const unit of units) {
    if (unit.hasActed || unit.movesLeft <= 0) continue;
    out.push({
      text: `${leader(state, unit.id)} 부대가 아직 움직이지 않았습니다. 이동 ${unit.movesLeft} 남음.`,
      focus: unit.coord,
      tone: "action",
    });
  }

  // 5. Officers standing around doing nothing.
  for (const city of cities) {
    const free = idleOfficers(state, city.id);
    if (free.length === 0) continue;
    const suggestion = suggestOrder(state, city.id);
    out.push({
      text: `${city.name}에 무장 ${free.length}명이 놀고 있습니다. ${suggestion}`,
      focus: city.coord,
      tone: "growth",
    });
  }

  // 6. Enough men at home to put an army in the field.
  if (units.length === 0) {
    const source = cities.filter((c) => c.troops >= 3000 && idleOfficers(state, c.id).length > 0)[0];
    if (source) {
      out.push({
        text: `${source.name}에 병사 ${source.troops.toLocaleString()}이 있습니다. 출진해 성을 노리십시오.`,
        focus: source.coord,
        tone: "growth",
      });
    }
  }

  if (out.length === 0) {
    out.push({ text: "이번 달에 할 일을 마쳤습니다. 턴을 종료하십시오.", focus: null, tone: "done" });
  }
  return out.slice(0, limit);
}

/** Which 내정 order this city most needs, phrased as a sentence fragment. */
export function suggestOrder(state: GameState, cityId: string): string {
  const city = state.cities[cityId];
  if (!city) return "";
  if (city.order < 50) return "치안이 낮으니 치안부터.";
  if (city.defense < city.maxDefense * 0.6) return "성벽이 상했으니 수리를.";
  if (city.troops < city.maxTroops * 0.4) return "병사가 모자라니 징병을.";
  const annualFood = (city.troops / 200) * 12;
  if (city.food < annualFood * 2) return "곳간이 얇으니 농업을.";
  if (city.commerce < developmentCap(state, city, "commerce")) return "상업을 올릴 수 있습니다.";
  if (city.agriculture < developmentCap(state, city, "agriculture")) return "농업을 올릴 수 있습니다.";
  return "개발 상한에 닿았으니 시설을 지으십시오.";
}

function leader(state: GameState, unitId: number): string {
  const unit = state.units[unitId];
  if (!unit) return "부대";
  return state.officers[unit.officerIds[0]]?.name ?? UNIT_TYPES[unit.type].label;
}
