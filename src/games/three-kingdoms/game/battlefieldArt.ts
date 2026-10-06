import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { axialToPixel, hexNeighbors, pixelToAxial, hexKey, hexLine } from './hex';
import { HEX_SIZE } from './constants';
import type { GameMap, UnitType, Tile } from './types';
import { box, mesh } from './models';
import { ROADS } from './scenario';

const earth = { plain: '#77734c', forest: '#454f32', hill: '#77705d', mountain: '#716e62', water: '#244d55', road: '#8f805e', wasteland: '#8c795e' };
const hash = (x: number, z: number) => {
  let h = Math.imul(x + 137, 374761393) ^ Math.imul(z + 719, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
const smooth = (v: number) => v * v * (3 - 2 * v);
function noise(x: number, z: number): number {
  const ix = Math.floor(x), iz = Math.floor(z), a = smooth(x - ix), b = smooth(z - iz);
  return T.MathUtils.lerp(T.MathUtils.lerp(hash(ix, iz), hash(ix + 1, iz), a), T.MathUtils.lerp(hash(ix, iz + 1), hash(ix + 1, iz + 1), a), b);
}

/** The rule grid stays intact; the rendered surface blends across its boundaries. */
export function terrainSampler(map: GameMap) {
  const tiles = new Map(map.tiles.map(t => [hexKey(t), t]));
  const colors = Object.fromEntries(Object.entries(earth).map(([k, v]) => [k, new T.Color(v)])) as Record<keyof typeof earth, T.Color>;
  return (x: number, z: number) => {
    const h = pixelToAxial({ x, y: z }, HEX_SIZE);
    let weight = 0, mountain = 0, hill = 0, water = 0, city = 0;
    const color = new T.Color(0, 0, 0);
    for (const coord of [h, ...hexNeighbors(h)]) {
      const tile = tiles.get(hexKey(coord)); if (!tile) continue;
      const p = axialToPixel(tile, HEX_SIZE), d = Math.hypot(x - p.x, z - p.y);
      const w = Math.pow(Math.max(0, 1 - d / 61), 3); if (!w) continue;
      weight += w; color.add(colors[tile.terrain].clone().multiplyScalar(w));
      if (tile.terrain === 'mountain') mountain += w;
      if (tile.terrain === 'hill') hill += w;
      if (tile.terrain === 'water') water += w;
      if (tile.cityId || tile.terrain === 'road') city = Math.max(city, Math.max(0, 1 - d / 44));
    }
    if (!weight) return { height: -3, water: 0, color: new T.Color('#4b4a36') };
    color.multiplyScalar(1 / weight);
    water /= weight; mountain /= weight; hill /= weight;
    const broad = noise(x / 90, z / 90), detail = noise(x / 14, z / 14);
    const ridge = 1 - Math.abs(noise(x / 32, z / 38) * 2 - 1);
    const height = (mountain * (32 + ridge * 85 + detail * 18) + hill * (4 + broad * 12)) * Math.pow(1 - city, 3) - water * 3 - .6;
    color.multiplyScalar(.77 + broad * .32 + detail * .16);
    if (mountain > .25) color.lerp(new T.Color('#b4b2a5'), mountain * ridge * .3);
    if (water > .48) color.lerp(new T.Color('#254b50'), .75);
    return { height, water, color };
  };
}

export function landscape(map: GameMap): { group: T.Group; ground: T.Mesh; sample: ReturnType<typeof terrainSampler> } {
  const group = new T.Group(), sample = terrainSampler(map);
  const points = map.tiles.map(t => axialToPixel(t, HEX_SIZE));
  const minX = Math.min(...points.map(p => p.x)) - 34, maxX = Math.max(...points.map(p => p.x)) + 34;
  const minZ = -34, maxZ = Math.max(...points.map(p => p.y)) + 34;
  const geometry = new T.PlaneGeometry(maxX - minX, maxZ - minZ, Math.ceil((maxX - minX) / 7), Math.ceil((maxZ - minZ) / 7));
  geometry.rotateX(-Math.PI / 2); geometry.translate((maxX + minX) / 2, 0, (maxZ + minZ) / 2);
  const positions = geometry.getAttribute('position'), colors = new Float32Array(positions.count * 3), wet = new Float32Array(positions.count);
  for (let i = 0; i < positions.count; i++) {
    const s = sample(positions.getX(i), positions.getZ(i)); positions.setY(i, s.height);
    s.color.toArray(colors, i * 3); wet[i] = s.water;
  }
  geometry.setAttribute('color', new T.BufferAttribute(colors, 3)); geometry.computeVertexNormals();
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d')!; ctx.fillStyle = '#dfdfdf'; ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 24000; i++) {
    const x = hash(i, 7) * 512, y = hash(i, 11) * 512, grey = Math.floor(160 + hash(i, 17) * 80);
    ctx.fillStyle = `rgba(${grey},${grey},${grey},.22)`; ctx.fillRect(x, y, 1 + hash(i, 5) * 6, 1 + hash(i, 2) * 4);
  }
  const texture = new T.CanvasTexture(canvas); texture.wrapS = texture.wrapT = T.RepeatWrapping; texture.repeat.set(24, 14); texture.colorSpace = T.SRGBColorSpace;
  const ground = new T.Mesh(geometry, new T.MeshStandardMaterial({ vertexColors: true, map: texture, bumpMap: texture, bumpScale: .7, roughness: .94 }));
  ground.receiveShadow = true; group.add(ground);
  const tileLookup = new Map(map.tiles.map(t => [hexKey(t), t])), roadVertices: number[] = [];
  for (const [fromId, toId] of ROADS) {
    const origin = map.tiles.find(t => t.cityId === fromId), destination = map.tiles.find(t => t.cityId === toId);
    if (!origin || !destination) continue;
    const path = hexLine(origin, destination).map(h => { const p = axialToPixel(h, HEX_SIZE); return new T.Vector3(p.x, 0, p.y); });
    const curve = new T.CatmullRomCurve3(path), steps = Math.ceil(curve.getLength() / 6);
    for (let step = 0; step < steps; step++) {
      const a = curve.getPoint(step / steps), b = curve.getPoint((step + 1) / steps), mid = a.clone().lerp(b, .5);
      const tile = tileLookup.get(hexKey(pixelToAxial({ x: mid.x, y: mid.z }, HEX_SIZE)));
      if (!tile || (tile.terrain !== 'road' && !tile.cityId)) continue;
      const tangent = curve.getTangent((step + .5) / steps), nx = -tangent.z * 2.2, nz = tangent.x * 2.2;
      const corners = [[a.x + nx,a.z + nz],[a.x - nx,a.z - nz],[b.x - nx,b.z - nz],[b.x + nx,b.z + nz]];
      for (const i of [0,3,1,1,3,2]) { const [x,z]=corners[i]; roadVertices.push(x,sample(x,z).height + .16,z); }
    }
  }
  const roadGeometry = new T.BufferGeometry(); roadGeometry.setAttribute('position', new T.Float32BufferAttribute(roadVertices, 3)); roadGeometry.computeVertexNormals();
  const roads = new T.Mesh(roadGeometry, new T.MeshStandardMaterial({ color: '#9b8761', roughness: 1 })); roads.receiveShadow = true; group.add(roads);
  // A separate glossy river surface follows only river triangles, preserving the fords.
  const riverVertices: number[] = [], riverUV: number[] = [], index = geometry.getIndex()!;
  for (let i = 0; i < index.count; i += 3) {
    const ids = [index.getX(i), index.getX(i + 1), index.getX(i + 2)];
    const polygon: { x: number; z: number }[] = [];
    for (let edge = 0; edge < 3; edge++) {
      const a = ids[edge], b = ids[(edge + 1) % 3];
      if (wet[a] >= .6) polygon.push({ x: positions.getX(a), z: positions.getZ(a) });
      if ((wet[a] >= .6) !== (wet[b] >= .6)) {
        const t = (.6 - wet[a]) / (wet[b] - wet[a]);
        polygon.push({ x: T.MathUtils.lerp(positions.getX(a), positions.getX(b), t), z: T.MathUtils.lerp(positions.getZ(a), positions.getZ(b), t) });
      }
    }
    for (let j = 1; j < polygon.length - 1; j++) for (const p of [polygon[0], polygon[j], polygon[j + 1]]) { riverVertices.push(p.x, -2.35, p.z); riverUV.push(p.x / 160, p.z / 160); }
  }
  const riverGeometry = new T.BufferGeometry(); riverGeometry.setAttribute('position', new T.Float32BufferAttribute(riverVertices, 3)); riverGeometry.setAttribute('uv', new T.Float32BufferAttribute(riverUV, 2)); riverGeometry.computeVertexNormals();
  const ripples = document.createElement('canvas'); ripples.width = ripples.height = 512;
  const waterCtx = ripples.getContext('2d')!; waterCtx.fillStyle = '#879da1'; waterCtx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 650; i++) {
    const x = hash(i, 81) * 512, y = hash(i, 43) * 512;
    waterCtx.strokeStyle = i % 3 ? '#ced8d318' : '#3d666c25'; waterCtx.lineWidth = .5 + hash(i, 9);
    waterCtx.beginPath(); waterCtx.moveTo(x, y); waterCtx.quadraticCurveTo(x + 8, y - 2, x + 14 + hash(i, 5) * 18, y); waterCtx.stroke();
  }
  const rippleTexture = new T.CanvasTexture(ripples); rippleTexture.wrapS = rippleTexture.wrapT = T.RepeatWrapping; rippleTexture.colorSpace = T.SRGBColorSpace;
  const river = new T.Mesh(riverGeometry, new T.MeshStandardMaterial({ color: '#547c80', map: rippleTexture, bumpMap: rippleTexture, bumpScale: .8, metalness: .1, roughness: .28 })); group.add(river);
  const surround = new T.Mesh(new T.PlaneGeometry(6500, 6500), new T.MeshStandardMaterial({ color: '#4d4b3c', roughness: 1 }));
  surround.rotation.x = -Math.PI / 2; surround.position.set(900, -8, 480); surround.receiveShadow = true; group.add(surround);
  const flora = new T.Group(); group.add(flora);
  for (const tile of map.tiles) {
    if (tile.cityId || tile.terrain === 'water' || tile.terrain === 'road' || tile.terrain === 'mountain') continue;
    const p = axialToPixel(tile, HEX_SIZE), seed = tile.q * 37 + tile.r * 97;
    const count = tile.terrain === 'forest' ? 9 : tile.terrain === 'plain' && hash(seed, 2) < .22 ? 2 : 0;
    for (let i = 0; i < count; i++) {
      const x = p.x + (hash(seed, i * 7) - .5) * 44, z = p.y + (hash(seed, i * 11 + 3) - .5) * 44;
      const tree = treeModel(seed + i, tile.terrain === 'forest' && i % 3 === 0);
      tree.position.set(x, sample(x, z).height, z); tree.rotation.y = hash(seed, i + 2) * Math.PI * 2; flora.add(tree);
    }
  }
  bake(flora);
  return { group, ground, sample };
}

