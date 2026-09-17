import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

// Bundle the browser's extensionless TS imports into one in-memory Node module.
const compiled = await build({ stdin: { contents: `
  export * from './src/games/three-kingdoms/game/hex';
  export * from './src/games/three-kingdoms/game/map';
  export * from './src/games/three-kingdoms/game/state';
  export * from './src/games/three-kingdoms/game/scenario';
  export * from './src/games/three-kingdoms/game/officers';
  export * from './src/games/three-kingdoms/game/rng';
  export * from './src/games/three-kingdoms/game/internal';
  export * from './src/games/three-kingdoms/game/turn';
  export * from './src/games/three-kingdoms/game/events';
  export * from './src/games/three-kingdoms/game/pathfinding';
  export * from './src/games/three-kingdoms/game/commands';
  export * from './src/games/three-kingdoms/game/combat';
  export * from './src/games/three-kingdoms/game/siege';
  export * from './src/games/three-kingdoms/game/supply';
  export * from './src/games/three-kingdoms/game/victory';
  export * from './src/games/three-kingdoms/game/ai';
  export { TERRAIN_MOVE_COST, TYPE_COUNTER, MAP_WIDTH, MAP_HEIGHT, DOMAIN_RADIUS,
    HARVEST_MONTH, BALANCE, DEV_CAP_BY_SCALE, DEV_CAP_PER_FACILITY, SCENARIO_START, TACTICS,
    MAX_DEFENSE_BY_SCALE }
    from './src/games/three-kingdoms/game/constants';
`, resolveDir: process.cwd() }, bundle: true, write: false, format: 'esm', platform: 'node' });
const {
  HEX_DIRS, hexKey, hexEquals, hexAdd, hexDistance, hexNeighbors, hexesInRange,
  axialToOffset, offsetToAxial, axialToPixel, pixelToAxial, hexRound, hexCorners, hexLine,
  createScenarioMap, createGameState, createOfficers, CITY_ANCHORS, PLAYABLE_FACTIONS,
  tileAt, isLand, computeCityNeighbors, citiesOf, factionTroops, standings, officersInCity, tacticsFor,
  createRng, TERRAIN_MOVE_COST, TYPE_COUNTER, MAP_WIDTH, MAP_HEIGHT, DOMAIN_RADIUS,
  previewInternal, queueInternal, cancelInternal, developmentCap, resolveInternalOrders,
  collectIncome, tickBuilds, canBuildAt, barracksBonus,
  beginTurn, runTurn, HARVEST_MONTH, BALANCE, DEV_CAP_BY_SCALE, SCENARIO_START,
  reachable, pathFrom, costTo, routeTo, attackTargets, isPassable,
  dispatch, moveUnit, returnToCity, dispatchCost, validateDispatch, unitFoodCapacity,
  resolveAttack, expectedCasualties, unitStats, attackPower, availableTactics,
  canCapture, captureCity, resolveSupply, supplyReach, isSupplied, evaluateVictory,
  planInternal, planMilitary, explainMilitary, unitsOf, idleOfficers, factionGold,
  TACTICS, MAX_DEFENSE_BY_SCALE,
} = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));

function allTiles() {
  const out = [];
  for (let row = 0; row < MAP_HEIGHT; row++) for (let col = 0; col < MAP_WIDTH; col++) out.push({ col, row });
  return out;
}

// --- hex --------------------------------------------------------------------

test('odd-r offset and axial round-trip for every tile on the real map', () => {
  for (const { col, row } of allTiles()) {
    const axial = offsetToAxial(col, row);
    assert.deepEqual(axialToOffset(axial), { col, row }, 'offset round-trip failed at ' + col + ',' + row);
  }
});

test('pixel round-trips back to the same hex at every zoom the camera allows', () => {
  for (const size of [34 * 0.6, 34, 34 * 2]) {
    for (const { col, row } of allTiles()) {
      const axial = offsetToAxial(col, row);
      const px = axialToPixel(axial, size);
      assert.ok(hexEquals(pixelToAxial(px, size), axial), 'center round-trip failed at ' + col + ',' + row);
      // Points well inside the hex must resolve to it too — this is exactly what hit-testing does.
      for (const [dx, dy] of [[0.4, 0], [-0.4, 0], [0, 0.4], [0, -0.4], [0.3, 0.3], [-0.3, -0.3]]) {
        const near = { x: px.x + dx * size, y: px.y + dy * size };
        assert.ok(hexEquals(pixelToAxial(near, size), axial), 'inner hit-test failed at ' + col + ',' + row);
      }
    }
  }
});

test('distance is symmetric, zero on self, and one for every neighbour', () => {
  const a = offsetToAxial(7, 5), b = offsetToAxial(19, 12);
  assert.equal(hexDistance(a, b), hexDistance(b, a));
  assert.equal(hexDistance(a, a), 0);
  const n = hexNeighbors(a);
  assert.equal(n.length, 6);
  assert.equal(new Set(n.map(hexKey)).size, 6);
  for (const h of n) assert.equal(hexDistance(a, h), 1);
  let walk = a;
  for (let k = 1; k <= 5; k++) { walk = hexAdd(walk, HEX_DIRS[1]); assert.equal(hexDistance(a, walk), k); }
});

test('hexesInRange returns the closed-form hex count and nothing outside the radius', () => {
  const c = offsetToAxial(10, 9);
  for (let radius = 0; radius <= 4; radius++) {
    const ring = hexesInRange(c, radius);
    assert.equal(ring.length, 3 * radius * (radius + 1) + 1);
    assert.equal(new Set(ring.map(hexKey)).size, ring.length);
    for (const h of ring) assert.ok(hexDistance(c, h) <= radius);
  }
  assert.ok(hexesInRange(c, 3).some((h) => hexDistance(c, h) === 3));
});

test('hexRound keeps the cube constraint and lands on a real hex', () => {
  for (const [qf, rf] of [[0.4, -0.2], [2.5, 3.5], [-1.7, 0.9], [5.49, -2.51]]) {
    const h = hexRound(qf, rf);
    assert.ok(Number.isInteger(h.q) && Number.isInteger(h.r));
    assert.ok(Math.abs(h.q + h.r - (qf + rf)) <= 1.0000001);
  }
});

