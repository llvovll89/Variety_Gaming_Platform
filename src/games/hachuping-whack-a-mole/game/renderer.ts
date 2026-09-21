import * as THREE from 'three';
import type { GameState } from './types';

const material = (color: string, roughness = .55) => new THREE.MeshStandardMaterial({color, roughness});
const sphereGeometry = new THREE.SphereGeometry(1, 24, 16);
function ball(parent: THREE.Object3D, mat: THREE.Material, x: number, y: number, z: number, sx: number, sy = sx, sz = sx) {
  const mesh = new THREE.Mesh(sphereGeometry, mat); mesh.position.set(x,y,z); mesh.scale.set(sx,sy,sz);
  mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
}
function makeMole(index: number) {
  const g = new THREE.Group();
  const fur = material(['#b68160','#a87964','#bb8a68'][index % 3]);
  const cream = material('#ffe2bf'), dark = material('#263b37', .25), pink = material('#e99e87'), white = material('#fffdf2', .25);
  ball(g, fur, 0,.35,0,.53,.66,.46);
  ball(g, fur, -.48,1.0,0,.2,.23,.14); ball(g, fur,.48,1.0,0,.2,.23,.14);
  ball(g, pink,-.48,1.0,.1,.105,.13,.055); ball(g,pink,.48,1,.1,.105,.13,.055);
  ball(g, fur,0,.8,.03,.62,.56,.52);
  ball(g,cream,0,.58,.46,.38,.27,.16);
  for (const side of [-1,1]) {
    ball(g,dark,side*.235,.88,.493,.075,.105,.045);
    ball(g,white,side*.235-.017,.915,.53,.023);
    ball(g,pink,side*.39,.67,.425,.1,.06,.04);
    ball(g,fur,side*.49,.17,.34,.21,.16,.25);
    for (let j=0;j<3;j++) ball(g,cream,side*.49+(j-1)*.075,.13,.55,.035,.04,.085);
  }
  ball(g,pink,0,.69,.615,.14,.105,.08);
  ball(g,dark,0,.43,.61,.115,.05,.025);
  ball(g,white,-.045,.44,.639,.04,.07,.015); ball(g,white,.045,.44,.639,.04,.07,.015);
  const hat = material('#ffad51', .35);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(.53,24,12,0,Math.PI*2,0,Math.PI/2),hat);
  cap.position.set(0,1.12,0); cap.scale.y=.52; cap.castShadow=true; g.add(cap);
  ball(g,hat,0,1.12,.13,.59,.065,.55);
  ball(g,cream,0,1.29,.39,.12,.1,.035);
  return g;
}

