import * as T from 'three';
import { FURNITURE, LEVELS, key, type State, type FurnitureKind, type Point } from './engine';
const mat=(color:string,glow=0)=>new T.MeshStandardMaterial({color,roughness:.78,metalness:.05,emissive:color,emissiveIntensity:glow});
function mesh(parent:T.Object3D,geometry:T.BufferGeometry,material:T.Material,p:number[]=[0,0,0]) {const m=new T.Mesh(geometry,material);m.position.set(...p as [number,number,number]);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function box(parent:T.Object3D,size:number[],p:number[],color:string|T.Material){return mesh(parent,new T.BoxGeometry(...size as [number,number,number]),typeof color==='string'?mat(color):color,p);}
function sphere(parent:T.Object3D,r:number,p:number[],color:string){return mesh(parent,new T.SphereGeometry(r,20,16),mat(color),p);}
function cylinder(parent:T.Object3D,r:number,h:number,p:number[],color:string,top=r){return mesh(parent,new T.CylinderGeometry(top,r,h,24),mat(color),p);}
function ring(parent:T.Object3D,r:number,color:string,y=.09){const m=mesh(parent,new T.TorusGeometry(r,.035,8,48),mat(color,.4),[0,y,0]);m.rotation.x=-Math.PI/2;return m;}
function label(text:string,color='#edf7ff',bg='#263b50') {
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=96;const ctx=canvas.getContext('2d')!;ctx.fillStyle=bg;ctx.beginPath();ctx.roundRect(4,8,248,80,22);ctx.fill();ctx.font='bold 34px Pretendard, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=color;ctx.fillText(text,128,49);
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;const sprite=new T.Sprite(new T.SpriteMaterial({map:texture,depthTest:false}));sprite.scale.set(1.2,.45,1);return sprite;
}
export function ghostModel() {
  const g=new T.Group(),body=sphere(g,.25,[0,.37,0],'#baf4e3');body.scale.set(1,1.2,.83);cylinder(g,.25,.22,[0,.23,0],'#baf4e3');
  for(const x of [-.16,0,.16])sphere(g,.095,[x,.13,.02],'#baf4e3');
  for(const x of [-.09,.09]){const eye=sphere(g,.034,[x,.4,.19],'#22364b');eye.scale.set(.9,1.4,.6);sphere(g,.037,[x*1.65,.31,.18],'#eeacb8');}
  const mouth=mesh(g,new T.TorusGeometry(.047,.012,6,14,Math.PI),mat('#294453'),[0,.325,.202]);mouth.rotation.z=Math.PI;
  for(const x of [-.3,.3]){const arm=sphere(g,.06,[x,.3,0],'#baf4e3');arm.scale.set(1.45,.6,.7);}
  return g;
}
export function furnitureModel(kind:FurnitureKind) {
  const g=new T.Group(),dark='#3e4965',feet='#48586b',color=FURNITURE[kind].color;
  const legs=()=>{for(const x of [-.27,.27])for(const z of [-.26,.26])cylinder(g,.04,.2,[x,.13,z],feet);};
  if(kind==='sofa'){legs();box(g,[.83,.26,.62],[0,.3,0],color);box(g,[.8,.4,.15],[0,.57,-.25],'#cb8975');for(const x of [-.19,.19])box(g,[.36,.12,.46],[x,.49,.025],'#f1b49d');for(const x of [-.41,.41])box(g,[.13,.37,.62],[x,.48,0],color);box(g,[.2,.23,.1],[-.2,.7,-.14],'#f5dcb3');}
  if(kind==='fridge'){box(g,[.64,1.12,.61],[0,.65,0],color);box(g,[.58,.35,.045],[0,1.02,.33],'#d6e0f3');box(g,[.58,.62,.045],[0,.51,.33],'#c5d3e8');for(const y of [.92,.5])box(g,[.045,.17,.05],[-.21,y,.365],dark);box(g,[.14,.13,.015],[.13,.94,.36],'#eace91');legs();}
  if(kind==='fan'){cylinder(g,.3,.08,[0,.09,0],color);cylinder(g,.045,.62,[0,.43,0],feet);const face=mesh(g,new T.TorusGeometry(.28,.035,8,36),mat(color),[0,.92,0]);face.rotation.y=0;const hub=sphere(g,.07,[0,.92,.04],'#eddda4');hub.scale.z=.5;const blades=new T.Group();blades.position.set(0,.92,0);for(let i=0;i<3;i++){const b=box(blades,[.12,.25,.035],[0,.145,0],color);b.rotation.z=i*Math.PI*2/3;b.position.set(Math.sin(-i*Math.PI*2/3)*.12,Math.cos(i*Math.PI*2/3)*.12,0);}g.add(blades);g.userData.blades=blades;for(let i=0;i<4;i++){const bar=box(g,[.52,.012,.012],[0,.92,.06],feet);bar.rotation.z=i*Math.PI/4;}}
  if(kind==='vacuum'){cylinder(g,.37,.17,[0,.18,0],color);cylinder(g,.32,.035,[0,.28,0],'#edd8f0');box(g,[.2,.07,.12],[0,.33,.03],dark);box(g,[.3,.055,.08],[0,.2,.33],'#353d59');sphere(g,.028,[.19,.31,.03],'#82e7d2');}
  if(kind==='bed'){legs();box(g,[.75,.23,.92],[0,.31,0],'#61789f');box(g,[.75,.34,.09],[0,.57,-.42],color);box(g,[.68,.14,.75],[0,.48,0],'#e4e7f5');box(g,[.69,.06,.46],[0,.58,.15],color);box(g,[.48,.09,.2],[0,.59,-.23],'#f4f3fb');}
  if(kind==='lamp'){cylinder(g,.25,.075,[0,.08,0],dark);cylinder(g,.035,.85,[0,.52,0],'#dcc995');cylinder(g,.29,.3,[0,1.04,0],color,.14);const bulb=sphere(g,.11,[0,.88,0],'#fff0b9');g.userData.bulb=bulb;}
  if(kind==='cart'){legs();box(g,[.84,.12,.68],[0,.48,0],color);box(g,[.54,.12,.48],[0,.26,0],'#c08e79');for(const x of [-.3,.3])for(const z of [-.24,.24]){const w=cylinder(g,.06,.065,[x,.08,z],dark);w.rotation.z=Math.PI/2;}box(g,[.055,.35,.055],[-.39,.63,-.28],feet);box(g,[.055,.35,.055],[.39,.63,-.28],feet);box(g,[.83,.05,.05],[0,.8,-.28],feet);}
  return g;
}
function cargoModel(heavy:boolean) {
  const g=new T.Group();if(heavy){box(g,[.63,1.13,.56],[0,.62,0],'#bb9780');for(const x of [-.15,.15])box(g,[.27,1.02,.04],[x,.64,.31],'#d2b29a');for(const x of [-.065,.065])box(g,[.018,.12,.025],[x,.62,.35],'#efd6a4');}
  else{box(g,[.57,.5,.55],[0,.31,0],'#d4af82');box(g,[.14,.51,.565],[0,.316,0],'#efe0ae');box(g,[.58,.015,.14],[0,.568,0],'#efe0ae');box(g,[.14,.12,.018],[.17,.31,.287],'#faf0d3');}
  return g;
}
export class MovingScene {
  renderer:T.WebGLRenderer;scene=new T.Scene();camera=new T.OrthographicCamera();
  objects=new Map<string,T.Group>();tiles=new Map<string,T.Mesh>();gates:T.Group[]=[];root=new T.Group();ghost=ghostModel();halo=new T.Group();arrow=new T.Group();
  targets=new Map<string,T.Vector3>();state:State;zoom=1;frame=0;lastTime=0;activeName:T.Sprite;onSelect:(id:string)=>void;resizeObserver:ResizeObserver;pointer:{x:number;y:number}|null=null;reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  constructor(public host:HTMLElement,state:State,onSelect:(id:string)=>void,public onPoint:(p:Point)=>void=()=>{},public onCargo:(id:string)=>void=()=>{}) {
    this.state=state;this.onSelect=onSelect;const l=LEVELS[state.levelIndex];this.scene.background=new T.Color('#182333');this.scene.add(this.root);
    this.renderer=new T.WebGLRenderer({antialias:true,alpha:false});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.3;host.append(this.renderer.domElement);
    this.camera.position.set(12,16,18);this.camera.lookAt(0,0,0);
    this.scene.add(new T.HemisphereLight('#e8f1ff','#546379',2.7));const light=new T.DirectionalLight('#ffecd1',3.4);light.position.set(-5,12,6);light.castShadow=true;light.shadow.mapSize.set(1024,1024);Object.assign(light.shadow.camera,{left:-10,right:10,top:10,bottom:-10});light.shadow.bias=-.001;light.shadow.normalBias=.035;this.scene.add(light);const moon=new T.DirectionalLight('#b5c9ff',1.2);moon.position.set(6,6,-7);this.scene.add(moon);
    box(this.root,[l.width-1,.32,l.height-1],[-.5,-.32,-.5],'#46526a');
    for(let y=1;y<l.height-1;y++)for(let x=1;x<l.width-1;x++){const p={x,y},v=this.world(p);const m=box(this.root,[.96,.1,.96],[v.x,-.08,v.z],(x+y)%2?'#c3b8a9':'#cebead');this.tiles.set(key(p),m);}
    box(this.root,[l.width-1,1.25,.13],[-.5,.42,1-l.height/2-.55],'#62798c');box(this.root,[.13,1.25,l.height-1],[1-l.width/2-.55,.42,-.5],'#536b7e');
    box(this.root,[l.width-1,.065,.2],[-.5,1.07,1-l.height/2-.55],'#9bacbb');box(this.root,[.2,.065,l.height-1],[1-l.width/2-.55,1.07,-.5],'#9bacbb');
    for(let i=2;i<l.width-2;i+=3){const x=i-l.width/2,z=1-l.height/2-.465;box(this.root,[1.22,.78,.03],[x,.45,z],'#d7d9ed');box(this.root,[1.07,.63,.035],[x,.45,z+.02],'#304963');box(this.root,[.045,.67,.04],[x,.45,z+.05],'#bbd1df');box(this.root,[1.1,.04,.04],[x,.45,z+.05],'#bbd1df');}
    for(const p of l.walls){const v=this.world(p);box(this.root,[.96,.47,.96],[v.x,.18,v.z],'#788699');box(this.root,[.99,.06,.99],[v.x,.44,v.z],'#afbac7');}
    for(const p of l.gates??[]){const group=new T.Group();group.position.copy(this.world(p));for(const x of [-.38,.38])box(group,[.1,.9,.1],[x,.45,0],'#e0ba69');box(group,[.84,.07,.1],[0,.92,0],'#e0ba69');const bars=box(group,[.68,.73,.075],[0,.4,0],mat('#f8ca66',.15));group.userData.bars=bars;this.root.add(group);this.gates.push(group);}
    for(const goal of l.goals){const v=this.world(goal),tile=box(this.root,[.82,.025,.82],[v.x,.005,v.z],mat(goal.kind==='box'?'#72c5b0':'#b4a0eb',.22));tile.userData.goal=goal;const tag=label(goal.kind==='box'?'상자':'옷장',goal.kind==='box'?'#14372e':'#31254b',goal.kind==='box'?'#bceadb':'#ded5f5');tag.position.set(v.x,.11,v.z);tag.scale.set(.72,.27,1);this.root.add(tag);}
    for(const f of state.furniture){const m=furnitureModel(f.kind);m.userData.furnitureId=f.id;this.objects.set(f.id,m);this.root.add(m);}
    for(const c of state.cargo){const m=cargoModel(c.kind==='wardrobe');m.userData.cargoId=c.id;this.objects.set(c.id,m);this.root.add(m);}
    ring(this.halo,.52,'#b5fae0');this.root.add(this.halo);const point=mesh(this.arrow,new T.ConeGeometry(.12,.28,3),mat('#dbffe9',.6),[0,.09,.68]);point.rotation.x=Math.PI/2;this.root.add(this.arrow);this.root.add(this.ghost);this.activeName=label('빙의 중','#e9fff6','#284e58');this.root.add(this.activeName);
    // Decorative plants stay on the outside rim and never occupy a playable tile.
    for(const x of [1-l.width/2-.3,l.width/2-1.3]){cylinder(this.root,.16,.27,[x,.06,l.height/2-.7],'#d59690');for(const a of [-.5,0,.5]){const leaf=sphere(this.root,.13,[x+a*.18,.34+Math.abs(a)*.1,l.height/2-.7],'#77a496');leaf.scale.set(.6,1.7,.7);}}
    this.sync(state,true);this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(host);this.resize();host.addEventListener('pointerdown',this.down);host.addEventListener('pointerup',this.up);host.addEventListener('pointercancel',this.cancel);this.frame=requestAnimationFrame(this.animate);
  }
  world(p:Point){const l=LEVELS[this.state.levelIndex];return new T.Vector3(p.x-l.width/2,0,p.y-l.height/2);}
  resize(){
    const {width,height}=this.host.getBoundingClientRect();if(!width||!height)return;
    this.renderer.setSize(width,height,false);
    const l=LEVELS[this.state.levelIndex],aspect=width/height;
    this.camera.updateMatrixWorld();
    let horizontal=0,vertical=0;
    for(const x of [-l.width/2-.45,l.width/2+.45])for(const z of [-l.height/2-.45,l.height/2+.45])for(const y of [0,1.8]){
      const corner=new T.Vector3(x,y,z).applyMatrix4(this.camera.matrixWorldInverse);
      horizontal=Math.max(horizontal,Math.abs(corner.x));vertical=Math.max(vertical,Math.abs(corner.y));
    }
    const extent=Math.max(4.2,vertical*1.08,horizontal/aspect*1.08)/this.zoom;
    this.camera.left=-extent*aspect;this.camera.right=extent*aspect;this.camera.top=extent;this.camera.bottom=-extent;this.camera.near=.1;this.camera.far=100;this.camera.updateProjectionMatrix();
  }
  sync(state:State,instant=false) {
    this.state=state;const active=state.furniture.find(f=>f.id===state.active);
    for(const f of state.furniture){const o=this.objects.get(f.id)!;const target=this.world(f);this.targets.set(f.id,target);if(instant)o.position.copy(target);o.userData.direction=f.direction;if(f.kind==='lamp'){const bulb=o.userData.bulb as T.Mesh;(bulb.material as T.MeshStandardMaterial).emissiveIntensity=state.powered?1.5:0;}}
    for(const c of state.cargo){const o=this.objects.get(c.id)!;o.visible=!c.delivered;const target=this.world(c);if(state.carry?.cargoId===c.id){target.y=.55;o.userData.furnitureId=state.carry.furnitureId;}else delete o.userData.furnitureId;if(state.effect?.kind==='jump'&&this.targets.get(c.id)?.distanceTo(target)){o.userData.jumpStart=performance.now();}this.targets.set(c.id,target);if(instant)o.position.copy(target);}
    for(const [id,tile] of this.tiles){const l=LEVELS[state.levelIndex],goal=l.goals.find(g=>key(g)===id);(tile.material as T.MeshStandardMaterial).color.set(state.ice.includes(id)?'#9edce9':goal?'#abbfba':(Number(id.split(',')[0])+Number(id.split(',')[1]))%2?'#c3b8a9':'#cebead');}
    for(const gate of this.gates){const bars=gate.userData.bars as T.Mesh;bars.scale.y=state.powered?.04:1;bars.position.y=state.powered?.88:.4;}
    this.halo.visible=!!active;this.arrow.visible=!!active;this.activeName.visible=!!active;
  }
  down=(e:PointerEvent)=>{this.pointer={x:e.clientX,y:e.clientY};};cancel=()=>{this.pointer=null;};
  up=(e:PointerEvent)=>{const down=this.pointer;this.pointer=null;if(!down||Math.hypot(e.clientX-down.x,e.clientY-down.y)>10)return;const rect=this.host.getBoundingClientRect(),ray=new T.Raycaster();ray.setFromCamera(new T.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),this.camera);const hit=ray.intersectObjects([...this.objects.values()].filter(object=>object.visible),true)[0];if(hit){let o:T.Object3D|null=hit.object;while(o&&!o.userData.furnitureId&&!o.userData.cargoId)o=o.parent;if(o?.userData.furnitureId){this.onSelect(o.userData.furnitureId);return;}if(o?.userData.cargoId){this.onCargo(o.userData.cargoId);return;}}const floor=ray.ray.intersectPlane(new T.Plane(new T.Vector3(0,1,0),0),new T.Vector3());if(floor){const l=LEVELS[this.state.levelIndex],point={x:Math.round(floor.x+l.width/2),y:Math.round(floor.z+l.height/2)};if(point.x>0&&point.y>0&&point.x<l.width-1&&point.y<l.height-1)this.onPoint(point);}};
  animate=(now:number)=>{this.frame=requestAnimationFrame(this.animate);if(document.hidden||now-this.lastTime<30)return;const dt=Math.min((now-this.lastTime)/1000,.1);this.lastTime=now;
    const active=this.state.furniture.find(f=>f.id===this.state.active);
    for(const [id,o] of this.objects){const target=this.targets.get(id);if(target)o.position.lerp(target,this.reduced?1:1-Math.exp(-dt*18));if(o.userData.jumpStart&&!this.reduced){const phase=Math.min(1,(now-o.userData.jumpStart)/380);o.position.y=Math.sin(phase*Math.PI)*.8;if(phase>=1)delete o.userData.jumpStart;}if(o.userData.direction!==undefined){const angle=[Math.PI,Math.PI/2,0,-Math.PI/2][o.userData.direction];o.rotation.y=angle;}if(o.userData.blades&&!this.reduced)o.userData.blades.rotation.z+=dt*(active?.id===id?9:1);}
    const pos=active?this.objects.get(active.id)!.position:this.world(this.state.ghost);this.ghost.position.set(pos.x,active?1.58:.5,pos.z);if(!this.reduced)this.ghost.position.y+=Math.sin(now*.0025)*.045;this.ghost.rotation.y=.58;this.halo.position.set(pos.x,0,pos.z);this.arrow.position.set(pos.x,0,pos.z);this.arrow.rotation.y=active?[Math.PI,Math.PI/2,0,-Math.PI/2][active.direction]:0;this.activeName.position.set(pos.x,1.28,pos.z);
    this.renderer.render(this.scene,this.camera);
  };
  dispose(){cancelAnimationFrame(this.frame);this.resizeObserver.disconnect();this.host.removeEventListener('pointerdown',this.down);this.host.removeEventListener('pointerup',this.up);this.host.removeEventListener('pointercancel',this.cancel);const geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>(),textures=new Set<T.Texture>();this.scene.traverse(o=>{const m=o as T.Mesh;if(m.geometry)geometries.add(m.geometry);if(m.material)for(const material of Array.isArray(m.material)?m.material:[m.material]){materials.add(material);const map=(material as T.MeshStandardMaterial).map;if(map)textures.add(map);}});for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();this.renderer.dispose();this.renderer.forceContextLoss();this.renderer.domElement.remove();}
}