/** Merge static parts by material color: detailed scenery without one draw call per leaf. */
export function bake(root: T.Group) {
  root.updateMatrixWorld(true);
  const inverse = root.matrixWorld.clone().invert(), batches = new Map<string, T.BufferGeometry[]>();
  root.traverse(node => {
    if (!(node instanceof T.Mesh) || !(node.material instanceof T.MeshStandardMaterial)) return;
    const key = node.material.color.getHexString();
    const geometry = node.geometry.index ? node.geometry.toNonIndexed() : node.geometry.clone();
    geometry.applyMatrix4(inverse.clone().multiply(node.matrixWorld));
    geometry.deleteAttribute('uv');
    if (!batches.has(key)) batches.set(key, []); batches.get(key)!.push(geometry);
    node.geometry.dispose(); node.material.dispose();
  });
  root.clear();
  for (const [color, parts] of batches) {
    const geometry = mergeGeometries(parts)!; parts.forEach(g => g.dispose());
    const object = new T.Mesh(geometry, new T.MeshStandardMaterial({ color: `#${color}`, roughness: .83 }));
    object.castShadow = true; object.receiveShadow = true; root.add(object);
  }
}

function treeModel(seed: number, pine: boolean) {
  const g = new T.Group(), height = 17 + hash(seed, 3) * 14;
  mesh(g, new T.CylinderGeometry(.55, 1.4, height * .7, 7), '#5b4631', 0, height * .35);
  if (pine) {
    for (let i = 0; i < 4; i++) mesh(g, new T.ConeGeometry(7.5 - i * 1.3, 11, 9), i % 2 ? '#394632' : '#46573a', 0, height * .45 + i * 4);
  } else {
    for (let i = 0; i < 28; i++) {
      const angle = i * 2.4, radius = 2 + hash(seed, i + 10) * 7;
      const x = Math.cos(angle) * radius, z = Math.sin(angle) * radius, y = height * .5 + hash(seed, i + 8) * height * .42;
      if (i % 4 === 0) { const branch = mesh(g, new T.CylinderGeometry(.25, .65, 9, 5), '#594530', x / 2, y - 4, z / 2); branch.rotation.z = -.65 * Math.cos(angle); branch.rotation.x = .65 * Math.sin(angle); }
      const crown = mesh(g, new T.IcosahedronGeometry(2.8 + hash(seed, i) * 1.5, 0), ['#465334', '#5c623c', '#596b43', '#6e7448'][i % 4], x, y, z);
      crown.scale.set(1.15, .7 + hash(seed, i + 4) * .4, 1);
    }
  }
  return g;
}