test('hexLine connects the endpoints with one step per hex of distance', () => {
  const a = offsetToAxial(4, 3), b = offsetToAxial(14, 11);
  const line = hexLine(a, b);
  assert.equal(line.length, hexDistance(a, b) + 1);
  assert.ok(hexEquals(line[0], a));
  assert.ok(hexEquals(line[line.length - 1], b));
  for (let i = 1; i < line.length; i++) assert.equal(hexDistance(line[i - 1], line[i]), 1);
  assert.deepEqual(hexLine(a, a), [a]);
});

test('hexCorners traces a closed pointy-top hexagon of the requested size', () => {
  const corners = hexCorners({ x: 0, y: 0 }, 34);
  assert.equal(corners.length, 6);
  for (const c of corners) assert.ok(Math.abs(Math.hypot(c.x, c.y) - 34) < 1e-9);
  // Pointy-top means one corner points straight up.
  assert.ok(corners.some((c) => Math.abs(c.x) < 1e-9 && Math.abs(c.y + 34) < 1e-9));
});

// --- map & scenario ---------------------------------------------------------

test('every city sits on passable land and owns its own hex', () => {
  const map = createScenarioMap();
  assert.equal(map.tiles.length, MAP_WIDTH * MAP_HEIGHT);
  for (const a of CITY_ANCHORS) {
    const t = tileAt(map, offsetToAxial(a.col, a.row));
    assert.ok(t, a.id + ' is off the map');
    assert.equal(t.cityId, a.id);
    assert.ok(isLand(t), a.id + ' was drowned by terrain generation');
    assert.ok(Number.isFinite(TERRAIN_MOVE_COST[t.terrain]), a.id + ' sits on impassable terrain');
  }
});

test('the Yellow River still splits the board yet leaves no city stranded', () => {
  const map = createScenarioMap();
  const water = map.tiles.filter((t) => t.terrain === 'water');
  assert.ok(water.length > 40, 'river is too thin: ' + water.length + ' tiles');

  // Every city must be reachable overland from 하비, or the map has an orphan pocket.
  const start = offsetToAxial(29, 15);
  const seen = new Set([hexKey(start)]);
  const queue = [start];
  while (queue.length) {
    const cur = queue.pop();
    for (const n of hexNeighbors(cur)) {
      const t = tileAt(map, n);
      if (!t || !isLand(t) || seen.has(hexKey(n))) continue;
      seen.add(hexKey(n));
      queue.push(n);
    }
  }
  for (const a of CITY_ANCHORS) {
    assert.ok(seen.has(hexKey(offsetToAxial(a.col, a.row))), a.id + ' is unreachable by land from 하비');
  }

  // The northern bank is reached by fords, not by a boulevard.
  const fords = map.tiles.filter((t) => t.terrain === 'road' && axialToOffset(t).row >= 2 && axialToOffset(t).row <= 6);
  assert.ok(fords.length > 0, 'no road ever reaches the northern bank');
});

test('every city gets a domain big enough to actually develop', () => {
  const map = createScenarioMap();
  // A city needs more buildable tiles than the six facility slots it will ever fill,
  // otherwise its economy is capped by map generation rather than by player choices.
  const BUILDABLE = new Set(['plain', 'hill', 'wasteland']);
  const domain = {}, buildable = {};
  for (const t of map.tiles) {
    if (!t.domainOf) continue;
    assert.notEqual(t.terrain, 'water', 'a domain claimed a river tile');
    domain[t.domainOf] = (domain[t.domainOf] ?? 0) + 1;
    if (BUILDABLE.has(t.terrain)) buildable[t.domainOf] = (buildable[t.domainOf] ?? 0) + 1;
  }
  for (const a of CITY_ANCHORS) {
    assert.ok(domain[a.id] >= 15, a.id + ' has only ' + (domain[a.id] ?? 0) + ' domain tiles');
    assert.ok(buildable[a.id] >= 8, a.id + ' has only ' + (buildable[a.id] ?? 0) + ' buildable tiles');
    const center = offsetToAxial(a.col, a.row);
    for (const t of map.tiles) {
      if (t.domainOf !== a.id) continue;
      assert.ok(hexDistance(center, { q: t.q, r: t.r }) <= DOMAIN_RADIUS);
    }
  }
});

test('no two cities are crammed on top of each other', () => {
  for (let i = 0; i < CITY_ANCHORS.length; i++) {
    for (let j = i + 1; j < CITY_ANCHORS.length; j++) {
      const a = CITY_ANCHORS[i], b = CITY_ANCHORS[j];
      const d = hexDistance(offsetToAxial(a.col, a.row), offsetToAxial(b.col, b.row));
      assert.ok(d >= 5, a.id + ' and ' + b.id + ' are only ' + d + ' hexes apart');
    }
  }
});

test('the city adjacency graph is symmetric and connects every city', () => {
  const g = computeCityNeighbors(CITY_ANCHORS);
  for (const [a, list] of Object.entries(g)) {
    assert.ok(list.length > 0, a + ' borders nobody');
    for (const b of list) assert.ok(g[b].includes(a), a + ' -> ' + b + ' is not mutual');
  }
  const seen = new Set(['xiapi']);
  const queue = ['xiapi'];
  while (queue.length) for (const n of g[queue.pop()]) if (!seen.has(n)) { seen.add(n); queue.push(n); }
  assert.equal(seen.size, CITY_ANCHORS.length, 'the city graph is not connected');
});

