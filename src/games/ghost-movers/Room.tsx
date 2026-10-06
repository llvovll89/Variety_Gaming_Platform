import { useId } from 'react';
import { LEVELS, FURNITURE, key, type State, type FurnitureKind, type Direction, type Point } from './engine';

export function GhostArt({smile=true}:{smile?:boolean}) {
  return <g className="gm-ghost-art"><path d="M-25 5 C-34-3-40 5-35 11 L-23 19 M24 5 C34-3 40 5 34 12 L23 19" fill="none" stroke="#c9f6e5" strokeWidth="7" strokeLinecap="round"/><path d="M-26 34V-3C-26-37 26-37 26-3V34Q17 24 9 34Q0 25-9 34Q-17 24-26 34Z" fill="#c9f6e5" stroke="#effff6" strokeWidth="2"/><ellipse cx="-9" cy="-2" rx="3.5" ry="5.5" fill="#244942"/><ellipse cx="10" cy="-2" rx="3.5" ry="5.5" fill="#244942"/><ellipse cx="-17" cy="8" rx="5" ry="3" fill="#edb7a6"/><ellipse cx="18" cy="8" rx="5" ry="3" fill="#edb7a6"/>{smile?<path d="M-5 10Q1 18 7 10" fill="none" stroke="#244942" strokeWidth="2.5" strokeLinecap="round"/>:<ellipse cy="12" rx="4" ry="5" fill="#244942"/>}<path d="M-16-16Q-7-24 4-21" fill="none" stroke="#effff6" strokeWidth="3" strokeLinecap="round"/></g>;
}
export function FurnitureArt({kind,possessed=false}:{kind:FurnitureKind;possessed?:boolean}) {
  return <g stroke="#243d40" strokeWidth="2" strokeLinejoin="round">
    {kind==='sofa'&&<><ellipse cy="8" rx="35" ry="12" fill="#10282d" opacity=".3" stroke="none"/><path d="M-33-5L-33-34Q-33-42-23-42H22Q31-42 31-33V-5" fill="#c98360"/><path d="M-31-21L-12-14L31-23V-8L-12 6L-31-2Z" fill="#efb48a"/><path d="M-31-2L-12 6L31-8V6L-12 20L-31 11Z" fill="#cf8d68"/><path d="M-36-26Q-40-30-40-22V1L-29 6V-19Z M31-28Q38-30 38-23V-1L26 5V-21Z" fill="#e9a57c"/><path d="M-28 13V20M24 9V15M-10-15V3" fill="none"/><path d="M-25-34Q-18-37-10-33M4-33Q12-37 22-34" fill="none" stroke="#efb48a" strokeWidth="3"/></>}
    {kind==='fan'&&<><ellipse cy="16" rx="25" ry="9" fill="#10282d" opacity=".3" stroke="none"/><ellipse cy="9" rx="19" ry="8" fill="#6faaa2"/><path d="M-5 5V-22H5V5Z" fill="#9ed5c6"/><circle cy="-38" r="25" fill="#c5e5d4"/><circle cy="-38" r="20" fill="#305b59"/><g className={possessed?'gm-fan-blades active':'gm-fan-blades'}><path d="M0-38Q-26-62-8-57Q8-56 0-38 Q29-52 20-35Q12-20 0-38 Q3-7-10-19Q-22-31 0-38" fill="#a4d2c1" stroke="none"/></g><circle cy="-38" r="4" fill="#edd9a8"/><path d="M-23-38H23M0-61V-15" fill="none" stroke="#c5e5d4" opacity=".35"/></>}
    {kind==='fridge'&&<><ellipse cy="12" rx="26" ry="9" fill="#10282d" opacity=".3" stroke="none"/><path d="M-23-57L8-66L29-56L-2-47Z" fill="#e1e8ee"/><path d="M-23-57L-2-47V14L-23 3Z" fill="#8fa5b9"/><path d="M-2-47L29-56V3L-2 14Z" fill="#bbcedc"/><path d="M-2-26L29-35" fill="none"/><path d="M4-40V-31M4-20V-5" fill="none" stroke="#617e96" strokeWidth="3"/><path d="M11-43L17-45V-38L11-36Z" fill="#e1efdf" stroke="none"/><path d="M8 10V16M-18 5V10M25 4V9" fill="none"/></>}
    {kind==='vacuum'&&<><ellipse cy="4" rx="31" ry="13" fill="#9c80b6"/><ellipse cy="-5" rx="31" ry="13" fill="#e0b5e5"/><path d="M-31-5V4M31-5V4"/><rect x="-10" y="-13" width="20" height="9" rx="3" fill="#4f516c"/><path d="M-20 9L7 14L24 5" stroke="#424660" strokeWidth="5"/><circle cx="20" cy="-6" r="3" fill="#b9ecda" stroke="none"/></>}
    {kind==='bed'&&<><path d="M-35-30L4-50L36-32L-3-12Z" fill="#e4e7f5"/><path d="M-35-30V-14L-3 6V-12Z" fill="#637fa8"/><path d="M-3-12L36-32V-15L-3 6Z" fill="#9eb5e6"/><path d="M-35-30V-53L4-73V-50Z" fill="#a5b8ed"/><path d="M-28-38L-4-50L7-44L-17-32Z" fill="#fbf7ff"/><path d="M-16-20L23-41L36-32L-3-12Z" fill="#a5b8ed"/><path d="M-30-10V0M30-10V0M-3 5V14" strokeWidth="4"/></>}
    {kind==='lamp'&&<><ellipse cy="10" rx="21" ry="8" fill="#4f536d"/><path d="M0 6V-46" stroke="#c8b491" strokeWidth="5"/><path d="M-26-36L-14-67H14L26-36Q0-22-26-36Z" fill="#efd48e"/><ellipse cy="-36" rx="26" ry="9" fill="#ffeec0"/><circle cy="-34" r="6" fill="#fff4c5" stroke="none"/></>}
    {kind==='cart'&&<><path d="M-33-22L0-38L34-19L1-3Z" fill="#e9ad91"/><path d="M-33-22V-15L1 3V-3L34-19V-12" fill="#be8a7b"/><path d="M-29-12V15M28-8V15M1 2V23" strokeWidth="4"/><path d="M-24 9L0-3L27 10L1 22Z" fill="#bb917d"/><circle cx="-29" cy="16" r="4" fill="#49566c"/><circle cx="28" cy="16" r="4" fill="#49566c"/><circle cx="1" cy="23" r="4" fill="#49566c"/><path d="M-32-22V-40L0-56V-38" fill="none" stroke="#718098" strokeWidth="4"/></>}
  </g>;
}
function CargoArt({heavy=false}:{heavy?:boolean}) {
  if(heavy)return <g stroke="#263e3f" strokeWidth="2" strokeLinejoin="round"><ellipse cy="13" rx="28" ry="9" fill="#10282d" opacity=".3" stroke="none"/><path d="M-26-64L6-74L29-61L-4-51Z" fill="#bfa582"/><path d="M-26-64L-4-51V18L-26 5Z" fill="#8c7058"/><path d="M-4-51L29-61V7L-4 18Z" fill="#a98b68"/><path d="M12-55V12M1-44L9-46V5L1 8ZM16-48L24-51V1L16 4Z" fill="none" stroke="#866d51"/><path d="M8-18V-9M16-20V-11" stroke="#efd6a6" strokeWidth="3"/><path d="M-21 8V15M24 9V15" fill="none"/></g>;
  return <g stroke="#263e3f" strokeWidth="2" strokeLinejoin="round"><ellipse cy="13" rx="27" ry="10" fill="#10282d" opacity=".3" stroke="none"/><path d="M-23-22L1-33L26-20L1-8Z" fill="#e4c39a"/><path d="M-23-22L1-8V19L-23 5Z" fill="#b68e63"/><path d="M1-8L26-20V5L1 19Z" fill="#cfa878"/><path d="M-10-28L14-15L14-5L7-2V-12L-17-25Z" fill="#f1dbac" stroke="none"/><path d="M9 5L20 0M14-1V8" stroke="#806242"/><path d="M-17-10L-7-4V4L-17-2Z" fill="#eee1b6" stroke="none"/></g>;
}
const project=(p:Point)=>({x:440+(p.x-p.y)*48,y:72+(p.x+p.y)*25});
const diamond='0,-25 48,0 0,25 -48,0';
function arrow(direction:Direction) {return ['0,-16 -8,-7 8,-7','28,0 16,-5 16,5','0,16 -8,7 8,7','-28,0 -16,-5 -16,5'][direction];}

