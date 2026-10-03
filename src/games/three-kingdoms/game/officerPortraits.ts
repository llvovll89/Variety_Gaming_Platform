import type { CSSProperties } from 'react';
import { HERO_CATALOG } from '../../three-kingdoms-card/lib/heroCatalog';
import { portraitStyle } from '../../three-kingdoms-card/lib/heroPortrait';
import { createOfficers } from './officers';

/** Fixed identities survive renamed officers, faction changes and save restores. */
export const PK_PORTRAIT_IDS = [
  ['mateng','handang','jiangqin','zhuran','buzhi','zhangzhao','zhanghong','wangyi','mengda','liuyan','liuzhang','zhangren','yanyan','zhangsong','liyan','zhangyi'],
  ['dongyun','feiyi','yanghu','duyu','zhangchunhua','caohong','manchong','liuye','maojie','caochun','chenqun','mifang','chentao','chenlian','houcheng','songxian'],
  ['weixu','gaolan','xuyou','fengji','shenpei','chunyuqiong','yuantan','huangzu','caimao','kuaiyue','hansui','zhangji','jianyong','chendeng','mizhu','sunqian'],
  ['yuejin','chengyu','lidian','gaoshun','chengong','zangba','jushou','tianfeng','qiaorui','jiling','yanghong','liubiao','wenpin','kuailiang','lijue','guosi'],
] as const;

const sharedPortraits = new Map(Object.values(createOfficers()).flatMap(officer => {
  const hero = HERO_CATALOG.find(h => h.key === officer.id || h.name === officer.name);
  return hero ? [[officer.id, hero.key] as const] : [];
}));
const dedicatedPortraits = new Map<string,{atlas:number;tile:number}>(PK_PORTRAIT_IDS.flatMap((ids,atlas)=>ids.map((id,tile)=>[id,{atlas:atlas+1,tile}])));

export function officerPortraitSource(id:string): {kind:'shared';key:string} | {kind:'pk';atlas:number;tile:number} {
  const shared=sharedPortraits.get(id);
  if(shared) return {kind:'shared',key:shared};
  const dedicated=dedicatedPortraits.get(id);
  if(dedicated) return {kind:'pk',...dedicated};
  // Custom officers receive a stable illustrated face, with no model or appearance editor.
  let hash=0;for(const c of id)hash=(Math.imul(hash,31)+c.charCodeAt(0))>>>0;
  return {kind:'pk',atlas:hash%4+1,tile:Math.floor(hash/4)%16};
}

export function officerPortraitStyle(id:string): CSSProperties {
  const source=officerPortraitSource(id);
  if(source.kind==='shared')return portraitStyle(source.key);
  return {
    backgroundImage:`url('/art/three-kingdoms/portraits-pk-${source.atlas}.png')`,
    backgroundSize:'400% 400%',
    backgroundPosition:`${(source.tile%4)*100/3}% ${Math.floor(source.tile/4)*100/3}%`,
  };
}