function roof(g: T.Group, width: number, depth: number, y: number, x = 0, z = 0) {
  // Curved tiled eaves, ridge beam and stepped tile courses.
  for (const side of [-1, 1]) {
    for (let i = 0; i < 5; i++) {
      const strip = box(g, i % 2 ? '#3d4040' : '#4d5150', width + i * 1.3, .65, depth / 9 + .4, x, y + 3.3 - i * .55, z + side * i * depth / 10);
      strip.rotation.x = side * (.38 - i * .055);
    }
    box(g, '#a38e63', width + 6, .7, 1, x, y + .6, z + side * depth / 2);
  }
  mesh(g, new T.CylinderGeometry(.7, .7, width + 1, 8), '#797363', x, y + 3.9, z).rotation.z = Math.PI / 2;
}

function hall(g: T.Group, x: number, z: number, width: number, depth: number, y: number) {
  box(g, '#b2a183', width + 2, 2, depth + 2, x, 1, z);
  box(g, '#c2b99c', width, y, depth, x, y / 2 + 2, z);
  for (const dx of [-width * .4, 0, width * .4]) { box(g, '#674532', .9, y, .9, x + dx, y / 2 + 2, z + depth / 2 + .3); box(g, '#35352d', 2, 3.5, .4, x + dx + 1, y / 2 + 2, z + depth / 2 + .5); }
  roof(g, width + 1, depth + 3, y + 2, x, z);
}

