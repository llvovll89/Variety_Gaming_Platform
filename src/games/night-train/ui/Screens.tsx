import { useState, type ReactNode } from 'react';
import { ArrowRight, Bed, Coins, Gift, Hammer, Question, Storefront, Trash, Trophy } from '@phosphor-icons/react';
import { CARDS, EVENTS, RELICS, canUpgrade, restHeal, type CardInstance, type Command, type DeckPick, type RunState } from '../engine';
import { CardView, Modal, RelicIcon } from './parts';

type Send = (command: Command) => void;

/** Shows the deck; in pick mode the player chooses one card, with an upgrade preview when relevant. */
export function DeckModal({ deck, title, kicker, pick, onPick, onClose, filter }: {
  deck: CardInstance[];
  title: string;
  kicker: string;
  pick?: DeckPick;
  onPick?: (card: CardInstance) => void;
  onClose: () => void;
  filter?: (card: CardInstance) => boolean;
}) {
  const [chosen, setChosen] = useState<CardInstance | null>(null);
  const order = { attack: 0, skill: 1, power: 2 } as const;
  const cards = [...deck].filter(card => !filter || filter(card))
    .sort((a, b) => order[CARDS[a.id].type] - order[CARDS[b.id].type] || CARDS[a.id].name.localeCompare(CARDS[b.id].name, 'ko') || Number(b.up) - Number(a.up));
  const verb = pick === 'remove' ? '제거하기' : pick === 'upgrade' ? '강화하기' : pick === 'transform' ? '맡기기' : '';
  return (
    <Modal label={title} onClose={onClose} wide>
      <p className="nt-modal-kicker">{kicker}</p>
      <h2>{title}</h2>
      {chosen && pick ? (
        <div className="nt-pick-confirm">
          <div className="nt-pick-preview">
            <CardView card={chosen} />
            {pick === 'upgrade' && <><ArrowRight size={28} aria-hidden="true" className="nt-pick-arrow" /><CardView card={chosen} showUpgrade /></>}
          </div>
          <div className="nt-modal-actions">
            <button type="button" className="nt-primary" onClick={() => onPick?.(chosen)}>{verb}</button>
            <button type="button" className="nt-secondary" onClick={() => setChosen(null)}>다른 카드 고르기</button>
          </div>
        </div>
      ) : (
        <div className="nt-card-grid">
          {cards.map(card => pick
            ? <CardView key={card.uid} card={card} compact onClick={() => setChosen(card)} />
            : <CardView key={card.uid} card={card} compact />)}
          {cards.length === 0 && <p className="nt-muted">고를 수 있는 카드가 없어요.</p>}
        </div>
      )}
    </Modal>
  );
}

function ScreenFrame({ icon, kicker, title, text, children }: { icon: ReactNode; kicker: string; title: string; text?: string; children: ReactNode }) {
  return (
    <section className="nt-screen" aria-labelledby="nt-screen-title">
      <div className="nt-screen-icon" aria-hidden="true">{icon}</div>
      <p className="nt-kicker">{kicker}</p>
      <h1 id="nt-screen-title">{title}</h1>
      {text && <p className="nt-screen-text">{text}</p>}
      {children}
    </section>
  );
}

export function RewardScreen({ run, send }: { run: RunState; send: Send }) {
  const reward = run.reward!;
  const [choosing, setChoosing] = useState(false);
  const pending = reward.gold != null || reward.cards != null || reward.relic != null;
  return (
    <ScreenFrame icon={<Trophy size={40} weight="duotone" />} kicker="객차를 지켜 냈어요" title="승리!" text="전리품을 챙기고 다음 역으로 떠나요.">
      <div className="nt-reward-list">
        {reward.gold != null && <button type="button" className="nt-reward" onClick={() => send({ t: 'takeGold' })}><Coins size={24} weight="fill" aria-hidden="true" /><span>골드 {reward.gold}</span></button>}
        {reward.relic && (
          <button type="button" className="nt-reward" onClick={() => send({ t: 'takeRelic' })}>
            <RelicIcon id={reward.relic} size={24} /><span>{RELICS[reward.relic].name}<small>{RELICS[reward.relic].desc}</small></span>
          </button>
        )}
        {reward.cards && <button type="button" className="nt-reward" onClick={() => setChoosing(true)}><Gift size={24} weight="fill" aria-hidden="true" /><span>새 카드 고르기<small>3장 중 1장을 덱에 넣어요</small></span></button>}
      </div>
      <button type="button" className={pending ? 'nt-secondary' : 'nt-primary'} onClick={() => send({ t: 'leave' })}>
        {pending ? '남은 보상 두고 출발' : '다음 역으로 출발'}<ArrowRight size={18} aria-hidden="true" />
      </button>
      {choosing && reward.cards && (
        <Modal label="카드 보상" onClose={() => setChoosing(false)} wide>
          <p className="nt-modal-kicker">카드 보상 · 지금 덱 {run.deck.length}장</p>
          <h2>어떤 카드를 가져갈까요?</h2>
          <div className="nt-card-choice">
            {reward.cards.map((card, index) => <CardView key={card.uid} card={card} onClick={() => { send({ t: 'pickCard', index }); setChoosing(false); }} />)}
          </div>
          <button type="button" className="nt-secondary" onClick={() => { send({ t: 'skipCards' }); setChoosing(false); }}>이번엔 넘기기 (덱을 가볍게)</button>
        </Modal>
      )}
    </ScreenFrame>
  );
}

