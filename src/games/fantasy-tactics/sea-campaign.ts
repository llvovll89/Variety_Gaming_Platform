import type { Point, Role, Tile } from './game';

export const SEA_STAGES = [
  { name: '항구에 도착한 검은 돛', place: '루미아 항구 · 갈라진 부두', objective: '항구를 점령한 약탈자들을 모두 물리치세요.', boss: false,
    dialogue: [{speaker:'노아',text:'등대는 켜졌는데 항구에 돌아온 배에는 사람이 없어요. 저 검은 돛이 빛을 가로막고 있어요.'},{speaker:'테오',text:'부두의 낡은 다리는 끊을 수 있어. 모두 건넌 뒤 끊으면 적의 접근을 늦출 수 있겠어.'},{speaker:'리아',text:'마른 풀도 있네. 불을 붙여 적을 몰아낼 수 있지만, 우리도 화상을 입으니 조심하자!'}],
    after: '부두를 되찾자 검은 돛의 배가 홀로 움직였다. 등대가 받은 응답은 바다 한가운데에서 오고 있었다.' },
  { name: '돌아오지 못한 유령선', place: '침묵의 바다 · 유령선 갑판', objective: '유령선장 레벤을 물리치세요.', boss: true,
    dialogue: [{speaker:'리아',text:'갑판 아래에서 별의 기운이 느껴져. 이 배도 길을 잃었던 거야.'},{speaker:'테오',text:'젖은 갑판 끝은 위험해. 적을 밀어 바다로 떨어뜨릴 수 있지만 선장은 버틸 거야.'},{speaker:'아린',text:'선장의 공격 예고를 피하고, 배가 붙잡고 있는 별빛을 풀어 주자.'}],
    after: '레벤의 검이 내려앉자 유령선에 갇힌 불빛들이 밤하늘로 흩어졌다. 남은 별 하나가 먼 섬을 가리켰다.' },
  { name: '별이 떨어진 섬', place: '낙성섬 · 별의 분화구', objective: '별을 삼킨 수호자 아스트라를 물리치세요.', boss: true,
    dialogue: [{speaker:'노아',text:'떨어진 별이 아직 빛나고 있어요. 하지만 그 옆의 수호자가 누구도 가까이 오지 못하게 해요.'},{speaker:'테오',text:'절벽 아래로 밀어내면 낙하 피해를 줄 수 있어. 높은 곳을 잡되, 발밑의 불길도 살펴봐.'},{speaker:'아린',text:'첫 등대에서 여기까지 함께 왔어. 이번에도 우리의 빛으로 길을 열자!'}],
    after: '별의 조각이 하늘로 돌아가자 바다 건너 등대들이 차례로 빛났다. 네 사람은 항구로 돌아왔다. 이제 그 빛은 누구도 혼자 남겨 두지 않았다.' },
] as const;

export const SEA_ENEMIES: [Role,number,number][][] = [
  [['goblin',6,5],['goblin',7,7],['goblin',9,5],['archer',9,3],['archer',10,7],['goblin',8,2]],
  [['goblin',6,4],['goblin',6,7],['archer',8,2],['archer',9,7],['boss',9,4],['goblin',7,5]],
  [['goblin',6,4],['goblin',7,7],['archer',9,2],['archer',10,6],['boss',9,4],['goblin',8,7]],
];

export function seaTile(stage:number,p:Point):Tile {
  const {x,y}=p;
  if(stage===3){const channel=x===5,bridge=channel&&(y===5||y===6);return {...p,height:x>=8&&y<=3?1:0,terrain:bridge?'bridge':channel?'water':x<=4?'stone':'grass'};}
  if(stage===4){const sea=y===0||y===9||x===0||x===11||x===5&&(y!==5&&y!==6);return {...p,height:0,terrain:sea?'water':x===5?'bridge':'stone'};}
  const sea=y===0||y===9||x===11;
  const height=!sea&&x>=8&&y<=7?2:!sea&&x===7&&y<=7?1:0;
  return {...p,height,terrain:sea?'water':x>=8&&y<=5?'stone':'grass'};
}
