import type { CardDef, CardInstance, CardStats, Effect, StatusId } from './types';

export const STATUS_INFO: Record<StatusId, { name: string; desc: string; debuff: boolean }> = {
  strength: { name: '힘', desc: '공격 피해가 수치만큼 늘어납니다.', debuff: false },
  weak: { name: '약화', desc: '주는 공격 피해가 25% 줄어듭니다. 턴이 끝날 때 1 줄어듭니다.', debuff: true },
  vulnerable: { name: '취약', desc: '받는 공격 피해가 50% 늘어납니다. 턴이 끝날 때 1 줄어듭니다.', debuff: true },
  burn: { name: '화상', desc: '자기 턴 시작에 수치만큼 피해를 받고 1 줄어듭니다. 방어를 무시합니다.', debuff: true },
  thorns: { name: '가시', desc: '공격받을 때마다 공격자에게 수치만큼 피해를 줍니다.', debuff: false },
  plating: { name: '철갑', desc: '턴이 끝날 때 수치만큼 방어를 얻습니다.', debuff: false },
  drawUp: { name: '시간표', desc: '턴 시작에 카드를 수치만큼 더 뽑습니다.', debuff: false },
  kindle: { name: '불꽃 엔진', desc: '턴 시작에 모든 적에게 화상을 수치만큼 겁니다.', debuff: false },
};

const card = (def: CardDef) => def;

