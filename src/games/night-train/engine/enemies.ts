import type { EnemyMove, EnemyState } from './types';

export interface EnemyDef {
  id: string;
  name: string;
  kind: 'normal' | 'elite' | 'boss';
  hp: [number, number];
  moves: Record<string, EnemyMove>;
  /** Picks the next move. `roll` is a 0..1 random number supplied by the engine. */
  next: (self: EnemyState, roll: number) => string;
  blurb: string;
}

const lastTwo = (self: EnemyState, id: string) => self.history.length >= 2 && self.history.slice(-2).every(h => h === id);
const cycle = (order: string[]) => (self: EnemyState) => order[self.history.length % order.length];

export const ENEMIES: Record<string, EnemyDef> = {
  'soot-rat': {
    id: 'soot-rat', name: '검댕 쥐', kind: 'normal', hp: [12, 15],
    blurb: '석탄 더미에서 태어난 까만 쥐. 빵 부스러기를 노린다.',
    moves: {
      bite: { id: 'bite', name: '앞니 물기', intent: 'attack', effects: [{ k: 'attack', n: 6 }] },
      scratch: { id: 'scratch', name: '검댕 할퀴기', intent: 'attack-debuff', effects: [{ k: 'attack', n: 4 }, { k: 'debuff', status: 'weak', n: 1 }] },
    },
    next: (self, roll) => {
      const choice = roll < 0.6 ? 'bite' : 'scratch';
      return lastTwo(self, choice) ? (choice === 'bite' ? 'scratch' : 'bite') : choice;
    },
  },
  ticketless: {
    id: 'ticketless', name: '무임승차 유령', kind: 'normal', hp: [20, 24],
    blurb: '표 없이 탄 지 백 년째. 검사만 하면 으스스해진다.',
    moves: {
      spook: { id: 'spook', name: '으스스한 속삭임', intent: 'debuff', effects: [{ k: 'debuff', status: 'vulnerable', n: 2 }] },
      chill: { id: 'chill', name: '차가운 손', intent: 'attack', effects: [{ k: 'attack', n: 8 }] },
    },
    next: cycle(['spook', 'chill', 'chill']),
  },
  moth: {
    id: 'moth', name: '등불나방', kind: 'normal', hp: [9, 12],
    blurb: '랜턴 불빛을 좋아해서 늘 무리 지어 날아든다.',
    moves: {
      dust: { id: 'dust', name: '인분 날리기', intent: 'attack-debuff', effects: [{ k: 'attack', n: 3 }, { k: 'debuff', status: 'burn', n: 2 }] },
      flutter: { id: 'flutter', name: '날갯짓 박치기', intent: 'attack', effects: [{ k: 'attack', n: 5 }] },
    },
    next: (self, roll) => (self.history.at(-1) === 'dust' || roll < 0.55 ? 'flutter' : 'dust'),
  },
  'rust-doll': {
    id: 'rust-doll', name: '녹슨 태엽인형', kind: 'normal', hp: [26, 30],
    blurb: '장난감 칸에서 탈출했다. 태엽을 감을수록 세진다.',
    moves: {
      wind: { id: 'wind', name: '태엽 감기', intent: 'defend-buff', effects: [{ k: 'block', n: 6 }, { k: 'buff', status: 'strength', n: 2 }] },
      punch: { id: 'punch', name: '태엽 주먹', intent: 'attack', effects: [{ k: 'attack', n: 9 }] },
    },
    next: cycle(['wind', 'punch', 'punch']),
  },
  inspector: {
    id: 'inspector', name: '그림자 검표원', kind: 'normal', hp: [34, 38],
    blurb: '진짜 검표원의 그림자가 혼자 일을 시작했다.',
    moves: {
      fine: { id: 'fine', name: '벌금 딱지', intent: 'attack', effects: [{ k: 'attack', n: 5, times: 2 }] },
      whistle: { id: 'whistle', name: '날카로운 호루라기', intent: 'debuff', effects: [{ k: 'debuff', status: 'weak', n: 2 }, { k: 'debuff', status: 'vulnerable', n: 1 }] },
      stamp: { id: 'stamp', name: '도장 찍기', intent: 'attack', effects: [{ k: 'attack', n: 12 }] },
    },
    next: (self, roll) => {
      if (self.history.length === 0) return 'whistle';
      if (self.history.at(-1) === 'whistle') return 'stamp';
      return roll < 0.25 ? 'whistle' : roll < 0.65 ? 'fine' : 'stamp';
    },
  },

  'boiler-golem': {
    id: 'boiler-golem', name: '보일러 골렘', kind: 'elite', hp: [72, 76],
    blurb: '기관실의 보일러가 몸을 일으켰다. 달아오를수록 무섭다.',
    moves: {
      heat: { id: 'heat', name: '열기 충전', intent: 'defend-buff', effects: [{ k: 'block', n: 12 }, { k: 'buff', status: 'strength', n: 3 }] },
      slam: { id: 'slam', name: '쇳덩이 주먹', intent: 'attack', effects: [{ k: 'attack', n: 15 }] },
      flurry: { id: 'flurry', name: '증기 연타', intent: 'attack', effects: [{ k: 'attack', n: 6, times: 2 }] },
    },
    next: cycle(['slam', 'heat', 'flurry', 'slam', 'heat', 'flurry']),
  },
  'fog-witch': {
    id: 'fog-witch', name: '안개 마녀', kind: 'elite', hp: [56, 60],
    blurb: '창문에 낀 안개 속에서 걸어 나왔다. 저주가 특기.',
    moves: {
      curse: { id: 'curse', name: '안개 저주', intent: 'debuff', effects: [{ k: 'debuff', status: 'weak', n: 2 }, { k: 'debuff', status: 'vulnerable', n: 2 }] },
      embers: { id: 'embers', name: '도깨비불', intent: 'attack-debuff', effects: [{ k: 'attack', n: 5 }, { k: 'debuff', status: 'burn', n: 4 }] },
      spear: { id: 'spear', name: '그림자 창', intent: 'attack', effects: [{ k: 'attack', n: 14 }] },
    },
    next: (self, roll) => {
      if (self.history.length === 0) return 'curse';
      const last = self.history.at(-1);
      if (last === 'curse') return 'spear';
      if (self.history.length % 4 === 0) return 'curse';
      return last === 'embers' ? 'spear' : roll < 0.5 ? 'embers' : 'spear';
    },
  },
  'twin-lamp': {
    id: 'twin-lamp', name: '쌍둥이 램프', kind: 'elite', hp: [30, 33],
    blurb: '언제나 둘이 함께 깜빡인다. 서로를 밝혀 준다.',
    moves: {
      glare: { id: 'glare', name: '눈부신 불빛', intent: 'attack', effects: [{ k: 'attack', n: 8 }] },
      shine: { id: 'shine', name: '서로 비추기', intent: 'defend-buff', effects: [{ k: 'blockAll', n: 5 }, { k: 'buffAll', status: 'strength', n: 1 }] },
    },
    next: (self, roll) => {
      if (self.history.length === 0) return self.uid % 2 === 0 ? 'glare' : 'shine';
      if (self.history.at(-1) === 'shine') return 'glare';
      return roll < 0.35 ? 'shine' : 'glare';
    },
  },

  'black-engine': {
    id: 'black-engine', name: '새벽을 삼킨 검은 기관차', kind: 'boss', hp: [170, 170],
    blurb: '종착역 직전, 새벽을 막아선 거대한 기관차. 연기가 별빛을 가린다.',
    moves: {
      smog: { id: 'smog', name: '검은 매연', intent: 'debuff', effects: [{ k: 'debuff', status: 'weak', n: 2 }, { k: 'debuff', status: 'burn', n: 3 }] },
      charge: { id: 'charge', name: '전속력 돌진', intent: 'attack', effects: [{ k: 'attack', n: 22 }] },
      horns: { id: 'horns', name: '경적 연타', intent: 'attack', effects: [{ k: 'attack', n: 6, times: 3 }] },
      stoke: { id: 'stoke', name: '보일러 점화', intent: 'defend-buff', effects: [{ k: 'block', n: 14 }, { k: 'buff', status: 'strength', n: 2 }] },
      rampage: { id: 'rampage', name: '폭주', intent: 'defend-buff', effects: [{ k: 'block', n: 20 }, { k: 'buff', status: 'strength', n: 3 }] },
    },
    next: self => {
      if (self.enraged && !self.history.includes('rampage')) return 'rampage';
      const order = ['smog', 'charge', 'horns', 'stoke'];
      const regular = self.history.filter(h => h !== 'rampage').length;
      return order[regular % order.length];
    },
  },
};

export const ENCOUNTERS: Record<'easy' | 'normal' | 'elite' | 'boss', string[][]> = {
  easy: [['soot-rat', 'soot-rat'], ['ticketless'], ['moth', 'moth']],
  normal: [['rust-doll'], ['soot-rat', 'ticketless'], ['moth', 'moth', 'moth'], ['inspector'], ['rust-doll', 'soot-rat'], ['ticketless', 'moth']],
  elite: [['boiler-golem'], ['fog-witch'], ['twin-lamp', 'twin-lamp']],
  boss: [['black-engine']],
};

export const INTENT_NAMES: Record<EnemyMove['intent'], string> = {
  attack: '공격', defend: '방어', buff: '강화', debuff: '방해', 'attack-debuff': '공격 + 방해', 'attack-defend': '공격 + 방어', 'defend-buff': '방어 + 강화',
};