test('the scenario rosters, garrisons and ownership all line up', () => {
  const s = createGameState('liubei');
  assert.equal(Object.keys(s.cities).length, 12);
  assert.equal(Object.keys(s.officers).length, 39);
  assert.equal(s.factionOrder[0], 'liubei', 'the player must act first');
  assert.equal(new Set(s.factionOrder).size, s.factionOrder.length);

  const filed = Object.values(s.cities).flatMap((c) => c.officerIds);
  assert.equal(filed.length, 39);
  assert.equal(new Set(filed).size, 39);
  for (const o of Object.values(s.officers)) {
    assert.ok(s.cities[o.cityId], o.id + ' posted to a missing city');
    assert.ok(s.cities[o.cityId].officerIds.includes(o.id));
    assert.ok(o.faction === null || s.factions[o.faction], o.id + ' has a phantom faction');
  }

  // Neutral cities are garrisoned but leaderless — siege practice, not a faction.
  for (const c of Object.values(s.cities)) {
    assert.ok(c.defense > 0 && c.defense <= c.maxDefense);
    assert.ok(c.troops <= c.maxTroops, c.id + ' starts over its troop cap');
    if (c.faction === null) assert.equal(officersInCity(s, c.id).length, 0, c.id + ' is neutral but staffed');
    else assert.ok(officersInCity(s, c.id).length > 0, c.id + ' is owned but empty');
  }
  assert.equal(citiesOf(s, 'liubei').length, 2);
  assert.equal(citiesOf(s, 'caocao').length, 2);
  assert.ok(factionTroops(s, 'lubu') >= 13000);
  assert.equal(standings(s).length, 7);
});

test('any faction can be chosen and the roster derives sane tactics', () => {
  for (const id of PLAYABLE_FACTIONS) {
    const s = createGameState(id);
    assert.equal(s.playerFactionId, id);
    assert.equal(s.factions[id].isPlayer, true);
    assert.equal(Object.values(s.factions).filter((f) => f.isPlayer).length, 1);
    assert.ok(citiesOf(s, id).length > 0, id + ' starts with no city');
  }
  const o = createOfficers();
  assert.ok(o.lubu.tactics.includes('charge'));       // 무력 100
  assert.ok(!o.lubu.tactics.includes('confuse'));     // 지력 26
  assert.ok(o.jiaxu.tactics.includes('confuse'));     // 지력 97
  assert.ok(o.liubei.tactics.includes('rally'));      // 매력 99
  assert.deepEqual(tacticsFor(50, 50, 50, 50), []);
  for (const officer of Object.values(o)) {
    for (const stat of [officer.lead, officer.war, officer.int, officer.pol, officer.cha]) {
      assert.ok(stat >= 1 && stat <= 100, officer.id + ' has an out-of-range stat');
    }
  }
});

test('the unit counter table is a proper rock-paper-scissors triangle', () => {
  assert.ok(TYPE_COUNTER.spear.cavalry > 1 && TYPE_COUNTER.cavalry.spear < 1);
  assert.ok(TYPE_COUNTER.cavalry.archer > 1 && TYPE_COUNTER.archer.cavalry < 1);
  assert.ok(TYPE_COUNTER.archer.spear > 1 && TYPE_COUNTER.spear.archer < 1);
  for (const t of ['spear', 'cavalry', 'archer']) assert.equal(TYPE_COUNTER[t][t], 1);
});

test('the seeded rng replays exactly and stays in range', () => {
  const a = createRng(1234), b = createRng(1234), c = createRng(9999);
  const rollsA = Array.from({ length: 200 }, () => a.float());
  const rollsB = Array.from({ length: 200 }, () => b.float());
  assert.deepEqual(rollsA, rollsB);
  assert.notDeepEqual(rollsA, Array.from({ length: 200 }, () => c.float()));
  for (const v of rollsA) assert.ok(v >= 0 && v < 1);
  const d = createRng(7);
  for (let i = 0; i < 500; i++) { const n = d.int(3, 9); assert.ok(n >= 3 && n <= 9 && Number.isInteger(n)); }
});

// --- 내정 & turn pipeline ----------------------------------------------------

function firstIdle(state, cityId, n = 1) {
  return officersInCity(state, cityId).filter((o) => o.duty === 'idle').slice(0, n).map((o) => o.id);
}

test('development is capped by city scale until facilities raise the ceiling', () => {
  const s = createGameState('caocao');
  const chenliu = s.cities.chenliu;             // 대도시, 상업 45
  assert.equal(developmentCap(s, chenliu, 'commerce'), DEV_CAP_BY_SCALE.large);
  assert.ok(chenliu.commerce < developmentCap(s, chenliu, 'commerce'), 'no room to grow at start');

  // 순욱 정치 98 -> floor(98/8) = 12, but only up to the cap.
  const p = previewInternal(s, 'chenliu', 'commerce', ['xunyu']);
  assert.equal(p.problem, null);
  assert.equal(p.delta, Math.min(12, DEV_CAP_BY_SCALE.large - chenliu.commerce));

  chenliu.commerce = DEV_CAP_BY_SCALE.large;
  const capped = previewInternal(s, 'chenliu', 'commerce', ['xunyu']);
  assert.equal(capped.delta, 0);
  assert.ok(capped.problem, 'hitting the ceiling must say so');
});

test('a deputy helps at 60 percent and two officers beat one', () => {
  const s = createGameState('caocao');
  const solo = previewInternal(s, 'chenliu', 'commerce', ['xunyu']).delta;
  const pair = previewInternal(s, 'chenliu', 'commerce', ['xunyu', 'caocao']).delta;
  assert.ok(pair > solo, 'adding 조조 must help');
  // 98 + 94*0.6 = 154.4 -> floor(154.4/8) = 19
  assert.equal(pair, Math.min(19, DEV_CAP_BY_SCALE.large - s.cities.chenliu.commerce));
});

test('an order books its officers for the month and cannot double-book them', () => {
  const s = createGameState('caocao');
  assert.equal(queueInternal(s, 'chenliu', 'commerce', ['xunyu']).ok, true);
  assert.equal(s.officers.xunyu.duty, 'internal');
  assert.equal(queueInternal(s, 'chenliu', 'agriculture', ['xunyu']).ok, false);
  assert.equal(s.internalOrders.length, 1);
  assert.equal(queueInternal(s, 'chenliu', 'commerce', []).ok, false, 'needs at least one officer');
  assert.equal(
    queueInternal(s, 'chenliu', 'commerce', ['caocao', 'xiahoudun', 'yuejin', 'dianwei']).ok,
    false,
    'three officers is the limit',
  );
});

