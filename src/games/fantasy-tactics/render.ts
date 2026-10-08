import { eventDuration, facing, motion, moveDuration } from './animation';
import { sprite, spriteHit } from './art';
import { Battle, HEIGHT, WIDTH, key, type Mode, type Point, type Role, type Tile, type Unit } from './game';

export const VIEW_W = 1120, VIEW_H = 670;
export const project = (p: Point, height = 0) => ({ x: 560 + (p.x - p.y) * 43, y: 94 + (p.x + p.y) * 23 - height * 19 });
const colors: Record<Role, string> = { ranger:'#68bc87', rogue:'#b495dc', shield:'#9bafc8', watermage:'#67c5e7', shaman:'#c587d7', sword: '#4794e1', spear: '#d6b45f', mage: '#e97777', healer: '#a1cfc8', goblin: '#88a24d', archer: '#b38266', boss: '#717289' };
function polygon(c: CanvasRenderingContext2D, points: number[][], color: string, stroke?: string) {
  c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.fillStyle = color; c.fill();
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = 1; c.stroke(); }
}
function diamond(c: CanvasRenderingContext2D, x: number, y: number, color: string, stroke?: string) { polygon(c, [[x, y - 23], [x + 43, y], [x, y + 23], [x - 43, y]], color, stroke); }
export function drawCharacter(c: CanvasRenderingContext2D, role: Role, x: number, y: number, scale = 1, enemy = false) {
  if (sprite(c, role, x, y, scale)) return;
  c.save(); c.translate(Math.round(x), Math.round(y)); c.scale(scale, scale);
  // Deliberately small, layered shapes retain the silhouette of a classic sprite.
  const rect = (a: number, b: number, w: number, h: number, fill: string) => { c.fillStyle = fill; c.fillRect(a, b, w, h); };
  c.fillStyle = '#12242b55'; c.beginPath(); c.ellipse(0, -2, 16, 7, 0, 0, Math.PI * 2); c.fill();
  polygon(c, [[-12, -34], [10, -34], [17, -6], [-18, -8]], enemy ? '#553c45' : role === 'mage' ? '#853f5e' : '#284863');
  rect(-9, -10, 7, 9, '#253342'); rect(3, -10, 7, 9, '#253342'); rect(-11, -3, 10, 4, '#bd9561'); rect(3, -3, 10, 4, '#bd9561');
  rect(-10, -32, 21, 24, '#243a49'); rect(-8, -31, 17, 21, colors[role]); rect(-8, -31, 5, 16, '#ffffff35');
  rect(-9, -14, 20, 4, '#77583d'); rect(-1, -14, 4, 4, '#f9db91');
  rect(-15, -30, 6, 15, colors[role]); rect(10, -28, 6, 15, colors[role]); rect(-15, -17, 6, 5, '#f1c39c'); rect(10, -17, 6, 5, '#f1c39c');
  const skin = role === 'goblin' ? '#a7bf66' : '#edc7a1';
  rect(-9, -48, 20, 18, '#28394b'); rect(-8, -47, 17, 15, skin); rect(5, -45, 4, 11, '#d79e7e'); rect(-6, -39, 3, 3, '#263849'); rect(3, -39, 3, 3, '#263849'); rect(-1, -34, 3, 1, '#a96d64');
  if (role === 'mage') {
    rect(-11, -46, 7, 22, '#cc8587'); rect(7, -45, 6, 20, '#9c526b');
    polygon(c, [[-16, -46], [0, -67], [15, -46]], '#9c4d68'); rect(-18, -48, 35, 4, '#f0bb7f'); rect(-2, -62, 5, 4, '#f2d28c');
  } else if (role === 'healer') {
    rect(-10, -49, 21, 7, '#eee2bf'); rect(-11, -44, 5, 18, '#ece6c9'); rect(7, -44, 5, 20, '#d1d0b3'); rect(-4, -48, 10, 3, '#93b7b4');
  } else if (role === 'boss' || role === 'spear') {
    rect(-11, -52, 23, 11, role === 'boss' ? '#555669' : '#c4cbd1'); rect(-12, -45, 5, 13, '#8a949e'); rect(8, -45, 5, 13, '#8a949e');
    rect(-1, -56, 6, 7, enemy ? '#ad526a' : '#dd7563');
  } else {
    const hair = role === 'sword' ? '#6a4340' : role === 'archer' ? '#76573f' : '#607c41';
    rect(-10, -51, 21, 7, hair); rect(-12, -46, 5, 9, hair); rect(7, -47, 6, 10, hair); rect(-6, -44, 6, 4, hair);
    if (role === 'goblin') { polygon(c, [[-9, -43], [-19, -47], [-14, -37]], skin); polygon(c, [[9, -43], [18, -47], [14, -37]], skin); }
  }
  if (role === 'mage' || role === 'healer') {
    rect(16, -47, 3, 44, '#8e6843'); rect(12, -51, 11, 9, '#d7b767'); rect(14, -52, 7, 8, role === 'mage' ? '#fa9980' : '#afeeee');
  } else if (role === 'spear') {
    rect(17, -51, 3, 51, '#8e6843'); polygon(c, [[14, -51], [18, -65], [23, -51]], '#e1e8e7');
    polygon(c, [[-18, -27], [-8, -24], [-10, -9], [-18, -6], [-24, -16]], '#798c9b', '#d9c48d');
  } else if (role === 'archer') {
    c.strokeStyle = '#d4b580'; c.lineWidth = 3; c.beginPath(); c.ellipse(18, -26, 8, 19, 0, -Math.PI / 2, Math.PI / 2); c.stroke();
    c.strokeStyle = '#eee0b3'; c.lineWidth = 1; c.beginPath(); c.moveTo(18, -45); c.lineTo(18, -7); c.stroke();
  } else {
    polygon(c, [[16, -12], [20, -43], [24, -46], [24, -13]], '#d7e2e2'); rect(12, -14, 16, 3, '#dfc176'); rect(18, -11, 4, 8, '#785f42');
    if (role === 'sword') polygon(c, [[-20, -27], [-9, -25], [-11, -8], [-20, -5], [-27, -17]], '#427cad', '#e2c988');
  }
  c.restore();
}
function tree(c: CanvasRenderingContext2D, x: number, y: number, scale = 1) {
  if (sprite(c, 'tree', x, y, scale)) return;
  c.save(); c.translate(x, y); c.scale(scale, scale); c.fillStyle = '#0d393338'; c.beginPath(); c.ellipse(0, 0, 29, 12, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#71654a'; c.fillRect(-5, -40, 10, 41); c.fillStyle = '#a28e66'; c.fillRect(-3, -35, 3, 30);
  polygon(c, [[0, -102], [32, -45], [-31, -45]], '#2e6152'); polygon(c, [[-3, -89], [37, -29], [-38, -29]], '#37715a'); polygon(c, [[-7, -79], [29, -40], [-27, -40]], '#4d8a67'); polygon(c, [[-6, -98], [6, -72], [-19, -72]], '#72a678'); c.restore();
}
function seaBackdrop(c:CanvasRenderingContext2D,stage:number) {
  c.fillStyle=stage===3?'#173c50':stage===4?'#111e35':'#243e50';c.fillRect(0,0,VIEW_W,VIEW_H);
  for(let i=0;i<95;i++){
    const x=(i*137)%VIEW_W,y=45+(i*79)%(VIEW_H-45);
    c.strokeStyle=stage===4?'#46668155':'#6cacbd55';c.lineWidth=1;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+15,y-5,x+35,y);c.stroke();
  }
  c.fillStyle='#d9e4c2';c.beginPath();c.arc(940,64,stage===4?24:17,0,Math.PI*2);c.fill();
  for(let i=0;i<28;i++){c.fillStyle='#d1e6ea';c.fillRect((i*101+73)%VIEW_W,12+(i*31)%65,2,2);}
  if(stage===3){
    for(let i=0;i<5;i++){const x=100+i*90,y=65+(i%2)*16;c.fillStyle='#314858';c.fillRect(x,y,65,55);polygon(c,[[x-5,y],[x+32,y-25],[x+70,y]],'#775c61');c.fillStyle='#deb875';c.fillRect(x+14,y+18,10,15);}
    c.strokeStyle='#9c7f60';c.lineWidth=7;c.beginPath();c.moveTo(1050,195);c.lineTo(1050,65);c.lineTo(970,65);c.stroke();c.lineWidth=1;c.beginPath();c.moveTo(970,65);c.lineTo(970,120);c.stroke();
  }else if(stage===4){
    polygon(c,[[80,330],[380,575],[890,535],[1040,310],[595,80]],'#46392f','#9c8463');
    c.strokeStyle='#b5a88b';c.lineWidth=3;c.beginPath();c.moveTo(405,74);c.lineTo(405,200);c.stroke();
    polygon(c,[[410,77],[545,91],[440,145]],'#242532','#7d8093');c.strokeStyle='#809b9e';c.lineWidth=1;c.beginPath();c.moveTo(410,74);c.lineTo(210,245);c.moveTo(410,74);c.lineTo(765,137);c.stroke();
  }else{
    polygon(c,[[40,345],[290,125],[625,59],[975,185],[1080,490],[795,650],[340,650]],'#4e6257','#8ea38b');
    polygon(c,[[875,138],[960,85],[1045,151],[995,184]],'#5b6873','#aab5a1');
    c.fillStyle='#e5d3ad';c.beginPath();c.arc(960,127,9,0,Math.PI*2);c.fill();
    c.strokeStyle='#b6ecdc';c.lineWidth=2;for(let i=0;i<3;i++){c.beginPath();c.ellipse(960,135,22+i*9,9+i*3,0,0,Math.PI*2);c.stroke();}
  }
}
export function drawBattle(c: CanvasRenderingContext2D, b: Battle, mode: Mode, hover: Point | null, grid: boolean, elapsed = Infinity) {
  c.clearRect(0, 0, VIEW_W, VIEW_H);
  c.fillStyle = '#40553b'; c.fillRect(0, 0, VIEW_W, VIEW_H);
  // A continuous forest floor surrounds the playable terrace.
  for (let i = 0; i < (b.stage>=3&&!b.sideQuest?0:2100); i++) {
    const x = (i * 137 + i * i * 7) % VIEW_W, y = (i * 71 + i * i * 3) % VIEW_H;
    c.fillStyle = ['#536448', '#354b35', '#68734d', '#3d5037'][i % 4]; c.fillRect(x, y, 2 + i % 5, 1 + i % 3);
  }
  if(b.stage>=3&&!b.sideQuest)seaBackdrop(c,b.stage);else{
    for (let i = 0; i < 17; i++) tree(c, 55 + i * 67, 80 + (i % 4) * 25, .8 + i % 3 * .14);
    for (let i = 0; i < 6; i++) { tree(c, 45 + i * 23, 210 + i * 42, 1); tree(c, 1070 - i * 18, 225 + i * 37, 1.05); }
  }
  const reachable = b.canAct() && !b.actor.moved && mode === 'move' ? new Set(b.targets(mode).map(key)) : new Set<string>();
  const targets = b.canAct() && mode !== 'move' ? new Set(b.targets(mode).map(key)) : new Set<string>();
  const area = hover && targets.has(key(hover)) ? new Set(b.area(hover, mode).map(key)) : new Set<string>();
  const order = [...b.tiles].sort((a, d) => a.x + a.y - d.x - d.y || a.y - d.y);
  for (const t of order) {
    const p = project(t, t.height), depth = 14 + t.height * 19;
    const left = t.terrain === 'water' ? '#468c97' : t.terrain === 'stone' ? '#657878' : '#74885a';
    polygon(c, [[p.x - 43, p.y], [p.x, p.y + 23], [p.x, p.y + 23 + depth], [p.x - 43, p.y + depth]], left);
    polygon(c, [[p.x, p.y + 23], [p.x + 43, p.y], [p.x + 43, p.y + depth], [p.x, p.y + 23 + depth]], t.terrain === 'water' ? '#327386' : t.terrain === 'stone' ? '#4d656b' : '#536f52');
    const tint = (t.x * 13 + t.y * 7) % 4;
    const top = t.terrain === 'water' ? b.stage>=3?'#37657d':'#65afbb' : t.terrain === 'bridge' ? '#c4a274' : t.terrain === 'stone' ? b.stage===4?['#806447','#8e7150','#836b4e','#967955'][tint]:['#a1b3ab', '#9ba9a3', '#a6b5aa', '#93a89f'][tint] : ['#7b9256', '#84995d', '#899c60', '#809358'][tint];
    diamond(c, p.x, p.y, top, grid ? '#c5d1a555' : undefined);
    c.save(); c.beginPath(); c.moveTo(p.x,p.y-23); c.lineTo(p.x+43,p.y); c.lineTo(p.x,p.y+23); c.lineTo(p.x-43,p.y); c.closePath(); c.clip();
    if (t.terrain === 'grass' || t.terrain === 'stone') {
      for (let i=0;i<100;i++) {
        const n = t.x * 211 + t.y * 53 + i * 37;
        c.fillStyle = t.terrain === 'stone' ? ['#74847766','#c4c7a744','#52645855'][i%3] : ['#38582b44','#c0bc7844','#65794377'][i%3];
        c.fillRect(p.x-43+n%86,p.y-23+(n*7+i*13)%46,1+i%4,1+i%2);
      }
      if (t.terrain === 'grass' && Math.abs(t.y - (5 + Math.floor(t.x/4))) < 1) {
        c.fillStyle = '#b4a17580'; c.beginPath(); c.ellipse(p.x,p.y,46,11,.47,0,Math.PI*2); c.fill();
        for(let i=0;i<14;i++){c.fillStyle='#716b4a88';c.fillRect(p.x-30+i*5,p.y-6+(i*7)%14,3,2);}
      }
    }
    c.restore();
    if (t.terrain === 'bridge') {
      c.strokeStyle = '#8a6b4a'; c.lineWidth = 2;
      for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(p.x - 25 + i * 6, p.y - 10 + i * 3); c.lineTo(p.x + 22 + i * 6, p.y - 10 + i * 3 + 25); c.stroke(); }
    } else if (t.terrain === 'water') {
      c.save(); c.beginPath(); c.moveTo(p.x,p.y-23); c.lineTo(p.x+43,p.y); c.lineTo(p.x,p.y+23); c.lineTo(p.x-43,p.y); c.closePath(); c.clip();
      for (let i = 0; i < 25; i++) {
        const x = p.x - 42 + (i * 29 + t.y * 11) % 84, y = p.y - 21 + (i * 17) % 42;
        c.strokeStyle = ['#afd6c788','#315f7277','#77b7c0'][i%3]; c.lineWidth = 1;
        c.beginPath(); c.moveTo(x,y); c.lineTo(x+7+i%12,y-2); c.lineTo(x+15+i%12,y-1); c.stroke();
      }
      c.restore();
    } else if (t.terrain === 'grass') {
      for (let i = 0; i < 3; i++) {
        const x = p.x - 18 + ((t.x * 17 + t.y * 13 + i * 23) % 36), y = p.y - 6 + ((i * 5 + t.y) % 11);
        c.fillStyle = '#60845188'; c.fillRect(x, y, 2, 4); c.fillRect(x + 3, y - 1, 2, 3);
        if ((t.x + t.y + i) % 9 === 0) { c.fillStyle = '#f5e8b7'; c.fillRect(x, y - 2, 3, 2); }
      }
    } else { c.strokeStyle = b.stage===4?'#42322499':'#71898466'; c.beginPath(); c.moveTo(p.x - 21, p.y + 11); c.lineTo(p.x + 21, p.y - 11); c.stroke(); }
    if(b.breakableBridges.some(v=>key(v)===key(t))&&t.terrain==='bridge'){c.strokeStyle='#813c32';c.lineWidth=3;c.beginPath();c.moveTo(p.x-12,p.y-8);c.lineTo(p.x+7,p.y+9);c.moveTo(p.x+9,p.y-9);c.lineTo(p.x-6,p.y+7);c.stroke();c.fillStyle='#fff0c4';c.font='10px sans-serif';c.fillText('낡은 다리',p.x-23,p.y-13);}
    if(b.cutBridges.some(v=>key(v)===key(t))){c.strokeStyle='#c4a274';c.lineWidth=3;c.beginPath();c.moveTo(p.x-29,p.y-6);c.lineTo(p.x-17,p.y);c.moveTo(p.x+17,p.y);c.lineTo(p.x+29,p.y+6);c.stroke();}
    if(b.traps.some(v=>key(v)===key(t))){c.fillStyle='#9bdc91';c.font='bold 15px sans-serif';c.fillText('덫',p.x-8,p.y+4);}
    const fire=b.burning.find(v=>key(v)===key(t));
    if(fire){diamond(c,p.x,p.y,'#e46c3a99','#ffd49a');for(let i=0;i<3;i++){const x=p.x-12+i*12;polygon(c,[[x-7,p.y],[x-5,p.y-12],[x,p.y-29+i*4],[x+7,p.y-8],[x+5,p.y]],'#ef842e');polygon(c,[[x-4,p.y],[x,p.y-16],[x+4,p.y]],'#ffdf83');}c.font='bold 11px sans-serif';c.fillStyle='#ffe8ac';c.fillText(`불 ${fire.turns}회`,p.x-16,p.y+17);}
    const chest=b.treasures.find(v=>key(v)===key(t));
    if(chest) {
      const open=b.opened.includes(chest.id),x=p.x,y=p.y;
      polygon(c,[[x-15,y-7],[x,y+1],[x+15,y-7],[x,y-15]],open?'#473e30':'#ad7938','#e0c27c');
      polygon(c,[[x-15,y-7],[x,y+1],[x,y+13],[x-15,y+5]],'#704a29','#c6a25b');
      polygon(c,[[x,y+1],[x+15,y-7],[x+15,y+5],[x,y+13]],'#483326','#c6a25b');
      if(open)polygon(c,[[x-15,y-7],[x-15,y-22],[x,y-30],[x,y-15]],'#9b6c34','#dfc47e');
      else {c.fillStyle='#f1d786';c.fillRect(x-2,y+1,5,6);c.fillStyle='#fff3b1';c.fillRect(x+11,y-23,2,9);c.fillRect(x+8,y-20,8,2);}
    }
    if (reachable.has(key(t))) diamond(c, p.x, p.y, '#54b8e744', '#b8eeff');
    if(b.bossWarning.some(v=>key(v)===key(t))){diamond(c,p.x,p.y,'#bd264c88','#ffb9c4');c.fillStyle='#fff1dc';c.font='bold 18px sans-serif';c.textAlign='center';c.fillText('!',p.x,p.y+6);c.textAlign='start';}
    if(b.sideQuest){const person=b.civilians.find(v=>key(v)===key(t)&&!b.rescued.includes(v.id));if(person){c.fillStyle='#ffe0af';c.beginPath();c.arc(p.x,p.y-26,7,0,Math.PI*2);c.fill();polygon(c,[[p.x-8,p.y-18],[p.x+8,p.y-18],[p.x+11,p.y],[p.x-11,p.y]],'#f1d690','#6b5642');c.font='bold 12px sans-serif';c.textAlign='center';c.fillStyle='#fff5cd';c.fillText('구출',p.x,p.y-39);c.textAlign='start';}}
    if (targets.has(key(t))) diamond(c, p.x, p.y, '#ffd16a32', '#eddca16b');
    if (area.has(key(t))) diamond(c, p.x, p.y, b.skill(mode)?.effect === 'damage' || mode === 'attack' ? '#e65d6877' : '#93f2d477', '#ffefd0');
    if (hover && key(hover) === key(t)) { c.lineWidth = 2; diamond(c, p.x, p.y, '#ffffff18', '#fff5ce'); }
    if (grid && t.height > 0) { c.font = '11px sans-serif'; c.fillStyle = '#405e56'; c.fillText(`↑${t.height}`, p.x - 6, p.y + 4); }

  }
  const visible = b.units.filter(u => u.hp > 0 || (elapsed < eventDuration(b.lastEvent) && b.lastEvent?.hits?.some(hit => hit.id === u.id)));
  visible.sort((a,d) => a.x+a.y-d.x-d.y).forEach(u => drawUnit(c,b,u,elapsed));
  // Trees outside the playable grid preserve visibility of every selectable cell.
  if(b.stage<3||b.sideQuest)for (const [x, y, s] of [[104, 390, 1.2], [170, 489, .9], [1080, 490, 1.1], [1095, 610, 1.3], [309, 600, .7]]) tree(c, x, y, s);
  if (b.stage === 2) {
    const p = project({ x: 8, y: -2 });
    polygon(c, [[p.x - 27, p.y - 40], [p.x + 27, p.y - 40], [p.x + 27, p.y - 165], [p.x - 27, p.y - 165]], '#c8cdc0', '#657d7c');
    polygon(c, [[p.x - 35, p.y - 165], [p.x, p.y - 191], [p.x + 35, p.y - 165]], '#577b8b');
    c.fillStyle = '#d6eec9'; c.fillRect(p.x - 12, p.y - 157, 24, 18); c.fillStyle = '#768c80'; c.fillRect(p.x - 5, p.y - 83, 10, 21);
  }
  const event = b.lastEvent;
  if (event && event.kind !== 'move') {
    const time = elapsed - moveDuration(event);
    if (time >= 0 && time < 620) {
      const source = b.units.find(u=>u.id===event.actorId)!;
      const from=project(event.from,b.tile(event.from).height), to=project(event.to,b.tile(event.to).height);
      const magic=source.role==='mage'||source.role==='healer'||event.kind!=='damage';
      const color=event.kind==='damage'?(source.role==='mage'?'#ffb45b':'#ffe7ac'):'#b7ffeb';
      c.save(); c.strokeStyle=color;c.fillStyle=color;c.lineWidth=3;
      if(time<300 && (magic||source.role==='archer')) {
        const t=Math.max(0,(time-80)/220),x=from.x+(to.x-from.x)*t,y=from.y-45+(to.y-from.y)*t;
        if(source.role==='archer'){c.beginPath();c.moveTo(x-10,y+3);c.lineTo(x+10,y-3);c.stroke();}
        else{c.beginPath();c.arc(x,y,5+Math.sin(t*Math.PI)*4,0,Math.PI*2);c.fill();}
      }
      if(time>160 && time<440) {
        for(const hit of event.hits??[{at:event.to,text:event.text}]) {
          const p=project(hit.at,b.tile(hit.at).height), t=(time-160)/280;
          c.globalAlpha=1-t;
          if(magic){c.beginPath();c.ellipse(p.x,p.y-20,12+t*25,18+t*32,0,0,Math.PI*2);c.stroke();}
          else{c.beginPath();c.arc(p.x,p.y-38,25,-1.4+t*.5,1.1+t*.5);c.stroke();}
        }
      }
      c.globalAlpha=1;c.textAlign='center';c.font='bold 23px Gulim,sans-serif';c.lineWidth=4;c.strokeStyle='#16213c';
      if(time>230) for(const hit of event.hits??[{at:event.to,text:event.text}]) {
        const p=project(hit.at,b.tile(hit.at).height),y=p.y-85-Math.min(25,(time-230)/13);
        c.globalAlpha=Math.min(1,(620-time)/100);c.strokeText(hit.text,p.x,y);c.fillText(hit.text,p.x,y);
      }
      c.restore();
    }
  }
}
function drawUnit(c: CanvasRenderingContext2D, b: Battle, u: Unit, elapsed: number) {
  let p = project(u,b.tile(u).height);
  const event=b.lastEvent, active=event?.actorId===u.id && elapsed<eventDuration(event);
  const delta=b.facings[u.id] ?? (u.team==='ally'?{x:1,y:0}:{x:-1,y:0});
  let direction=facing({x:0,y:0},delta), pose: 'idle'|'walk'|'attack'='idle';
  if(active && event) {
    const m=motion(event,elapsed);
    if(m.walking) {
      const a=project(m.from,b.tile(m.from).height),z=project(m.to,b.tile(m.to).height);
      p={x:a.x+(z.x-a.x)*m.fraction,y:a.y+(z.y-a.y)*m.fraction-Math.abs(Math.sin(elapsed/75*Math.PI))*2};
      direction=facing(m.from,m.to);pose='walk';
    } else if(event.kind!=='move') {
      direction=facing(event.from,event.to);
      if(m.actionTime>90 && m.actionTime<380) pose='attack';
      if(event.kind==='damage' && !['mage','healer','archer'].includes(u.role)) {
        const target=project(event.to,b.tile(event.to).height),t=Math.sin(Math.min(1,m.actionTime/420)*Math.PI);
        p={x:p.x+(target.x-p.x)*t*.18,y:p.y+(target.y-p.y)*t*.18};
      }
    }
  }
  const hit=event?.hits?.some(v=>v.id===u.id),impact=elapsed-moveDuration(event);
  if(hit && impact>230 && impact<420 && event?.kind==='damage') p.x+=Math.sin(impact*.12)*3;
  if(u.id===b.selected && u.team==='ally' && u.hp>0){
    c.strokeStyle='#fff3b3';c.lineWidth=2;c.beginPath();c.ellipse(p.x,p.y-1,23,10,0,0,Math.PI*2);c.stroke();
    polygon(c,[[p.x,p.y-113],[p.x-6,p.y-122],[p.x+6,p.y-122]],'#fff0a5');
  }
  c.save();
  if(b.stage===4&&u.team==='enemy'){c.filter='saturate(0.5) hue-rotate(130deg)';c.globalAlpha=.85;}
  if(b.stage===5&&u.role==='boss'){c.filter='hue-rotate(135deg) brightness(1.25)';c.strokeStyle='#b6ecdc';c.lineWidth=2;c.beginPath();c.ellipse(p.x,p.y-42,38,49,0,0,Math.PI*2);c.stroke();}
  if(u.hp===0)c.globalAlpha=Math.max(0,1-Math.max(0,impact-230)/390);
  else if(u.acted && u.team==='ally' && b.phase==='player' && !active)c.globalAlpha=.63;
  if(!sprite(c,u.role,p.x,p.y,1.05,direction,pose,elapsed,u.team==='enemy'||!!u.promoted))drawCharacter(c,u.role,p.x,p.y,1.05,u.team==='enemy');
  c.restore();
  if(u.hp>0){c.fillStyle='#183c40';c.fillRect(p.x-21,p.y+8,42,5);c.fillStyle=u.team==='ally'?'#a3ecbc':'#ef9691';c.fillRect(p.x-20,p.y+9,40*u.hp/u.maxHp,3);}
  if(u.ward){c.strokeStyle='#c8f9ed';c.lineWidth=1.5;c.beginPath();c.ellipse(p.x,p.y-26,25,32,0,0,Math.PI*2);c.stroke();}
}

export function pickTile(b: Battle, point: Point): Tile | null {
  // Reverse draw order resolves overlapping height planes consistently.
  const order = [...b.tiles].sort((a, d) => d.x + d.y - a.x - a.y || d.y - a.y);
  for (const tile of order) {
    const p = project(tile, tile.height);
    if (Math.abs(point.x - p.x) / 43 + Math.abs(point.y - p.y) / 23 <= 1) return tile;
  }
  return null;
}
export function pickUnit(b: Battle, point: Point): Unit | null {
  const order = b.units.filter(u => u.hp > 0).sort((a, d) => d.x + d.y - a.x - a.y);
  return order.find(u => {
    const p = project(u, b.tile(u).height), delta = b.facings[u.id] ?? (u.team === 'ally' ? { x: 1, y: 0 } : { x: -1, y: 0 });
    return spriteHit(u.role, point.x - p.x, point.y - p.y, facing({ x: 0, y: 0 }, delta), u.team === 'enemy' || !!u.promoted);
  }) ?? null;
}
export function clampCursor(p: Point) { return { x: Math.max(0, Math.min(WIDTH - 1, p.x)), y: Math.max(0, Math.min(HEIGHT - 1, p.y)) }; }