export function RestScreen({ run, send }: { run: RunState; send: Send }) {
  const [upgrading, setUpgrading] = useState(false);
  const heal = Math.min(restHeal(run), run.maxHp - run.hp);
  const canUp = run.deck.some(canUpgrade);
  if (run.rest!.done) {
    return (
      <ScreenFrame icon={<Bed size={40} weight="duotone" />} kicker="침대칸" title="푹 쉬었어요" text="창밖이 조금 밝아진 것 같아요.">
        <button type="button" className="nt-primary" onClick={() => send({ t: 'leave' })}>다음 역으로 출발<ArrowRight size={18} aria-hidden="true" /></button>
      </ScreenFrame>
    );
  }
  return (
    <ScreenFrame icon={<Bed size={40} weight="duotone" />} kicker="침대칸" title="잠깐 쉬어 갈까요?" text="둘 중 하나만 할 수 있어요.">
      <div className="nt-choice-list">
        <button type="button" className="nt-choice" onClick={() => send({ t: 'rest' })}>
          <Bed size={26} weight="fill" aria-hidden="true" /><span><b>한숨 자기</b><small>체력 {heal} 회복 (지금 {run.hp}/{run.maxHp})</small></span>
        </button>
        <button type="button" className="nt-choice" disabled={!canUp} onClick={() => setUpgrading(true)}>
          <Hammer size={26} weight="fill" aria-hidden="true" /><span><b>카드 손질하기</b><small>{canUp ? '카드 1장을 강화해요' : '강화할 카드가 없어요'}</small></span>
        </button>
      </div>
      {upgrading && <DeckModal deck={run.deck} filter={canUpgrade} pick="upgrade" kicker="침대칸 · 카드 강화" title="어떤 카드를 손질할까요?"
        onClose={() => setUpgrading(false)} onPick={card => { send({ t: 'upgrade', uid: card.uid }); setUpgrading(false); }} />}
    </ScreenFrame>
  );
}

