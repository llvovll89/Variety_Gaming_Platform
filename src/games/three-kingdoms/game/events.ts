/**
 * Everything the turn pipeline produces for the player to see, plus its Korean wording.
 *
 * Keeping the log text out of the rules modules means combat and economy code never has to
 * think about presentation, and the step machine has exactly one thing to hand the engine.
 */
import type { HexCoord } from "./hex";
import type { BattleReplay } from './battleReplay';
import { FACILITIES, TACTICS } from "./constants";
import type { CityId, FacilityType, FactionId, GameState, InternalKind, LogEntry, TacticId, UnitId } from "./types";

export type GameEvent =
  | { kind: 'battle-scene'; report: BattleReplay; at: HexCoord }
  | { kind: "turn-begin"; year: number; month: number }
  | { kind: "internal"; cityId: CityId; order: InternalKind; delta: number; officers: string[] }
  | { kind: "build-progress"; cityId: CityId; at: HexCoord; facility: FacilityType; left: number }
  | { kind: "build-complete"; cityId: CityId; at: HexCoord; facility: FacilityType }
  | { kind: "raze"; cityId: CityId; at: HexCoord; facility: FacilityType; by: FactionId }
  | { kind: "dispatch"; cityId: CityId; at: HexCoord; leader: string; troops: number }
  | { kind: "move"; unitId: UnitId; from: HexCoord; to: HexCoord; path: HexCoord[] }
  | { kind: "battle"; at: HexCoord; attackerId: UnitId; defenderId: UnitId; dealt: number; taken: number; ranged: boolean }
  | { kind: "tactic"; unitId: UnitId; tactic: TacticId; at: HexCoord; landed: boolean }
  | { kind: "siege"; at: HexCoord; cityId: CityId; unitId: UnitId; dealt: number; taken: number; garrisonLost: number; breached: boolean }
  | { kind: "rout"; unitId: UnitId; at: HexCoord; leader: string; destroyed: boolean }
  | { kind: "destroy"; unitId: UnitId; at: HexCoord; leader: string }
  | { kind: "captured"; officer: string; at: HexCoord }
  | { kind: "capture"; cityId: CityId; at: HexCoord; from: string; to: FactionId }
  | { kind: "starve"; unitId: UnitId; at: HexCoord; leader: string; lost: number }
  | { kind: "income"; gold: number; food: number }
  | { kind: "harvest"; food: number }
  | { kind: "famine"; cityId: CityId; lost: number }
  | { kind: "eliminated"; faction: FactionId; name: string }
  | { kind: "result"; result: "victory" | "defeat" }
  | { kind: "turn-end"; year: number; month: number };

const ORDER_LABEL: Record<InternalKind, string> = {
  commerce: "상업",
  agriculture: "농업",
  order: "치안",
  draft: "징병",
  train: "훈련",
  repair: "수리",
  build: "건설",
};

export function orderLabel(kind: InternalKind): string {
  return ORDER_LABEL[kind];
}

