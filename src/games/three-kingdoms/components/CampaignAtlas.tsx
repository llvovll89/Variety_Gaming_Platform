import { useId } from 'react';
import { axialToOffset } from '../game/hex';
import type { FactionId, GameState } from '../game/types';

/** An original schematic of the playable scenario, using its real city positions. */
export function CampaignAtlas({state,selectedFaction,onFaction}:{state:GameState;selectedFaction:FactionId;onFaction:(id:FactionId)=>void}) {
  const texture=useId();
  const position=(coord:GameState['cities'][string]['coord'])=>{const p=axialToOffset(coord);return {x:50+p.col*18,y:36+p.row*18};};
  return <svg viewBox="0 0 660 430" className="tk-campaign-atlas" role="group" aria-label="중원 세력도. 도시를 선택해 해당 군주의 세력을 확인하세요.">
    <defs><pattern id={texture} width="36" height="36" patternUnits="userSpaceOnUse"><path d="M36 0H0V36" fill="none" stroke="#756747" strokeWidth=".4" opacity=".18"/></pattern></defs>
    <rect width="660" height="430" fill={`url(#${texture})`}/>
    <g fill="none" stroke="#a79774" strokeWidth="1" opacity=".32">{Array.from({length:8},(_,i)=><path key={i} d={`M-20 ${90+i*18} C70 ${10+i*16} 150 ${200+i*9} 220 ${115+i*16} S380 ${170+i*17} 410 ${85+i*17} S590 ${110+i*16} 700 ${45+i*16}`}/>)}</g>
    <path d="M0 112C65 85 78 97 122 139S212 147 246 130S343 91 371 130S442 182 492 141S589 95 660 98" fill="none" stroke="#a1b6b1" strokeWidth="12" opacity=".55"/>
    <path d="M0 112C65 85 78 97 122 139S212 147 246 130S343 91 371 130S442 182 492 141S589 95 660 98" fill="none" stroke="#526f70" strokeWidth="1.2" opacity=".5"/>
    <text x="340" y="112" fill="#526f70" fontSize="12" letterSpacing="8">黃河</text>
    <g fill="#817452" opacity=".28" fontSize="35">{[[70,66],[106,88],[146,65],[64,316],[99,339],[138,309]].map(([x,y],i)=><text key={i} x={x} y={y}>山</text>)}</g>
    <g stroke="#82714e" strokeDasharray="3 5" opacity=".3">{Object.values(state.cities).flatMap(c=>c.neighborCityIds.filter(id=>id>c.id).map(id=>{const a=position(c.coord),b=position(state.cities[id].coord);return <line key={`${c.id}-${id}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y}/>;}))}</g>
    <text x="320" y="300" fill="#8b7952" opacity=".24" fontSize="60" letterSpacing="25">中原</text>
    {Object.values(state.cities).map(c=>{const p=position(c.coord),f=c.faction?state.factions[c.faction]:null,active=c.faction===selectedFaction;return <g key={c.id} role={f?'button':undefined} tabIndex={f?0:undefined} aria-label={`${c.name} · ${f?.name??'중립'}${active?' · 선택됨':''}`} onClick={()=>{if(f)onFaction(f.id);}} onKeyDown={e=>{if(f&&(e.key==='Enter'||e.key===' ')){e.preventDefault();onFaction(f.id);}}} className={f?'tk-atlas-city':''}>
      {active&&<circle cx={p.x} cy={p.y} r="26" fill={f?.color} opacity=".12"/>}<circle cx={p.x} cy={p.y} r="20" fill="transparent"/><circle cx={p.x} cy={p.y} r={active?7:5} fill={f?.color??'#8a8069'} stroke="#eee4ca" strokeWidth="2"/>
      <rect x={p.x-23} y={p.y+10} width="46" height="22" rx="2" fill={active?f?.color:'#ede5d2'}/><text x={p.x} y={p.y+25} textAnchor="middle" fill={active?'#fff4d9':'#3f4438'} fontSize="12" fontWeight="600">{c.name}</text>
    </g>;})}
    <g transform="translate(610 340)" stroke="#756747" fill="none"><path d="M0 0v44M-12 22h24M0 0l-4 8h8z"/><text x="0" y="-8" textAnchor="middle" fill="#756747" stroke="none" fontSize="12">北</text></g>
  </svg>;
}