export function ShopScreen({ run, send }: { run: RunState; send: Send }) {
  const shop = run.shop!;
  const [removing, setRemoving] = useState(false);
  const canRemove = !shop.removed && run.gold >= shop.removePrice && run.deck.length > 5;
  return (
    <ScreenFrame icon={<Storefront size={40} weight="duotone" />} kicker="매점칸" title="어서 오세요, 차장님!" text={`가진 골드 ${run.gold}`}>
      <div className="nt-shop">
        <div className="nt-shop-cards">
          {shop.cards.map((item, index) => (
            <div key={item.card.uid} className={`nt-shop-item${item.sold ? ' is-sold' : ''}`}>
              <CardView card={item.card} compact disabled={item.sold || run.gold < item.price}
                label={`${CARDS[item.card.id].name} 사기, ${item.price}골드${item.sold ? ', 판매 완료' : run.gold < item.price ? ', 골드 부족' : ''}`}
                onClick={() => send({ t: 'buyCard', index })} />
              <span className="nt-price"><Coins size={14} weight="fill" aria-hidden="true" />{item.sold ? '판매 완료' : item.price}</span>
            </div>
          ))}
        </div>
        <div className="nt-shop-side">
          {shop.relics.map((item, index) => (
            <button key={item.id} type="button" className={`nt-shop-relic${item.sold ? ' is-sold' : ''}`} disabled={item.sold || run.gold < item.price} onClick={() => send({ t: 'buyRelic', index })}>
              <RelicIcon id={item.id} size={26} />
              <span><b>{RELICS[item.id].name}</b><small>{RELICS[item.id].desc}</small></span>
              <span className="nt-price"><Coins size={14} weight="fill" aria-hidden="true" />{item.sold ? '판매 완료' : item.price}</span>
            </button>
          ))}
          <button type="button" className="nt-shop-relic" disabled={!canRemove} onClick={() => setRemoving(true)}>
            <Trash size={26} weight="duotone" aria-hidden="true" />
            <span><b>카드 정리 서비스</b><small>{shop.removed ? '오늘은 이미 정리했어요' : run.deck.length <= 5 ? '덱이 너무 얇아요' : '덱에서 카드 1장을 뺍니다'}</small></span>
            <span className="nt-price"><Coins size={14} weight="fill" aria-hidden="true" />{shop.removed ? '완료' : shop.removePrice}</span>
          </button>
        </div>
      </div>
      <button type="button" className="nt-primary" onClick={() => send({ t: 'leave' })}>매점 나가기<ArrowRight size={18} aria-hidden="true" /></button>
      {removing && <DeckModal deck={run.deck} pick="remove" kicker={`카드 정리 · ${shop.removePrice}골드`} title="어떤 카드를 뺄까요?"
        onClose={() => setRemoving(false)} onPick={card => { send({ t: 'removeCard', uid: card.uid }); setRemoving(false); }} />}
    </ScreenFrame>
  );
}

export function EventScreen({ run, send }: { run: RunState; send: Send }) {
  const state = run.event!;
  const def = EVENTS[state.id];
  const [picking, setPicking] = useState<number | null>(null);
  const pickChoice = picking === null ? null : def.choices[picking];
  return (
    <ScreenFrame icon={<Question size={40} weight="duotone" />} kicker="수상한 객차" title={def.title} text={state.result ?? def.text}>
      {state.result === null ? (
        <div className="nt-choice-list">
          {def.choices.map((choice, index) => {
            const ok = !choice.available || choice.available(run);
            return (
              <button key={choice.label} type="button" className="nt-choice" disabled={!ok}
                onClick={() => (choice.pick ? setPicking(index) : send({ t: 'eventChoice', index }))}>
                <span><b>{choice.label}</b><small>{ok ? choice.detail : `${choice.detail} · 지금은 할 수 없어요`}</small></span>
              </button>
            );
          })}
        </div>
      ) : (
        <button type="button" className="nt-primary" onClick={() => send({ t: 'leave' })}>다음 역으로 출발<ArrowRight size={18} aria-hidden="true" /></button>
      )}
      {pickChoice && picking !== null && (
        <DeckModal deck={run.deck} pick={pickChoice.pick} filter={pickChoice.pick === 'upgrade' ? canUpgrade : undefined}
          kicker={def.title} title={pickChoice.detail} onClose={() => setPicking(null)}
          onPick={card => { send({ t: 'eventChoice', index: picking, uid: card.uid }); setPicking(null); }} />
      )}
    </ScreenFrame>
  );
}

export function TreasureScreen({ run, send }: { run: RunState; send: Send }) {
  const chest = run.treasure!;
  return (
    <ScreenFrame icon={<Gift size={40} weight="duotone" />} kicker="화물칸" title={chest.opened ? '보물을 찾았어요!' : '주인 없는 화물 상자'}
      text={chest.opened ? undefined : '자물쇠가 헐거워요. 열어 볼까요?'}>
      {chest.opened ? (
        <>
          <div className="nt-reward-list">
            <div className="nt-reward is-static"><Coins size={24} weight="fill" aria-hidden="true" /><span>골드 {chest.gold}</span></div>
            {chest.relic && <div className="nt-reward is-static"><RelicIcon id={chest.relic} size={24} /><span>{RELICS[chest.relic].name}<small>{RELICS[chest.relic].desc}</small></span></div>}
          </div>
          <button type="button" className="nt-primary" onClick={() => send({ t: 'leave' })}>다음 역으로 출발<ArrowRight size={18} aria-hidden="true" /></button>
        </>
      ) : (
        <button type="button" className="nt-primary" onClick={() => send({ t: 'openTreasure' })}><Gift size={18} weight="fill" aria-hidden="true" />상자 열기</button>
      )}
    </ScreenFrame>
  );
}