/** Render one event as a log line. Returns null for events not worth a line. */
export function describe(state: GameState, event: GameEvent): LogEntry | null {
  const turn = state.turn;
  switch (event.kind) {
    case "turn-begin":
      return { turn, text: `${event.year}년 ${event.month}월 ${state.day === 21 ? '하순' : state.day === 11 ? '중순' : '상순'}.`, focus: null, kind: "info" };

    case "internal": {
      const city = state.cities[event.cityId];
      if (!city) return null;
      const who = event.officers.join("·");
      const label = ORDER_LABEL[event.order];
      const amount = event.order === "draft" || event.order === "repair"
        ? `${event.delta.toLocaleString()}`
        : `+${event.delta}`;
      return {
        turn,
        text: `${city.name}: ${who}이(가) ${label}을(를) 마쳤다. ${amount}`,
        focus: city.coord,
        kind: "info",
      };
    }

    case "build-complete": {
      const city = state.cities[event.cityId];
      return {
        turn,
        text: `${city?.name ?? ""} 인근에 ${FACILITIES[event.facility].label}이(가) 완성되었다.`,
        focus: event.at,
        kind: "info",
      };
    }

    case "build-progress":
    case 'battle-scene':
    case "move":
      return null; // Too chatty for the log; the map already shows both of these.

    case "raze": {
      const city = state.cities[event.cityId];
      const who = state.factions[event.by];
      return {
        turn,
        text: `${who?.name ?? ""}군이 ${city?.name ?? ""}의 ${FACILITIES[event.facility].label}을(를) 불태웠다.`,
        focus: event.at,
        kind: "alert",
      };
    }

    case "dispatch": {
      const city = state.cities[event.cityId];
      return {
        turn,
        text: `${city?.name ?? ""}에서 ${event.leader}이(가) 병사 ${event.troops.toLocaleString()}을(를) 이끌고 출진했다.`,
        focus: event.at,
        kind: "info",
      };
    }

    case "battle": {
      const attacker = state.units[event.attackerId];
      const defender = state.units[event.defenderId];
      const who = attacker ? state.officers[attacker.officerIds[0]]?.name ?? "아군" : "부대";
      const foe = defender ? state.officers[defender.officerIds[0]]?.name ?? "적군" : "적군";
      const back = event.taken > 0 ? ` 아군 ${event.taken.toLocaleString()} 손실.` : " 반격 없음.";
      return {
        turn,
        text: `${who}이(가) ${foe}을(를) 쳤다. 적 ${event.dealt.toLocaleString()} 손실.${back}`,
        focus: event.at,
        kind: "battle",
      };
    }

    case "tactic": {
      const unit = state.units[event.unitId];
      const who = unit ? state.officers[unit.officerIds[0]]?.name ?? "부대" : "부대";
      const spec = TACTICS[event.tactic];
      return {
        turn,
        text: event.landed
          ? `${who}, ${spec.label}!`
          : `${who}의 ${spec.label}이(가) 간파당했다.`,
        focus: event.at,
        kind: "battle",
      };
    }

    case "siege": {
      const city = state.cities[event.cityId];
      const tail = event.breached
        ? city && city.troops > 0 ? " 성벽이 무너졌다!" : " 성이 비었다!"
        : "";
      const garrison = event.garrisonLost > 0 ? ` 수비 ${event.garrisonLost.toLocaleString()} 손실.` : "";
      return {
        turn,
        text: `${city?.name ?? ""} 공격. 내구 ${event.dealt.toLocaleString()} 감소.${garrison} 아군 ${event.taken.toLocaleString()} 손실.${tail}`,
        focus: event.at,
        kind: event.breached ? "capture" : "battle",
      };
    }

    case "rout":
      return {
        turn,
        text: event.destroyed
          ? `${event.leader}의 부대가 사기를 잃고 흩어졌다.`
          : `${event.leader}의 부대가 무너져 퇴각했다.`,
        focus: event.at,
        kind: "alert",
      };

    case "destroy":
      return { turn, text: `${event.leader}의 부대가 궤멸했다.`, focus: event.at, kind: "alert" };

    case "captured":
      return { turn, text: `${event.officer}이(가) 사로잡혔다.`, focus: event.at, kind: "alert" };

    case "capture": {
      const city = state.cities[event.cityId];
      const to = state.factions[event.to];
      return {
        turn,
        text: `${to?.name ?? ""}군이 ${city?.name ?? ""}을(를) 점령했다. (${event.from})`,
        focus: event.at,
        kind: "capture",
      };
    }

    case "starve":
      return {
        turn,
        text: `${event.leader}의 부대가 굶주려 ${event.lost.toLocaleString()}을(를) 잃었다.`,
        focus: event.at,
        kind: "alert",
      };

    case "income":
      return {
        turn,
        text: `세수 ${event.gold.toLocaleString()}금, 병량 ${event.food >= 0 ? "+" : ""}${event.food.toLocaleString()}.`,
        focus: null,
        kind: "info",
      };

    case "harvest":
      return {
        turn,
        text: `가을걷이. 병량 ${event.food.toLocaleString()}을(를) 거두었다.`,
        focus: null,
        kind: "info",
      };

    case "famine": {
      const city = state.cities[event.cityId];
      return {
        turn,
        text: `${city?.name ?? ""}의 곳간이 비었다. 병사 ${event.lost.toLocaleString()}이(가) 흩어졌다.`,
        focus: city?.coord ?? null,
        kind: "alert",
      };
    }

    case "eliminated":
      return { turn, text: `${event.name}이(가) 멸망했다.`, focus: null, kind: "capture" };

    case "result":
      return {
        turn,
        text: event.result === "victory" ? "중원을 통일했다." : "모든 것을 잃었다.",
        focus: null,
        kind: "alert",
      };

    case "turn-end":
      return null;
  }
}

/** Append an event's log line if it has one. */
export function logEvent(state: GameState, event: GameEvent): void {
  const entry = describe(state, event);
  if (!entry) return;
  state.log.push(entry);
  // The log is a scrolling tail, not an archive; cap it so long games cannot grow unbounded.
  if (state.log.length > 300) state.log.splice(0, state.log.length - 300);
}