test('cancelling refunds exactly what was taken and frees the officer', () => {
  const s = createGameState('liubei');
  const city = s.cities.xiapi;
  const gold = city.gold, food = city.food;
  const who = firstIdle(s, 'xiapi');
  assert.equal(queueInternal(s, 'xiapi', 'draft', who).ok, true);
  assert.ok(city.gold < gold && city.food < food, 'conscription must cost up front');

  assert.equal(cancelInternal(s, 0).ok, true);
  assert.equal(city.gold, gold, 'gold refund must be exact');
  assert.equal(city.food, food, 'food refund must be exact');
  assert.equal(s.officers[who[0]].duty, 'idle');
  assert.equal(s.internalOrders.length, 0);
  assert.equal(cancelInternal(s, 0).ok, false, 'cancelling nothing is not ok');
});

test('conscription is bounded by gold, grain and the barracks cap at the same time', () => {
  const s = createGameState('liubei');
  const city = s.cities.xiapi;

  // Derived from BALANCE rather than hardcoded, so a rate change retunes the test with it.
  city.gold = 20;
  const byGold = Math.floor(20 / BALANCE.draftGoldPerTroop);
  assert.ok(previewInternal(s, 'xiapi', 'draft', ['guanyu']).delta <= byGold, 'gold must bind');

  city.gold = 99999;
  city.food = 12;
  const byFood = Math.floor(12 / BALANCE.draftFoodPerTroop);
  assert.ok(previewInternal(s, 'xiapi', 'draft', ['guanyu']).delta <= byFood, 'grain must bind');

  city.food = 99999;
  city.troops = city.maxTroops;            // a full barracks binds at zero
  const full = previewInternal(s, 'xiapi', 'draft', ['guanyu']);
  assert.equal(full.delta, 0);
  assert.ok(full.problem);

  city.troops = 0;
  const free = previewInternal(s, 'xiapi', 'draft', ['guanyu']);
  assert.ok(free.delta > 0 && free.delta <= city.maxTroops + barracksBonus(s, city));
});

test('resolving delivers exactly what the preview promised', () => {
  const s = createGameState('liubei');
  const city = s.cities.xiapi;
  const before = city.troops;
  const preview = previewInternal(s, 'xiapi', 'draft', ['guanyu']);
  assert.equal(queueInternal(s, 'xiapi', 'draft', ['guanyu']).ok, true);
  resolveInternalOrders(s);
  assert.equal(city.troops - before, preview.delta, 'headcount must match the quote');
  assert.equal(s.officers.guanyu.duty, 'idle', 'the officer clocks off after the month');
  assert.equal(s.internalOrders.length, 0);
});

test('a facility raises the ceiling only once it is finished', () => {
  const s = createGameState('liubei');
  const city = s.cities.xiapi;
  const spot = s.map.tiles.find(
    (t) => t.domainOf === 'xiapi' && !t.cityId && !t.facility && t.terrain === 'plain',
  );
  assert.ok(spot, 'expected somewhere buildable in the 하비 domain');
  const at = { q: spot.q, r: spot.r };
  assert.equal(canBuildAt(s, 'xiapi', at, 'market').ok, true);

  const capBefore = developmentCap(s, city, 'commerce');
  city.gold = 5000;
  assert.equal(queueInternal(s, 'xiapi', 'build', ['chendeng'], at, 'market').ok, true);
  resolveInternalOrders(s);
  assert.ok(spot.facility, 'construction must be placed on the tile');
  assert.ok(spot.facility.buildTurnsLeft > 0);
  assert.equal(developmentCap(s, city, 'commerce'), capBefore, 'unfinished work must not count');
  assert.equal(s.officers.chendeng.duty, 'internal', 'the builder stays on site');

  let guard = 0;
  while (spot.facility.buildTurnsLeft > 0 && guard++ < 20) tickBuilds(s);
  assert.equal(spot.facility.buildTurnsLeft, 0);
  assert.equal(developmentCap(s, city, 'commerce'), capBefore + 8);
  assert.equal(s.officers.chendeng.duty, 'idle', 'the builder is released on completion');
  assert.equal(canBuildAt(s, 'xiapi', at, 'farm').ok, false, 'the tile is taken now');
});

test('grain arrives only at the autumn harvest, gold arrives every month', () => {
  const s = createGameState('liubei');
  assert.notEqual(s.month, HARVEST_MONTH, 'the scenario should not open on harvest month');
  const city = s.cities.xiapi;
  city.food = 100000;                     // take famine out of the picture
  const beforeFood = city.food, beforeGold = city.gold;

  collectIncome(s, 'liubei');
  assert.ok(city.gold > beforeGold, 'commerce must pay every month');
  assert.ok(city.food < beforeFood, 'upkeep eats grain in an ordinary month');

  s.month = HARVEST_MONTH;
  const preHarvest = city.food;
  const events = collectIncome(s, 'liubei');
  assert.ok(city.food > preHarvest, 'the harvest must outweigh upkeep');
  assert.ok(events.some((e) => e.kind === 'harvest'));
});

test('an empty granary disbands troops instead of going negative', () => {
  const s = createGameState('liubei');
  const city = s.cities.xiapi;
  city.food = 0;
  const troops = city.troops;
  const events = collectIncome(s, 'liubei');
  assert.equal(city.food, 0, 'grain must never go negative');
  assert.ok(city.troops < troops, 'starving soldiers desert');
  assert.ok(events.some((e) => e.kind === 'famine' && e.cityId === 'xiapi'));
});

test('ending the turn rolls the calendar and always lands back on the player', () => {
  const s = createGameState('liubei');
  const startMonth = s.month;
  runTurn(s);
  assert.equal(s.month, startMonth + 1);
  assert.equal(s.phase, 'player');
  assert.equal(s.turn, 2);

  s.month = 12;
  const year = s.year;
  runTurn(s);
  assert.equal(s.month, 1);
  assert.equal(s.year, year + 1);
});

