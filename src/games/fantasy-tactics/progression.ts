import type { Role, Skill, Unit } from './game';

export const PROMOTION_LEVEL = 3, HIDDEN_LEVEL = 5;
export const JOBS: Partial<Record<Role, { novice: string; promoted: string; hidden: Skill }>> = {
  ranger:{novice:'견습 궁수',promoted:'별숲 추적자',hidden:{name:'별비',cost:8,range:5,shape:'cross',effect:'damage',power:2,description:'십자 범위에 별빛 화살을 쏟아낸다.'}},
  rogue:{novice:'견습 도적',promoted:'월영 암살자',hidden:{name:'그림자 춤',cost:8,range:3,shape:'cross',effect:'damage',power:2.2,description:'십자 범위의 적을 그림자 검으로 벤다.'}},
  sword: { novice: '견습 검사', promoted: '별빛 기사', hidden: { name: '유성검', cost: 8, range: 3, shape: 'cross', effect: 'damage', power: 2.1, description: '별빛을 내려 십자 범위의 적을 벤다. Lv.5 전직자 전용.' } },
  spear: { novice: '수습 창병', promoted: '여명 용기사', hidden: { name: '용의 포효', cost: 8, range: 3, shape: 'cross', effect: 'damage', power: 2, description: '용의 기운으로 십자 범위를 공격한다. Lv.5 전직자 전용.' } },
  mage: { novice: '마법 견습생', promoted: '홍련 현자', hidden: { name: '초신성', cost: 10, range: 5, shape: 'cross', effect: 'damage', power: 2.5, description: '강력한 별의 폭발로 십자 범위를 공격한다. Lv.5 전직자 전용.' } },
  healer: { novice: '수습 치유사', promoted: '별의 사제', hidden: { name: '별빛의 기적', cost: 9, range: 5, shape: 'cross', effect: 'heal', power: 48, description: '십자 범위의 동료를 크게 치유한다. Lv.5 전직자 전용.' } },
};
export function jobName(u: Unit) { const job = JOBS[u.role]; return job ? u.promoted ? job.promoted : job.novice : ''; }
