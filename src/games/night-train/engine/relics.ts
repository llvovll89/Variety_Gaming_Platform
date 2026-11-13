export interface RelicDef {
  id: string;
  name: string;
  desc: string;
  icon: 'lantern' | 'thermos' | 'glove' | 'candy' | 'scarf' | 'cap' | 'bell' | 'coal' | 'flint' | 'compass' | 'ticket' | 'watch';
  starter?: boolean;
}

export const RELICS: Record<string, RelicDef> = Object.fromEntries(([
  { id: 'lantern', name: '작은 랜턴', desc: '전투 첫 턴에 카드를 1장 더 뽑습니다.', icon: 'lantern', starter: true },
  { id: 'thermos', name: '따뜻한 보온병', desc: '전투에서 이기면 체력을 5 회복합니다.', icon: 'thermos' },
  { id: 'gloves', name: '검은 가죽 장갑', desc: '전투 시작 시 힘 1을 얻습니다.', icon: 'glove' },
  { id: 'candy', name: '별사탕 병', desc: '전투 시작 시 방어 10을 얻습니다.', icon: 'candy' },
  { id: 'scarf', name: '붉은 목도리', desc: '전투 시작 시 모든 적에게 취약 1을 겁니다.', icon: 'scarf' },
  { id: 'cap', name: '기관사 모자', desc: '얻을 때 최대 체력 +10, 체력 10 회복.', icon: 'cap' },
  { id: 'bell', name: '고양이 방울', desc: '휴식칸에서 체력을 15 더 회복합니다.', icon: 'bell' },
  { id: 'coal', name: '여분 석탄', desc: '전투 첫 턴에 증기 1을 더 얻습니다.', icon: 'coal' },
  { id: 'flint', name: '부싯돌', desc: '적에게 거는 화상이 1 늘어납니다.', icon: 'flint' },
  { id: 'compass', name: '고장 난 나침반', desc: '매점 가격이 25% 싸집니다.', icon: 'compass' },
  { id: 'ticket', name: '금빛 정기권', desc: '전투 보상 골드가 10 늘어납니다.', icon: 'ticket' },
  { id: 'watch', name: '회중시계', desc: '3번째 턴마다 카드를 2장 더 뽑습니다.', icon: 'watch' },
] satisfies RelicDef[]).map(relic => [relic.id, relic]));

export const RELIC_POOL = Object.values(RELICS).filter(relic => !relic.starter).map(relic => relic.id);
