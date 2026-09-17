import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

// Bundle the browser's extensionless TS imports into one in-memory Node module.
const compiled = await build({ stdin: { contents: `
  export * from './src/games/three-kingdoms/game/hex';
`, resolveDir: process.cwd() }, bundle: true, write: false, format: 'esm', platform: 'node' });
const {
  HEX_DIRS, hexKey, hexEquals, hexAdd, hexDistance, hexNeighbors, hexesInRange,
  axialToOffset, offsetToAxial, axialToPixel, pixelToAxial, hexRound, hexCorners, hexLine,
} = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));

const MAP_W = 28, MAP_H = 18;
function allTiles() {
  const out = [];
  for (let row = 0; row < MAP_H; row++) for (let col = 0; col < MAP_W; col++) out.push({ col, row });
  return out;
}

test('odd-r offset and axial round-trip for every tile on the real map', () => {
  for (const { col, row } of allTiles()) {
    const axial = offsetToAxial(col, row);
    const back = axialToOffset(axial);
    assert.deepEqual(back, { col, row }, `offset round-trip failed at ${col},${row}`);
  }
});

test('pixel round-trips back to the same hex at every zoom the camera allows', () => {
  for (const size of [34 * 0.6, 34, 34 * 2]) {
    for (const { col, row } of allTiles()) {
      const axial = offsetToAxial(col, row);
      const px = axialToPixel(axial, size);
      assert.ok(hexEquals(pixelToAxial(px, size), axial), `center round-trip failed at ${col},${row} size ${size}`);
      // Points well inside the hex must resolve to it too — this is what hit-testing does.
      for (const [dx, dy] of [[0.4, 0], [-0.4, 0], [0, 0.4], [0, -0.4], [0.3, 0.3], [-0.3, -0.3]]) {
        const near = { x: px.x + dx * size, y: py(px, dy, size) };
        assert.ok(hexEquals(pixelToAxial(near, size), axial), `offset hit-test failed at ${col},${row}`);
      }
    }
  }
  function py(px, dy, size) { return px.y + dy * size; }
});

test('distance is symmetric, zero on self, and one for every neighbour', () => {
  const a = offsetToAxial(7, 5), b = offsetToAxial(19, 12);
  assert.equal(hexDistance(a, b), hexDistance(b, a));
  assert.equal(hexDistance(a, a), 0);
  const n = hexNeighbors(a);
  assert.equal(n.length, 6);
  assert.equal(new Set(n.map(hexKey)).size, 6);
  for (const h of n) assert.equal(hexDistance(a, h), 1);
  // Stepping k times in one direction is exactly k away.
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
    assert.equal(Number.isInteger(h.q) && Number.isInteger(h.r), true);
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
  // Pointy-top means a corner straight up and flat vertical sides.
  assert.ok(corners.some((c) => Math.abs(c.x) < 1e-9 && Math.abs(c.y + 34) < 1e-9));
});
