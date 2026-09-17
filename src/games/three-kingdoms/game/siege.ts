/**
 * Taking a city.
 *
 * The wall has to be down AND the garrison gone before anyone walks through the gate, so a
 * defender can always buy time by refusing to spend their last soldiers. What happens after
 * is what makes the endgame accelerate: the loser's granary is halved, their facilities in
 * the 영역 burn, and their officers either run or change banner.
 */
import { BALANCE } from "./constants";
import { tileAt } from "./map";
import { createRng } from "./rng";
import { nearestFriendlyCity } from "./state";
import type { GameEvent } from "./events";
import type { City, GameState, Unit } from "./types";

export interface CaptureCheck {
  ok: boolean;
  reason?: string;
}

/** Is this city ready to fall to that unit? */
export function canCapture(_state: GameState, unit: Unit, city: City): CaptureCheck {
  if (city.faction === unit.faction) return { ok: false, reason: "이미 아군 도시입니다." };
  // The wall is the gate condition, exactly as in RTK11. Requiring the garrison to be
  // exterminated as well turned every siege into a ten-turn grind that killed the attacker
  // first; the garrison instead makes the wall harder to break while it lasts.
  if (city.defense > 0) return { ok: false, reason: "성벽이 아직 버티고 있습니다." };
  const distance = Math.max(
    Math.abs(unit.coord.q - city.coord.q),
    Math.abs(unit.coord.r - city.coord.r),
    Math.abs(unit.coord.q + unit.coord.r - city.coord.q - city.coord.r),
  );
  if (distance !== 1) return { ok: false, reason: "성에 인접해야 입성할 수 있습니다." };
  // Deliberately NOT gated on movement. An assault zeroes the attacker's movement, so
  // requiring it here meant a unit could breach a wall and then never walk through the gap:
  // the wall healed before its next turn and the siege looped forever.
  return { ok: true };
}

/** March in. Spends the rest of the month. */
export function captureCity(state: GameState, unit: Unit, city: City): GameEvent[] {
  const check = canCapture(state, unit, city);
  if (!check.ok) return [];

  const events: GameEvent[] = [];
  const loser = city.faction;
  const loserName = loser ? state.factions[loser]?.name ?? "무소속" : "무소속";

  // Move the unit onto the city hex.
  const from = tileAt(state.map, unit.coord);
  if (from?.unitId === unit.id) from.unitId = null;
  unit.coord = city.coord;
  const to = tileAt(state.map, city.coord);
  if (to) to.unitId = unit.id;
  unit.movesLeft = 0;
  unit.hasActed = true;

  // Officers still inside either flee to the nearest city their side still holds, or are
  // taken. This is the rule that snowballs a collapsing faction.
  const rng = createRng(state.rngSeed);
  const refuge = loser ? nearestFriendlyCity(state, loser, city.coord) : null;
  for (const id of [...city.officerIds]) {
    const officer = state.officers[id];
    if (!officer || officer.duty === "marching") continue;
    const escaped = refuge !== null && refuge.id !== city.id
      && rng.chance(BALANCE.officerEscapeBase + officer.cha / 400);
    city.officerIds.splice(city.officerIds.indexOf(id), 1);
    if (escaped && refuge) {
      officer.cityId = refuge.id;
      officer.duty = "idle";
      refuge.officerIds.push(officer.id);
    } else {
      officer.faction = unit.faction;
      officer.cityId = city.id;
      officer.duty = "idle";
      city.officerIds.push(officer.id);
      events.push({ kind: "captured", officer: officer.name, at: city.coord });
    }
  }
  state.rngSeed = rng.seed();

  // Sacking: stores are halved, order collapses, the wall is patched to a fraction.
  city.faction = unit.faction;
  city.gold = Math.round(city.gold * BALANCE.captureStoreLoss);
  city.food = Math.round(city.food * BALANCE.captureStoreLoss);
  city.order = BALANCE.captureOrder;
  city.defense = Math.round(city.maxDefense * BALANCE.captureDefenseFraction);
  // The old garrison scatters, but the victor leaves part of its own army to hold the place.
  // Without this a captured city sits at zero troops and is simply taken straight back, and
  // the front turns into the same city changing hands every other month.
  city.troops = 0;
  const left = Math.round(unit.troops * BALANCE.captureGarrisonShare);
  if (left > 0) {
    unit.troops -= left;
    city.troops += left;
  }

  // The old owner's works in this 영역 are theirs, not yours — they burn with the city.
  for (const tile of state.map.tiles) {
    if (tile.domainOf !== city.id || !tile.facility) continue;
    if (tile.facility.faction === unit.faction) continue;
    if (tile.facility.builderId) {
      const builder = state.officers[tile.facility.builderId];
      if (builder && builder.duty === "internal") builder.duty = "idle";
    }
    tile.facility = null;
  }

  events.push({
    kind: "capture", cityId: city.id, at: city.coord, from: loserName, to: unit.faction,
  });
  return events;
}

/** A city with no garrison cannot hold its wall up on its own. */
export function decayUndefendedCities(state: GameState): void {
  for (const city of Object.values(state.cities)) {
    if (city.troops > 0) continue;
    // Only decays while somebody is actually at the gates.
    const besieged = Object.values(state.units).some(
      (u) =>
        u.faction !== city.faction &&
        Math.max(
          Math.abs(u.coord.q - city.coord.q),
          Math.abs(u.coord.r - city.coord.r),
          Math.abs(u.coord.q + u.coord.r - city.coord.q - city.coord.r),
        ) === 1,
    );
    if (!besieged) continue;
    city.defense = Math.max(0, city.defense - BALANCE.emptyCityDecay);
  }
}
