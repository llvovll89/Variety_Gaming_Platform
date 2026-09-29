// Fictional game balance and dialogue; tiles are ordered left-to-right, top-to-bottom.
export const EXPANSION_HEROES = [
  { key: 'xushu', name: '서서', title: '검을 거둔 지략가', faction: '촉', role: '책사', quote: '칼보다 먼저 형세를 살피겠습니다.', stats: [82, 64, 96, 81], tile: 0 },
  { key: 'fazheng', name: '법정', title: '한중의 묘책', faction: '촉', role: '책사', quote: '적이 믿는 안전한 길이 우리의 기회입니다.', stats: [79, 31, 95, 84], tile: 1 },
  { key: 'guanping', name: '관평', title: '의기를 잇는 칼', faction: '촉', role: '무장', quote: '물려받은 의리는 끝까지 지키겠습니다.', stats: [78, 85, 62, 56], tile: 2 },
  { key: 'caoren', name: '조인', title: '흔들리지 않는 성벽', faction: '위', role: '지휘관', quote: '이 성에 우리 깃발이 있는 한 물러서지 않는다.', stats: [90, 86, 67, 58], tile: 3 },
  { key: 'jiaxu', name: '가후', title: '침묵 속의 승부수', faction: '위', role: '책사', quote: '승산이 보이면 한 수면 충분하지요.', stats: [76, 29, 97, 86], tile: 4 },
  { key: 'pangde', name: '방덕', title: '백마의 결의', faction: '위', role: '기장', quote: '이 돌격에 나의 모든 것을 걸겠다.', stats: [82, 94, 55, 44], tile: 5 },
  { key: 'lusu', name: '노숙', title: '동맹을 잇는 지혜', faction: '오', role: '내정관', quote: '함께 걸을 길을 찾는 것도 승리입니다.', stats: [80, 46, 92, 96], tile: 6 },
  { key: 'taishici', name: '태사자', title: '동래의 명궁', faction: '오', role: '궁장', quote: '약속한 곳에는 반드시 이 화살이 닿는다.', stats: [86, 95, 65, 57], tile: 7 },
  { key: 'zhoutai', name: '주태', title: '상처로 지킨 충의', faction: '오', role: '무장', quote: '상처는 남아도 주군을 지킨 뜻은 꺾이지 않는다.', stats: [79, 91, 48, 40], tile: 8 },
  { key: 'dongzhuo', name: '동탁', title: '서량의 폭풍', faction: '군웅', role: '지휘관', quote: '천하의 길목을 이 손에 움켜쥐겠다.', stats: [83, 88, 62, 39], tile: 9 },
  { key: 'zhangjiao', name: '장각', title: '황천의 깃발', faction: '군웅', role: '책사', quote: '새로운 세상을 바라는 마음을 하나로 모아라.', stats: [81, 37, 91, 82], tile: 10 },
  { key: 'menghuo', name: '맹획', title: '남중의 왕', faction: '군웅', role: '무장', quote: '우리 산과 강은 우리가 지킨다.', stats: [82, 91, 43, 60], tile: 11 },
] as const;
