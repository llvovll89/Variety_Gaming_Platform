import * as THREE from 'three';
import { COLORS, LEVELS, TimeRun, key, type Frame, type Point } from './engine';

const world=(p:Point)=>new THREE.Vector3(p.x-6,0,p.y-4);
function material(color:string,glow=false,ghost=false){return new THREE.MeshStandardMaterial({color,roughness:.72,metalness:glow?.35:.12,emissive:glow?color:'#000000',emissiveIntensity:glow?.8:0,transparent:ghost,opacity:ghost?.48:1,depthWrite:!ghost});}
function mesh(g:THREE.BufferGeometry,m:THREE.Material,parent:THREE.Object3D,x=0,y=0,z=0){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
function box(parent:THREE.Object3D,size:number[],position:number[],m:THREE.Material){return mesh(new THREE.BoxGeometry(...size as [number,number,number]),m,parent,...position as [number,number,number]);}
function ring(parent:THREE.Object3D,r:number,m:THREE.Material,y=.05){const o=mesh(new THREE.TorusGeometry(r,.035,8,48),m,parent,0,y,0);o.rotation.x=-Math.PI/2;return o;}

export function makeExplorer(color='#f0e8ca',ghost=false){
  const g=new THREE.Group(),cloth=material(color,false,ghost),dark=material(ghost?color:'#213b48',false,ghost),metal=material(ghost?color:'#b98b59',false,ghost),light=material(ghost?color:'#82f3e3',true,ghost);
  mesh(new THREE.ConeGeometry(.28,.5,8),cloth,g,0,.47,0);
  const head=mesh(new THREE.SphereGeometry(.235,12,10),cloth,g,0,.89,0);head.scale.set(1,1.04,1);
  box(g,[.35,.12,.06],[0,.9,.205],dark);box(g,[.11,.075,.07],[-.09,.905,.24],light);box(g,[.11,.075,.07],[.09,.905,.24],light);
  const scarf=material(ghost?color:'#ed9964',false,ghost);ring(g,.16,scarf,.69);box(g,[.09,.3,.035],[.18,.53,-.17],scarf);
  box(g,[.31,.31,.14],[0,.51,-.22],metal);const wheel=mesh(new THREE.TorusGeometry(.1,.025,6,12),light,g,0,.54,-.31);wheel.rotation.x=0;
  const leftLeg=box(g,[.105,.22,.16],[-.12,.15,.03],dark),rightLeg=box(g,[.105,.22,.16],[.12,.15,.03],dark);
  const leftArm=mesh(new THREE.CapsuleGeometry(.055,.22,3,6),cloth,g,-.27,.48,.01),rightArm=mesh(new THREE.CapsuleGeometry(.055,.22,3,6),cloth,g,.27,.48,.01);
  const shadow=mesh(new THREE.CircleGeometry(.3,24),new THREE.MeshBasicMaterial({color:ghost?color:'#08131c',transparent:true,opacity:ghost?.16:.28,depthWrite:false}),g,0,.025,0);shadow.rotation.x=-Math.PI/2;shadow.castShadow=false;
  const labelRing=ring(g,.37,light,.03);labelRing.visible=ghost;
  g.userData={leftLeg,rightLeg,leftArm,rightArm,wheel,ghost,last:{x:0,y:0}};
  return g;
}
export function buildRoom(levelIndex:number){
  const level=LEVELS[levelIndex],scene=new THREE.Scene();scene.background=new THREE.Color('#101e29');scene.fog=new THREE.Fog('#101e29',25,55);
  scene.add(new THREE.HemisphereLight('#e0f8ee','#172439',2.4));
  const sun=new THREE.DirectionalLight('#fff0d9',3);sun.position.set(-8,16,8);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-10,right:10,top:10,bottom:-10});sun.shadow.bias=-.001;scene.add(sun);
  const moon=new THREE.DirectionalLight('#6d9ed9',1.7);moon.position.set(8,6,-10);scene.add(moon);
  const root=new THREE.Group();scene.add(root);
  const floorA=material('#29404b'),floorB=material('#304953'),wall=material('#3c555c'),brass=material('#b59865');
  const geometry=new THREE.BoxGeometry(.965,.16,.965);
  for(let y=1;y<=7;y++)for(let x=1;x<=11;x++){const p={x,y},v=world(p);mesh(geometry,(x+y)%2?floorA:floorB,root,v.x,-.12,v.z);}
  box(root,[11.5,.48,7.5],[0,-.47,0],material('#162b35'));
  for(const p of level.walls){const v=world(p);box(root,[.92,.52,.92],[v.x,.15,v.z],wall);box(root,[.84,.055,.84],[v.x,.43,v.z],brass);}
  for(let i=-6;i<=6;i+=2){box(root,[.2,.65,.2],[i,-.05,-4.3],wall);box(root,[.3,.09,.3],[i,.31,-4.3],brass);}
  const plates=new Map<string,THREE.Group>();
  for(const p of level.plates){const g=new THREE.Group();g.position.copy(world(p));root.add(g);mesh(new THREE.CylinderGeometry(.37,.4,.08,32),material('#152b33'),g,0,.02,0);ring(g,.32,material(level.gates.some(d=>d.blockedBy?.includes(p.id))?'#ff8e79':p.color,true));if(p.pulse){const pulse=mesh(new THREE.SphereGeometry(.06,8,6),material('#f8dc9f',true),g,.4,.13,0);g.userData.pulse=pulse;}g.userData.disc=mesh(new THREE.CylinderGeometry(.24,.24,.055,24),material(p.color,true),g,0,.07,0);plates.set(p.id,g);label(g,p.id,'#12343e',.15);}
  const gates:THREE.Group[]=[];
  for(const door of level.gates){const g=new THREE.Group();g.position.copy(world(door));root.add(g);box(g,[.12,1.08,.15],[-.44,.53,0],brass);box(g,[.12,1.08,.15],[.44,.53,0],brass);box(g,[.99,.12,.15],[0,1.05,0],brass);const barrier=box(g,[.72,.86,.07],[0,.48,0],new THREE.MeshStandardMaterial({color:'#ecaa73',emissive:'#ed9564',emissiveIntensity:1,transparent:true,opacity:.4}));g.userData.barrier=barrier;gates.push(g);}
  const laserGroups:THREE.Group[]=[];
  for(const laser of level.lasers){const g=new THREE.Group();root.add(g);for(const p of laser.cells){const v=world(p);box(g,[.09,.58,.94],[v.x,.31,v.z],material('#fa687c',true));box(root,[.6,.015,.92],[v.x,-.015,v.z],material('#693e47'));}laserGroups.push(g);}
  const crystals:THREE.Mesh[]=[];
  for(const p of level.crystals){const v=world(p);const o=mesh(new THREE.OctahedronGeometry(.19),material(p.volatile?'#c3a0ff':'#f6d387',true),root,v.x,.5,v.z);crystals.push(o);ringAt(root,p,'#d9b570');}
  const exit=new THREE.Group();exit.position.copy(world(level.exit));root.add(exit);ring(exit,.4,material('#b2ecd3',true));const portal=mesh(new THREE.TorusGeometry(.37,.065,12,48),material('#b2ecd3',true),exit,0,.51,0);portal.rotation.y=Math.PI/2;label(exit,'↗','#d9f5e4',.1);
  ringAt(root,level.start,'#e9b989');
  const clock=new THREE.Group();clock.position.set(.1,1,-5.3);root.add(clock);
  mesh(new THREE.TorusGeometry(1.45,.07,8,64),brass,clock);mesh(new THREE.TorusGeometry(1.27,.014,4,64),material('#78b6b3',true),clock);
  for(let i=0;i<12;i++){const a=i*Math.PI/6;const o=box(clock,[.05,.15,.05],[Math.sin(a)*1.34,Math.cos(a)*1.34,0],brass);o.rotation.z=-a;}
  const hand=box(clock,[.045,.95,.04],[0,.37,.02],material('#a7e1d0',true));hand.geometry.translate(0,-.37,0);hand.position.y=0;
  const player=makeExplorer();root.add(player);player.position.copy(world(level.start));
  const ghosts=COLORS.map(color=>{const g=makeExplorer(color,true);g.visible=false;root.add(g);return g;});
  const dustGeometry=new THREE.BufferGeometry();const dust=[];for(let i=0;i<65;i++)dust.push(Math.sin(i*73)*9,Math.cos(i*11)*2+3,Math.cos(i*67)*7);dustGeometry.setAttribute('position',new THREE.Float32BufferAttribute(dust,3));const particles=new THREE.Points(dustGeometry,new THREE.PointsMaterial({color:'#94c9be',size:.035,transparent:true,opacity:.5}));scene.add(particles);
  return {scene,player,ghosts,plates,gates,laserGroups,crystals,exit,hand,particles};
}
function ringAt(parent:THREE.Group,p:Point,color:string){const g=new THREE.Group();g.position.copy(world(p));parent.add(g);ring(g,.4,material(color,true),.005);}
function label(parent:THREE.Group,text:string,color:string,height:number){
  if(typeof document==='undefined')return;
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;const c=canvas.getContext('2d');if(!c)return;c.fillStyle=color;c.font='bold 78px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(text,64,64);
  const texture=new THREE.CanvasTexture(canvas),m=new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false});const o=mesh(new THREE.PlaneGeometry(.4,.4),m,parent,0,height,0);o.rotation.x=-Math.PI/2;o.castShadow=false;
}
type Room=ReturnType<typeof buildRoom>;
function animateCharacter(g:THREE.Group,frame:Frame,seconds:number,instant:boolean){
  const target=world(frame),dx=target.x-g.position.x,dz=target.z-g.position.z,moving=Math.abs(dx)+Math.abs(dz)>.025;
  if(instant||Math.abs(dx)+Math.abs(dz)>2)g.position.copy(target);else{g.position.x+=dx*.28;g.position.z+=dz*.28;}
  g.position.y=moving?Math.abs(Math.sin(seconds*20))*.04:Math.sin(seconds*3)*.012;
  const angle=[Math.PI,Math.PI/2,0,-Math.PI/2][frame.direction];g.rotation.y=angle;
  const stride=moving?Math.sin(seconds*20)*.5:0;g.userData.leftLeg.rotation.x=stride;g.userData.rightLeg.rotation.x=-stride;g.userData.leftArm.rotation.x=-stride;g.userData.rightArm.rotation.x=stride;g.userData.wheel.rotation.z=seconds;
}
export function updateRoom(room:Room,run:TimeRun,seconds:number,instant=false){
  animateCharacter(room.player,run.player,seconds,instant);
  room.ghosts.forEach((g,i)=>{g.visible=i<run.echoes.length;if(g.visible)animateCharacter(g,run.ghostFrames[i],seconds,instant);});
  room.plates.forEach((g,id)=>{g.userData.disc.position.y=run.occupiedPlates.includes(id)?.045:.075;g.scale.setScalar(run.occupiedPlates.includes(id)?1.08:1);if(g.userData.pulse){const p=run.level.plates.find(p=>p.id===id)!;const a=run.plateRemaining(p)/(p.pulse??120)*Math.PI*2;g.userData.pulse.position.set(Math.cos(a)*.4,.13,Math.sin(a)*.4);g.userData.pulse.visible=run.plateRemaining(p)>0;}});
  room.gates.forEach((g,i)=>{g.userData.barrier.visible=!run.gateOpen(run.level.gates[i]);});
  room.laserGroups.forEach((g,i)=>{g.visible=run.laserActive(run.level.lasers[i]);});
  room.crystals.forEach((o,i)=>{o.visible=!run.collected.includes(run.level.crystals[i].id);o.rotation.y=seconds;o.position.y=.48+Math.sin(seconds*3+i)*.06;});
  room.exit.scale.setScalar(run.exitOpen?1+.025*Math.sin(seconds*4):.85);room.hand.rotation.z=-run.tick/600*Math.PI*2;room.particles.rotation.y=seconds*.012;
}

