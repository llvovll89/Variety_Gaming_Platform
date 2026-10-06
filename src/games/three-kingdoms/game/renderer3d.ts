import * as T from 'three';
import { axialToPixel, pixelToAxial, hexKey, type HexCoord, type Point } from './hex';
import { HEX_SIZE, UNIT_TYPES } from './constants';
import type { Camera, Viewport } from './camera';
import type { GameState, Tile } from './types';
import type { RenderOverlay } from './renderer';
import { officerModel, disposeObject } from './models';
import { landscape, fortress, regiment, facilityArt, bake } from './battlefieldArt';

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
  private ground: T.Mesh | null = null;
  private elevation: (x: number, z: number) => number = () => 0;
  private sun = new T.DirectionalLight('#fff1d2', 2.5);
  yaw = 0;
  pitch = 1.02;
  grid = false;
  constructor(canvas: HTMLCanvasElement) {
    this.gl = new T.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.gl.setClearColor('#292a26');
    this.gl.outputColorSpace = T.SRGBColorSpace;
    this.gl.toneMapping = T.ACESFilmicToneMapping;
    this.gl.toneMappingExposure = 1.12;
    this.gl.shadowMap.enabled = true;
    this.gl.shadowMap.type = T.PCFSoftShadowMap;
    this.scene.fog = new T.Fog('#292a26', 2200, 4200);
    this.scene.add(new T.HemisphereLight('#d3d7cb', '#474132', 1.35));
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
    const v = new T.Vector3(p.x, this.elevation(p.x, p.y), p.y).project(this.camera);
    return { x: (v.x + 1) * this.view.width / 2, y: (1 - v.y) * this.view.height / 2 };
  }
  worldAt(p: Point): Point {
    this.ray.setFromCamera(new T.Vector2(p.x / this.view.width * 2 - 1, 1 - p.y / this.view.height * 2), this.camera);
    const hit = this.ground && this.ray.intersectObject(this.ground, false)[0];
    const v = hit ? hit.point : this.ray.ray.intersectPlane(this.plane, new T.Vector3());
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
    ctx.fillStyle = '#101010f2'; ctx.beginPath(); ctx.roundRect(0, 0, 512, 112, 8); ctx.fill();
    ctx.fillStyle = color; ctx.fillRect(0, 0, 8, 112);
    ctx.strokeStyle = '#b8ab8055'; ctx.lineWidth = 2; ctx.strokeRect(1, 1, 510, 110);
    ctx.font = '600 42px Pretendard, sans-serif'; ctx.fillStyle = '#f4eddb'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 259, 58, 484);
    const tex = new T.CanvasTexture(c); tex.colorSpace = T.SRGBColorSpace;
    const s = new T.Sprite(new T.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
    s.scale.set(width, width * 112 / 512, 1); s.renderOrder = 10; return s;
  }
  private buildTerrain(state: GameState) {
    this.clear(this.terrain);
    const art = landscape(state.map);
    this.terrain.add(art.group); this.ground = art.ground;
    this.elevation = (x, z) => art.sample(x, z).height;
  }
  private city(g: T.Group, color: string, scale: number) {
    fortress(g, color, scale);
  }
  private facility(g: T.Group, tile: Tile) {
    facilityArt(g, tile);
  }
  private buildObjects(state: GameState) {
    this.clear(this.objects); this.units.clear();
    for (const city of Object.values(state.cities)) {
      const p = point(city.coord), g = new T.Group(); g.position.set(p.x, this.elevation(p.x, p.y), p.y);
      const color = state.factions[city.faction ?? '']?.color ?? '#817b63';
      this.city(g, color, city.scale === 'capital' ? 1.25 : 1);
      g.userData.hex = city.coord;
      this.objects.add(g);
      if (!Object.values(state.units).some(unit => hexKey(unit.coord) === hexKey(city.coord))) {
        const label = this.label(`${city.name}  ${Math.round(city.troops / 100) / 10}천`, color, 78);
        label.position.set(p.x, this.elevation(p.x, p.y) + 55, p.y); label.userData.hex = city.coord; this.objects.add(label);
      }
    }
    for (const tile of state.map.tiles) if (tile.facility) {
      const p = point(tile), g = new T.Group(); g.position.set(p.x, this.elevation(p.x, p.y), p.y); this.facility(g, tile); this.objects.add(g);
    }
    for (const unit of Object.values(state.units)) {
      const o = state.officers[unit.officerIds[0]]; if (!o) continue;
      const p = point(unit.coord), g = new T.Group(); g.position.set(p.x, this.elevation(p.x, p.y), p.y);
      g.userData.hex = unit.coord;
      const station = Object.values(state.cities).find(city => hexKey(city.coord) === hexKey(unit.coord));
      const formation = regiment(unit.type, state.factions[unit.faction].color, unit.troops);
      formation.position.set(station ? 44 : 0, 0, station ? 24 : 0); g.add(formation);
      const model = officerModel(o, unit.type === 'cavalry'); bake(model); model.scale.setScalar(5.5);
      model.position.set(station ? 44 : 0, 0, station ? 32 : 7); g.add(model);
      const label = this.label(`${station ? `${station.name} · ` : ''}${o.name} · ${UNIT_TYPES[unit.type].label} ${unit.troops}`, state.factions[unit.faction].color, station ? 105 : 95);
      label.position.set(0, station ? 78 : 43, 0); g.add(label);
      this.objects.add(g); this.units.set(unit.id, g);
    }
  }
  private ring(hex: HexCoord, color: string, filled = false) {
    const p = point(hex);
    const geometry = filled ? new T.CircleGeometry(32, 6) : new T.RingGeometry(31, 33, 6);
    geometry.rotateX(-Math.PI / 2); geometry.rotateY(Math.PI / 6);
    const positions = geometry.getAttribute('position');
    for (let i = 0; i < positions.count; i++) positions.setY(i, this.elevation(p.x + positions.getX(i), p.y + positions.getZ(i)) + .5);
    const m = new T.Mesh(geometry, new T.MeshBasicMaterial({ color, transparent: true, opacity: filled ? 0.25 : 0.9, depthWrite: false }));
    m.position.set(p.x, 0, p.y); this.overlays.add(m);
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
      const group = this.units.get(unit.id);
      group?.position.set(p.x, this.elevation(p.x, p.y), p.y);
      if (group && overlay.moving?.unitId === unit.id) {
        const destination = point(unit.coord), dx = destination.x - p.x, dz = destination.y - p.y;
        if (Math.hypot(dx, dz) > 1) group.rotation.y = Math.atan2(dx, dz);
      }
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