export interface TargetPoint {id: number; x: number; y: number; radius: number}
export class MoleScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera(-6,6,5,-5,.1,80);
  private moles: THREE.Group[] = [];
  private bursts: THREE.Group[] = [];
  private positions: THREE.Vector3[] = [];
  private width = 1; private height = 1;
  private reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  constructor(canvas: HTMLCanvasElement, private preview = false) {
    this.renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true});
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearColor(0x000000,0);
    this.camera.position.set(0,10,12); this.camera.lookAt(0,0,0);
    this.scene.add(new THREE.HemisphereLight('#fffaf1','#819f94',2.5));
    const light = new THREE.DirectionalLight('#fff5e5',3.4); light.position.set(-5,10,7); light.castShadow=true;
    light.shadow.mapSize.set(1024,1024); Object.assign(light.shadow.camera,{left:-7,right:7,top:7,bottom:-7}); light.shadow.normalBias=.04; this.scene.add(light);
    const fill = new THREE.DirectionalLight('#d5fff3',1); fill.position.set(5,3,-4); this.scene.add(fill);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(200,200), new THREE.ShadowMaterial({opacity:.13}));
    ground.rotation.x=-Math.PI/2; ground.position.y=-.85; ground.receiveShadow=true; this.scene.add(ground);
    const shape = new THREE.Shape();
    const a=3.65,r=.55;
    shape.moveTo(-a+r,-a); shape.lineTo(a-r,-a); shape.quadraticCurveTo(a,-a,a,-a+r);
    shape.lineTo(a,a-r); shape.quadraticCurveTo(a,a,a-r,a); shape.lineTo(-a+r,a);
    shape.quadraticCurveTo(-a,a,-a,a-r); shape.lineTo(-a,-a+r); shape.quadraticCurveTo(-a,-a,-a+r,-a);
    for (let i=0;i<9;i++) {
      const x=(i%3-1)*2.15,z=(Math.floor(i/3)-1)*2.1;
      this.positions.push(new THREE.Vector3(x,0,z));
      const hole=new THREE.Path(); hole.absarc(x,-z,.79,0,Math.PI*2,true); shape.holes.push(hole);
    }
    const deck = new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.5,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.1,bevelThickness:.1,curveSegments:32}),material('#8bc6b0'));
    deck.rotation.x=-Math.PI/2; deck.position.y=-.6; deck.receiveShadow=true; deck.castShadow=true; this.scene.add(deck);
    const rim=material('#c5e6cc'), holeMat=material('#234a42');
    const burstMat=material('#ffb34c');
    for (let i=0;i<9;i++) {
      const p=this.positions[i];
      const well=new THREE.Mesh(new THREE.CylinderGeometry(.78,.7,.45,32,1,true),holeMat); well.position.set(p.x,-.3,p.z); this.scene.add(well);
      const base=new THREE.Mesh(new THREE.CircleGeometry(.76,32),holeMat); base.rotation.x=-Math.PI/2; base.position.set(p.x,-.54,p.z); this.scene.add(base);
      const ring=new THREE.Mesh(new THREE.TorusGeometry(.81,.105,12,40),rim); ring.rotation.x=-Math.PI/2; ring.position.set(p.x,.015,p.z); ring.castShadow=true; ring.receiveShadow=true; this.scene.add(ring);
      const mole=makeMole(i); mole.position.set(p.x,-1.8,p.z); this.moles.push(mole); this.scene.add(mole);
      const burst=new THREE.Group(); burst.position.copy(p); burst.visible=false;
      for(let k=0;k<8;k++) {const part=new THREE.Mesh(new THREE.IcosahedronGeometry(.07),burstMat); burst.add(part);}
      this.bursts.push(burst); this.scene.add(burst);
    }
    // Molded feet and tiny corner fasteners ground the toy in the scene.
    const foot=material('#477e69');
    for(const x of [-3,3]) for(const z of [-3,3]) {
      ball(this.scene,foot,x,-.64,z,.35,.2,.35);
      ball(this.scene,rim,x,-.015,z,.07,.025,.07);
    }
  }
  resize(width: number,height: number) {
    this.width=width; this.height=height; this.renderer.setSize(width,height,false);
    const aspect=width/Math.max(1,height), view=Math.max(3.65,4.15/aspect);
    this.camera.left=-view*aspect; this.camera.right=view*aspect; this.camera.top=view; this.camera.bottom=-view;
    this.camera.updateProjectionMatrix();
  }
  targets(): TargetPoint[] {
    return this.positions.map((p,id)=> {
      const center=new THREE.Vector3(p.x,.35,p.z).project(this.camera);
      const edge=new THREE.Vector3(p.x+.88,.35,p.z).project(this.camera);
      return {id,x:(center.x+1)*this.width/2,y:(1-center.y)*this.height/2,radius:Math.abs(edge.x-center.x)*this.width/2};
    });
  }
  render(state: GameState | null, hit: (id:number)=>number, time: number) {
    for (let i=0;i<9;i++) {
      const mole=state?.moles[i], flash=hit(i);
      const demo=this.preview && [1,3,8].includes(i);
      const active=mole?.isActive || demo;
      const pop=active ? (demo || this.reduced ? 1 : Math.min(1,(mole?.activeSince ?? 0)/.13)) : 0;
      const m=this.moles[i];
      m.visible=!!active || flash>0;
      m.position.y=flash>0 ? -.2-(1-flash)*1.25 : -1.55+(1-Math.pow(1-pop,3))*1.6;
      m.scale.set(1+(flash>0?(1-flash)*.2:0),flash>0?.65:1,1);
      m.rotation.z=demo && !this.reduced ? Math.sin(time*1.4+i)*.035 : 0;
      const burst=this.bursts[i]; burst.visible=flash>0 && !this.reduced;
      burst.children.forEach((p,k)=> {const a=k*Math.PI/4,t=1-flash; p.position.set(Math.cos(a)*t*1.4,.7+Math.sin(t*Math.PI)*1.1,Math.sin(a)*t*1.4); p.scale.setScalar(flash*1.6); p.rotation.x=t*6;});
    }
    this.renderer.render(this.scene,this.camera);
  }
  dispose() {
    const geometries=new Set<THREE.BufferGeometry>(), materials=new Set<THREE.Material>();
    this.scene.traverse(o=> {if(o instanceof THREE.Mesh){if(o.geometry!==sphereGeometry) geometries.add(o.geometry); for(const m of Array.isArray(o.material)?o.material:[o.material]) materials.add(m);}});
    geometries.forEach(g=>g.dispose()); materials.forEach(m=>m.dispose()); this.renderer.dispose();
  }
}
