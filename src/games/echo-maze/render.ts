import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { key, LEVELS, type MazeRun } from './engine';

const mat = (color: string) => new THREE.MeshStandardMaterial({ color, roughness: .72 });
/** A real WebGL diorama. Grid X/Z axes stay aligned with the movement controls. */
export class MazeScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera(-10, 10, 10, -10, .1, 200);
  private walls: THREE.InstancedMesh;
  private mist: THREE.InstancedMesh;
  private tracks: THREE.InstancedMesh;
  private player = new THREE.Group();
  private anchor: THREE.Mesh;
  private exit = new THREE.Group();
  private crystals = new Map<string, THREE.Mesh>();
  private dummy = new THREE.Object3D();
  private width = 0; private height = 0; private time = 0;
  private reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  private face: THREE.Sprite;
  private disposed = false;
  private portrait: HTMLImageElement | null = null;
  private imageSource = '';
  private lastVisibility = '';
  private closeView = false;
  setCloseView(close: boolean) { this.closeView = close; }
  constructor(private canvas: HTMLCanvasElement, private run: MazeRun) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearColor(0x000000, 0);
    const n = run.cells.length, center = (n - 1) / 2;
    this.camera.position.set(0, n * 1.15, n * 1.3);
    this.camera.lookAt(0, 0, 0);
    this.scene.add(new THREE.HemisphereLight('#fff7df', '#6a8f87', 2.6));
    const sun = new THREE.DirectionalLight('#fff2ca', 3);
    sun.position.set(-n * .5, n, n * .6); sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -n, right: n, top: n, bottom: -n, far: n * 4 });
    sun.shadow.normalBias = .045; this.scene.add(sun);
    const add = (geometry: THREE.BufferGeometry, material: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D = this.scene) => {
      const mesh = new THREE.Mesh(geometry, material); mesh.position.set(x, y, z);
      mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
    };
    const platform = add(new RoundedBoxGeometry(n + .8, .55, n + .8, 2, .15), mat('#78b79b'), 0, -.36, 0);
    platform.receiveShadow = true;
    add(new THREE.BoxGeometry(n + .25, .12, n + .25), mat('#e4e9cd'), 0, -.025, 0);
    const ground = add(new THREE.PlaneGeometry(n * 4, n * 4), new THREE.ShadowMaterial({ opacity: .12 }), 0, -.66, 0);
    ground.rotation.x = -Math.PI / 2;
    const wallCount = run.cells.flat().filter(v => v === 1).length;
    this.walls = new THREE.InstancedMesh(new RoundedBoxGeometry(.98, .7, .98, 2, .065), mat('#659f85'), wallCount);
    this.walls.castShadow = this.walls.receiveShadow = true; this.scene.add(this.walls);
    this.mist = new THREE.InstancedMesh(new THREE.BoxGeometry(1.01, .78, 1.01), mat('#b0c9be'), n * n);
    this.mist.receiveShadow = true; this.scene.add(this.mist);
    this.tracks = new THREE.InstancedMesh(new THREE.CircleGeometry(.07, 8), new THREE.MeshBasicMaterial({ color: '#76a791' }), n * n);
    this.scene.add(this.tracks);
    const sphere = new THREE.SphereGeometry(1, 16, 12);
    const body = add(sphere, mat('#efaa52'), 0, .38, 0, this.player); body.scale.set(.23, .3, .2);
    for (const side of [-1, 1]) {
      const foot = add(sphere, mat('#315b51'), side * .13, .12, .09, this.player); foot.scale.set(.09, .08, .14);
    }
    const head = add(sphere, mat('#fff0c8'), 0, .78, 0, this.player); head.scale.set(.26, .26, .26);
    const cap = add(new THREE.SphereGeometry(.29, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat('#e9a246'), 0, .9, 0, this.player);
    cap.scale.y = .5;
    this.face = new THREE.Sprite(new THREE.SpriteMaterial({ color: '#fff7dd', depthTest: false }));
    this.face.position.set(0, .82, .12); this.face.scale.set(.44, .44, 1); this.face.renderOrder = 5;
    this.player.add(this.face); this.player.position.set(run.player.x - center, 0, run.player.y - center); this.scene.add(this.player);
    this.anchor = add(new THREE.TorusGeometry(.34, .045, 8, 28), new THREE.MeshBasicMaterial({ color: '#39babb', depthTest: false }), 0, .1, 0);
    this.anchor.rotation.x = -Math.PI / 2; this.anchor.renderOrder = 4;
    const gateMat = mat('#2a7662');
    for (const side of [-1, 1]) add(new THREE.BoxGeometry(.13, 1.25, .15), gateMat, side * .35, .68, 0, this.exit);
    add(new THREE.BoxGeometry(.85, .18, .2), gateMat, 0, 1.3, 0, this.exit);
    add(new THREE.BoxGeometry(.58, 1.08, .04), new THREE.MeshBasicMaterial({ color: '#a5edd2', transparent: true, opacity: .72 }), 0, .64, 0, this.exit);
    // A billboard keeps the destination readable even behind a wall or in fog.
    const labelCanvas = document.createElement('canvas'); labelCanvas.width = 256; labelCanvas.height = 128;
    const ctx = labelCanvas.getContext('2d')!; ctx.fillStyle = '#286653'; ctx.fillRect(0, 0, 256, 128);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 64px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('EXIT', 128, 64);
    const labelTexture = new THREE.CanvasTexture(labelCanvas); labelTexture.colorSpace = THREE.SRGBColorSpace;
    const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTexture, depthTest: false }));
    label.position.y = 1.65; label.scale.set(1.15, .575, 1); label.renderOrder = 6; this.exit.add(label);
    this.exit.position.set(run.exit.x - center, 0, run.exit.y - center); this.scene.add(this.exit);
    for (const id of run.shards) {
      const [x, z] = id.split(',').map(Number);
      const crystal = add(new THREE.OctahedronGeometry(.22), new THREE.MeshStandardMaterial({ color: '#ffc866', emissive: '#b67d19', emissiveIntensity: .3, roughness: .3 }), x - center, .65, z - center);
      this.crystals.set(id, crystal);
    }
  }
  setPortrait(source: string) {
    if (source === this.imageSource) return;
    this.imageSource = source;
    if (this.portrait) this.portrait.onload = null;
    const img = new Image(); this.portrait = img;
    img.onload = () => {
      if (this.disposed) return;
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
      const ctx = canvas.getContext('2d')!; const side = Math.min(img.naturalWidth, img.naturalHeight);
      ctx.beginPath(); ctx.arc(64, 64, 62, 0, Math.PI * 2); ctx.clip();
      ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, 128, 128);
      const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
      const material = this.face.material as THREE.SpriteMaterial; material.map?.dispose(); material.map = texture; material.color.set('#ffffff'); material.needsUpdate = true;
    };
    img.src = source;
  }
  draw(dt: number) {
    const { canvas, run } = this, n = run.cells.length, center = (n - 1) / 2;
    const width = Math.max(1, canvas.clientWidth), height = Math.max(1, canvas.clientHeight);
    if (width !== this.width || height !== this.height) {
      this.width = width; this.height = height; this.renderer.setSize(width, height, false);
    }
    const aspect = width / height;
    // Echo reveals the whole board for five seconds, including in close view.
    const close = this.closeView && run.reveal <= 0 && run.status === 'playing';
    const view = close ? Math.max(3.8, 4.5 / aspect) : Math.max(n * .47, (n + 2.8) / (2 * aspect));
    if (this.camera.top !== view || this.camera.right !== view * aspect) {
      Object.assign(this.camera, { left: -view * aspect, right: view * aspect, top: view, bottom: -view }); this.camera.updateProjectionMatrix();
    }
    if (!run.paused && run.status === 'playing') this.time += dt;
    const visible = (x: number, z: number) => run.status !== 'playing' || run.reveal > 0 || Math.hypot(x - run.player.x, z - run.player.y) <= LEVELS[run.difficulty].vision;
    const signature = `${key(run.player)}:${run.reveal > 0}:${run.status}:${run.visited.size}`;
    if (signature !== this.lastVisibility) {
      this.lastVisibility = signature; let wallIndex = 0;
      for (let z = 0; z < n; z++) for (let x = 0; x < n; x++) {
        const lit = visible(x, z), index = z * n + x;
        this.dummy.rotation.set(0, 0, 0); this.dummy.position.set(x - center, .39, z - center); this.dummy.scale.setScalar(lit ? 0 : 1); this.dummy.updateMatrix(); this.mist.setMatrixAt(index, this.dummy.matrix);
        if (run.cells[z][x] === 1) {
          this.dummy.position.y = .38; this.dummy.scale.setScalar(lit ? 1 : 0); this.dummy.updateMatrix(); this.walls.setMatrixAt(wallIndex++, this.dummy.matrix);
        }
        this.dummy.rotation.x = -Math.PI / 2; this.dummy.position.y = .042; this.dummy.scale.setScalar(lit && run.visited.has(`${x},${z}`) ? 1 : 0); this.dummy.updateMatrix(); this.tracks.setMatrixAt(index, this.dummy.matrix);
      }
      this.walls.instanceMatrix.needsUpdate = this.mist.instanceMatrix.needsUpdate = this.tracks.instanceMatrix.needsUpdate = true;
    }
    const blend = this.reduced ? 1 : 1 - Math.exp(-dt * 24);
    this.player.position.x += (run.player.x - center - this.player.position.x) * blend;
    this.player.position.z += (run.player.y - center - this.player.position.z) * blend;
    this.player.position.y = this.reduced ? 0 : Math.sin(this.time * 5) * .025;
    const focusX = close ? this.player.position.x : 0, focusZ = close ? this.player.position.z : 0;
    this.camera.position.set(focusX, n * 1.15, focusZ + n * 1.3); this.camera.lookAt(focusX, 0, focusZ);
    this.anchor.visible = !!run.anchor && visible(run.anchor.x, run.anchor.y);
    if (run.anchor) this.anchor.position.set(run.anchor.x - center, .1, run.anchor.y - center);
    for (const [id, crystal] of this.crystals) {
      const [x, z] = id.split(',').map(Number); crystal.visible = run.shards.has(id) && visible(x, z);
      if (!this.reduced) { crystal.rotation.y = this.time; crystal.position.y = .65 + Math.sin(this.time * 2 + x) * .07; }
    }
    this.renderer.render(this.scene, this.camera);
  }
  dispose() {
    this.disposed = true; if (this.portrait) this.portrait.onload = null;
    const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>(), textures = new Set<THREE.Texture>();
    this.scene.traverse(object => {
      if (object instanceof THREE.Mesh) geometries.add(object.geometry);
      if (object instanceof THREE.Mesh || object instanceof THREE.Sprite) for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        materials.add(material); const map = (material as THREE.MeshStandardMaterial).map; if (map) textures.add(map);
      }
      if (object instanceof THREE.InstancedMesh) object.dispose();
      if (object instanceof THREE.Light && 'shadow' in object) (object as THREE.DirectionalLight).shadow.dispose();
    });
    geometries.forEach(g => g.dispose()); textures.forEach(t => t.dispose()); materials.forEach(m => m.dispose());
    // React StrictMode reuses the same canvas during its effect cleanup check.
    // Forcing context loss here would make that canvas unusable on the next mount.
    this.renderer.dispose();
  }
}
