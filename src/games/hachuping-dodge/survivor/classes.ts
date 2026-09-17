import type { Hero, Weapon } from './world';

export const ADVANCE_LEVELS = [10, 25, 40] as const;
export const MAX_LEVEL = 60;
export const levelExperience = (level:number) => 12 + (level-1)*6;
export const HERO_STATS: Record<Hero, { hp:number; speed:number; damage:number; interval:number; armor:number; xp:number; weapon:Weapon; trait:string; synergy:string }> = {
  ranger: { hp:100,speed:242,damage:18,interval:.48,armor:0,xp:1,weapon:'rifle',trait:'정찰자의 발걸음 · 이동 속도 +15%',synergy:'소총 숙련 · 소총 공격 속도 +20%' },
  knight: { hp:145,speed:189,damage:18,interval:.48,armor:.15,xp:1,weapon:'sword',trait:'철갑 · 체력 145, 피해 15% 감소, 이동 -10%',synergy:'검술 숙련 · 장검 피해 +25%' },
  witch: { hp:80,speed:210,damage:21,interval:.48,armor:0,xp:1.15,weapon:'laser',trait:'마력 감응 · 공격력 21, 경험치 +15%, 체력 80',synergy:'광자 공명 · 레이저 피해 +25%' },
  robot: { hp:120,speed:199,damage:18,interval:.42,armor:0,xp:1,weapon:'shotgun',trait:'기계 코어 · 체력 120, 빠른 공격, 이동 -5%',synergy:'산탄 확장 · 산탄총 탄환 2발 추가' },
};
export const PATHS = {
  sniper: { hero:'ranger',names:['명사수','매의 눈','천궁의 저격수'],skill:'관통 저격',description:'가까운 적을 조준해 관통 광선을 발사',cooldown:5,trait:'공격력 +15%',color:'#a9e6b7' },
  hunter: { hero:'ranger',names:['덫 사냥꾼','숲의 감시자','야생의 지배자'],skill:'속박 덫',description:'가까운 적 주변에 피해를 주고 3초간 둔화',cooldown:6,trait:'이동 속도 +8% · 수집 범위 +25',color:'#a8d379' },
  berserker: { hero:'knight',names:['광전사','폭풍 검사','검성'],skill:'회전 참격',description:'주변 모든 적을 베고 적중 시 체력 회복',cooldown:4,trait:'공격력 +18%',color:'#f1b183' },
  paladin: { hero:'knight',names:['성기사','빛의 수호자','여명의 성전사'],skill:'성역',description:'주변 적에게 피해를 주고 보호막 생성',cooldown:7,trait:'최대 체력 +25 · 체력 25 회복',color:'#f1dd9b' },
  pyromancer: { hero:'witch',names:['화염술사','유성 마법사','태양의 현자'],skill:'유성 폭발',description:'가까운 적 중심에 넓은 폭발 피해',cooldown:5,trait:'공격력 +20%',color:'#ffae85' },
  cryomancer: { hero:'witch',names:['빙결술사','서리 지휘자','겨울의 대현자'],skill:'서리 파동',description:'주변 적들에게 피해를 주고 3초간 둔화',cooldown:6,trait:'받는 피해 8% 추가 감소',color:'#a6e6ff' },
  artillery: { hero:'robot',names:['포격병','공성 지휘관','섬멸 병기'],skill:'추적 드론',description:'가까운 적 최대 3기에 즉시 정밀 타격',cooldown:4,trait:'공격 속도 +12%',color:'#e6c78d' },
  engineer: { hero:'robot',names:['정비사','코어 기술자','영원의 기계심장'],skill:'복구 펄스',description:'체력 회복 및 주변 적 탄환 제거',cooldown:8,trait:'최대 체력 +20 · 체력 20 회복 · 수집 범위 +20',color:'#8ee5d3' },
} as const;
export type Career = keyof typeof PATHS;
export type Focus = 'power' | 'survival';
export interface Promotion { id:string; path:Career; tier:number; focus:Focus; name:string }
export interface JobState { path:Career|null; history:Promotion[]; cooldown:number; shield:number; slow:Record<number,number>; power:number }
export function promotionOptions(hero:Hero,job:JobState): Promotion[] {
  const tier=job.history.length+1;
  if(tier>3)return [];
  if(!job.path) return (Object.keys(PATHS) as Career[]).filter(path=>PATHS[path].hero===hero).map(path=>({id:`${path}-1`,path,tier:1,focus:'power',name:PATHS[path].names[0]}));
  const path=job.path;
  return (['power','survival'] as Focus[]).map(focus=>({id:`${path}-${tier}-${focus}`,path,tier,focus,name:`${PATHS[path].names[tier-1]} · ${focus==='power'?'강습':'수호'}`}));
}
export function promotionTrait(option:Promotion) {
  return `${PATHS[option.path].trait}${option.tier===1?'':option.focus==='power'?' · 직업 스킬 위력 +35%':' · 최대 체력 +30 · 피해 5% 추가 감소'}`;
}
export function skillDescription(path:Career,tier:number,power=1) {
  const scale=(1+tier*.6)*power;
  const damage=path==='pyromancer'?3:path==='sniper'?2.5:path==='berserker'?2:1.5;
  if(path==='engineer')return `체력 ${Math.round((12+tier*8)*power)} 회복 · 반경 ${130+tier*35} 내 적 탄환 제거 · ${PATHS[path].cooldown}초마다`;
  return `공격력의 ${Math.round(damage*scale*100)}% 피해${path==='paladin'?` · 보호막 ${Math.round((20+tier*15)*power)}`:path==='berserker'?` · 적중 시 체력 ${Math.round((4+tier*2)*power)} 회복`:path==='hunter'||path==='cryomancer'?' · 3초간 이동 55% 둔화':''} · ${PATHS[path].cooldown}초마다`;
}