export function fortress(g: T.Group, color: string, scale: number) {
  g.scale.setScalar(scale);
  box(g, '#857965', 59, 2.4, 51, 0, .8);
  box(g, '#a5987a', 45, .5, 38, 0, 2.2);
  // Brick courses and crenellations, with a real gap for the south gate.
  for (const z of [-23, 23]) for (const segment of z > 0 ? [-1, 1] : [0]) {
    const w = segment ? 22 : 56, x = segment * 17;
    box(g, '#8b887a', w, 12, 3.5, x, 8, z);
    for (let row = 0; row < 4; row++) box(g, '#68695e', w, .23, 3.7, x, 3.6 + row * 2.7, z);
    for (let dx = -w / 2 + 2; dx < w / 2; dx += 4) box(g, '#a19b87', 2, 2.5, 3.6, x + dx, 15, z);
  }
  for (const x of [-28, 28]) {
    box(g, '#8b887a', 3.5, 12, 46, x, 8);
    for (let row = 0; row < 4; row++) box(g, '#68695e', 3.7, .23, 46, x, 3.6 + row * 2.7);
    for (let z = -20; z <= 20; z += 4) box(g, '#a19b87', 3.6, 2.5, 2, x, 15, z);
  }
  for (const x of [-27, 27]) for (const z of [-22, 22]) { box(g, '#a19a86', 7, 17, 7, x, 10, z); const upper = new T.Group(); upper.position.y = 17; g.add(upper); hall(upper, x, z, 7, 7, 5); }
  hall(g, 0, -9, 20, 12, 12); roof(g, 17, 13, 22, 0, -9);
  for (const x of [-16, 16]) { hall(g, x, 5, 9, 12, 6); hall(g, x, -10, 8, 8, 6); }
  // Gatehouse above the arched passage; doors, studs and approach stairs.
  for (const x of [-5, 5]) box(g, '#a59a81', 3, 14, 7, x, 9, 23);
  box(g, '#97927f', 14, 4, 7, 0, 16, 23); const gatehouse = new T.Group(); gatehouse.position.y = 16; g.add(gatehouse); hall(gatehouse, 0, 23, 12, 7, 5);
  box(g, '#513b2e', 7, 9, .7, 0, 7, 25);
  for (const x of [-2, 2]) for (const y of [4, 6, 8, 10]) mesh(g, new T.SphereGeometry(.25, 4, 3), '#a08e65', x, y, 25.5);
  for (let i = 0; i < 4; i++) box(g, '#a4997f', 9 + i, 1, 2, 0, 2 - i * .45, 28 + i * 2);
  box(g, '#8d8268', 7, .35, 33, 0, 2.6, 4);
  for (const x of [-10, 10]) standard(g, color, x, 24, 19, 10);
  bake(g);
}