/** Original card set. Numbers follow the usual deckbuilder budget: ~6 damage or ~5 block per energy. */
export const CARDS: Record<string, CardDef> = Object.fromEntries([
  // Starter
  card({ id: 'punch', name: '개찰 펀치', type: 'attack', rarity: 'starter', cost: 1, effects: [{ k: 'attack', n: 6 }], up: { effects: [{ k: 'attack', n: 9 }] }, flavor: '딸깍! 표 검사는 확실하게.' }),
  card({ id: 'coat', name: '외투 여미기', type: 'skill', rarity: 'starter', cost: 1, effects: [{ k: 'block', n: 5 }], up: { effects: [{ k: 'block', n: 8 }] }, flavor: '밤바람은 차갑지만 외투는 두껍다.' }),
  card({ id: 'lantern-flash', name: '랜턴 비추기', type: 'attack', rarity: 'starter', cost: 2, effects: [{ k: 'attack', n: 8 }, { k: 'apply', status: 'vulnerable', n: 2, to: 'target' }], up: { effects: [{ k: 'attack', n: 10 }, { k: 'apply', status: 'vulnerable', n: 3, to: 'target' }] }, flavor: '그림자는 빛 앞에서 흔들린다.' }),

  // Common attacks
  card({ id: 'double-punch', name: '연속 개찰', type: 'attack', rarity: 'common', cost: 1, effects: [{ k: 'attack', n: 4, times: 2 }], up: { effects: [{ k: 'attack', n: 6, times: 2 }] }, flavor: '왕복표는 두 번 찍는다.' }),
  card({ id: 'whistle', name: '출발 기적', type: 'attack', rarity: 'common', cost: 1, effects: [{ k: 'attackAll', n: 5 }], up: { effects: [{ k: 'attackAll', n: 8 }] }, flavor: '뿌우— 객차 전체가 울린다.' }),
  card({ id: 'sudden-stop', name: '급정거', type: 'attack', rarity: 'common', cost: 1, effects: [{ k: 'attack', n: 7 }, { k: 'draw', n: 1 }], up: { effects: [{ k: 'attack', n: 10 }, { k: 'draw', n: 1 }] }, flavor: '모두 손잡이를 꽉 잡으세요!' }),
  card({ id: 'spark', name: '레일 불꽃', type: 'attack', rarity: 'common', cost: 0, effects: [{ k: 'attack', n: 4 }], up: { effects: [{ k: 'attack', n: 7 }] }, flavor: '바퀴 아래에서 튄 작은 별.' }),
  card({ id: 'gust', name: '창문 돌풍', type: 'attack', rarity: 'common', cost: 1, effects: [{ k: 'attack', n: 6 }, { k: 'apply', status: 'weak', n: 1, to: 'target' }], up: { effects: [{ k: 'attack', n: 8 }, { k: 'apply', status: 'weak', n: 2, to: 'target' }] }, flavor: '창문을 열면 바람이 대신 싸워 준다.' }),
  card({ id: 'ember-toss', name: '불씨 던지기', type: 'attack', rarity: 'common', cost: 1, effects: [{ k: 'attack', n: 3 }, { k: 'apply', status: 'burn', n: 4, to: 'target' }], up: { effects: [{ k: 'attack', n: 4 }, { k: 'apply', status: 'burn', n: 6, to: 'target' }] }, flavor: '보일러에서 슬쩍 빌려 온 불씨.' }),
  card({ id: 'trunk-swing', name: '트렁크 휘두르기', type: 'attack', rarity: 'common', cost: 2, effects: [{ k: 'attack', n: 13 }], up: { effects: [{ k: 'attack', n: 18 }] }, flavor: '분실물이지만 쓸모는 있다.' }),

  // Common skills
  card({ id: 'umbrella', name: '우산 펼치기', type: 'skill', rarity: 'common', cost: 1, effects: [{ k: 'block', n: 8 }], up: { effects: [{ k: 'block', n: 11 }] }, flavor: '비 대신 주먹을 막는 중.' }),
  card({ id: 'blanket', name: '포근한 담요', type: 'skill', rarity: 'common', cost: 1, effects: [{ k: 'block', n: 5 }, { k: 'draw', n: 1 }], up: { effects: [{ k: 'block', n: 8 }, { k: 'draw', n: 1 }] }, flavor: '침대칸에서 챙겨 온 담요.' }),
  card({ id: 'timetable', name: '시간표 확인', type: 'skill', rarity: 'common', cost: 1, effects: [{ k: 'draw', n: 2 }], up: { cost: 0 }, flavor: '다음 역까지 남은 시간을 계산한다.' }),
  card({ id: 'coffee', name: '식당칸 커피', type: 'skill', rarity: 'common', cost: 0, effects: [{ k: 'energy', n: 1 }, { k: 'draw', n: 1 }], exhaust: true, up: { effects: [{ k: 'energy', n: 2 }, { k: 'draw', n: 1 }] }, flavor: '쓰지만 눈이 번쩍 뜨인다.' }),
  card({ id: 'fog-window', name: '김 서린 창문', type: 'skill', rarity: 'common', cost: 1, effects: [{ k: 'block', n: 4 }, { k: 'apply', status: 'weak', n: 2, to: 'target' }], up: { effects: [{ k: 'block', n: 6 }, { k: 'apply', status: 'weak', n: 3, to: 'target' }] }, flavor: '상대가 흐릿한 창 너머로 헛손질한다.' }),

  // Uncommon
  card({ id: 'steam-blast', name: '증기 분사', type: 'attack', rarity: 'uncommon', cost: 2, effects: [{ k: 'attackAll', n: 7 }, { k: 'apply', status: 'burn', n: 3, to: 'all' }], up: { effects: [{ k: 'attackAll', n: 10 }, { k: 'apply', status: 'burn', n: 4, to: 'all' }] }, flavor: '칙— 객차가 하얗게 덮인다.' }),
  card({ id: 'luggage-slam', name: '짐더미 밀치기', type: 'attack', rarity: 'uncommon', cost: 1, effects: [{ k: 'blockAttack' }], up: { cost: 0 }, flavor: '쌓아 둔 방어가 그대로 무기가 된다.' }),
  card({ id: 'shooting-star', name: '별똥별 슛', type: 'attack', rarity: 'uncommon', cost: 1, effects: [{ k: 'attack', n: 3, times: 3 }], up: { effects: [{ k: 'attack', n: 4, times: 3 }] }, flavor: '창밖의 별이 세 번 반짝였다.' }),
  card({ id: 'brake-lever', name: '비상 브레이크', type: 'skill', rarity: 'uncommon', cost: 1, effects: [{ k: 'block', n: 6 }, { k: 'apply', status: 'weak', n: 1, to: 'all' }], up: { effects: [{ k: 'block', n: 9 }, { k: 'apply', status: 'weak', n: 2, to: 'all' }] }, flavor: '끼이익— 모두가 균형을 잃는다.' }),
  card({ id: 'first-aid', name: '구급 상자', type: 'skill', rarity: 'uncommon', cost: 1, effects: [{ k: 'heal', n: 6 }], exhaust: true, up: { effects: [{ k: 'heal', n: 9 }] }, flavor: '반창고는 별 모양이다.' }),
  card({ id: 'luggage-wall', name: '짐칸 바리케이드', type: 'skill', rarity: 'uncommon', cost: 2, effects: [{ k: 'block', n: 14 }], up: { effects: [{ k: 'block', n: 19 }] }, flavor: '여행 가방 열두 개면 충분하다.' }),
  card({ id: 'focus', name: '숨 고르기', type: 'skill', rarity: 'uncommon', cost: 1, effects: [{ k: 'block', n: 3 }, { k: 'apply', status: 'strength', n: 1, to: 'self' }], up: { effects: [{ k: 'block', n: 5 }, { k: 'apply', status: 'strength', n: 2, to: 'self' }] }, flavor: '덜컹, 덜컹. 박자에 맞춰 숨을 쉰다.' }),
  card({ id: 'iron-coat', name: '철갑 외투', type: 'power', rarity: 'uncommon', cost: 1, effects: [{ k: 'apply', status: 'plating', n: 3, to: 'self' }], up: { effects: [{ k: 'apply', status: 'plating', n: 5, to: 'self' }] }, flavor: '안감에 기차 부품을 덧댔다.' }),
  card({ id: 'barbed-wire', name: '가시 울타리', type: 'power', rarity: 'uncommon', cost: 1, effects: [{ k: 'apply', status: 'thorns', n: 3, to: 'self' }], up: { effects: [{ k: 'apply', status: 'thorns', n: 5, to: 'self' }] }, flavor: '손대면 따끔합니다.' }),
  card({ id: 'rhythm', name: '기관사의 리듬', type: 'power', rarity: 'uncommon', cost: 1, effects: [{ k: 'apply', status: 'strength', n: 2, to: 'self' }], up: { effects: [{ k: 'apply', status: 'strength', n: 3, to: 'self' }] }, flavor: '칙칙폭폭이 곧 박자다.' }),

  // Rare
  card({ id: 'last-train', name: '막차 일격', type: 'attack', rarity: 'rare', cost: 3, effects: [{ k: 'attack', n: 30 }], up: { effects: [{ k: 'attack', n: 40 }] }, flavor: '놓치면 다음은 없다.' }),
  card({ id: 'coal-burst', name: '석탄 폭발', type: 'attack', rarity: 'rare', cost: 2, effects: [{ k: 'attackAll', n: 12 }, { k: 'apply', status: 'vulnerable', n: 2, to: 'all' }], up: { effects: [{ k: 'attackAll', n: 16 }, { k: 'apply', status: 'vulnerable', n: 2, to: 'all' }] }, flavor: '삽 한 가득, 펑!' }),
  card({ id: 'boiler', name: '보일러 과열', type: 'power', rarity: 'rare', cost: 2, effects: [{ k: 'apply', status: 'drawUp', n: 1, to: 'self' }], up: { cost: 1 }, flavor: '압력계 바늘이 빨간 칸을 넘었다.' }),
  card({ id: 'fire-engine', name: '불꽃 엔진', type: 'power', rarity: 'rare', cost: 1, effects: [{ k: 'apply', status: 'kindle', n: 2, to: 'self' }], up: { effects: [{ k: 'apply', status: 'kindle', n: 3, to: 'self' }] }, flavor: '엔진이 돌 때마다 불씨가 흩날린다.' }),
  card({ id: 'starlight', name: '별빛 축복', type: 'skill', rarity: 'rare', cost: 0, effects: [{ k: 'energy', n: 2 }, { k: 'draw', n: 2 }], exhaust: true, up: { effects: [{ k: 'energy', n: 3 }, { k: 'draw', n: 2 }] }, flavor: '창밖의 은하수가 손바닥에 내려앉았다.' }),
  card({ id: 'fortress', name: '강철 객차', type: 'skill', rarity: 'rare', cost: 2, effects: [{ k: 'block', n: 20 }, { k: 'apply', status: 'thorns', n: 2, to: 'self' }], up: { effects: [{ k: 'block', n: 26 }, { k: 'apply', status: 'thorns', n: 3, to: 'self' }] }, flavor: '이 칸은 무엇도 뚫을 수 없다.' }),
].map(def => [def.id, def]));