export default function Room({state,onPossess,preview=false}:{state:State;onPossess?:(id:string)=>void;preview?:boolean}) {
  const l=LEVELS[state.levelIndex],uid=useId().replaceAll(':',''),tiles=[];
  for(let y=1;y<l.height-1;y++)for(let x=1;x<l.width-1;x++)tiles.push({x,y});
  const objects=[...l.walls.map(p=>({...p,type:'wall' as const,id:key(p)})),...state.cargo.filter(c=>!c.delivered).map(c=>({...c,type:'cargo' as const})),...state.furniture.map(f=>({...f,type:'furniture' as const}))].sort((a,b)=>(a.x+a.y)-(b.x+b.y)||a.x-b.x);
  return <svg className={`gm-room${preview?' gm-preview':''}`} viewBox="70 0 800 505" aria-label={`${l.name} 이삿짐 방. 가구를 누르면 빙의합니다.`} role="group">
    <defs><radialGradient id={`${uid}light`}><stop offset="0" stopColor="#8ec4b2" stopOpacity=".16"/><stop offset="1" stopColor="#8ec4b2" stopOpacity="0"/></radialGradient><pattern id={`${uid}paper`} width="16" height="16" patternUnits="userSpaceOnUse"><path d="M0 8H16" stroke="#a3c8b4" opacity=".09"/></pattern></defs>
    <g aria-hidden="true">
      <ellipse cx="455" cy="270" rx="395" ry="220" fill={`url(#${uid}light)`}/>
      <circle cx="772" cy="53" r="23" fill="#dbdfbb"/><circle cx="783" cy="45" r="22" fill="#1d343a"/>
      {[[168,62],[683,24],[811,170],[127,214],[631,61]].map(([x,y],i)=><path key={i} d={`M${x-3} ${y}h6M${x} ${y-3}v6`} stroke="#bdd7c5" strokeWidth="1.5" opacity=".65"/>)}
      <polygon points="152,272 440,122 824,322 536,472" fill="#11282d" opacity=".5"/>
      <polygon points="152,222 440,72 440,12 152,162" fill="#416461" stroke="#172f35" strokeWidth="3"/>
      <polygon points="440,72 824,272 824,212 440,12" fill="#31534f" stroke="#172f35" strokeWidth="3"/>
      <polygon points="152,162 440,12 824,212 824,203 440,3 152,153" fill="#79a094"/>
      <polygon points="152,222 440,72 824,272 536,422" fill="#957d60" stroke="#1d373b" strokeWidth="3"/>
      <polygon points="152,222 536,422 536,439 152,239" fill="#5d5849"/>
      <polygon points="536,422 824,272 824,289 536,439" fill="#797057"/>
      <path d="M200 150L266 116V166L200 200Z" fill="#182f38" stroke="#81a89c" strokeWidth="5"/><path d="M233 133V183M202 175L264 141" fill="none" stroke="#81a89c" strokeWidth="3"/><path d="M211 148L219 144M250 158L254 156" stroke="#c5e8da" strokeWidth="3"/>
      <path d="M595 122L633 142V114L595 94Z" fill="#dac7a0" stroke="#a28f74" strokeWidth="3"/><path d="M601 111L627 125" stroke="#84755e" strokeWidth="3"/>
      {tiles.map(p=>{const at=project(p),iced=state.ice.includes(key(p)),g=l.goals.find(g=>g.x===p.x&&g.y===p.y),delivered=state.cargo.some(c=>c.delivered&&c.x===p.x&&c.y===p.y);return <g key={key(p)} transform={`translate(${at.x} ${at.y})`}><polygon points={diamond} fill={iced?'#a4dce2':(p.x+p.y)%2===0?'#ab997a':'#a18e70'} stroke={iced?'#d4f1f0':'#88795f'} strokeWidth="1.3"/><path d="M-29-9L15 14M-5-19L39 4" stroke={iced?'#ddf6f6':'#c2af8e'} opacity={iced?.8:.28}/>{iced&&<path d="M-5-6L7 6M7-6L-5 6M1-10V10M-10 0H12" stroke="#e3ffff" strokeWidth="1.5"/>}{g&&<><polygon points="0,-21 40,0 0,21 -40,0" fill={delivered?'#71c6a8':'#456f60'} stroke="#b4e7ba" strokeWidth="2" strokeDasharray={delivered?undefined:'5 3'}/>{delivered?<path d="M-12-1L-3 7L15-7" fill="none" stroke="#ebffe7" strokeWidth="4" strokeLinecap="round"/>:<text y="5" textAnchor="middle" fill="#eff9dc" fontSize="11" fontWeight="700">{g.kind==='box'?'상자':'옷장'}</text>}</>}</g>;})}
      <g transform="translate(796 336)"><path d="M-8-20L23-36L63-16V11L31 28L-8 8Z" fill="#648d7e" stroke="#203d3b" strokeWidth="2"/><path d="M-8-20L23-36L63-16L31 1Z" fill="#b7d9bd"/><path d="M-8-20V8L31 28V1Z" fill="#4b796b"/><path d="M-2-15L25-1V15L-2 1Z" fill="#b9d2bd"/><ellipse cx="3" cy="13" rx="5" ry="8" fill="#1d3436"/><ellipse cx="50" cy="16" rx="5" ry="8" fill="#1d3436"/><text x="40" y="9" textAnchor="middle" fill="#e5f3d7" fontSize="10" fontWeight="800">이사</text></g>
      <text x="693" y="401" fill="#b4d1bc" fontSize="13" transform="rotate(-27 693 401)">초록 발판에 배송</text>
    </g>
    {objects.map(o=>{const p=project(o);if(o.type==='wall')return <g key={o.id} transform={`translate(${p.x} ${p.y})`} aria-hidden="true"><polygon points="0,-53 48,-28 0,-3 -48,-28" fill="#648177" stroke="#304f48" strokeWidth="2"/><polygon points="-48,-28 0,-3 0,25 -48,0" fill="#3c5e56"/><polygon points="0,-3 48,-28 48,0 0,25" fill="#4e7064"/></g>;
      if(o.type==='cargo')return <g key={o.id} className="gm-object" style={{transform:`translate(${p.x}px, ${p.y}px)`}} aria-hidden="true"><CargoArt heavy={o.kind==='wardrobe'}/></g>;
      const possessed=state.active===o.id;return <g key={o.id} className={`gm-object gm-furniture${possessed?' possessed':''}`} style={{transform:`translate(${p.x}px, ${p.y}px)`}} role={preview?undefined:'button'} tabIndex={preview?-1:0} aria-label={preview?undefined:`${FURNITURE[o.kind].name}에 빙의${possessed?' (현재 빙의 중)':''}`} aria-pressed={preview?undefined:possessed} onClick={preview?undefined:()=>onPossess?.(o.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '&&!possessed){e.preventDefault();e.stopPropagation();onPossess?.(o.id);}}}>
        <ellipse className="gm-selection" rx="45" ry="22" fill={possessed?'#c9f6e5':'transparent'} opacity={possessed?.24:1} stroke={possessed?'#c9f6e5':'transparent'} strokeWidth="2"/><ellipse cx="0" cy="-18" rx="44" ry="58" fill="transparent"/>
        <FurnitureArt kind={o.kind} possessed={possessed}/>
        {possessed&&<><g transform="translate(0 -99) scale(.52)" className="gm-spirit"><GhostArt/></g><polygon points={arrow(o.direction)} fill="#e9ffd9" transform="translate(0 32)"/><text y="56" textAnchor="middle" fill="#e6ffee" fontSize="13" fontWeight="700">빙의 중</text></>}
      </g>;
    })}
    {!state.active&&<g className="gm-object" style={{transform:`translate(${project(state.ghost).x}px, ${project(state.ghost).y-24}px)`}} aria-hidden="true"><ellipse cy="34" rx="23" ry="9" fill="#183b38" opacity=".3"/><g className="gm-spirit"><GhostArt/></g></g>}
    {state.effect&&<g key={state.effect.id} className="gm-effect" aria-hidden="true" transform={`translate(${project(state.effect.origin).x} ${project(state.effect.origin).y-16}) rotate(${[333,27,153,207][state.effect.direction]})`}>
      {state.effect.kind==='wind'&&[0,1,2].map(i=><path key={i} d={`M20 ${i*10-10}H${110-i*15}`} fill="none" stroke="#d6f9e8" strokeWidth="4" strokeLinecap="round"/>)}
      {state.effect.kind==='ice'&&<text x="60" y="0" fill="#e6ffff" fontSize="24">✧ ✧ ✧</text>}
      {state.effect.kind==='push'&&<path d="M30-15L40-4L29 7M44-15L54-4L43 7" fill="none" stroke="#eed7a7" strokeWidth="4"/>}
    </g>}
  </svg>;
}