test('the turn runner terminates, and draining it matches stepping it', () => {
  const stepped = createGameState('liubei');
  const runner = beginTurn(stepped);
  let count = 0;
  while (runner.next(stepped)) {
    if (++count > 5000) throw new Error('turn resolution did not terminate');
  }
  assert.equal(stepped.phase, 'player');
  assert.ok(runner.done);

  const drained = createGameState('liubei');
  const events = runTurn(drained);
  assert.equal(events.length, count, 'the fast path must produce the same events');
  assert.equal(drained.turn, stepped.turn);
  assert.equal(drained.month, stepped.month);
});

test('a turn cannot be started while one is already running', () => {
  const s = createGameState('liubei');
  s.phase = 'resolve';
  assert.throws(() => beginTurn(s));
});

test('the same seed replays identically through ten turns of administration', () => {
  const play = (seed) => {
    const s = createGameState('caocao', seed);
    for (let i = 0; i < 10; i++) {
      const who = firstIdle(s, 'chenliu', 2);
      if (who.length) queueInternal(s, 'chenliu', i % 2 ? 'agriculture' : 'commerce', who);
      runTurn(s);
    }
    return s;
  };
  const a = play(4242), b = play(4242);
  assert.deepEqual(a.cities, b.cities);
  assert.deepEqual(a.officers, b.officers);
  assert.equal(a.turn, 11);
  assert.ok(a.cities.chenliu.commerce > 45, 'sanity: development actually happened');
});

test('ten turns of steady administration break no invariant', () => {
  const s = createGameState('caocao');
  for (let turn = 0; turn < 10; turn++) {
    for (const city of citiesOf(s, 'caocao')) {
      const idle = firstIdle(s, city.id, 2);
      if (idle.length === 0) continue;
      const kind = city.order < 70
        ? 'order'
        : city.commerce < developmentCap(s, city, 'commerce') ? 'commerce' : 'agriculture';
      queueInternal(s, city.id, kind, idle);
    }
    runTurn(s);
  }
  for (const city of Object.values(s.cities)) {
    assert.ok(city.gold >= 0, city.id + ' went into debt');
    assert.ok(city.food >= 0, city.id + ' has negative grain');
    assert.ok(city.order >= 0 && city.order <= 100, city.id + ' has impossible order');
    assert.ok(city.troops >= 0 && city.troops <= city.maxTroops + barracksBonus(s, city));
    assert.ok(city.defense >= 0 && city.defense <= city.maxDefense);
    assert.ok(city.commerce <= developmentCap(s, city, 'commerce'));
    assert.ok(city.agriculture <= developmentCap(s, city, 'agriculture'));
  }
  for (const o of Object.values(s.officers)) {
    assert.ok(['idle', 'internal', 'marching', 'captured'].includes(o.duty));
  }
  assert.ok(s.cities.chenliu.commerce > 45, 'ten months of work should show');
});

// --- movement ----------------------------------------------------------------

/** Put an army of a given shape next to a chosen hex, bypassing the march. */
function army(state, cityId, officerIds, type, troops, at) {
  const city = state.cities[cityId];
  city.troops = troops + 2000; city.gold = 99999; city.food = 99999;
  const r = dispatch(state, { cityId, officerIds, type, troops });
  assert.equal(r.ok, true, 'dispatch: ' + (r.reason ?? ''));
  const unit = Object.values(state.units).find((u) => u.officerIds[0] === officerIds[0]);
  if (at) {
    tileAt(state.map, unit.coord).unitId = null;
    unit.coord = at;
    tileAt(state.map, at).unitId = unit.id;
  }
  unit.movesLeft = 12; unit.energy = 100; unit.hasActed = false;
  return unit;
}

test('dispatch takes the bill out of the city and marches at half speed', () => {
  const s = createGameState('liubei');
  const city = s.cities.xiapi;
  const gold = city.gold, food = city.food, troops = city.troops;
  const cost = dispatchCost(3000);
  const r = dispatch(s, { cityId: 'xiapi', officerIds: ['guanyu'], type: 'cavalry', troops: 3000 });
  assert.equal(r.ok, true);
  assert.equal(city.troops, troops - 3000);
  assert.equal(city.gold, gold - cost.gold);
  assert.equal(city.food, food - cost.food);
  const unit = Object.values(s.units)[0];
  assert.equal(unit.food, unitFoodCapacity(3000));
  assert.equal(unit.movesLeft, 6, 'a fresh army starts on half movement');
  assert.equal(s.officers.guanyu.duty, 'marching');
  assert.equal(tileAt(s.map, unit.coord).unitId, unit.id, 'occupancy index must be set');
  assert.equal(validateDispatch(s, { cityId: 'xiapi', officerIds: ['guanyu'], type: 'spear', troops: 1000 }).ok,
    false, 'a marching officer cannot be dispatched again');
});

test('reachability respects terrain cost, water and occupancy', () => {
  const s = createGameState('liubei');
  const unit = army(s, 'xiapi', ['guanyu'], 'cavalry', 3000);
  const reach = reachable(s, unit);
  assert.ok(reach.size > 1, 'an army with movement can go somewhere');
  for (const [, entry] of reach) {
    const tile = tileAt(s.map, entry.hex);
    assert.notEqual(tile.terrain, 'water', 'cavalry cannot swim');
    assert.ok(entry.cost <= unit.movesLeft);
  }
  // Roads are cheaper than plains, so a road hex at the same distance costs less.
  const roads = [...reach.values()].filter((e) => tileAt(s.map, e.hex).terrain === 'road');
  const hills = [...reach.values()].filter((e) => tileAt(s.map, e.hex).terrain === 'hill');
  if (roads.length && hills.length) {
    const nearestRoad = Math.min(...roads.map((e) => e.cost / Math.max(1, hexDistance(unit.coord, e.hex))));
    const nearestHill = Math.min(...hills.map((e) => e.cost / Math.max(1, hexDistance(unit.coord, e.hex))));
    assert.ok(nearestRoad < nearestHill, 'a gado must be cheaper per hex than a hill');
  }
  assert.equal(costTo(s, unit, { q: 999, r: 999 }), null, 'off-map is unreachable');
});

