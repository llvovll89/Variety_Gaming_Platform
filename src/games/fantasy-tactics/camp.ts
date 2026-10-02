import type { Role } from './game';

export const CAMP_TOPICS = ['arrival', 'arin', 'theo', 'ria', 'noah', 'route'] as const;
export type CampTopic = typeof CAMP_TOPICS[number];
export type CampLine = { speaker: string; role: Role; text: string };
export interface CampState { topic: CampTopic | null; line: number; heard: CampTopic[]; mapSeen: boolean; }
export const newCamp = (): CampState => ({ topic: 'arrival', line: 0, heard: [], mapSeen: false });
const say = (speaker: string, role: Role, text: string): CampLine => ({ speaker, role, text });
export const CAMPS: { title: string; location: string; route: string; advice: string; talks: Record<CampTopic, CampLine[]> }[] = [
  {
    title: '다리 너머의 모닥불', location: '여울숲 야영지', route: '여울숲 → 바람 언덕 → 별의 등대',
    advice: '언덕 위 궁수는 높은 곳에서 공격합니다. 테오를 앞에 세우고, 리아의 마법으로 모인 적을 노리세요.',
    talks: {
      arrival: [say('리아', 'mage', '봤지? 다리 위에서 내 불꽃이 딱 길을 열어 줬잖아!'), say('테오', 'spear', '봤어. 내 망토도 딱 타들어 갈 뻔했지.'), say('노아', 'healer', '두 분 다 이리 오세요. 망토보다 먼저 상처를 봐야겠어요.')],
      arin: [say('아린', 'sword', '다리 앞에서는 검을 쥔 손에 힘이 너무 들어갔어. 너희가 내 뒤에 있다는 생각만 했거든.'), say('노아', 'healer', '뒤에서 따라가기만 한 건 아니에요. 저희도 아린을 지키고 있었어요.'), say('아린', 'sword', '…맞아. 다음엔 혼자 앞장서려고만 하지 않을게.')],
      theo: [say('테오', 'spear', '창은 길어서 좋지만, 나무다리에선 발밑도 봐야 해. 누가 내 뒤에서 밀기라도 하면—'), say('리아', 'mage', '그래서 내가 “조심해!” 했잖아. 세 번이나.'), say('테오', 'spear', '알아. 내일도 세 번쯤 부탁할게.')],
      ria: [say('리아', 'mage', '노아, 내 불꽃 어땠어? 조금만 더 연습하면 밤에도 등불이 필요 없을 거야.'), say('노아', 'healer', '불빛은 좋았어요. 그런데 우리 텐트는 남겨 주세요.'), say('리아', 'mage', '텐트는 안 태워! …적어도 오늘은.')],
      noah: [say('노아', 'healer', '저희 집은 항구 근처예요. 등대가 꺼진 밤엔, 배가 돌아오는 소리를 모두 기다렸어요.'), say('아린', 'sword', '그래서 이 길을 함께 온 거구나.'), say('노아', 'healer', '네. 누군가 돌아갈 길을 밝히는 일이라면, 저도 돕고 싶어요.')],
      route: [say('테오', 'spear', '다음은 바람 언덕이야. 무너진 성벽을 지나면 등대가 보여.'), say('리아', 'mage', '궁수가 위에서 기다린다고 했지? 한곳에 서 있으면 내가 길을 열게.')],
    },
  },
  {
    title: '등대가 보이는 밤', location: '바람 언덕 야영지', route: '바람 언덕 → 봉인된 뜰 → 별의 등대',
    advice: '다음 전투의 목표는 검은 기사 모르덴 격파입니다. 노아의 보호와 치유로 전열을 유지하세요.',
    talks: {
      arrival: [say('아린', 'sword', '저기 보여? 구름 사이로 등대가 보이는데… 정말 불빛이 없어.'), say('노아', 'healer', '내일은 켜져 있을 거예요. 우리가 거기까지 갈 테니까요.'), say('테오', 'spear', '그럼 오늘은 제대로 쉬자. 마지막 오르막이 남았어.')],
      arin: [say('아린', 'sword', '등대에 누가 있든, 먼저 이야기를 들어 보고 싶어. 왜 빛을 가뒀는지.'), say('테오', 'spear', '좋아. 대신 검을 놓지는 마. 네 이야기는 내가 옆에서 지켜 줄게.'), say('아린', 'sword', '고마워. 같이 가자.')],
      theo: [say('테오', 'spear', '아까 언덕 위에선 바람 때문에 창끝이 자꾸 흔들렸어.'), say('리아', 'mage', '그러고도 그렇게 막아 준 거야? …망토는 내가 기워 줄게.'), say('테오', 'spear', '마법 말고 바늘로 해 주면 더 고맙겠네.')],
      ria: [say('리아', 'mage', '이상해. 가까워질수록 등대 쪽에서 마법의 기운이 느껴져.'), say('노아', 'healer', '안에 아직 빛이 남아 있다는 뜻일까요?'), say('리아', 'mage', '응. 꺼진 게 아니라 갇힌 것 같아. 내일 확인해 보자.')],
      noah: [say('노아', 'healer', '처음엔 따라올 수 있을지 걱정했어요. 지금은… 여러분이 다치면 제가 돕겠다는 생각이 먼저 들어요.'), say('아린', 'sword', '이미 여러 번 도와줬어. 내일도 부탁할게.'), say('노아', 'healer', '네. 모두 함께 돌아가요.')],
      route: [say('테오', 'spear', '새벽에 능선을 따라 봉인된 뜰로 들어가자. 등대까지는 마지막 한 구간이야.'), say('노아', 'healer', '검은 기사를 쓰러뜨리면 길이 열릴 거예요. 제가 뒤에서 보호할게요.')],
    },
  },
];