export class TimeScene {
  readonly room:Room;
  private renderer:THREE.WebGLRenderer|null=null;
  private canvas:HTMLCanvasElement;
  private context:CanvasRenderingContext2D|null=null;
  private camera=new THREE.OrthographicCamera(-10,10,7,-7,.1,90);
  private width=1;
  private height=1;
  constructor(private host:HTMLElement,readonly run:TimeRun){
    this.room=buildRoom(run.levelIndex);
    try{this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.8));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.1;this.canvas=this.renderer.domElement;}
    catch{this.canvas=document.createElement('canvas');this.context=this.canvas.getContext('2d');}
    this.canvas.setAttribute('aria-hidden','true');host.appendChild(this.canvas);this.camera.position.set(11,15,13);this.camera.lookAt(0,0,-.3);this.resize();
  }
  resize(){this.width=Math.max(1,this.host.clientWidth);this.height=Math.max(1,this.host.clientHeight);const aspect=this.width/this.height,span=Math.max(5.8,7.6/aspect);this.camera.left=-span*aspect;this.camera.right=span*aspect;this.camera.top=span;this.camera.bottom=-span;this.camera.updateProjectionMatrix();if(this.renderer)this.renderer.setSize(this.width,this.height);else{this.canvas.width=this.width*2;this.canvas.height=this.height*2;}}
  draw(seconds:number,instant=false){updateRoom(this.room,this.run,seconds,instant);if(this.renderer)this.renderer.render(this.room.scene,this.camera);else if(this.context)drawFallback(this.context,this.run,this.canvas.width,this.canvas.height);}
  screenPoint(p:Point){
    this.camera.updateMatrixWorld();
    if(this.renderer){const v=world(p);v.y=.2;v.project(this.camera);return{x:(v.x+1)*this.width/2,y:(1-v.y)*this.height/2};}
    const scale=Math.min(this.width/19,this.height/12);return{x:this.width/2+(p.x-p.y-2)*scale*.72,y:this.height*.28+(p.x+p.y-6)*scale*.36};
  }
  pick(clientX:number,clientY:number):Point|null{
    const rect=this.canvas.getBoundingClientRect(),x=clientX-rect.left,y=clientY-rect.top;let p:Point;
    if(this.renderer){const ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2(x/rect.width*2-1,1-y/rect.height*2),this.camera);const hit=ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),0),new THREE.Vector3());if(!hit)return null;p={x:Math.round(hit.x+6),y:Math.round(hit.z+4)};}
    else{const scale=Math.min(rect.width/19,rect.height/12),a=(x-rect.width/2)/(scale*.72),b=(y-rect.height*.28)/(scale*.36);p={x:Math.round((a+b+8)/2),y:Math.round((b-a+4)/2)};}
    return p.x>=1&&p.x<=11&&p.y>=1&&p.y<=7?p:null;
  }
  dispose(){const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();this.room.scene.traverse(o=>{if(o instanceof THREE.Mesh||o instanceof THREE.Points){geometries.add(o.geometry);const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>materials.add(m));}});geometries.forEach(g=>g.dispose());materials.forEach(m=>{if('map' in m&&(m as THREE.MeshBasicMaterial).map)(m as THREE.MeshBasicMaterial).map!.dispose();m.dispose();});this.renderer?.dispose();this.renderer?.forceContextLoss();this.canvas.remove();}
}