test('an enemy hex is impassable and leaving its zone of control costs extra', () => {
  const s = createGameState('liubei');
  const mine = army(s, 'xiapi', ['guanyu'], 'spear', 3000);
  const free = costTo(s, mine, hexNeighbors(mine.coord).find((h) => {
    const t = tileAt(s.map, h);
    return t && t.terrain !== 'water' && !t.cityId && t.unitId == null;
  }));

  // Drop an enemy right beside it and re-measure the same step.
  const foe = army(s, 'xiaopei', ['zhangfei'], 'spear', 2000);
  const spot = hexNeighbors(mine.coord).find((h) => {
    const t = tileAt(s.map, h);
    return t && t.terrain !== 'water' && !t.cityId && t.unitId == null;
  });
  tileAt(s.map, foe.coord).unitId = null;
  foe.coord = spot; tileAt(s.map, spot).unitId = foe.id;
  foe.faction = 'caocao';

  assert.equal(isPassable(s, spot, 'liubei'), false, 'an occupied hex is never passable');
  const reach = reachable(s, mine);
  for (const [, entry] of reach) {
    if (hexEquals(entry.hex, mine.coord)) continue;
    assert.ok(entry.cost >= free, 'every step out of a ZOC costs at least the plain cost');
  }
  const anyStep = [...reach.values()].find((e) => !hexEquals(e.hex, mine.coord));
  assert.ok(anyStep.cost >= free + BALANCE.zocPenalty - 2, 'the ZOC surcharge must actually bite');
});

// --- combat ------------------------------------------------------------------

/** Two armies facing each other on identical ground, so only the variable under test moves. */
function duel(typeA, typeB, tweak = () => {}) {
  const s = createGameState('liubei');
  const a = army(s, 'xiapi', ['guanyu'], typeA, 5000);
  const b = army(s, 'xiaopei', ['zhangfei'], typeB, 5000);
  b.faction = 'caocao';
  // Park them side by side on plain ground.
  const spot = hexNeighbors(a.coord).find((h) => {
    const t = tileAt(s.map, h);
    return t && t.terrain === 'plain' && !t.cityId && t.unitId == null;
  }) ?? hexNeighbors(a.coord).find((h) => {
    const t = tileAt(s.map, h);
    return t && t.terrain !== 'water' && !t.cityId && t.unitId == null;
  });
  tileAt(s.map, b.coord).unitId = null;
  b.coord = spot; tileAt(s.map, spot).unitId = b.id;
  a.morale = b.morale = 80; a.energy = b.energy = 100;
  tweak(s, a, b);
  return { s, a, b };
}

test('the counter triangle actually changes casualties', () => {
  const even = duel('spear', 'spear');
  const good = duel('spear', 'cavalry');
  const bad = duel('spear', 'archer');
  const base = expectedCasualties(even.s, even.a, even.b);
  assert.ok(expectedCasualties(good.s, good.a, good.b) > base * 1.4, 'spear into cavalry must hurt');
  assert.ok(expectedCasualties(bad.s, bad.a, bad.b) < base, 'spear into archer must not');
});

test('casualties scale with troops, morale and energy, and never exceed the target', () => {
  const { s, a, b } = duel('spear', 'spear');
  const base = expectedCasualties(s, a, b);

  a.troops = 10000;
  assert.ok(expectedCasualties(s, a, b) > base, 'more men hit harder');
  a.troops = 5000;

  a.morale = 20;
  assert.ok(expectedCasualties(s, a, b) < base, 'a dispirited army hits softer');
  a.morale = 80;

  a.energy = 0;
  assert.ok(expectedCasualties(s, a, b) < base * 0.7, 'an exhausted army loses at least 30%');
  a.energy = 100;

  b.troops = 100;
  assert.ok(expectedCasualties(s, a, b) <= 100, 'you cannot kill more men than are there');
});

test('a ranged archer takes no counterblow, a melee attacker does', () => {
  const melee = duel('spear', 'spear');
  const before = melee.a.troops;
  resolveAttack(melee.s, melee.a, melee.b.coord);
  assert.ok(melee.a.troops < before, 'an adjacent attacker gets hit back');

  const shoot = duel('archer', 'spear');
  // Step the target out to range 2 so the archer is shooting, not brawling.
  const far = hexNeighbors(shoot.b.coord).find((h) => {
    const t = tileAt(shoot.s.map, h);
    return t && t.terrain !== 'water' && !t.cityId && t.unitId == null
      && hexDistance(shoot.a.coord, h) === 2;
  });
  if (far) {
    tileAt(shoot.s.map, shoot.b.coord).unitId = null;
    shoot.b.coord = far; tileAt(shoot.s.map, far).unitId = shoot.b.id;
    const troops = shoot.a.troops;
    const events = resolveAttack(shoot.s, shoot.a, far).events;
    assert.equal(shoot.a.troops, troops, 'range 2 must be answered by nothing');
    assert.equal(events.find((e) => e.kind === 'battle').taken, 0);
  }
});

test('an attack spends energy and the month, and a tactic spends more', () => {
  const plain = duel('spear', 'spear');
  resolveAttack(plain.s, plain.a, plain.b.coord);
  assert.equal(plain.a.energy, 100 - BALANCE.energyPerAttack);
  assert.equal(plain.a.hasActed, true);
  assert.equal(plain.a.movesLeft, 0);

  const tactical = duel('spear', 'spear');
  assert.ok(availableTactics(tactical.s, tactical.a).includes('pike'), '관우 knows 제사');
  resolveAttack(tactical.s, tactical.a, tactical.b.coord, 'pike');
  assert.equal(tactical.a.energy, 100 - TACTICS.pike.energy);
  // 기력 gates which 전법 are on the table: at 30 the cheap ones remain, 화계 does not.
  tactical.a.energy = 30;
  const left = availableTactics(tactical.s, tactical.a);
  assert.ok(!left.includes('fire'), '화계 costs 50 and must be out of reach at 30');
  assert.ok(left.includes('rally'), '고무 costs 30 and must still be offered');
});

test('morale reaching zero routs the army off the board', () => {
  const { s, a, b } = duel('spear', 'spear');
  b.morale = 1;
  b.troops = 20000;               // survivable, so this is a rout and not a wipe-out
  const events = resolveAttack(s, a, b.coord).events;
  assert.ok(events.some((e) => e.kind === 'rout'), 'a broken army must rout');
  assert.equal(s.units[b.id], undefined, 'and leave the field');
  assert.equal(tileAt(s.map, b.coord).unitId, null, 'the occupancy index must be cleared');
});