export const STARTER_DECK = ['punch', 'punch', 'punch', 'punch', 'punch', 'coat', 'coat', 'coat', 'coat', 'lantern-flash'];

export function cardStats(card: CardInstance): CardStats & CardDef {
  const def = CARDS[card.id];
  if (!card.up) return def;
  return { ...def, ...def.up, effects: def.up.effects ?? def.effects, exhaust: def.up.exhaust ?? def.exhaust };
}

export function cardName(card: CardInstance) {
  return CARDS[card.id].name + (card.up ? '+' : '');
}

export function needsTarget(card: CardInstance) {
  return cardStats(card).effects.some(e => e.k === 'attack' || e.k === 'blockAttack' || (e.k === 'apply' && e.to === 'target'));
}

export function canUpgrade(card: CardInstance) {
  return !card.up;
}

export interface DescribeContext {
  /** Final per-hit damage for a base value, once strength, weak and vulnerable are applied. */
  damage?: (base: number) => number;
  block?: number;
}

function line(effect: Effect, ctx: DescribeContext): string {
  const dmg = (n: number) => (ctx.damage ? ctx.damage(n) : n);
  switch (effect.k) {
    case 'attack': return effect.times && effect.times > 1 ? `피해 ${dmg(effect.n)} × ${effect.times}` : `피해 ${dmg(effect.n)}`;
    case 'attackAll': return `모든 적에게 피해 ${dmg(effect.n)}`;
    case 'damageAll': return `모든 적에게 피해 ${effect.n}`;
    case 'blockAttack': return ctx.block === undefined ? '현재 방어만큼 피해' : `현재 방어만큼 피해 (${dmg(ctx.block)})`;
    case 'block': return `방어 ${effect.n}`;
    case 'draw': return `카드 ${effect.n}장 뽑기`;
    case 'energy': return `에너지 ${effect.n} 얻기`;
    case 'heal': return `체력 ${effect.n} 회복`;
    case 'apply': {
      const name = STATUS_INFO[effect.status].name;
      if (effect.to === 'self') {
        if (effect.status === 'plating') return `매 턴 끝에 방어 ${effect.n}`;
        if (effect.status === 'thorns') return `가시 ${effect.n} (공격받으면 반격)`;
        if (effect.status === 'drawUp') return `매 턴 카드 ${effect.n}장 더 뽑기`;
        if (effect.status === 'kindle') return `매 턴 모든 적에게 화상 ${effect.n}`;
        return `${name} +${effect.n}`;
      }
      return effect.to === 'all' ? `모든 적에게 ${name} ${effect.n}` : `${name} ${effect.n}`;
    }
  }
}

export function describeCard(card: CardInstance, ctx: DescribeContext = {}): string[] {
  const stats = cardStats(card);
  const lines = stats.effects.map(e => line(e, ctx));
  if (stats.type === 'power') lines.push('전투 내내 유지');
  if (stats.exhaust) lines.push('소멸');
  return lines;
}

export const TYPE_NAMES = { attack: '공격', skill: '기술', power: '능력' } as const;
export const RARITY_NAMES = { starter: '기본', common: '일반', uncommon: '고급', rare: '희귀' } as const;
