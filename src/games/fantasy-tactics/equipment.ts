import type { Point, Role } from './game';

export type Slot = 'weapon' | 'armor' | 'accessory';
export type GearStats = { attack: number; defense: number; move: number; mpDiscount: number; healing: number; dash: number };
export interface Equipment { id: string; name: string; slot: Slot; roles: Role[]; description: string; bonus: Partial<GearStats>; }
const fighters: Role[] = ['sword','spear'], casters: Role[] = ['mage','healer'], everyone: Role[] = [...fighters,...casters];
const item = (id: string, name: string, slot: Slot, roles: Role[], bonus: Partial<GearStats>, description: string): Equipment => ({id,name,slot,roles,bonus,description});
export const EQUIPMENT: Equipment[] = [
  item('sword-start','여행자의 검','weapon',['sword'],{},'손에 익은 첫 번째 검.'),
  item('sword-iron','강철 장검','weapon',['sword'],{attack:3},'안정적인 공격력.'),
  item('sword-star','별가름 검','weapon',['sword'],{attack:5,defense:-1},'공격에 집중하는 검사에게.'),
  item('spear-start','수비대의 창','weapon',['spear'],{},'왕국 수비대의 기본 창.'),
  item('spear-oak','참나무 돌격창','weapon',['spear'],{attack:2,dash:.25},'직선 돌진의 피해 배율 +0.25.'),
  item('spear-wind','바람의 창','weapon',['spear'],{attack:3,move:1},'기동성이 좋은 창.'),
  item('mage-start','수습 마법봉','weapon',['mage'],{},'리아가 처음 받은 마법봉.'),
  item('mage-ember','잿불 지팡이','weapon',['mage'],{attack:2,mpDiscount:1},'모든 스킬 소모 MP -1, 최소 1.'),
  item('mage-flame','불꽃별 지팡이','weapon',['mage'],{attack:5},'강력한 마법 공격.'),
  item('healer-start','순례자의 지팡이','weapon',['healer'],{},'노아의 여행 지팡이.'),
  item('healer-heal','온기의 지팡이','weapon',['healer'],{healing:7},'치유 스킬 회복량 +7.'),
  item('healer-dawn','새벽의 지팡이','weapon',['healer'],{attack:2,healing:10,mpDiscount:1},'회복과 마나 효율을 함께 높인다.'),
  item('armor-cloth','여행복','armor',everyone,{defense:1},'누구나 입을 수 있는 가벼운 옷.'),
  item('armor-leather','가죽 갑옷','armor',everyone,{defense:2},'튼튼한 여행용 갑옷.'),
  item('armor-mail','사슬 갑옷','armor',fighters,{defense:4,move:-1},'이동력을 낮추는 대신 높은 방어력.'),
  item('armor-robe','마나 로브','armor',casters,{defense:1,mpDiscount:1},'스킬 소모 MP -1, 최소 1.'),
  item('armor-spell','별무늬 로브','armor',casters,{defense:3,healing:3},'마법사를 보호하고 치유를 돕는다.'),
  item('armor-star','등대 수호갑','armor',everyone,{defense:5},'검은 기사에게서 되찾은 보물.'),
  item('acc-travel','여행자의 부적','accessory',everyone,{},'원정의 시작을 기억하는 부적.'),
  item('acc-moon','달빛 목걸이','accessory',everyone,{mpDiscount:1},'스킬 소모 MP -1, 최소 1.'),
  item('acc-swift','질풍 부츠','accessory',everyone,{move:1,defense:-1},'방어력 -1, 이동력 +1.'),
  item('acc-heal','생명의 브로치','accessory',everyone,{healing:5},'치유 스킬 회복량 +5.'),
  item('acc-guard','수호의 반지','accessory',everyone,{defense:2},'동료를 지키는 작은 반지.'),
  item('acc-focus','집중의 수정','accessory',everyone,{attack:2},'다리 전투의 첫 승리 보상.'),
];
export const GEAR = Object.fromEntries(EQUIPMENT.map(g=>[g.id,g])) as Record<string,Equipment>;
export const SLOTS: Slot[] = ['weapon','armor','accessory'];
export const SLOT_LABEL: Record<Slot,string> = {weapon:'무기',armor:'방어구',accessory:'장신구'};
export const START_GEAR = ['sword-start','spear-start','mage-start','healer-start','armor-cloth','acc-travel'];
export type Loadout = Partial<Record<Slot,string>>;
export interface Treasure extends Point { id: string; name: string; items: string[]; potions: number; }
export const TREASURES: Treasure[][] = [
  [ {id:'forest-road',name:'다리 앞 상자',x:3,y:5,items:['sword-iron'],potions:1}, {id:'forest-detour',name:'숲 가장자리 상자',x:0,y:8,items:['mage-ember','armor-leather'],potions:0}, {id:'forest-high',name:'궁수 고지 상자',x:9,y:1,items:['spear-oak','acc-moon'],potions:0} ],
  [ {id:'hill-road',name:'언덕길 상자',x:4,y:5,items:['healer-heal'],potions:1}, {id:'hill-detour',name:'성벽 아래 상자',x:3,y:9,items:['armor-mail','acc-swift'],potions:0}, {id:'hill-high',name:'망루 옆 상자',x:10,y:2,items:['sword-star','mage-flame'],potions:0} ],
  [ {id:'tower-road',name:'뜰 입구 상자',x:4,y:4,items:['spear-wind','armor-robe'],potions:0}, {id:'tower-detour',name:'외곽 정원 상자',x:2,y:9,items:['acc-heal','armor-spell'],potions:0}, {id:'tower-high',name:'봉인 뒤 상자',x:10,y:5,items:['healer-dawn','acc-guard'],potions:0} ],
];
export const ALL_CHEST_IDS = TREASURES.flat().map(t=>t.id);