// --- siege, supply, victory --------------------------------------------------

test('a siege breaks the wall, bleeds the garrison, and only then opens the gate', () => {
  const s = createGameState('caocao');
  const target = s.cities.xuchang;
  const spot = hexNeighbors(target.coord).find((h) => {
    const t = tileAt(s.map, h);
    return t && t.terrain !== 'water' && !t.cityId && t.unitId == null;
  });
  const unit = army(s, 'chenliu', ['xiahoudun', 'yuejin'], 'spear', 9000, spot);

  assert.equal(canCapture(s, unit, target).ok, false, 'an intact wall cannot be walked through');
  const wall = target.defense, garrison = target.troops, mine = unit.troops;
  const events = resolveAttack(s, unit, target.coord).events;
  const siege = events.find((e) => e.kind === 'siege');
  assert.ok(siege, 'an assault on a city is a siege, not a battle');
  assert.ok(target.defense < wall, 'the wall must take damage');
  assert.ok(target.troops < garrison, 'and the garrison must bleed with it');
  assert.ok(unit.troops < mine, 'the walls cost the attacker too');

  // Hammer it until the wall is gone, then the gate is open regardless of movement.
  for (let i = 0; i < 20 && target.defense > 0; i++) {
    unit.energy = 100; unit.hasActed = false;
    resolveAttack(s, unit, target.coord);
  }
  assert.equal(target.defense, 0);
  assert.equal(unit.movesLeft, 0, 'an assault always ends the month');
  assert.equal(canCapture(s, unit, target).ok, true, 'capture must not require leftover movement');
});

test('cavalry are poor at sieges and spearmen are not', () => {
  const build = (type) => {
    const s = createGameState('caocao');
    const target = s.cities.xuchang;
    const spot = hexNeighbors(target.coord).find((h) => {
      const t = tileAt(s.map, h);
      return t && t.terrain !== 'water' && !t.cityId && t.unitId == null;
    });
    const unit = army(s, 'chenliu', ['xiahoudun'], type, 8000, spot);
    // Raise the wall out of reach so neither result is clipped by the wall running out,
    // which would make both types look identical.
    target.defense = 500000;
    const before = target.defense;
    resolveAttack(s, unit, target.coord);
    return before - target.defense;
  };
  assert.ok(build('spear') > build('cavalry') * 1.4, 'a horse is a bad battering ram');
});

test('capturing flips the city, sacks it, garrisons it and razes the old works', () => {
  const s = createGameState('caocao');
  const target = s.cities.xiaopei;            // 유비's, so it has officers to lose
  // Give it a facility of its own to burn.
  const domainTile = s.map.tiles.find((t) => t.domainOf === 'xiaopei' && !t.cityId && t.terrain === 'plain');
  domainTile.facility = { type: 'farm', ownerCity: 'xiaopei', faction: 'liubei', buildTurnsLeft: 0, builderId: null };

  const spot = hexNeighbors(target.coord).find((h) => {
    const t = tileAt(s.map, h);
    return t && t.terrain !== 'water' && !t.cityId && t.unitId == null;
  });
  const unit = army(s, 'chenliu', ['xiahoudun'], 'spear', 12000, spot);
  target.defense = 0;
  const gold = target.gold, food = target.food, storming = unit.troops;

  const events = captureCity(s, unit, target);
  assert.equal(target.faction, 'caocao');
  assert.equal(target.gold, Math.round(gold * BALANCE.captureStoreLoss));
  assert.equal(target.food, Math.round(food * BALANCE.captureStoreLoss));
  assert.equal(target.order, BALANCE.captureOrder);
  assert.equal(target.defense, Math.round(target.maxDefense * BALANCE.captureDefenseFraction));
  assert.ok(target.troops > 0, 'the victor leaves a garrison behind');
  assert.ok(unit.troops < storming, 'taken out of the storming army');
  assert.equal(domainTile.facility, null, 'the old owner works burn with the city');
  assert.ok(hexEquals(unit.coord, target.coord), 'the army occupies the hex');
  assert.ok(events.some((e) => e.kind === 'capture'));
  // Every officer who was inside either fled or changed banner — nobody is left in limbo.
  for (const o of Object.values(s.officers)) {
    if (o.cityId !== 'xiaopei') continue;
    assert.ok(o.faction === 'caocao' || o.duty === 'captured');
  }
});

test('supply follows friendly ground and an enemy on the road cuts it', () => {
  const s = createGameState('liubei');
  const unit = army(s, 'xiapi', ['guanyu'], 'spear', 4000);
  assert.equal(isSupplied(s, unit), true, 'an army at home is fed');

  // Strand it in the far west, well past any corridor of ours.
  tileAt(s.map, unit.coord).unitId = null;
  const far = offsetToAxial(10, 10);
  unit.coord = far; tileAt(s.map, far).unitId = unit.id;
  assert.equal(isSupplied(s, unit), false, 'ten hexes into nobody land is not fed');

  unit.food = 0;
  const events = resolveSupply(s);
  assert.ok(events.some((e) => e.kind === 'starve'), 'an army with no grain and no line starves');
  assert.ok(unit.unsuppliedTurns > 0);
});

test('supply refills a fed army and never overfills it', () => {
  const s = createGameState('liubei');
  const unit = army(s, 'xiapi', ['guanyu'], 'spear', 4000);
  const cap = unitFoodCapacity(4000);
  unit.food = 10;
  resolveSupply(s);
  assert.ok(unit.food > 10, 'a connected army is topped back up');
  assert.ok(unit.food <= cap, 'but never beyond what it can carry');
  assert.equal(unit.unsuppliedTurns, 0);
});