export function drawFallback(c:CanvasRenderingContext2D,run:TimeRun,width:number,height:number){
  c.fillStyle='#101e29';c.fillRect(0,0,width,height);const scale=Math.min(width/19,height/12);const project=(p:Point)=>({x:width/2+(p.x-p.y-2)*scale*.72,y:height*.28+(p.x+p.y-6)*scale*.36});
  const diamond=(p:Point,color:string)=>{const v=project(p);c.beginPath();c.moveTo(v.x,v.y-scale*.34);c.lineTo(v.x+scale*.7,v.y);c.lineTo(v.x,v.y+scale*.34);c.lineTo(v.x-scale*.7,v.y);c.closePath();c.fillStyle=color;c.fill();c.strokeStyle='#526871';c.lineWidth=1;c.stroke();};
  for(let y=1;y<=7;y++)for(let x=1;x<=11;x++){const p={x,y};diamond(p,run.level.walls.some(w=>key(w)===key(p))?'#b09566':(x+y)%2?'#2d4651':'#344e59');}
  for(const p of run.level.plates){diamond(p,run.occupiedPlates.includes(p.id)?p.color:'#365e64');const v=project(p);c.fillStyle='#eef2df';c.font=`bold ${scale*.3}px sans-serif`;c.textAlign='center';c.fillText(p.id,v.x,v.y+scale*.1);}
  for(const p of run.level.gates)if(!run.gateOpen(p))diamond(p,'#db9a66');
  for(const l of run.level.lasers)if(run.laserActive(l))l.cells.forEach(p=>diamond(p,'#df6373'));
  for(const p of run.level.crystals)if(!run.collected.includes(p.id))diamond(p,'#f3d592');diamond(run.level.exit,run.exitOpen?'#b4e9cc':'#6d8278');
  const people=[...run.ghostFrames.map((p,i)=>({p,color:COLORS[i],ghost:true})),{p:run.player,color:'#f2e9cd',ghost:false}].sort((a,b)=>a.p.x+a.p.y-b.p.x-b.p.y);
  for(const person of people){const v=project(person.p);c.globalAlpha=person.ghost?.6:1;c.fillStyle=person.color;c.beginPath();c.moveTo(v.x,v.y-scale*.63);c.lineTo(v.x-scale*.18,v.y);c.lineTo(v.x+scale*.18,v.y);c.fill();c.beginPath();c.arc(v.x,v.y-scale*.65,scale*.16,0,Math.PI*2);c.fill();c.fillStyle='#28424a';c.fillRect(v.x-scale*.12,v.y-scale*.71,scale*.24,scale*.08);c.globalAlpha=1;}
}
