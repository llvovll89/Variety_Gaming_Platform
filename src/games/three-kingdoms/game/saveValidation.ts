import { z } from 'zod';
import { MAP_HEIGHT, MAP_WIDTH } from './constants';
import { axialToOffset, offsetToAxial } from './hex';
import type { GameState } from './types';

const number = z.number().finite();
const amount = number.nonnegative();
const integer = amount.int();
const id = z.string().min(1);
const factionId = id.nullable();
const hex = z.object({ q: number.int(), r: number.int() });
const facilityType = z.enum(['farm', 'market', 'barracks', 'fort', 'tower']);
const tactics = z.enum(['charge', 'pike', 'volley', 'fire', 'confuse', 'rally']);

/** Validate persisted data before either React or the engine can dereference it. */
export const savedStateSchema = z.object({
  day: z.union([z.literal(1), z.literal(11), z.literal(21)]).default(1),
  pkRosterVersion: integer.optional(),
  turn: integer.min(1), year: integer, month: integer.min(1).max(12),
  phase: z.enum(['player', 'ai', 'resolve', 'ended']), activeIndex: integer,
  playerFactionId: id, factionOrder: z.array(id).min(1),
  factions: z.record(id, z.object({
    id, name: z.string(), hanja: z.string(), leaderId: id, color: z.string(),
    isPlayer: z.boolean(), alive: z.boolean(), aggression: amount,
  })),
  cities: z.record(id, z.object({
    id, name: z.string(), hanja: z.string(), coord: hex, faction: factionId,
    scale: z.enum(['small', 'mid', 'large', 'capital']),
    gold: amount, food: amount, troops: amount, maxTroops: amount,
    commerce: amount, agriculture: amount, order: amount.max(100),
    defense: amount, maxDefense: amount, officerIds: z.array(id), neighborCityIds: z.array(id),
  })),
  officers: z.record(id, z.object({
    id, name: z.string(), hanja: z.string(), lead: amount, war: amount, int: amount, pol: amount, cha: amount,
    faction: factionId, cityId: id, duty: z.enum(['idle', 'internal', 'marching', 'captured']),
    unitId: integer.nullable(), tactics: z.array(tactics),
    appearance: z.object({
      armor: z.string(), cloth: z.string(), skin: z.string(),
      helmet: z.enum(['crown', 'helmet', 'scholar', 'plume']),
      weapon: z.enum(['spear', 'blade', 'sword', 'fan', 'bow']),
      beard: number, build: number,
    }).optional(),
  })),
  units: z.record(z.string(), z.object({
    id: integer, faction: id, coord: hex, type: z.enum(['spear', 'cavalry', 'archer']),
    troops: amount, maxTroops: amount, morale: amount.max(100), energy: amount.max(100), food: amount,
    officerIds: z.array(id).min(1).max(3), homeCityId: id, movesLeft: amount, hasActed: z.boolean(),
    status: z.object({ confused: amount, slowed: amount, fired: amount }), unsuppliedTurns: integer,
    orderTarget: z.union([z.object({ kind: z.literal('city'), id }), z.object({ kind: z.literal('hex'), hex })]).optional(),
  })),
  nextUnitId: integer,
  map: z.object({
    width: z.literal(MAP_WIDTH), height: z.literal(MAP_HEIGHT),
    tiles: z.array(z.object({
      q: number.int(), r: number.int(), terrain: z.enum(['plain', 'forest', 'hill', 'mountain', 'water', 'road', 'wasteland']),
      cityId: id.nullable(), domainOf: id.nullable(), unitId: integer.nullable(),
      facility: z.object({ type: facilityType, ownerCity: id, faction: id, buildTurnsLeft: integer, builderId: id.nullable() }).nullable(),
    })).length(MAP_WIDTH * MAP_HEIGHT),
  }),
  internalOrders: z.array(z.object({
    cityId: id, kind: z.enum(['commerce', 'agriculture', 'order', 'draft', 'train', 'repair', 'build']),
    officerIds: z.array(id).min(1), buildAt: hex.optional(), buildType: facilityType.optional(),
    goldSpent: amount, foodSpent: amount, delta: amount,
  })),
  log: z.array(z.object({ turn: integer, text: z.string(), focus: hex.nullable(), kind: z.enum(['info', 'battle', 'capture', 'alert']) })),
  rngSeed: integer.max(0xffffffff), result: z.enum(['playing', 'victory', 'defeat']),
});

