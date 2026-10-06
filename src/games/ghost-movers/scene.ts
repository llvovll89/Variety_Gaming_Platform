import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { FURNITURE, LEVELS, key, type State, type FurnitureKind, type Point } from './engine';
const mat=(color:string,glow=0)=>new T.MeshStandardMaterial({color,roughness:.62,metalness:.02,emissive:color,emissiveIntensity:glow});
function mesh(parent:T.Object3D,geometry:T.BufferGeometry,material:T.Material,p:number[]=[0,0,0]) {const m=new T.Mesh(geometry,material);m.position.set(...p as [number,number,number]);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function box(parent:T.Object3D,size:number[],p:number[],color:string|T.Material){const radius=Math.min(.065,Math.min(...size)*.23);return mesh(parent,new RoundedBoxGeometry(...size as [number,number,number],2,radius),typeof color==='string'?mat(color):color,p);}
function sphere(parent:T.Object3D,r:number,p:number[],color:string){return mesh(parent,new T.SphereGeometry(r,20,16),mat(color),p);}
function cylinder(parent:T.Object3D,r:number,h:number,p:number[],color:string|T.Material,top=r){return mesh(parent,new T.CylinderGeometry(top,r,h,24),typeof color==='string'?mat(color):color,p);}
function ring(parent:T.Object3D,r:number,color:string,y=.09){const m=mesh(parent,new T.TorusGeometry(r,.035,8,48),mat(color,.4),[0,y,0]);m.rotation.x=-Math.PI/2;return m;}
function label(text:string,color='#edf7ff',bg='#263b50') {
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=96;const ctx=canvas.getContext('2d')!;ctx.fillStyle=bg;ctx.beginPath();ctx.roundRect(4,8,248,80,22);ctx.fill();ctx.font='bold 34px Pretendard, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=color;ctx.fillText(text,128,49);
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;const sprite=new T.Sprite(new T.SpriteMaterial({map:texture,depthTest:false}));sprite.scale.set(1.2,.45,1);return sprite;
}
export function ghostModel() {
  const g=new T.Group(),skin=mat('#b5f5df',.24);skin.roughness=.32;
  const profile=[new T.Vector2(0,.13),new T.Vector2(.19,.14),new T.Vector2(.255,.23),new T.Vector2(.265,.39),new T.Vector2(.23,.57),new T.Vector2(.14,.66),new T.Vector2(0,.69)];
  mesh(g,new T.LatheGeometry(profile,32),skin);
  for(const x of [-.17,0,.17])mesh(g,new T.SphereGeometry(.095,20,12),skin,[x,.15,.02]);
  for(const x of [-.092,.092]){const eye=sphere(g,.037,[x,.44,.236],'#173e3c');eye.scale.set(.9,1.7,.45);sphere(g,.01,[x-.008,.466,.253],'#e8fff6');const cheek=sphere(g,.038,[x*1.66,.345,.195],'#e7aba5');cheek.scale.set(1,.6,.25);}
  const mouth=mesh(g,new T.TorusGeometry(.04,.01,6,16,Math.PI),mat('#356960'),[0,.355,.245]);mouth.rotation.z=Math.PI;
  for(const x of [-.285,.285]){const arm=mesh(g,new T.SphereGeometry(.075,20,12),skin,[x,.29,.04]);arm.scale.set(1.1,.6,.7);arm.rotation.z=x<0?-.3:.3;}
  g.add(new T.PointLight('#9fffe0',.65,1.6,2));
  return g;
}
export function furnitureModel(kind:FurnitureKind) {
  const g=new T.Group(),dark='#485064',feet=kind==='sofa'||kind==='bed'?'#9b7057':'#62717c',color=FURNITURE[kind].color;
  const legs=()=>{for(const x of [-.27,.27])for(const z of [-.26,.26])cylinder(g,.04,.2,[x,.13,z],feet);};
  if(kind==='sofa'){legs();box(g,[.83,.26,.62],[0,.3,0],'#e5a186');box(g,[.8,.4,.18],[0,.57,-.25],'#dc927a');for(const x of [-.19,.19])box(g,[.36,.14,.46],[x,.49,.025],'#f0ae8f');for(const x of [-.41,.41])box(g,[.16,.37,.62],[x,.48,0],'#e5a186');const pillow=box(g,[.23,.23,.14],[-.2,.69,-.13],'#b7d0b4');pillow.rotation.z=-.16;const cushion=box(g,[.2,.2,.13],[.19,.68,-.13],'#f3dcc1');cushion.rotation.z=.12;}
  if(kind==='fridge'){box(g,[.64,1.12,.61],[0,.65,0],'#c6cbe0');box(g,[.58,.35,.055],[0,1.02,.33],'#dae0f1');box(g,[.58,.62,.055],[0,.51,.33],'#d0d7eb');for(const y of [.92,.5])box(g,[.045,.17,.05],[-.21,y,.375],dark);box(g,[.1,.13,.018],[.13,.94,.37],'#f1d788');box(g,[.09,.09,.018],[.09,.7,.37],'#a8ceb5');legs();}
  if(kind==='fan'){cylinder(g,.3,.08,[0,.09,0],color);cylinder(g,.045,.62,[0,.43,0],feet);const face=mesh(g,new T.TorusGeometry(.28,.035,8,36),mat(color),[0,.92,0]);face.rotation.y=0;const hub=sphere(g,.07,[0,.92,.04],'#eddda4');hub.scale.z=.5;const blades=new T.Group();blades.position.set(0,.92,0);for(let i=0;i<3;i++){const b=box(blades,[.12,.25,.035],[0,.145,0],color);b.rotation.z=i*Math.PI*2/3;b.position.set(Math.sin(-i*Math.PI*2/3)*.12,Math.cos(i*Math.PI*2/3)*.12,0);}g.add(blades);g.userData.blades=blades;for(let i=0;i<4;i++){const bar=box(g,[.52,.012,.012],[0,.92,.06],feet);bar.rotation.z=i*Math.PI/4;}}
  if(kind==='vacuum'){cylinder(g,.37,.17,[0,.18,0],color);cylinder(g,.32,.035,[0,.28,0],'#edd8f0');box(g,[.2,.07,.12],[0,.33,.03],dark);box(g,[.3,.055,.08],[0,.2,.33],'#353d59');sphere(g,.028,[.19,.31,.03],'#82e7d2');}
  if(kind==='bed'){legs();box(g,[.75,.23,.92],[0,.31,0],'#61789f');box(g,[.75,.34,.09],[0,.57,-.42],color);box(g,[.68,.14,.75],[0,.48,0],'#e4e7f5');box(g,[.69,.06,.46],[0,.58,.15],color);box(g,[.48,.09,.2],[0,.59,-.23],'#f4f3fb');}
  if(kind==='lamp'){cylinder(g,.25,.075,[0,.08,0],dark);cylinder(g,.035,.85,[0,.52,0],'#c8a773');cylinder(g,.29,.3,[0,1.04,0],mat('#f4d69c',.3),.18);const bulb=sphere(g,.11,[0,.88,0],'#fff0b9');g.userData.bulb=bulb;const light=new T.PointLight('#ffd399',1.8,3.2,2);light.position.y=.9;g.add(light);g.userData.light=light;}
  if(kind==='cart'){legs();box(g,[.84,.12,.68],[0,.48,0],color);box(g,[.54,.12,.48],[0,.26,0],'#c08e79');for(const x of [-.3,.3])for(const z of [-.24,.24]){const w=cylinder(g,.06,.065,[x,.08,z],dark);w.rotation.z=Math.PI/2;}box(g,[.055,.35,.055],[-.39,.63,-.28],feet);box(g,[.055,.35,.055],[.39,.63,-.28],feet);box(g,[.83,.05,.05],[0,.8,-.28],feet);}
  return g;
}
function cargoModel(heavy:boolean) {
  const g=new T.Group();if(heavy){box(g,[.63,1.13,.56],[0,.62,0],'#bb94b9');for(const x of [-.15,.15])box(g,[.27,1.02,.045],[x,.64,.31],'#d4aed0');for(const x of [-.065,.065])box(g,[.024,.12,.03],[x,.62,.35],'#c9a465');}
  else{box(g,[.57,.5,.55],[0,.31,0],'#d4af82');box(g,[.14,.51,.565],[0,.316,0],'#efe0ae');box(g,[.58,.015,.14],[0,.568,0],'#efe0ae');box(g,[.14,.12,.018],[.17,.31,.287],'#faf0d3');}
  return g;
}
function floorMaterial() {
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;const ctx=canvas.getContext('2d')!;
  ctx.fillStyle='#f3ddbc';ctx.fillRect(0,0,256,256);
  for(let i=0;i<4;i++){ctx.fillStyle=i%2?'#ecd0a9':'#e5c39b';ctx.fillRect(0,i*64,256,63);ctx.strokeStyle='#b9936960';ctx.lineWidth=1;for(let j=0;j<4;j++){ctx.beginPath();ctx.moveTo(0,i*64+10+j*12);ctx.bezierCurveTo(70,i*64+5+j*12,160,i*64+17+j*12,256,i*64+10+j*12);ctx.stroke();}}
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;
  return new T.MeshStandardMaterial({color:'#e7c5a3',map:texture,roughness:.82});
}
/** Decoration lives beyond the playable grid and is excluded from pointer raycasts. */
function nightNeighborhood(scene:T.Scene,width:number,height:number) {
  const city=new T.Group();scene.add(city);
  const moon=sphere(city,.4,[width*.12,1.9,-height/2-1],'#f9dcaa');(moon.material as T.MeshStandardMaterial).emissive.set('#f9dcaa');(moon.material as T.MeshStandardMaterial).emissiveIntensity=.45;moon.castShadow=false;
  const ground=box(city,[width*8,.1,height*8],[0,-2.9,-height],new T.MeshBasicMaterial({color:'#17243d',toneMapped:false}));ground.castShadow=false;ground.receiveShadow=false;
  for(let i=0;i<12;i++){const x=(i-5.5)*1.7,z=-height/2-3-(i%3)*1.2,h=1.1+(i%4)*.4;box(city,[1.35,h,1.35],[x,-2.8+h/2,z],i%2?'#263552':'#2d3f5b');box(city,[1.45,.12,1.45],[x,h-2.78,z],'#394969');for(let row=0;row<2;row++)for(let col=0;col<2;col++){const window=box(city,[.2,.23,.025],[x-.34+col*.68,-2.5+row*.48,z+.69],mat((i+col+row)%3?'#e6b972':'#324969',(i+col+row)%3?.8:0));window.castShadow=false;}}
  const positions=[];for(let i=0;i<28;i++)positions.push(Math.sin(i*12.9898)*width,2.5+(i%7)*.5,-height/2-3-Math.abs(Math.cos(i*7.7))*6);
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));city.add(new T.Points(geometry,new T.PointsMaterial({color:'#b9c7e1',size:.035,transparent:true,opacity:.65})));
}
export class MovingScene {
  renderer:T.WebGLRenderer;scene=new T.Scene();camera=new T.OrthographicCamera();
  objects=new Map<string,T.Group>();tiles=new Map<string,T.Mesh>();gates:T.Group[]=[];root=new T.Group();ghost=ghostModel();halo=new T.Group();arrow=new T.Group();
  targets=new Map<string,T.Vector3>();state:State;zoom=1;frame=0;lastTime=0;activeName:T.Sprite;onSelect:(id:string)=>void;resizeObserver:ResizeObserver;pointer:{x:number;y:number}|null=null;reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  constructor(public host:HTMLElement,state:State,onSelect:(id:string)=>void,public onPoint:(p:Point)=>void=()=>{},public onCargo:(id:string)=>void=()=>{}) {
    this.state=state;this.onSelect=onSelect;const l=LEVELS[state.levelIndex];this.scene.background=new T.Color('#17243d');this.scene.fog=new T.Fog('#17243d',29,48);this.scene.add(this.root);
    this.renderer=new T.WebGLRenderer({antialias:true,alpha:false});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.3;host.append(this.renderer.domElement);
    this.camera.position.set(12,16,18);this.camera.lookAt(0,0,0);
    this.scene.add(new T.HemisphereLight('#b3c6ef','#956f53',1.25));const light=new T.DirectionalLight('#ffdfad',2.6);light.position.set(-5,12,6);light.castShadow=true;light.shadow.mapSize.set(1024,1024);Object.assign(light.shadow.camera,{left:-10,right:10,top:10,bottom:-10});light.shadow.bias=-.001;light.shadow.normalBias=.035;this.scene.add(light);const moon=new T.DirectionalLight('#a9bcff',1.1);moon.position.set(6,6,-7);this.scene.add(moon);
    nightNeighborhood(this.scene,l.width,l.height);
    box(this.root,[l.width-1,.32,l.height-1],[-.5,-.32,-.5],'#596583');
    const wood=floorMaterial();
    for(let y=1;y<l.height-1;y++)for(let x=1;x<l.width-1;x++){const p={x,y},v=this.world(p);const m=box(this.root,[.985,.1,.985],[v.x,-.08,v.z],wood.clone());this.tiles.set(key(p),m);}
    wood.dispose();
    const back=1-l.height/2-.55,left=1-l.width/2-.55;
    box(this.root,[l.width-1,1.65,.16],[-.5,.62,back],'#9295ad');box(this.root,[.16,1.65,l.height-1],[left,.62,-.5],'#ac9ba6');
    box(this.root,[l.width-1,.09,.23],[-.5,1.49,back],'#c4bfcc');box(this.root,[.23,.09,l.height-1],[left,1.49,-.5],'#c4bfcc');
    box(this.root,[l.width-1,.16,.22],[-.5,.02,back+.035],'#c8af9b');box(this.root,[.22,.16,l.height-1],[left+.035,.02,-.5],'#c8af9b');
    for(let i=2;i<l.width-2;i+=3){const x=i-l.width/2,z=back+.11;box(this.root,[1.26,.94,.06],[x,.84,z],'#d5bb9e');box(this.root,[1.1,.79,.025],[x,.84,z+.045],mat('#f2c27e',.65));box(this.root,[.045,.82,.045],[x,.84,z+.085],'#d5bb9e');box(this.root,[1.14,.045,.045],[x,.84,z+.085],'#d5bb9e');box(this.root,[1.42,.08,.18],[x,.34,z+.07],'#e1c3a2');const glow=new T.PointLight('#ffd09a',2.2,3.5,2);glow.position.set(x,1,z+.65);this.root.add(glow);}
    for(const p of l.walls){const v=this.world(p);box(this.root,[.94,.47,.94],[v.x,.18,v.z],'#a5a2b2');box(this.root,[.96,.085,.96],[v.x,.44,v.z],'#c7c2cd');}
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
    for(const [id,tile] of this.tiles){const l=LEVELS[state.levelIndex],goal=l.goals.find(g=>key(g)===id);(tile.material as T.MeshStandardMaterial).color.set(state.ice.includes(id)?'#99d9e8':goal?'#c5dab8':(Number(id.split(',')[0])+Number(id.split(',')[1]))%2?'#edceb0':'#e2bf9b');}
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