function standard(g: T.Group, color: string, x: number, y: number, z: number, size: number) {
  mesh(g, new T.CylinderGeometry(.35, .5, size * 2, 6), '#786247', x, y, z);
  const cloth = new T.PlaneGeometry(size * .8, size * 1.2, 4, 3), vertices = cloth.getAttribute('position');
  for (let i = 0; i < vertices.count; i++) vertices.setZ(i, Math.sin(vertices.getX(i) * .9) * .7);
  const flag = new T.Mesh(cloth, new T.MeshStandardMaterial({ color, side: T.DoubleSide, roughness: .9 })); flag.position.set(x + size * .4, y + size * .45, z); g.add(flag);
  box(g, '#cab47a', size * .65, .7, .35, x + size * .4, y + size * .85, z + .8);
}

function trooper(g: T.Group, color: string, type: UnitType, x: number, z: number) {
  const soldier = new T.Group(); soldier.position.set(x, 0, z); g.add(soldier);
  const base = type === 'cavalry' ? 6.4 : 0;
  if (type === 'cavalry') {
    const horse = mesh(soldier, new T.SphereGeometry(1, 9, 7), '#64503b', 0, 4.8); horse.scale.set(2.6, 2.6, 5);
    const neck = mesh(soldier, new T.CylinderGeometry(1.2, 1.7, 5.5, 8), '#64503b', 0, 7, 3.8); neck.rotation.x = -.35;
    const head = mesh(soldier, new T.SphereGeometry(1, 8, 6), '#6f5942', 0, 9, 5); head.scale.set(1.4, 1.3, 2.3);
    for (const dx of [-1.8, 1.8]) for (const dz of [-3, 3]) { mesh(soldier, new T.CylinderGeometry(.45, .6, 4.5, 6), '#4c3e31', dx, 2.2, dz); box(soldier, '#272522', 1, .8, 1.3, dx, .5, dz); }
    box(soldier, color, 5.7, .8, 6, 0, 7);
    mesh(soldier, new T.CylinderGeometry(.3, .5, 4, 6), '#302923', 0, 4.6, -5).rotation.x = -.4;
  }
  for (const dx of [-.9, .9]) { mesh(soldier, new T.CylinderGeometry(.55, .7, 3.8, 6), '#33312d', dx, base + 2); box(soldier, '#292622', 1.1, .7, 1.8, dx, base + .6, .3); }
  mesh(soldier, new T.CylinderGeometry(1.5, 2, 3, 8), color, 0, base + 4.7);
  const torso = mesh(soldier, new T.SphereGeometry(1, 8, 6), '#555956', 0, base + 6.8); torso.scale.set(1.7, 2.2, 1.1);
  for (let i = 0; i < 3; i++) box(soldier, '#7f806d', 2.8, .3, .4, 0, base + 5.8 + i * .8, 1.1);
  for (const dx of [-2, 2]) { mesh(soldier, new T.SphereGeometry(1, 6, 4), '#666b61', dx, base + 7.4); mesh(soldier, new T.CylinderGeometry(.5, .6, 2.6, 6), color, dx, base + 5.8); }
  mesh(soldier, new T.SphereGeometry(1.15, 8, 6), '#b39570', 0, base + 9.7);
  mesh(soldier, new T.SphereGeometry(1.35, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), '#555c56', 0, base + 9.8);
  box(soldier, '#a28b56', .4, 1.2, .5, 0, base + 10.8);
  if (type === 'archer') { const bow = mesh(soldier, new T.TorusGeometry(2.7, .2, 5, 12, Math.PI), '#a88a58', 2.2, base + 6.7, .7); bow.rotation.z = -Math.PI / 2; box(soldier, '#d0c7ac', .1, 5.3, .1, 2.2, base + 6.7, .7); }
  else { mesh(soldier, new T.CylinderGeometry(.14, .2, 15, 5), '#8a7150', 2.7, base + 7.5, .8); mesh(soldier, new T.ConeGeometry(.6, 2.6, 5), '#c5c8bc', 2.7, base + 16, .8); if (type === 'spear') { const shield = mesh(soldier, new T.CylinderGeometry(2, 2, .5, 10), '#494c42', -2.4, 5.7, 1); shield.rotation.x = Math.PI / 2; } }
}