/** Run after roster migration, so legitimate old saves can add their missing officers. */
export function validSaveReferences(s: GameState): boolean {
  const owns = (record: object, key: string | number) => Object.hasOwn(record, key);
  const hasFaction = (value: string | null) => value === null || owns(s.factions, value);
  const inMap = (p: { q: number; r: number }) => {
    const { col, row } = axialToOffset(p);
    return col >= 0 && col < MAP_WIDTH && row >= 0 && row < MAP_HEIGHT;
  };
  const tileAt = (p: { q: number; r: number }) => {
    const { col, row } = axialToOffset(p); return s.map.tiles[row * MAP_WIDTH + col];
  };
  const unique = (values: readonly (string | number)[]) => new Set(values).size === values.length;
  if (!owns(s.factions, s.playerFactionId) || s.factionOrder[0] !== s.playerFactionId ||
      !unique(s.factionOrder) || s.activeIndex >= s.factionOrder.length ||
      s.factionOrder.some(fid => !owns(s.factions, fid))) return false;
  if (Object.entries(s.factions).some(([key, f]) => key !== f.id || !owns(s.officers, f.leaderId))) return false;
  if (Object.entries(s.cities).some(([key, c]) => key !== c.id || !hasFaction(c.faction) || !inMap(c.coord) ||
      tileAt(c.coord).cityId !== c.id || !unique(c.officerIds) || c.officerIds.some(oid => !owns(s.officers, oid)) ||
      c.neighborCityIds.some(cid => !owns(s.cities, cid)))) return false;
  if (Object.entries(s.officers).some(([key, o]) => key !== o.id || !hasFaction(o.faction) || !owns(s.cities, o.cityId) ||
      (o.unitId !== null && !owns(s.units, o.unitId)))) return false;
  if (Object.entries(s.units).some(([key, u]) => key !== String(u.id) || u.id >= s.nextUnitId || !owns(s.factions, u.faction) ||
      !owns(s.cities, u.homeCityId) || !inMap(u.coord) || tileAt(u.coord).unitId !== u.id ||
      !unique(u.officerIds) || u.officerIds.some(oid => !owns(s.officers, oid)) ||
      (u.orderTarget?.kind === 'city' && !owns(s.cities, u.orderTarget.id)) ||
      (u.orderTarget?.kind === 'hex' && !inMap(u.orderTarget.hex)))) return false;
  if (s.map.tiles.some((t, index) => {
    const expected = offsetToAxial(index % MAP_WIDTH, Math.floor(index / MAP_WIDTH));
    return t.q !== expected.q || t.r !== expected.r ||
      (t.cityId !== null && !owns(s.cities, t.cityId)) || (t.domainOf !== null && !owns(s.cities, t.domainOf)) ||
      (t.unitId !== null && (!owns(s.units, t.unitId) || s.units[t.unitId].coord.q !== t.q || s.units[t.unitId].coord.r !== t.r)) ||
      (t.facility !== null && (!owns(s.cities, t.facility.ownerCity) || !owns(s.factions, t.facility.faction) ||
        (t.facility.builderId !== null && !owns(s.officers, t.facility.builderId))));
  })) return false;
  return !s.internalOrders.some(o => !owns(s.cities, o.cityId) || !unique(o.officerIds) || o.officerIds.some(oid => !owns(s.officers, oid)) ||
    (o.buildAt !== undefined && !inMap(o.buildAt)) || (o.kind === 'build' && (!o.buildAt || !o.buildType))) &&
    !s.log.some(entry => entry.focus !== null && !inMap(entry.focus));
}
