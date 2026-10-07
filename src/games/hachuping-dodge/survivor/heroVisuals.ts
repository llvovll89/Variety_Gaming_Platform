import { WEAPONS, type Hero, type Loadout } from './world';

/** Stable hero identity; clothing choices alter trim instead of repainting every hero. */
export const HERO_VISUALS: Record<Hero,{color:string;light:string;cloth:string;shade:string;role:string;effect:string}> = {
  ranger:{color:'#9dca94',light:'#e3efcd',cloth:'#426048',shade:'#253c30',role:'기동 · 정밀 사격',effect:'나뭇잎 궤적과 초록 룬탄'},
  knight:{color:'#e2bc78',light:'#fff0c7',cloth:'#43597b',shade:'#283952',role:'방어 · 근접 전투',effect:'황금 참격과 방패 문양'},
  witch:{color:'#bba5ee',light:'#ede5ff',cloth:'#655282',shade:'#382d51',role:'마력 · 광역 제어',effect:'별 결정과 마법진'},
  robot:{color:'#e89b6c',light:'#ffe3b4',cloth:'#8e5840',shade:'#4b352c',role:'연사 · 기계 지원',effect:'주황 불꽃과 금속 파편'},
  assassin:{color:'#de9eb9',light:'#ffe0ef',cloth:'#70445c',shade:'#292733',role:'기동 · 연속 참격',effect:'자홍 초승달과 잔상 칼날'},
  storm:{color:'#8ecbe9',light:'#def5ff',cloth:'#3e7089',shade:'#263e56',role:'관통 · 번개 타격',effect:'푸른 번개와 전기 궤적'},
};

export function heroWeaponName(loadout:Loadout) {
  if(loadout.hero==='witch'&&loadout.weapon==='laser')return '별빛 지팡이';
  if(loadout.hero==='storm'&&loadout.weapon==='laser')return '뇌전창';
  if(loadout.hero==='assassin'&&loadout.weapon==='sword')return '월영 쌍검';
  if(loadout.hero==='robot'&&loadout.weapon==='shotgun')return '중장 산탄포';
  return WEAPONS[loadout.weapon].name;
}
