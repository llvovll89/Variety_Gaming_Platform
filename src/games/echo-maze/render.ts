import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { key, LEVELS, DIRECTIONS, type MazeRun } from './engine';
import { masonry, capstone, starGeometry, stoneArch } from './art';

const mat = (color: string) => new T.MeshStandardMaterial({ color, roughness: .85 });
type Decoration = { x: number; z: number; object: T.Object3D };
/** Stone ruins with north-aligned controls and fog that never reveals unseen routes. */
export class MazeScene {
  private renderer: T.WebGLRenderer;
  private scene = new T.Scene();
  private camera = new T.OrthographicCamera(-10, 10, 10, -10, .1, 200);
  private walls: T.InstancedMesh;
  private caps: T.InstancedMesh;
  private floor: T.InstancedMesh;
  private tracks: T.InstancedMesh;
  private player = new T.Group();
  private eyes = new T.Group();
  private anchor: T.Group;
  private echo: T.Mesh;
  private exit = new T.Group();
  private portal: T.Mesh;
  private playerLight = new T.PointLight('#ffd080', 3, 5, 2);
  private crystals = new Map<string, T.Group>();
  private seals = new Map<string, T.Group>();
  private traps = new Map<string, T.Group>();
  private decorations: Decoration[] = [];
  private dummy = new T.Object3D();
  private width = 0; private height = 0; private time = 0;
  private reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  private face: T.Sprite;
  private disposed = false;
  private portrait: HTMLImageElement | null = null;
  private imageSource = '';
  private lastVisibility = '';
  private closeView = false;
  private ray = new T.Raycaster();
  private plane = new T.Plane(new T.Vector3(0, 1, 0), 0);
  setCloseView(close: boolean) { this.closeView = close; }
  constructor(private canvas: HTMLCanvasElement, private run: MazeRun) {
    this.renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
    this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = T.PCFSoftShadowMap;
    this.renderer.shadowMap.autoUpdate = false;
    this.renderer.outputColorSpace = T.SRGBColorSpace; this.renderer.toneMapping = T.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.3;
    this.renderer.setClearColor(0x000000, 0);
    const n = run.cells.length, center = (n - 1) / 2;
    this.camera.position.set(0, n * 1.1, n * .85); this.camera.lookAt(0, 0, 0);
    this.scene.add(new T.HemisphereLight('#c6dcf2', '#263442', 2.2));
    const sun = new T.DirectionalLight('#d2e4f3', 2); sun.position.set(-n * .6, n, n * .4); sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -n, right: n, top: n, bottom: -n, far: n * 4 }); sun.shadow.camera.updateProjectionMatrix(); sun.shadow.normalBias = .035; this.scene.add(sun);
    const stone = masonry(), paving = masonry(true), topStone = capstone();
    const wallMaterial = new T.MeshStandardMaterial({ color: '#a6b0b9', map: stone, bumpMap: stone, bumpScale: .065, roughness: .96 });
    const tileMaterial = new T.MeshStandardMaterial({ color: '#c0bbb0', map: paving, bumpMap: paving, bumpScale: .025, roughness: .95 });
    const add = (geometry: T.BufferGeometry, material: T.Material, x: number, y: number, z: number, parent: T.Object3D = this.scene) => {
      const mesh = new T.Mesh(geometry, material); mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
    };
    add(new RoundedBoxGeometry(n + .6, 1.4, n + .6, 1, .06), wallMaterial, 0, -.77, 0);
    add(new T.BoxGeometry(n + .8, .12, n + .8), mat('#303c47'), 0, -1.45, 0);
    const wallCount = run.cells.flat().filter(v => v === 1).length;
    this.walls = new T.InstancedMesh(new RoundedBoxGeometry(.98, .6, .98, 1, .025), wallMaterial, wallCount);
    this.walls.castShadow = this.walls.receiveShadow = true; this.scene.add(this.walls);
    this.caps = new T.InstancedMesh(new T.BoxGeometry(1.01, .085, 1.01), new T.MeshStandardMaterial({ color: '#97a1a4', map: topStone, bumpMap: topStone, bumpScale: .04, roughness: .95 }), wallCount); this.caps.receiveShadow = true; this.scene.add(this.caps);
    this.floor = new T.InstancedMesh(new T.BoxGeometry(.975, .06, .975), tileMaterial, n * n); this.floor.receiveShadow = true; this.scene.add(this.floor);
    this.tracks = new T.InstancedMesh(new T.RingGeometry(.045, .072, 12), new T.MeshBasicMaterial({ color: '#77bcb9', transparent: true, opacity: .65 }), n * n); this.scene.add(this.tracks);
    // Fog changes instance transforms after the first frame; initial bounds must not hide later corridors.
    this.walls.frustumCulled = this.caps.frustumCulled = this.tracks.frustumCulled = false;
    const star = add(starGeometry(), new T.MeshStandardMaterial({ color: '#ffc857', emissive: '#a56117', emissiveIntensity: .28, roughness: .34, metalness: .15 }), 0, .8, 0, this.player); star.rotation.x = -.15;
    for (const side of [-1, 1]) { const eye = add(new T.SphereGeometry(.037, 10, 8), mat('#24211c'), side * .095, .86, .195, this.eyes); eye.scale.y = 1.55; add(new T.SphereGeometry(.012, 6, 4), new T.MeshBasicMaterial({ color: '#ffffff' }), side * .095 - .01, .88, .228, this.eyes); }
    const smile = add(new T.TorusGeometry(.065, .009, 5, 16, Math.PI), mat('#63451b'), 0, .75, .2, this.eyes); smile.rotation.z = Math.PI; this.player.add(this.eyes);
    this.face = new T.Sprite(new T.SpriteMaterial({ color: '#ffffff', depthTest: true })); this.face.position.set(0, .83, .25); this.face.scale.set(.35, .35, 1); this.face.visible = false; this.player.add(this.face);
    const glow = add(new T.RingGeometry(.18, .42, 32), new T.MeshBasicMaterial({ color: '#efbc69', transparent: true, opacity: .24, depthWrite: false }), 0, .045, 0, this.player); glow.rotation.x = -Math.PI / 2;
    this.player.position.set(run.player.x - center, 0, run.player.y - center); this.scene.add(this.player, this.playerLight);
    this.anchor = new T.Group();
    for (const rotation of [0, Math.PI / 2, Math.PI / 4]) { const ring = add(new T.TorusGeometry(.23, .018, 6, 24), new T.MeshStandardMaterial({ color: '#e2b96b', metalness: .6, roughness: .3 }), 0, .34, 0, this.anchor); ring.rotation.y = rotation; }
    add(new T.SphereGeometry(.1, 10, 8), new T.MeshStandardMaterial({ color: '#77d8d9', emissive: '#50b9be', emissiveIntensity: .7 }), 0, .34, 0, this.anchor);
    add(new T.CylinderGeometry(.26, .3, .06, 16), mat('#b7965b'), 0, .05, 0, this.anchor); this.scene.add(this.anchor);
    this.echo = add(new T.RingGeometry(.98, 1, 64), new T.MeshBasicMaterial({ color: '#84e3e4', transparent: true, opacity: 0, depthWrite: false }), 0, .065, 0); this.echo.rotation.x = -Math.PI / 2;
    this.exit.add(stoneArch(wallMaterial));
    this.portal = add(new T.CircleGeometry(.43, 32), new T.MeshBasicMaterial({ color: '#77e4e6', transparent: true, opacity: .78, side: T.DoubleSide }), 0, .68, .035, this.exit); this.portal.scale.y = 1.22;
    for (const radius of [.27, .36, .42]) add(new T.TorusGeometry(radius, .012, 6, 40), new T.MeshBasicMaterial({ color: '#b6ffff' }), 0, .69, .06, this.exit);
    for (const side of [-1, 1]) { add(new T.BoxGeometry(.15, .22, .15), mat('#6e756f'), side * .64, .11, .12, this.exit); add(new T.OctahedronGeometry(.075), new T.MeshBasicMaterial({ color: '#ffda8b' }), side * .64, .31, .12, this.exit); }
    const portalLight = new T.PointLight('#73dce2', 2.5, 4, 2); portalLight.position.set(0, .8, .35); this.exit.add(portalLight);
    const labelCanvas = document.createElement('canvas'); labelCanvas.width = 256; labelCanvas.height = 96;
    const ctx = labelCanvas.getContext('2d')!; ctx.fillStyle = '#101d2bea'; ctx.fillRect(0, 0, 256, 96); ctx.fillStyle = '#b7ffff'; ctx.font = '600 42px Pretendard,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('출구', 128, 49);
    const labelTexture = new T.CanvasTexture(labelCanvas); labelTexture.colorSpace = T.SRGBColorSpace;
    const label = new T.Sprite(new T.SpriteMaterial({ map: labelTexture, depthTest: false })); label.position.y = 1.6; label.scale.set(.95, .356, 1); label.renderOrder = 6; this.exit.add(label);
    this.exit.position.set(run.exit.x - center, 0, run.exit.y - center); this.scene.add(this.exit);
    for (const id of run.shards) {
      const [x, z] = id.split(',').map(Number), hourglass = new T.Group();
      for (const y of [.18, .68]) add(new T.CylinderGeometry(.18, .18, .06, 12), mat('#cba95c'), 0, y, 0, hourglass);
      for (let i = 0; i < 3; i++) { const angle = i * Math.PI * 2 / 3; add(new T.CylinderGeometry(.015, .015, .5, 5), mat('#cba95c'), Math.cos(angle) * .14, .43, Math.sin(angle) * .14, hourglass); }
      for (const side of [-1, 1]) { const sand = add(new T.ConeGeometry(.12, .2, 10), new T.MeshStandardMaterial({ color: '#ffd982', emissive: '#d7992b', emissiveIntensity: .7 }), 0, .43 + side * .11, 0, hourglass); if (side < 0) sand.rotation.z = Math.PI; }
      hourglass.position.set(x - center, 0, z - center); this.scene.add(hourglass); this.crystals.set(id, hourglass);
    }
    for (const id of run.seals) {
      const [x,z] = id.split(',').map(Number), seal = new T.Group();
      add(new T.OctahedronGeometry(.22), new T.MeshStandardMaterial({ color: '#bf9ef2', emissive: '#8258b2', emissiveIntensity: .75, roughness: .25 }), 0, .55, 0, seal);
      const ring = add(new T.TorusGeometry(.29, .022, 6, 20), mat('#c7b495'), 0, .55, 0, seal); ring.rotation.x = .7;
      seal.position.set(x-center,0,z-center); this.scene.add(seal); this.seals.set(id,seal);
    }
    for (const id of run.traps) {
      const [x,z] = id.split(',').map(Number), trap = new T.Group();
      const ring = add(new T.RingGeometry(.21,.33,8), new T.MeshBasicMaterial({ color: '#e87464', side: T.DoubleSide }), 0,.055,0,trap); ring.rotation.x = -Math.PI/2;
      for (let i=0;i<3;i++) add(new T.ConeGeometry(.07,.22,4), mat('#aeb3af'), (i-1)*.15,.14,0,trap);
      trap.position.set(x-center,0,z-center); this.scene.add(trap); this.traps.set(id,trap);
    }
    const moss = mat('#5b744a'), stem = mat('#435540'), crystalMaterial = new T.MeshStandardMaterial({ color: '#ffdb91', emissive: '#ffc66c', emissiveIntensity: .6, roughness: .45 });
    for (let z=1;z<n-1;z++) for(let x=1;x<n-1;x++) {
      if(run.cells[z][x]!==1 || (x*13+z*7)%5!==0) continue;
      const decor = new T.Group(); decor.position.set(x-center,0,z-center);
      for(let i=0;i<5;i++) { const leaf=add(new T.OctahedronGeometry(.08),moss,.25+Math.sin(i*2)*.12,.63-i*.1,.51,decor); leaf.scale.set(1.2,.6,1); add(new T.CylinderGeometry(.009,.009,.16,4),stem,.28,.56-i*.1,.5,decor); }
      if((x+z)%3===0) for(let i=0;i<3;i++) { const shard=add(new T.ConeGeometry(.045,.12+i*.035,5),crystalMaterial,-.2+i*.1,.71+i*.02,-.1,decor); shard.rotation.z=(i-1)*.2; }
      // Each ivy cluster uses one draw per material, rather than one per leaf/stem.
      const batches = new Map<T.Material, T.BufferGeometry[]>();
      for (const child of [...decor.children]) {
        const mesh = child as T.Mesh<T.BufferGeometry, T.Material>; mesh.updateMatrix();
        const geometries = batches.get(mesh.material) || [];
        geometries.push(mesh.geometry.clone().applyMatrix4(mesh.matrix)); batches.set(mesh.material, geometries);
        mesh.geometry.dispose(); decor.remove(mesh);
      }
      for (const [material, geometries] of batches) {
        const geometry = mergeGeometries(geometries)!;
        geometries.forEach(item => item.dispose()); decor.add(new T.Mesh(geometry, material));
      }
      this.decorations.push({x,z,object:decor}); this.scene.add(decor);
    }
  }
  /** Mouse taps only move to adjacent corridors; no path or fog information is exposed. */
  directionAt(clientX: number, clientY: number): number | null {
    const rect=this.canvas.getBoundingClientRect();
    this.ray.setFromCamera(new T.Vector2((clientX-rect.left)/rect.width*2-1,1-(clientY-rect.top)/rect.height*2),this.camera);
    const hit=this.ray.ray.intersectPlane(this.plane,new T.Vector3()); if(!hit)return null;
    const center=(this.run.cells.length-1)/2, x=Math.round(hit.x+center), y=Math.round(hit.z+center);
    const direction=DIRECTIONS.findIndex(d=>this.run.player.x+d.x===x&&this.run.player.y+d.y===y);
    return direction>=0&&this.run.cells[y]?.[x]===0?direction:null;
  }
  setPortrait(source: string) {
    if(source===this.imageSource)return; this.imageSource=source;
    const custom=!source.endsWith('/art/star-avatar.svg'); this.face.visible=custom; this.eyes.visible=!custom;
    if(this.portrait)this.portrait.onload=null; if(!custom)return;
    const img=new Image(); this.portrait=img;
    img.onload=()=>{if(this.disposed||this.imageSource!==source)return; const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d')!;const side=Math.min(img.naturalWidth,img.naturalHeight);ctx.beginPath();ctx.arc(64,64,62,0,Math.PI*2);ctx.clip();ctx.drawImage(img,(img.naturalWidth-side)/2,(img.naturalHeight-side)/2,side,side,0,0,128,128);const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;const material=this.face.material as T.SpriteMaterial;material.map?.dispose();material.map=texture;material.needsUpdate=true;};
    img.src=source;
  }
  draw(dt: number) {
    const {canvas,run}=this,n=run.cells.length,center=(n-1)/2;
    const width=Math.max(1,canvas.clientWidth),height=Math.max(1,canvas.clientHeight);
    if(width!==this.width||height!==this.height){this.width=width;this.height=height;this.renderer.setSize(width,height,false);}
    const aspect=width/height,close=this.closeView&&run.reveal<=0&&run.status==='playing';
    const view=close?Math.max(3.6,4.2/aspect):Math.max(n*.48,(n+2.8)/(2*aspect));
    if(this.camera.top!==view||this.camera.right!==view*aspect){Object.assign(this.camera,{left:-view*aspect,right:view*aspect,top:view,bottom:-view});this.camera.updateProjectionMatrix();}
    if(!run.paused&&run.status==='playing')this.time+=dt;
    const visible=(x:number,z:number)=>run.status!=='playing'||run.reveal>0||Math.hypot(x-run.player.x,z-run.player.y)<=LEVELS[run.difficulty].vision;
    const signature=`${key(run.player)}:${run.reveal>0}:${run.status}:${run.visited.size}`;
    if(signature!==this.lastVisibility){
      this.renderer.shadowMap.needsUpdate = true;
      this.lastVisibility=signature;let wallIndex=0;
      for(let z=0;z<n;z++)for(let x=0;x<n;x++){
        const lit=visible(x,z),visited=run.visited.has(`${x},${z}`),index=z*n+x;
        this.dummy.rotation.set(0,0,0);this.dummy.position.set(x-center,-.015,z-center);this.dummy.scale.setScalar(1);this.dummy.updateMatrix();this.floor.setMatrixAt(index,this.dummy.matrix);this.floor.setColorAt(index,new T.Color(lit?'#ffffff':visited?'#8b9aaa':'#536679'));
        if(run.cells[z][x]===1){this.dummy.position.y=.3;this.dummy.scale.setScalar(lit?1:0);this.dummy.updateMatrix();this.walls.setMatrixAt(wallIndex,this.dummy.matrix);this.dummy.position.y=.64;this.dummy.updateMatrix();this.caps.setMatrixAt(wallIndex++,this.dummy.matrix);}
        this.dummy.rotation.x=-Math.PI/2;this.dummy.position.y=.04;this.dummy.scale.setScalar(lit&&visited?1:0);this.dummy.updateMatrix();this.tracks.setMatrixAt(index,this.dummy.matrix);
      }
      this.walls.instanceMatrix.needsUpdate=this.caps.instanceMatrix.needsUpdate=this.floor.instanceMatrix.needsUpdate=this.tracks.instanceMatrix.needsUpdate=true;if(this.floor.instanceColor)this.floor.instanceColor.needsUpdate=true;
      for(const decor of this.decorations)decor.object.visible=visible(decor.x,decor.z);
    }
    const blend=this.reduced?1:1-Math.exp(-dt*24);
    this.player.position.x+=(run.player.x-center-this.player.position.x)*blend;this.player.position.z+=(run.player.y-center-this.player.position.z)*blend;this.player.position.y=this.reduced?0:Math.sin(this.time*4)*.025;
    const focusX=close?this.player.position.x:0,focusZ=close?this.player.position.z:0;
    this.camera.position.set(focusX,n*1.1,focusZ+n*.85);this.camera.lookAt(focusX,0,focusZ);this.camera.updateMatrixWorld();
    this.playerLight.position.set(this.player.position.x,.85,this.player.position.z+.3);
    this.anchor.visible=!!run.anchor&&visible(run.anchor.x,run.anchor.y);if(run.anchor)this.anchor.position.set(run.anchor.x-center,0,run.anchor.y-center);
    this.echo.visible=run.reveal>0&&run.reveal<=5;
    if(this.echo.visible){const progress=(5-run.reveal)/5;this.echo.position.set(run.player.x-center,.065,run.player.y-center);this.echo.scale.setScalar(1+progress*n);(this.echo.material as T.MeshBasicMaterial).opacity=this.reduced ? .16 : (1-progress)*.5;}
    for(const[id,crystal]of this.crystals){const[x,z]=id.split(',').map(Number);crystal.visible=run.shards.has(id)&&visible(x,z);if(!this.reduced)crystal.rotation.y=this.time*.35;}
    for(const[id,seal]of this.seals){const[x,z]=id.split(',').map(Number);seal.visible=run.seals.has(id)&&visible(x,z);if(!this.reduced){seal.rotation.y=this.time*.6;seal.position.y=Math.sin(this.time*2+x)*.055;}}
    for(const[id,trap]of this.traps){const[x,z]=id.split(',').map(Number);trap.visible=visible(x,z);const ring=trap.children[0] as T.Mesh;(ring.material as T.MeshBasicMaterial).color.set(run.trapsActive?'#f08069':'#566c74');for(let i=1;i<trap.children.length;i++)trap.children[i].scale.y=run.trapsActive?1:.25;}
    (this.portal.material as T.MeshBasicMaterial).color.set(run.seals.size?'#487982':'#7de4e8');(this.portal.material as T.MeshBasicMaterial).opacity=run.seals.size ? .35 : .85;
    this.renderer.render(this.scene,this.camera);
  }
  dispose() {
    this.disposed=true;if(this.portrait)this.portrait.onload=null;
    const geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>(),textures=new Set<T.Texture>();
    this.scene.traverse(object=>{if(object instanceof T.Mesh)geometries.add(object.geometry);if(object instanceof T.Mesh||object instanceof T.Sprite)for(const material of Array.isArray(object.material)?object.material:[object.material]){materials.add(material);for(const property of ['map','bumpMap']as const){const texture=(material as T.MeshStandardMaterial)[property];if(texture)textures.add(texture);}}if(object instanceof T.InstancedMesh)object.dispose();if(object instanceof T.Light&&'shadow'in object)(object as T.DirectionalLight).shadow.dispose();});
    geometries.forEach(g=>g.dispose());textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());this.renderer.dispose();
  }
}
