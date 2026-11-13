import { CARDS, cardName } from './cards';
import { RELICS } from './relics';
import { random } from './rng';
import type { CardInstance, RunState } from './types';

export type DeckPick = 'remove' | 'upgrade' | 'transform';

export interface EventChoice {
  label: string;
  detail: string;
  /** Some choices ask the player to choose a card from the deck first. */
  pick?: DeckPick;
  available?: (run: RunState) => boolean;
  resolve: (run: RunState, helpers: EventHelpers, card?: CardInstance) => string;
}

export interface EventHelpers {
  addCard: (id: string, upgraded?: boolean) => CardInstance;
  gainRelic: () => string | null;
  randomCardId: (rarities: ('common' | 'uncommon' | 'rare')[]) => string;
}

export interface EventDef {
  id: string;
  title: string;
  text: string;
  choices: EventChoice[];
}

const heal = (run: RunState, amount: number) => {
  const healed = Math.min(amount, run.maxHp - run.hp);
  run.hp += healed;
  return healed;
};

export const EVENTS: Record<string, EventDef> = {
  luggage: {
    id: 'luggage', title: '주인 없는 트렁크',
    text: '선반 위에서 낡은 트렁크가 덜컹거립니다. 이름표에는 "다음 역에서 찾아갈게요"라고만 적혀 있어요.',
    choices: [
      { label: '살짝 열어 본다', detail: '골드 55 · 체력 -7', available: run => run.hp > 7, resolve: run => { run.gold += 55; run.hp -= 7; return '안에서 동전 주머니가 굴러 나왔지만, 걸쇠에 손가락을 찧었어요.'; } },
      { label: '분실물 센터에 맡긴다', detail: '체력 8 회복', resolve: run => `착한 일을 하고 나니 마음이 편해졌어요. 체력 ${heal(run, 8)} 회복.` },
    ],
  },
  sleepy: {
    id: 'sleepy', title: '꾸벅꾸벅 조는 승객',
    text: '창가 자리 승객이 졸다가 당신의 어깨에 기댑니다. 주머니에서 쪽지 한 장이 삐죽 나와 있어요.',
    choices: [
      { label: '담요를 덮어 준다', detail: '덱에서 카드 1장 제거', pick: 'remove', available: run => run.deck.length > 5, resolve: (run, _h, card) => {
        if (!card) return '';
        run.deck = run.deck.filter(c => c.uid !== card.uid);
        return `승객이 고맙다며 웅얼거립니다. 짐이 가벼워졌어요. (${cardName(card)} 제거)`;
      } },
      { label: '쪽지를 읽어 본다', detail: '무작위 고급 카드 1장 얻기', resolve: (_run, h) => {
        const card = h.addCard(h.randomCardId(['uncommon']));
        return `쪽지에는 낯선 기술이 적혀 있었어요. ${cardName(card)}을(를) 얻었습니다.`;
      } },
      { label: '조용히 지나간다', detail: '아무 일도 일어나지 않음', resolve: () => '승객은 계속 쿨쿨 잠들어 있어요.' },
    ],
  },
  vending: {
    id: 'vending', title: '수상한 자판기',
    text: '객차 끝에 반짝이는 자판기가 서 있습니다. 메뉴는 전부 "???"이고, 동전 넣는 곳이 웃는 입처럼 생겼어요.',
    choices: [
      { label: '동전을 넣는다', detail: '골드 -45 · 무작위 유물', available: run => run.gold >= 45, resolve: (run, h) => {
        run.gold -= 45;
        const relic = h.gainRelic();
        if (relic) return `철컹! ${RELICS[relic].name}이(가) 떨어졌어요.`;
        run.gold += 45;
        return '자판기가 텅 비어 있었어요. 동전을 돌려받았습니다.';
      } },
      { label: '옆구리를 툭 친다', detail: '절반 확률로 골드 40, 아니면 체력 -8', available: run => run.hp > 8, resolve: run => {
        if (random(run) < 0.5) { run.gold += 40; return '동전 반환구에서 동전이 와르르 쏟아졌어요!'; }
        run.hp -= 8;
        return '자판기가 화가 나서 캔을 던졌어요. 아야!';
      } },
      { label: '못 본 척한다', detail: '아무 일도 일어나지 않음', resolve: () => '자판기가 서운하게 깜빡입니다.' },
    ],
  },
  window: {
    id: 'window', title: '별이 쏟아지는 창',
    text: '창밖으로 별똥별이 비처럼 쏟아집니다. 하나쯤은 소원을 들어줄 것 같아요.',
    choices: [
      { label: '튼튼해지게 해 주세요', detail: '최대 체력 +6', resolve: run => { run.maxHp += 6; run.hp += 6; return '몸이 따뜻해지며 힘이 솟아요. 최대 체력 +6.'; } },
      { label: '더 강해지게 해 주세요', detail: '카드 1장 강화', pick: 'upgrade', available: run => run.deck.some(c => !c.up), resolve: (run, _h, card) => {
        const target = run.deck.find(c => c.uid === card?.uid);
        if (!target) return '';
        target.up = true;
        return `${cardName(target)}이(가) 별빛을 머금었어요.`;
      } },
    ],
  },
  painter: {
    id: 'painter', title: '꿈꾸는 화가',
    text: '식당칸 구석에서 화가가 당신의 카드를 그려 주겠다고 합니다. "조금 다르게 그려도 괜찮죠?"',
    choices: [
      { label: '카드를 맡긴다', detail: '카드 1장을 무작위 카드로 바꾸기', pick: 'transform', resolve: (run, h, card) => {
        const index = run.deck.findIndex(c => c.uid === card?.uid);
        if (index < 0) return '';
        const old = run.deck[index];
        const replacement = h.randomCardId(['common', 'uncommon', 'rare']);
        run.deck[index] = { uid: old.uid, id: replacement, up: false };
        return `${cardName(old)}이(가) ${CARDS[replacement].name}(으)로 다시 태어났어요.`;
      } },
      { label: '그림을 산다', detail: '골드 -35 · 무작위 희귀 카드', available: run => run.gold >= 35, resolve: (run, h) => {
        run.gold -= 35;
        const card = h.addCard(h.randomCardId(['rare']));
        return `액자 속 그림이 카드로 변했어요. ${cardName(card)}을(를) 얻었습니다.`;
      } },
      { label: '정중히 사양한다', detail: '아무 일도 일어나지 않음', resolve: () => '화가는 어깨를 으쓱하고 다시 붓을 듭니다.' },
    ],
  },
};