export function regiment(type: UnitType, color: string, troops: number) {
  const g = new T.Group(), columns = type === 'cavalry' ? 3 : 4, rows = troops >= 6000 ? 4 : 3;
  for (let row = 0; row < rows; row++) for (let col = 0; col < columns; col++) trooper(g, color, type, (col - (columns - 1) / 2) * (type === 'cavalry' ? 9 : 6), -row * (type === 'cavalry' ? 12 : 7));
  standard(g, color, -15, 16, -9, 10); bake(g); return g;
}

export function facilityArt(g: T.Group, tile: Tile) {
  const f = tile.facility!;
  if (f.type === 'farm') {
    box(g, '#6b593c', 36, .8, 30, 0, .2);
    for (let z = -12; z <= 12; z += 4) { box(g, '#857143', 34, .5, 2.6, 0, 1, z); for (let x = -15; x <= 15; x += 3) mesh(g, new T.ConeGeometry(.7, 2.6, 4), '#ada265', x, 2, z); }
    hall(g, 18, -8, 7, 9, 4);
  } else if (f.type === 'tower') {
    for (const x of [-5, 5]) for (const z of [-5, 5]) box(g, '#69533b', 1.4, 23, 1.4, x, 11, z);
    for (const z of [-5, 5]) { const brace = box(g, '#8e7650', 1, 21, 1, 0, 11, z); brace.rotation.z = .46; }
    box(g, '#9b8562', 14, 2, 14, 0, 22);
    for (const x of [-6, 6]) box(g, '#756345', 1, 4, 14, x, 25);
    roof(g, 14, 17, 28); box(g, '#574939', 11, 1, 2, 0, 25, 5);
  } else if (f.type === 'fort') {
    for (let i = -15; i <= 15; i += 3) for (const side of [-1, 1]) {
      mesh(g, new T.CylinderGeometry(.6, 1, 8, 5), '#857352', i, 4, side * 14);
      mesh(g, new T.ConeGeometry(1, 2, 5), '#a08c69', i, 9, side * 14);
      mesh(g, new T.CylinderGeometry(.6, 1, 8, 5), '#857352', side * 17, 4, i);
    }
    hall(g, 0, -3, 12, 12, 5);
  } else if (f.type === 'barracks') {
    for (const x of [-10, 10]) for (const z of [-8, 8]) {
      const tent = mesh(g, new T.ConeGeometry(8, 10, 4), '#a39270', x, 5, z); tent.rotation.y = Math.PI / 4;
      box(g, '#514937', 2.3, 4, .4, x, 2, z + 5.5);
    }
    for (let x = -8; x <= 8; x += 4) mesh(g, new T.CylinderGeometry(.2, .3, 11, 5), '#897250', x, 5, 19);
  } else {
    hall(g, 0, -5, 18, 13, 7);
    for (const x of [-11, 0, 11]) { box(g, '#806442', 8, 3, 4, x, 2, 9); box(g, '#a28f64', 10, .7, 8, x, 7, 8).rotation.x = .12; for (const dx of [-4, 4]) box(g, '#68523c', .6, 7, .6, x + dx, 3.5, 11); }
  }
  if (f.buildTurnsLeft) for (const x of [-20, 20]) { box(g, '#9a805a', .8, 18, .8, x, 9); box(g, '#9a805a', 40, .7, .7, 0, 12); }
  bake(g);
}