test('victory needs every city, defeat needs no city and no army', () => {
  const s = createGameState('liubei');
  assert.deepEqual(evaluateVictory(s).filter((e) => e.kind === 'result'), []);

  const all = createGameState('liubei');
  for (const city of Object.values(all.cities)) city.faction = 'liubei';
  evaluateVictory(all);
  assert.equal(all.result, 'victory');

  const lost = createGameState('liubei');
  for (const city of Object.values(lost.cities)) {
    if (city.faction === 'liubei') city.faction = 'caocao';
  }
  // One army still in the field means the game is not over.
  army(lost, 'chenliu', ['xiahoudun'], 'spear', 3000);
  Object.values(lost.units)[0].faction = 'liubei';
  evaluateVictory(lost);
  assert.equal(lost.result, 'playing', 'a surviving army can still retake a city');

  for (const u of Object.values(lost.units)) delete lost.units[u.id];
  evaluateVictory(lost);
  assert.equal(lost.result, 'defeat');
  assert.equal(lost.factions.liubei.alive, false);
});

// --- AI ----------------------------------------------------------------------

/** Drive every faction, including the player's, with the AI. The balance instrument. */
function autoplay(seed, turns) {
  const s = createGameState('liubei', seed);
  const captures = [];
  for (let t = 0; t < turns && s.result === 'playing'; t++) {
    planInternal(s, s.playerFactionId);
    for (const cmd of planMilitary(s, s.playerFactionId)) {
      if (cmd.kind === 'dispatch') dispatch(s, cmd);
      else if (cmd.kind === 'move') moveUnit(s, cmd.unitId, cmd.to);
      else if (cmd.kind === 'attack') {
        const u = s.units[cmd.unitId];
        if (u) resolveAttack(s, u, cmd.target, cmd.tactic);
      } else if (cmd.kind === 'capture') {
        const u = s.units[cmd.unitId], c = s.cities[cmd.cityId];
        if (u && c) captureCity(s, u, c);
      } else if (cmd.kind === 'return') returnToCity(s, cmd.unitId);
    }
    for (const e of runTurn(s)) if (e.kind === 'capture') captures.push(e);
  }
  return { state: s, captures };
}

test('the AI never issues a command the rules would reject', () => {
  const s = createGameState('liubei', 31);
  for (let turn = 0; turn < 25; turn++) {
    for (const fid of s.factionOrder) {
      for (const cmd of planMilitary(s, fid)) {
        if (cmd.kind === 'move') {
          const unit = s.units[cmd.unitId];
          assert.ok(unit, 'a command must name a real unit');
          assert.equal(unit.faction, fid, 'a faction cannot order somebody else army');
          const entry = reachable(s, unit).get(hexKey(cmd.to));
          assert.ok(entry, 'the AI must not walk somewhere it cannot reach');
          assert.ok(entry.cost <= unit.movesLeft, 'nor spend movement it does not have');
          assert.notEqual(tileAt(s.map, cmd.to).terrain, 'water', 'nor march into the river');
        }
        if (cmd.kind === 'dispatch') {
          assert.equal(validateDispatch(s, cmd).ok, true, 'dispatch must be legal: ' + JSON.stringify(cmd));
        }
        if (cmd.kind === 'attack') {
          const unit = s.units[cmd.unitId];
          assert.ok(attackTargets(s, unit).some((h) => hexEquals(h, cmd.target)),
            'the AI must only swing at something it can actually reach');
        }
        if (cmd.kind === 'capture') {
          assert.equal(canCapture(s, s.units[cmd.unitId], s.cities[cmd.cityId]).ok, true);
        }
      }
    }
    planInternal(s, s.playerFactionId);
    runTurn(s);
  }
});

test('the AI keeps a gold reserve and never over-commits its granary', () => {
  const { state } = autoplay(5, 30);
  for (const city of Object.values(state.cities)) {
    assert.ok(city.gold >= 0, city.id + ' spent money it did not have');
    assert.ok(city.food >= 0, city.id + ' spent grain it did not have');
    assert.ok(city.troops >= 0);
  }
  for (const unit of Object.values(state.units)) {
    assert.ok(unit.troops > 0, 'a unit with no men must not linger on the board');
    assert.ok(unit.food >= 0);
    assert.equal(tileAt(state.map, unit.coord).unitId, unit.id, 'occupancy index out of sync');
  }
  // No tile may claim a unit that no longer exists.
  for (const tile of state.map.tiles) {
    if (tile.unitId != null) assert.ok(state.units[tile.unitId], 'stale unit on tile');
  }
});

test('a sixty-turn all-AI campaign runs clean and actually redraws the map', () => {
  const { state, captures } = autoplay(1, 60);
  assert.ok(captures.length >= 4, 'only ' + captures.length + ' cities changed hands in 60 turns');
  const owners = new Set(Object.values(state.cities).map((c) => c.faction));
  assert.ok(owners.size < 8, 'somebody should have consolidated by now');
  // Officers are never left pointing at an army that no longer exists.
  for (const o of Object.values(state.officers)) {
    if (o.unitId != null) assert.ok(state.units[o.unitId], o.id + ' marches with a ghost army');
    if (o.duty === 'marching') assert.ok(o.unitId != null, o.id + ' is marching with nothing');
  }
});

test('the whole campaign is deterministic under a fixed seed', () => {
  const a = autoplay(77, 20).state;
  const b = autoplay(77, 20).state;
  assert.equal(a.rngSeed, b.rngSeed, 'a stray Math.random() has crept into the rules layer');
  assert.deepEqual(a.cities, b.cities);
  assert.deepEqual(a.units, b.units);
  assert.deepEqual(a.officers, b.officers);
  const c = autoplay(78, 20).state;
  assert.notDeepEqual(a.log.map((l) => l.text), c.log.map((l) => l.text), 'seeds must diverge');
});

test('explainMilitary reports the numbers a balance pass needs', () => {
  const s = createGameState('liubei');
  const e = explainMilitary(s, 'caocao');
  assert.equal(e.cities, 2);
  assert.equal(e.armies, 0);
  assert.ok(e.garrison > 0 && e.gold > 0);
  assert.ok(e.candidates.length > 0, 'somebody must look attackable from 진류');
  for (const c of e.candidates) {
    assert.ok(c.distance <= 12);
    assert.equal(c.ok, c.force > c.need);
  }
});
