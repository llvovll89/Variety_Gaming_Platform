import * as T from 'three';
import { axialToPixel, pixelToAxial, hexKey, type HexCoord, type Point } from './hex';
import { HEX_SIZE, UNIT_TYPES } from './constants';
import type { Camera, Viewport } from './camera';
import type { GameState, Tile } from './types';
import type { RenderOverlay } from './renderer';
import { box, mesh, officerModel, disposeObject } from './models';

const COLORS = { plain: '#9ca77b', forest: '#6f8969', hill: '#9b9a82', mountain: '#a4aaa0', water: '#579ba8', road: '#c4b897', wasteland: '#b3a58c' };
const point = (h: HexCoord) => axialToPixel(h, HEX_SIZE);

export class MapRenderer3D {
  readonly gl: T.WebGLRenderer;
  private scene = new T.Scene();
  private camera = new T.PerspectiveCamera(38, 1, 1, 7000);
  private terrain = new T.Group();
  private objects = new T.Group();
  private overlays = new T.Group();
  private map: GameState['map'] | null = null;
  private signature = '';
  private view: Viewport = { width: 1, height: 1 };
  private ray = new T.Raycaster();
  private plane = new T.Plane(new T.Vector3(0, 1, 0), 0);
  private units = new Map<number, T.Group>();
  private sun = new T.DirectionalLight('#fff1d2', 2.5);
  yaw = 0;
  pitch = 0.85;
  grid = false;
  constructor(canvas: HTMLCanvasElement) {
    this.gl = new T.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.gl.setClearColor('#b8cbd0');
    this.gl.outputColorSpace = T.SRGBColorSpace;
    this.gl.toneMapping = T.ACESFilmicToneMapping;
    this.gl.toneMappingExposure = 1.05;
    this.gl.shadowMap.enabled = true;
    this.gl.shadowMap.type = T.PCFSoftShadowMap;
    this.scene.fog = new T.Fog('#b8cbd0', 1700, 3600);
    this.scene.add(new T.HemisphereLight('#e5f3ff', '#716649', 1.7));
    this.sun.castShadow = true;
    Object.assign(this.sun.shadow.camera, { left: -650, right: 650, top: 650, bottom: -650, near: 1, far: 2400 });
    this.sun.shadow.mapSize.set(2048, 2048); this.sun.shadow.bias = -0.001; this.sun.shadow.normalBias = .4;
    this.scene.add(this.sun, this.sun.target);
    this.scene.add(this.terrain, this.objects, this.overlays);
  }
  resize(view: Viewport, dpr: number) {
    this.view = view; this.gl.setPixelRatio(Math.min(dpr, 1.6)); this.gl.setSize(view.width, view.height, false);
    this.camera.aspect = view.width / Math.max(1, view.height); this.camera.updateProjectionMatrix();
  }
  screenOf(p: Point): Point {
    const v = new T.Vector3(p.x, 0, p.y).project(this.camera);
    return { x: (v.x + 1) * this.view.width / 2, y: (1 - v.y) * this.view.height / 2 };
  }
  worldAt(p: Point): Point {
    this.ray.setFromCamera(new T.Vector2(p.x / this.view.width * 2 - 1, 1 - p.y / this.view.height * 2), this.camera);
    const v = this.ray.ray.intersectPlane(this.plane, new T.Vector3());
    return v ? { x: v.x, y: v.z } : { x: -10000, y: -10000 };
  }
  hexAt(p: Point): HexCoord {
    this.worldAt(p); // Updates the ray using the current camera matrices.
    for (const hit of this.ray.intersectObjects(this.objects.children, true)) {
      let node: T.Object3D | null = hit.object;
      while (node) {
        if (node.userData.hex) return node.userData.hex as HexCoord;
        node = node.parent;
      }
    }
    return pixelToAxial(this.worldAt(p), HEX_SIZE);
  }
  private clear(group: T.Group) { disposeObject(group); group.clear(); }
  private label(text: string, color: string, width = 108): T.Sprite {
    const c = document.createElement('canvas'); c.width = 512; c.height = 112;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#142832ed'; ctx.beginPath(); ctx.roundRect(0, 0, 512, 112, 12); ctx.fill();
    ctx.fillStyle = color; ctx.fillRect(0, 0, 8, 112);
    ctx.strokeStyle = '#b8ab8055'; ctx.lineWidth = 2; ctx.strokeRect(1, 1, 510, 110);
    ctx.font = '600 42px Pretendard, sans-serif'; ctx.fillStyle = '#f4eddb'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 259, 58, 484);
    const tex = new T.CanvasTexture(c); tex.colorSpace = T.SRGBColorSpace;
    const s = new T.Sprite(new T.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
    s.scale.set(width, width * 112 / 512, 1); s.renderOrder = 10; return s;
  }
  private buildTerrain(state: GameState) {
    this.clear(this.terrain);
    const textures = new Map<string, T.CanvasTexture>();
    for (const [kind, color] of Object.entries(COLORS)) {
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
      const ctx = canvas.getContext('2d')!; ctx.fillStyle = color; ctx.fillRect(0, 0, 128, 128);
      for (let i = 0; i < 900; i++) {
        ctx.fillStyle = i % 2 ? '#ffffff10' : '#263b3010';
        ctx.fillRect((i * 47) % 128, (i * 29 + Math.floor(i / 128) * 13) % 128, 1 + i % 3, 1 + i % 2);
      }
      const texture = new T.CanvasTexture(canvas); texture.colorSpace = T.SRGBColorSpace;
      texture.anisotropy = Math.min(4, this.gl.capabilities.getMaxAnisotropy()); textures.set(kind, texture);
    }
    for (const tile of state.map.tiles) {
      const p = point(tile);
      const g = new T.Group(); g.position.set(p.x, 0, p.y); this.terrain.add(g);
      const ground = mesh(g, new T.CylinderGeometry(HEX_SIZE + 0.1, HEX_SIZE + 0.1, 5, 6), '#ffffff', 0, -2.5);
      const groundMaterial = ground.material as T.MeshStandardMaterial;
      groundMaterial.map = textures.get(tile.terrain)!;
      if (tile.terrain === 'water') { groundMaterial.roughness = .28; groundMaterial.metalness = .16; }
      if (tile.terrain === 'mountain' || tile.terrain === 'hill') {
        for (let i = 0; i < 3; i++) {
          const high = tile.terrain === 'mountain' ? 34 + ((tile.q * 7 + tile.r * 3 + i * 11) & 31) : 16;
          const m = mesh(g, new T.IcosahedronGeometry(1, 1), i === 1 ? '#adb1a0' : '#8e998c', (i - 1) * 13, high * .32, (i % 2) * 9);
          m.scale.set(18 + i * 2, high * .65, 15 + i * 2); m.rotation.y = tile.r;
        }
      }
      if (tile.terrain === 'forest') for (let i = 0; i < 5; i++) {
        const x = Math.sin(i * 13 + tile.q) * 19, z = Math.cos(i * 7 + tile.r) * 19;
        mesh(g, new T.CylinderGeometry(1, 1.5, 12, 6), '#72614a', x, 6, z);
        const crown = mesh(g, new T.IcosahedronGeometry(8, 1), i % 2 ? '#426d50' : '#638152', x, 17, z);
        crown.scale.set(1, 1.2, 1);
      }
      if (tile.terrain === 'plain' && !tile.cityId && (tile.q + tile.r) % 3 === 0) {
        for (let i = 0; i < 3; i++) mesh(g, new T.ConeGeometry(1.3, 3, 3), '#a1a68c', i * 8 - 8, 1.5, 9);
      }
    }
  }
  private city(g: T.Group, color: string, scale: number) {
    g.scale.setScalar(scale);
    box(g, '#b1a99a', 43, 4, 37, 0, 2);
    for (const z of [-16, 16]) { box(g, '#a8a99e', 42, 13, 3, 0, 8, z); for(let x=-18;x<=18;x+=6)box(g,'#babcb0',3,3,3,x,15,z); }
    for (const x of [-20, 20]) { box(g, '#a8a99e', 3, 13, 35, x, 8); for(let z=-12;z<=12;z+=6)box(g,'#babcb0',3,3,3,x,15,z); }
    for (const x of [-19, 19]) for (const z of [-15, 15]) {
      box(g, '#bcb6a2', 8, 19, 8, x, 10, z);
      box(g, '#754733', 7, 5, 7, x, 22, z);
      const roof = mesh(g, new T.ConeGeometry(9, 5, 4), '#344e57', x, 26, z); roof.rotation.y = Math.PI / 4;
      box(g, '#dbbb79', 10, .6, 10, x, 23.5, z);
    }
    for (const x of [-12, 0, 12]) {
      box(g, '#d3c9ac', 9, 13, 12, x, 9);
      const roof = mesh(g, new T.ConeGeometry(10, 6, 4), '#365760', x, 19); roof.rotation.y = Math.PI / 4;
      box(g, '#b99158', 11, .7, 13, x, 16);
    }
    box(g, '#483b30', 7, 10, 3.3, 0, 6, 16);
    box(g, '#c5b790', 7, 1, 10, 0, .5, 22);
    box(g, '#665b43', 0.8, 26, 0.8, 7, 22);
    box(g, color, 10, 10, 0.4, 12, 31);
  }
  private facility(g: T.Group, tile: Tile) {
    const f = tile.facility!;
    const color = f.buildTurnsLeft ? '#a69b7b' : '#b5ad92';
    if (f.type === 'farm') {
      for (let i = 0; i < 6; i++) box(g, i % 2 ? '#a6a669' : '#676f40', 28, 1, 3, 0, 1, i * 4 - 12);
    } else if (f.type === 'tower') {
      for (const x of [-6, 6]) for (const z of [-6, 6]) box(g, '#796c53', 2, 23, 2, x, 11, z);
      box(g, color, 18, 4, 18, 0, 24); box(g, '#474e46', 22, 3, 3, 0, 29);
    } else {
      box(g, color, 20, 10, 15, 0, 5);
      const r = mesh(g, new T.ConeGeometry(17, 8, 4), f.type === 'fort' ? '#716a53' : '#596962', 0, 14); r.rotation.y = Math.PI / 4;
    }
  }
  private buildObjects(state: GameState) {
    this.clear(this.objects); this.units.clear();
    for (const city of Object.values(state.cities)) {
      const p = point(city.coord), g = new T.Group(); g.position.set(p.x, 0, p.y);
      const color = state.factions[city.faction ?? '']?.color ?? '#817b63';
      this.city(g, color, city.scale === 'capital' ? 1.25 : 1);
      g.userData.hex = city.coord;
      this.objects.add(g);
      if (!Object.values(state.units).some(unit => hexKey(unit.coord) === hexKey(city.coord))) {
        const label = this.label(`${city.name}  ${Math.round(city.troops / 100) / 10}천`, color);
        label.position.set(p.x, 59, p.y); label.userData.hex = city.coord; this.objects.add(label);
      }
    }
    for (const tile of state.map.tiles) if (tile.facility) {
      const p = point(tile), g = new T.Group(); g.position.set(p.x, 0, p.y); this.facility(g, tile); this.objects.add(g);
    }
    for (const unit of Object.values(state.units)) {
      const o = state.officers[unit.officerIds[0]]; if (!o) continue;
      const p = point(unit.coord), g = new T.Group(); g.position.set(p.x, 0, p.y);
      g.userData.hex = unit.coord;
      const model = officerModel(o, unit.type === 'cavalry'); model.scale.setScalar(9); g.add(model);
      for (let i = 0; i < 6; i++) {
        const soldier = new T.Group(); soldier.position.set((i % 3 - 1) * 9, 0, -10 - Math.floor(i / 3) * 8);
        box(soldier, state.factions[unit.faction].color, 4, 7, 3, 0, 6);
        mesh(soldier, new T.SphereGeometry(2.3, 5, 4), '#a5a393', 0, 11);
        box(soldier, '#685f4a', 0.5, 17, 0.5, 3, 8); g.add(soldier);
      }
      const station = Object.values(state.cities).find(city => hexKey(city.coord) === hexKey(unit.coord));
      const label = this.label(`${station ? `${station.name} · ` : ''}${o.name} · ${UNIT_TYPES[unit.type].label} ${unit.troops}`, state.factions[unit.faction].color, station ? 145 : 119);
      label.position.set(0, station ? 65 : 43, 0); g.add(label);
      this.objects.add(g); this.units.set(unit.id, g);
    }
  }
  private ring(hex: HexCoord, color: string, filled = false) {
    const p = point(hex);
    const geometry = filled ? new T.CircleGeometry(32, 6) : new T.RingGeometry(31, 33, 6);
    geometry.rotateX(-Math.PI / 2); geometry.rotateY(Math.PI / 6);
    const m = new T.Mesh(geometry, new T.MeshBasicMaterial({ color, transparent: true, opacity: filled ? 0.25 : 0.9, depthWrite: false }));
    m.position.set(p.x, 0.35, p.y); this.overlays.add(m);
  }
  render(state: GameState, cam: Camera, view: Viewport, overlay: RenderOverlay) {
    this.view = view;
    const distance = Math.max(300, view.height / (2 * Math.tan(19 * Math.PI / 180)) / cam.zoom);
    this.camera.position.set(cam.x + Math.sin(this.yaw) * distance * Math.cos(this.pitch), distance * Math.sin(this.pitch), cam.y + Math.cos(this.yaw) * distance * Math.cos(this.pitch));
    this.camera.lookAt(cam.x, 0, cam.y); this.camera.updateMatrixWorld();
    this.sun.position.set(cam.x - 500, 900, cam.y + 350); this.sun.target.position.set(cam.x, 0, cam.y);
    if (this.map !== state.map) { this.map = state.map; this.buildTerrain(state); this.signature = ''; }
    const signature = JSON.stringify([state.cities, state.units, state.officers, state.map.tiles.filter(t => t.facility).map(t => [hexKey(t), t.facility])]);
    if (signature !== this.signature) { this.signature = signature; this.buildObjects(state); }
    for (const unit of Object.values(state.units)) {
      const p = overlay.moving?.unitId === unit.id ? overlay.moving.point : point(unit.coord);
      this.units.get(unit.id)?.position.set(p.x, 0, p.y);
    }
    this.clear(this.overlays);
    if (this.grid) for (const tile of state.map.tiles) this.ring(tile, '#c7c6a6');
    for (const h of overlay.reachable ?? []) this.ring(h, '#81b9cd', true);
    for (const h of overlay.targets ?? []) this.ring(h, '#e29074', true);
    for (const h of overlay.buildable ?? []) this.ring(h, '#e5cf79', true);
    if (overlay.hovered) this.ring(overlay.hovered, '#e9e7d3');
    if (overlay.selected) this.ring(overlay.selected, '#ffe3a2');
    for (const fx of overlay.fx ?? []) {
      const age = Math.min(1, ((overlay.now ?? 0) - fx.born) / fx.ms), p = point(fx.at);
      const label = this.label(fx.text, fx.color, 85); label.position.set(p.x, 50 + age * 30, p.y); label.material.opacity = 1 - age; this.overlays.add(label);
    }
    this.gl.render(this.scene, this.camera);
  }
  dispose() { this.clear(this.terrain); this.clear(this.objects); this.clear(this.overlays); this.sun.shadow.map?.dispose(); this.gl.dispose(); }
}
