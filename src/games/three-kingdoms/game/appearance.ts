import type { Officer, OfficerAppearance } from './types';

export function appearanceFor(o: Officer): OfficerAppearance {
  const hash = [...o.id].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7);
  const base: OfficerAppearance = {
    armor: ['#626d79', '#887343', '#364d50', '#604c4b', '#a2a9ad'][hash % 5],
    cloth: ['#344d70', '#77403e', '#325747', '#63516c', '#a18b5e'][Math.floor(hash / 7) % 5],
    skin: ['#c99b79', '#d5b08b', '#b98566'][hash % 3],
    helmet: o.int > o.war + 15 ? 'scholar' : (['helmet', 'crown', 'plume'] as const)[hash % 3],
    weapon: o.int > o.war + 20 ? 'fan' : (['spear', 'blade', 'sword', 'bow'] as const)[hash % 4],
    beard: ((hash >>> 12) % 11) / 10,
    build: Math.round((0.8 + ((hash >>> 8) % 15) * 0.05) * 100) / 100,
  };
  const signatures: Record<string, Partial<OfficerAppearance>> = {
    zhugeliang: { cloth: '#ddd9c8', armor: '#b8b6ab', helmet: 'scholar', weapon: 'fan', beard: .8, build: .9 },
    pangtong: { cloth: '#695b44', helmet: 'scholar', weapon: 'fan', beard: .5, build: 1.1 },
    simayi: { cloth: '#31323c', armor: '#555767', helmet: 'scholar', weapon: 'fan', beard: .7 },
    machao: { cloth: '#d2c9b5', armor: '#c0c7d0', helmet: 'plume', weapon: 'spear', beard: .1, build: 1.15 },
    huangyueying: { cloth: '#ded7b1', helmet: 'scholar', weapon: 'fan', beard: 0, build: .8 },
    wangyi: { cloth: '#46566c', helmet: 'crown', weapon: 'sword', beard: 0, build: .85 },
    zhurong: { cloth: '#963d2e', armor: '#8c6c43', helmet: 'plume', weapon: 'blade', beard: 0, build: 1 },
    zhangchunhua: { cloth: '#635674', helmet: 'crown', weapon: 'fan', beard: 0, build: .8 },
    guanyu: { cloth: '#24563c', armor: '#816d37', skin: '#ac654d', beard: 1, weapon: 'blade', helmet: 'crown', build: 1.2 },
    zhangfei: { cloth: '#3b3632', armor: '#43434b', beard: 0.8, weapon: 'spear', build: 1.3 },
    lubu: { cloth: '#902f36', armor: '#b09958', helmet: 'plume', weapon: 'blade', beard: 0.1, build: 1.25 },
    zhaoyun: { cloth: '#d5dce0', armor: '#b5c5cf', helmet: 'helmet', weapon: 'spear', beard: 0, build: 1 },
    caocao: { cloth: '#343c66', armor: '#9b8451', helmet: 'crown', weapon: 'sword', beard: 0.5 },
    liubei: { cloth: '#4d7550', armor: '#a58b4c', helmet: 'crown', weapon: 'sword', beard: 0.4 },
    dianwei: { armor: '#66554a', cloth: '#66402f', build: 1.4, beard: 0.5, weapon: 'blade' },
    xuchu: { armor: '#5c6269', cloth: '#746344', build: 1.45, beard: 0.2, weapon: 'blade' },
    huangzhong: { beard: 1, armor: '#977f4b', cloth: '#a0813a', weapon: 'bow' },
    zhouyu: { armor: '#b0b9c0', cloth: '#96464a', beard: 0, weapon: 'sword' },
    sunce: { armor: '#b09059', cloth: '#923d32', beard: 0, weapon: 'spear' },
  };
  return { ...base, ...signatures[o.id], ...o.appearance };
}
