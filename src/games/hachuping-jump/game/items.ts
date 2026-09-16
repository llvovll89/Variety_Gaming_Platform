export type ItemKind = 'shield' | 'magnet' | 'double' | 'slow' | 'heart' | 'gem';
export const ITEMS: Record<ItemKind, { name: string; symbol: string; color: string; description: string }> = {
  shield: { name: '무적 방울', symbol: '◇', color: '#1593ad', description: '6초 충돌 보호' },
  magnet: { name: '별 자석', symbol: 'U', color: '#c54e8b', description: '8초 별 끌어오기' },
  double: { name: '쌍둥이 별', symbol: '×2', color: '#b77a12', description: '8초 별·통과 점수 2배' },
  slow: { name: '시간 사탕', symbol: '◷', color: '#6a66c4', description: '6초 장애물 속도 감소' },
  heart: { name: '하트 쿠션', symbol: '♥', color: '#dd5876', description: '충돌 1회 방어 · 최대 1개' },
  gem: { name: '별빛 보석', symbol: '◆', color: '#258a72', description: '즉시 50점 획득' },
};
export const ITEM_ORDER: ItemKind[] = ['shield', 'double', 'magnet', 'slow', 'heart', 'gem'];
