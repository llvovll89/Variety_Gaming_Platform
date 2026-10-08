import * as T from 'three';
import { Fight, type Weapon } from './engine';
import { fighterPose, photoSize, WEAPON_LENGTH, type Point } from './pose';
export type Portrait = { image: HTMLImageElement | null; zoom: number; x: number; y: number };
type Rig = {
  root: T.Group; body: T.Group; torso: T.Group; head: T.Group; limbs: T.Mesh[]; joints: T.Mesh[]; hands: T.Mesh[]; feet: T.Mesh[];
  weapon: T.Group; photo: T.Mesh; image: HTMLImageElement | null; weaponId: Weapon; flashMaterials: T.MeshStandardMaterial[];
  trail: T.Mesh; history: number[]; hp: number; flash: number;
};
const TRAIL = 6;
// Half-turned stance toward the camera, like a 3D fighter's side view.
const STANCE = .38;
const up = new T.Vector3(0, 1, 0), axis = new T.Vector3(), a = new T.Vector3(), b = new T.Vector3();
const mat = (color: string, metalness = 0, roughness = .72) => new T.MeshStandardMaterial({ color, metalness, roughness });
function box(parent: T.Object3D, size: Point, pos: Point, material: T.Material) {
  const mesh = new T.Mesh(new T.BoxGeometry(...size), material); mesh.position.set(...pos); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
}
function sphere(parent: T.Object3D, size: Point, pos: Point, material: T.Material) {
  const mesh = new T.Mesh(new T.SphereGeometry(1, 20, 16), material); mesh.scale.set(...size); mesh.position.set(...pos); mesh.castShadow = true; parent.add(mesh); return mesh;
}
/** A unit-height tapered limb; join() stretches it between two joints without squashing its ends. */
function segment(parent: T.Object3D, startRadius: number, endRadius: number, material: T.Material) {
  const mesh = new T.Mesh(new T.CylinderGeometry(endRadius, startRadius, 1, 12), material); mesh.castShadow = true; parent.add(mesh); return mesh;
}
function join(mesh: T.Mesh, start: Point, end: Point) {
  a.set(...start); b.set(...end); axis.subVectors(b, a); const length = axis.length();
  mesh.position.copy(a).add(b).multiplyScalar(.5); mesh.quaternion.setFromUnitVectors(up, axis.normalize()); mesh.scale.set(1, Math.max(.1, length), 1);
}
function makeWeapon(id: Weapon) {
  const g = new T.Group(), steel = mat('#8f9da5', .8, .28), wood = mat('#98704c', 0, .55), rubber = mat('#252d32');
  const length = WEAPON_LENGTH[id];
  const shaft = new T.Mesh(new T.CylinderGeometry(id === 'spatula' ? 3.6 : 2.1, 3, length - 22, 12), id === 'spatula' ? wood : steel);
  shaft.position.y = (length - 22) / 2; shaft.castShadow = true; g.add(shaft);
  if (id === 'spatula') { sphere(g, [14, 23, 3.5], [0, length - 8, 0], wood); }
  if (id === 'swatter') {
    for (const x of [-20, 20]) box(g, [3, 40, 4], [x, length - 7, 0], rubber);
    for (const y of [length - 27, length + 13]) box(g, [43, 3, 4], [0, y, 0], rubber);
    for (let x = -16; x <= 16; x += 5) box(g, [1, 37, 1], [x, length - 7, 0], steel);
    for (let y = length - 23; y <= length + 10; y += 5) box(g, [38, 1, 1], [0, y, 0], steel);
  }
  if (id === 'golf') { box(g, [28, 12, 17], [10, length, 0], steel); box(g, [6, 32, 6], [0, 14, 0], rubber); }
  return g;
}
function makeRig(index: number): Rig {
  const root = new T.Group(), body = new T.Group(); root.add(body);
  const shirt = mat(index ? '#5d7079' : '#874c40'), pants = mat(index ? '#5a5146' : '#2f363c'), skin = mat(index ? '#b58e74' : '#c29a7c');
  const shoes = mat('#22292d', 0, .5), hair = mat(index ? '#3a3027' : '#1f2224', 0, .9), cloth = mat(index ? '#e1ded4' : '#ded9cc');
  const torso = new T.Group(); body.add(torso);
  sphere(torso, [15, 14, 21], [0, 2, 0], pants);
  const chest = new T.Mesh(new T.CylinderGeometry(1, .74, 1, 18), shirt); chest.scale.set(15, 58, 23); chest.position.y = 36; chest.castShadow = true; torso.add(chest);
  sphere(torso, [15, 11, 25], [0, 64, 0], shirt);
  // P1 wears a cook's apron, P2 a towel over the shoulder: props that read as "kitchen" without text.
  if (index) box(torso, [8, 30, 12], [4, 60, 14], cloth); else box(torso, [3, 52, 30], [14.5, 24, 0], cloth);
  box(torso, [31, 5, 44], [0, 10, 0], mat('#2a2622'));
  const neck = new T.Mesh(new T.CylinderGeometry(6.5, 7.5, 18, 10), skin); neck.position.y = 80; torso.add(neck);
  const head = new T.Group(); head.position.y = 108; torso.add(head);
  sphere(head, [16, 19, 15.5], [0, 0, 0], skin);
  sphere(head, [16.6, 11, 16.2], [-2, 9, 0], hair);
  if (index) box(head, [26, 4, 30], [5, 14, 0], mat('#41505a')); else box(head, [32, 6, 33], [-1, 12, 0], cloth);
  for (const z of [-15.5, 15.5]) sphere(head, [3, 5, 2], [-2, -1, z], skin);
  for (const z of [-6.5, 6.5]) { box(head, [2, 2.6, 3.2], [15, 3, z], mat('#1b2023')); box(head, [2, 1.4, 6], [15.2, 8, z], hair); }
  box(head, [5, 6, 4], [16, -3, 0], skin); box(head, [1.5, 1.2, 8], [15, -10, 0], mat('#7e5c4d'));
  const limbs = [segment(body, 12, 9, pants), segment(body, 9, 7, pants), segment(body, 12, 9, pants), segment(body, 9, 7, pants),
    segment(body, 8.5, 7, shirt), segment(body, 7, 5.5, skin), segment(body, 8.5, 7, shirt), segment(body, 7, 5.5, skin)];
  const joints = [sphere(body, [9, 9, 9], [0, 0, 0], pants), sphere(body, [9, 9, 9], [0, 0, 0], pants), sphere(body, [7, 7, 7], [0, 0, 0], shirt), sphere(body, [7, 7, 7], [0, 0, 0], shirt),
    sphere(body, [9.5, 9.5, 9.5], [0, 0, 0], shirt), sphere(body, [9.5, 9.5, 9.5], [0, 0, 0], shirt)];
  const hands = [sphere(body, [7.5, 8, 7], [0, 0, 0], skin), sphere(body, [7.5, 8, 7], [0, 0, 0], skin)];
  const feet = [box(body, [30, 11, 15], [0, 0, 0], shoes), box(body, [30, 11, 15], [0, 0, 0], shoes)];
  const weapon = makeWeapon('spatula'); root.add(weapon);
  const photo = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ transparent: true, side: T.DoubleSide, depthWrite: false })); photo.visible = false; root.add(photo);
  const trailGeometry = new T.BufferGeometry(); trailGeometry.setAttribute('position', new T.BufferAttribute(new Float32Array(TRAIL * 2 * 3), 3));
  const indices: number[] = []; for (let i = 0; i < TRAIL - 1; i++) { const n = i * 2; indices.push(n, n + 1, n + 2, n + 1, n + 3, n + 2); } trailGeometry.setIndex(indices);
  const trail = new T.Mesh(trailGeometry, new T.MeshBasicMaterial({ color: '#f3e6d4', transparent: true, opacity: 0, side: T.DoubleSide, depthWrite: false })); trail.frustumCulled = false; root.add(trail);
  return { root, body, torso, head, limbs, joints, hands, feet, weapon, photo, image: null, weaponId: 'spatula', flashMaterials: [shirt, pants, skin, cloth], trail, history: [], hp: 100, flash: 0 };
}
export class KitchenScene {
  renderer: T.WebGLRenderer; scene = new T.Scene(); camera = new T.OrthographicCamera(-540, 540, 310, -310, 1, 2600);
  rigs: [Rig, Rig]; sparks: T.Mesh[] = []; rings: T.Mesh[] = []; reduced = false; width = 0; height = 0; previous = 0;
  cameraX: number | null = null; cameraY = 150; cameraWidth = 540; punch = 0;
  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: false, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75)); this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = T.PCFSoftShadowMap;
    this.renderer.outputColorSpace = T.SRGBColorSpace; this.renderer.toneMapping = T.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.2;
    this.scene.background = new T.Color('#3f494f'); this.scene.fog = new T.Fog('#3f494f', 1100, 1900);
    this.camera.position.set(0, 320, 1100); this.camera.lookAt(0, 150, 0);
    this.scene.add(new T.HemisphereLight('#e8edef', '#59605b', 2.3));
    const sun = new T.DirectionalLight('#fff0d8', 3.1); sun.position.set(-300, 600, 450); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -760, right: 760, top: 700, bottom: -600 }); sun.shadow.bias = -.0003; sun.shadow.normalBias = 1; this.scene.add(sun);
    const rim = new T.DirectionalLight('#b8c7d0', 1.4); rim.position.set(500, 300, -260); this.scene.add(rim);
    this.stage(); this.rigs = [makeRig(0), makeRig(1)]; this.rigs.forEach(r => this.scene.add(r.root));
    for (let i = 0; i < 24; i++) { const spark = new T.Mesh(new T.BoxGeometry(2.4, 2.4, 2.4), new T.MeshBasicMaterial({ color: '#f0dbc2', transparent: true, depthWrite: false })); spark.visible = false; this.scene.add(spark); this.sparks.push(spark); }
    for (let i = 0; i < 3; i++) { const ring = new T.Mesh(new T.RingGeometry(.82, 1, 40), new T.MeshBasicMaterial({ color: '#f6e7d2', transparent: true, depthWrite: false, side: T.DoubleSide })); ring.visible = false; this.scene.add(ring); this.rings.push(ring); }
  }
  stage() {
    const steel = mat('#9ba5a9', .65, .45), wall = mat('#687270'), cabinet = mat('#525e62'), dark = mat('#303a40'), wood = mat('#896447');
    box(this.scene, [1800, 8, 1500], [0, -9, 330], mat('#6b6e68'));
    for (let x = -880; x < 900; x += 110) for (let z = -330; z < 1080; z += 110) box(this.scene, [108, 1, 108], [x, -4, z], mat((Math.round(x / 110) + Math.round(z / 110)) % 2 ? '#858980' : '#777e78'));
    box(this.scene, [1800, 640, 20], [0, 280, -240], wall);
    for (let x = -880; x < 900; x += 75) for (let y = 80; y < 560; y += 48) box(this.scene, [73, 46, 1], [x, y, -229], mat(y % 96 ? '#778180' : '#737d7b'));
    box(this.scene, [1500, 14, 112], [0, 125, -176], steel);
    for (let x = -700; x < 720; x += 145) { box(this.scene, [138, 116, 98], [x, 60, -180], cabinet); box(this.scene, [31, 4, 5], [x, 100, -127], dark); }
    box(this.scene, [400, 35, 135], [0, 365, -167], steel); box(this.scene, [260, 160, 75], [0, 460, -206], steel);
    for (const x of [-360, 370]) { box(this.scene, [270, 14, 100], [x, 280, -173], wood); for (let i = 0; i < 5; i++) { const pan = new T.Mesh(new T.CylinderGeometry(17, 17, 7, 24), steel); pan.position.set(x - 90 + i * 43, 292, -175); this.scene.add(pan); } }
    for (const x of [-570, 565]) { box(this.scene, [145, 105, 9], [x, 334, -221], dark); box(this.scene, [127, 87, 3], [x, 334, -213], mat('#abb9b6', .4, .2)); }
    for (const x of [-120, 120]) { const burner = new T.Mesh(new T.CylinderGeometry(28, 28, 6, 24), dark); burner.position.set(x, 137, -158); this.scene.add(burner); }
    const pot = new T.Mesh(new T.CylinderGeometry(24, 23, 36, 24), steel); pot.position.set(-120, 157, -158); pot.castShadow = true; this.scene.add(pot);
    box(this.scene, [115, 10, 56], [370, 140, -165], wood);
  }
  resize() {
    const canvas = this.renderer.domElement, w = canvas.clientWidth, h = canvas.clientHeight;
    if (w !== this.width || h !== this.height) { this.width = w; this.height = h; this.renderer.setSize(w, h, false); }
  }
  render(fight: Fight, portraits: [Portrait, Portrait], now = performance.now()) {
    this.resize();
    const dt = this.previous ? Math.min(.05, (now - this.previous) / 1000) : 0; this.previous = now;
    this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const impact = !this.reduced && fight.hitstop > 0;
    const shake = impact && fight.hitstop > .04 ? 2.5 : 0;
    // The camera tracks the midpoint and frames both fighters, keeping the frustum at the canvas aspect.
    const [p1, p2] = fight.fighters, aspect = this.width / Math.max(1, this.height) || 1.74;
    const halfWidth = Math.min(600, Math.max(Math.abs(p1.x - p2.x) / 2 + 215, 165 * aspect, 330));
    const centerX = Math.max(-600 + halfWidth, Math.min(600 - halfWidth, (p1.x + p2.x) / 2 - 540));
    const centerY = halfWidth / aspect - 42 + Math.max(p1.air, p2.air) * .45;
    // New rounds cut straight to the spawn framing instead of drifting from the last K.O.
    const follow = this.cameraX === null || fight.phase === 'ready' ? 1 : Math.min(1, dt * 5);
    this.cameraX = this.cameraX === null ? centerX : this.cameraX + (centerX - this.cameraX) * follow;
    this.cameraY += (centerY - this.cameraY) * follow; this.cameraWidth += (halfWidth - this.cameraWidth) * follow;
    // A slight punch-in during hitstop sells the impact without moving the playfield.
    this.punch += ((impact ? .03 : 0) - this.punch) * (impact ? 1 : Math.min(1, dt * 10));
    const w = this.cameraWidth * (1 - this.punch), h = w / aspect;
    Object.assign(this.camera, { left: -w, right: w, top: h, bottom: -h }); this.camera.updateProjectionMatrix();
    this.camera.position.set(this.cameraX + Math.sin(now * .09) * shake, this.cameraY + 170, 1100); this.camera.lookAt(this.cameraX, this.cameraY, 0);
    fight.fighters.forEach((f, i) => {
      const r = this.rigs[i], p = fighterPose(f, fight.elapsed), ch = portraits[i];
      r.root.position.set(f.x - 540, f.air, f.z * 1.65); const other = fight.fighters[1 - i];
      // Fighters turn toward each other when a sidestep breaks the line, as in a 3D fighter.
      r.root.rotation.y = Math.atan2(-(other.z - f.z) * 1.65, (other.x - f.x) || f.facing) + (f.facing < 0 ? STANCE : -STANCE);
      r.body.visible = !ch.image; r.photo.visible = !!ch.image?.complete && !!ch.image.naturalWidth;
      r.torso.position.set(...p.hip); r.torso.rotation.z = -p.lean; r.head.rotation.z = p.headTilt;
      const pairs: [Point, Point][] = [[[p.hip[0] + 5, p.hip[1] - 6, 12], p.frontKnee], [p.frontKnee, p.frontFoot], [[p.hip[0] - 5, p.hip[1] - 6, -12], p.backKnee], [p.backKnee, p.backFoot],
        [p.shoulder, p.elbow], [p.elbow, p.hand], [p.rearShoulder, p.rearElbow], [p.rearElbow, p.rearHand]];
      pairs.forEach(([start, end], n) => join(r.limbs[n], start, end));
      [p.frontKnee, p.backKnee, p.elbow, p.rearElbow, p.shoulder, p.rearShoulder].forEach((point, n) => r.joints[n].position.set(...point));
      r.feet[0].position.set(p.frontFoot[0] + 8, p.frontFoot[1], p.frontFoot[2]); r.feet[1].position.set(p.backFoot[0] + 8, p.backFoot[1], p.backFoot[2]);
      r.hands[0].position.set(...p.hand); r.hands[1].position.set(...p.rearHand);
      if (r.weaponId !== f.weapon) { r.root.remove(r.weapon); this.disposeObject(r.weapon); r.weapon = makeWeapon(f.weapon); r.root.add(r.weapon); r.weaponId = f.weapon; }
      r.weapon.position.set(...p.hand); r.weapon.rotation.z = p.weaponAngle;
      if (ch.image && ch.image !== r.image && ch.image.complete && ch.image.naturalWidth) {
        const m = r.photo.material as T.MeshBasicMaterial; m.map?.dispose(); m.map = new T.Texture(ch.image); m.map.colorSpace = T.SRGBColorSpace; m.map.needsUpdate = true; m.needsUpdate = true; r.image = ch.image;
      }
      if (ch.image) {
        const size = photoSize(ch.image.naturalWidth || 1, ch.image.naturalHeight || 1, ch.zoom);
        r.photo.scale.set(size.width, size.height * (f.input.crouch && !f.action ? .78 : 1), 1); r.photo.position.set(ch.x * 15 + p.strike * 8, size.height / 2 + ch.y * 15, 40);
        r.photo.quaternion.copy(r.root.quaternion).invert().multiply(this.camera.quaternion); r.photo.rotateZ((f.stun ? -.08 : -.035 * p.strike) * f.facing);
        r.weapon.position.set(p.hand[0], Math.min(size.height * .7, p.hand[1]), 55);
      }
      this.updateTrail(r, f.action ? p.swing : 0, p.weaponAngle, r.weapon.position);
      if (f.hp < r.hp) r.flash = .12; r.hp = f.hp; if (!impact) r.flash = Math.max(0, r.flash - dt);
      for (const m of r.flashMaterials) { m.emissive.set('#ffd9c0'); m.emissiveIntensity = this.reduced ? 0 : r.flash * 1.6; }
    });
    this.sparks.forEach((spark, i) => {
      const e = fight.effects[Math.floor(i / 8)], n = i % 8; spark.visible = !!e;
      if (!e) return; const progress = 1 - e.life / .4, angle = n * Math.PI / 4 + .3;
      const spread = (e.kind === 'super' ? 70 : 42) * Math.sqrt(progress);
      spark.position.set(e.x - 540 + Math.cos(angle) * spread, e.y + Math.sin(angle) * spread, e.z * 1.65 + 45); spark.rotation.set(angle, angle, 0);
      const m = spark.material as T.MeshBasicMaterial; m.opacity = Math.min(1, e.life * 5); m.color.set(e.kind === 'block' ? '#c4d1d9' : '#f1ca94'); spark.scale.set(3 - progress * 2, .7, .7);
    });
    this.rings.forEach((ring, i) => {
      const e = fight.effects[i]; ring.visible = !!e && !this.reduced; if (!e) return;
      const progress = 1 - e.life / .4; ring.position.set(e.x - 540, e.y, e.z * 1.65 + 40); ring.quaternion.copy(this.camera.quaternion);
      ring.scale.setScalar((e.kind === 'super' ? 30 : 16) + progress * (e.kind === 'super' ? 90 : 46));
      const m = ring.material as T.MeshBasicMaterial; m.opacity = (1 - progress) * .8; m.color.set(e.kind === 'block' ? '#b9cbd6' : '#f6e7d2');
    });
    this.renderer.render(this.scene, this.camera);
  }
  /** A short ribbon behind the weapon head during the swing, read from the weapon's own pose. */
  updateTrail(r: Rig, swing: number, angle: number, hand: T.Vector3) {
    const length = WEAPON_LENGTH[r.weaponId], sx = -Math.sin(angle), sy = Math.cos(angle);
    const point = [hand.x + sx * length * .78, hand.y + sy * length * .78, hand.z, hand.x + sx * length, hand.y + sy * length, hand.z];
    if (swing > .05 && !this.reduced) { r.history.unshift(...point); r.history.length = Math.min(r.history.length, TRAIL * 6); }
    else if (r.history.length) r.history.length = Math.max(0, r.history.length - 12);
    const position = r.trail.geometry.getAttribute('position') as T.BufferAttribute, count = r.history.length / 6;
    for (let n = 0; n < TRAIL; n++) for (let k = 0; k < 6; k++) position.array[n * 6 + k] = r.history[Math.min(n, Math.max(0, count - 1)) * 6 + k] ?? 0;
    position.needsUpdate = true; (r.trail.material as T.MeshBasicMaterial).opacity = count > 1 ? .16 : 0;
  }
  disposeObject(obj: T.Object3D) { obj.traverse(child => { if (child instanceof T.Mesh) { child.geometry.dispose(); for (const m of Array.isArray(child.material) ? child.material : [child.material]) { if ('map' in m) (m.map as T.Texture | null)?.dispose(); m.dispose(); } } }); }
  dispose() { this.disposeObject(this.scene); this.renderer.dispose(); }
}
