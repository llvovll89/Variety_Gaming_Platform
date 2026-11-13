import { useState, type ReactNode } from 'react';
import {
  CARDS, EVENTS, RELICS, SNACKS, SNACK_SLOTS, canUpgrade, restHeal,
  type CardInstance, type Command, type DeckPick, type RunState,
} from '../engine';
import { Glyph, SNACK_GLYPH } from './glyphs';
import { CardView, Modal, RelicIcon, Stamp } from './parts';

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
  const verb = pick === 'remove' ? '이 카드 빼기' : pick === 'upgrade' ? '이 카드 강화하기' : pick === 'transform' ? '이 카드 맡기기' : '';
  return (
    <Modal label={title} onClose={onClose} wide>
      <p className="nt-modal-kicker">{kicker}</p>
      <h2>{title}</h2>
      {chosen && pick ? (
        <div className="nt-pick-confirm">
          <div className="nt-pick-preview">
            <CardView card={chosen} size="large" />
            {pick === 'upgrade' && <><Glyph name="arrow" size={28} className="nt-pick-arrow" /><CardView card={chosen} size="large" showUpgrade /></>}
          </div>
          <div className="nt-modal-actions">
            <button type="button" className="nt-btn nt-btn-ink" onClick={() => onPick?.(chosen)}>{verb}</button>
            <button type="button" className="nt-btn nt-btn-paper-line" onClick={() => setChosen(null)}>다른 카드 고르기</button>
          </div>
        </div>
      ) : (
        <div className="nt-card-grid">
          {cards.map(card => pick
            ? <CardView key={card.uid} card={card} size="compact" onClick={() => setChosen(card)} />
            : <CardView key={card.uid} card={card} size="compact" />)}
          {cards.length === 0 && <p>고를 수 있는 카드가 없어요.</p>}
        </div>
      )}
    </Modal>
  );
}

function Notice({ glyph, kicker, title, lead, wide, children, foot }: { glyph: string; kicker: string; title: string; lead?: ReactNode; wide?: boolean; children: ReactNode; foot: ReactNode }) {
  return (
    <section className="nt-place" aria-labelledby="nt-notice-title">
      <div className={`nt-notice nt-sheet${wide ? ' is-wide' : ''}`}>
        <header className="nt-notice-head">
          <Stamp glyph={glyph} size={30} />
          <div>
            <p className="nt-modal-kicker">{kicker}</p>
            <h1 id="nt-notice-title">{title}</h1>
            {lead && <p>{lead}</p>}
          </div>
        </header>
        {children}
        <footer className="nt-notice-foot">{foot}</footer>
      </div>
    </section>
  );
}

function Price({ value, short }: { value: number; short?: boolean }) {
  return <span className={`nt-price${short ? ' is-short' : ''}`}><Glyph name="coin" size={15} />{value}</span>;
}

export function RewardScreen({ run, send }: { run: RunState; send: Send }) {
  const reward = run.reward!;
  const [choosing, setChoosing] = useState(false);
  const pending = reward.gold != null || reward.cards != null || reward.relic != null || reward.snack != null;
  const bagFull = run.snacks.length >= SNACK_SLOTS;
  const elite = run.combat?.kind === 'elite';
  return (
    <Notice glyph="crate" kicker={elite ? '강적을 물리쳤어요' : '객차를 지켜 냈어요'} title="전리품 목록" lead="필요한 것만 챙겨도 괜찮아요. 덱이 얇을수록 좋은 카드가 자주 손에 들어옵니다."
      foot={<>
        <small>{pending ? '챙기지 않은 보상은 두고 떠나요.' : '모두 챙겼어요.'}</small>
        <button type="button" className={`nt-btn ${pending ? 'nt-btn-paper-line' : 'nt-btn-ink'}`} onClick={() => send({ t: 'leave' })}>다음 역으로<Glyph name="arrow" size={18} /></button>
      </>}>
      <ul className="nt-ledger">
        {reward.gold != null && <li><button type="button" className="nt-ledger-row" onClick={() => send({ t: 'takeGold' })}><Glyph name="coin" size={28} /><span><b>골드 {reward.gold}</b><small>매점에서 카드·유물·간식을 살 수 있어요.</small></span><span className="nt-act">받기</span></button></li>}
        {reward.cards && <li><button type="button" className="nt-ledger-row" onClick={() => setChoosing(true)}><Glyph name="tickets" size={28} /><span><b>새 카드 한 장</b><small>세 장 중 하나를 골라 덱에 넣어요.</small></span><span className="nt-act">고르기</span></button></li>}
        {reward.relic && <li><button type="button" className="nt-ledger-row" onClick={() => send({ t: 'takeRelic' })}><RelicIcon id={reward.relic} size={28} /><span><b>{RELICS[reward.relic].name}</b><small>{RELICS[reward.relic].desc}</small></span><span className="nt-act">받기</span></button></li>}
        {reward.snack && <li><button type="button" className="nt-ledger-row" disabled={bagFull} onClick={() => send({ t: 'takeSnack' })}><Glyph name={SNACK_GLYPH[reward.snack]} size={28} /><span><b>{SNACKS[reward.snack].name}</b><small>{bagFull ? '간식 가방이 가득 찼어요. 하나를 먹거나 버리면 챙길 수 있어요.' : SNACKS[reward.snack].desc}</small></span><span className="nt-act">{bagFull ? '가득 참' : '챙기기'}</span></button></li>}
        {!pending && <li><div className="nt-ledger-row is-done"><Glyph name="arrow" size={28} /><span><b>정리 끝</b><small>다음 역으로 출발하세요.</small></span><span /></div></li>}
      </ul>
      {choosing && reward.cards && (
        <Modal label="카드 보상" onClose={() => setChoosing(false)} wide>
          <p className="nt-modal-kicker">카드 보상 · 지금 덱 {run.deck.length}장</p>
          <h2>어떤 카드를 가져갈까요?</h2>
          <div className="nt-card-choice">
            {reward.cards.map((card, index) => <CardView key={card.uid} card={card} size="large" onClick={() => { send({ t: 'pickCard', index }); setChoosing(false); }} />)}
          </div>
          <button type="button" className="nt-btn nt-btn-paper-line" onClick={() => { send({ t: 'skipCards' }); setChoosing(false); }}>이번엔 넘기기</button>
        </Modal>
      )}
    </Notice>
  );
}

export function RestScreen({ run, send }: { run: RunState; send: Send }) {
  const [upgrading, setUpgrading] = useState(false);
  const heal = Math.min(restHeal(run), run.maxHp - run.hp);
  const canUp = run.deck.some(canUpgrade);
  const done = run.rest!.done;
  return (
    <Notice glyph="bed" kicker="침대칸 · SLEEPER" title={done ? '푹 쉬었어요' : '잠깐 눈을 붙일까요?'} lead={done ? '창밖이 조금 밝아진 것 같아요.' : '둘 중 하나만 할 수 있어요.'}
      foot={<><small>체력 {run.hp} / {run.maxHp}</small><button type="button" className="nt-btn nt-btn-ink" disabled={!done} onClick={() => send({ t: 'leave' })}>다음 역으로<Glyph name="arrow" size={18} /></button></>}>
      {!done && (
        <div className="nt-choices">
          <button type="button" className="nt-choice" onClick={() => send({ t: 'rest' })}>
            <span className="nt-choice-no">Ⅰ</span><span><b>한숨 자기</b><small>체력 {heal} 회복{heal === 0 ? ' (이미 가득해요)' : ''}</small></span><Glyph name="bed" size={22} />
          </button>
          <button type="button" className="nt-choice" disabled={!canUp} onClick={() => setUpgrading(true)}>
            <span className="nt-choice-no">Ⅱ</span><span><b>카드 손질하기</b><small>{canUp ? '카드 한 장을 강화해요. 숫자가 커지거나 비용이 줄어요.' : '강화할 카드가 없어요.'}</small></span><Glyph name="hammer" size={22} />
          </button>
        </div>
      )}
      {upgrading && <DeckModal deck={run.deck} filter={canUpgrade} pick="upgrade" kicker="침대칸 · 카드 강화" title="어떤 카드를 손질할까요?"
        onClose={() => setUpgrading(false)} onPick={card => { send({ t: 'upgrade', uid: card.uid }); setUpgrading(false); }} />}
    </Notice>
  );
}

export function ShopScreen({ run, send }: { run: RunState; send: Send }) {
  const shop = run.shop!;
  const [removing, setRemoving] = useState(false);
  const canRemove = !shop.removed && run.gold >= shop.removePrice && run.deck.length > 5;
  const bagFull = run.snacks.length >= SNACK_SLOTS;
  return (
    <Notice glyph="awning" kicker="매점칸 · BUFFET CAR" title="오늘의 차림표" wide lead="카드 한 장, 유물 하나, 간식 한 봉지. 남는 골드는 다음 매점까지 가져갈 수 있어요."
      foot={<><span className="nt-wallet"><Glyph name="coin" size={20} />{run.gold}<small>&nbsp;골드</small></span><button type="button" className="nt-btn nt-btn-ink" onClick={() => send({ t: 'leave' })}>매점 나가기<Glyph name="arrow" size={18} /></button></>}>
      <div className="nt-shop">
        <div>
          <h2>카드</h2>
          <div className="nt-shop-cards">
            {shop.cards.map((item, index) => (
              <div key={item.card.uid} className={`nt-shop-item${item.sold ? ' is-sold' : ''}`}>
                <CardView card={item.card} size="compact" disabled={item.sold || run.gold < item.price}
                  label={`${CARDS[item.card.id].name} 사기, ${item.price}골드${item.sold ? ', 판매 완료' : run.gold < item.price ? ', 골드 부족' : ''}`}
                  onClick={() => send({ t: 'buyCard', index })} />
                {item.sold ? <span className="nt-price">판매 완료</span> : <Price value={item.price} short={run.gold < item.price} />}
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2>유물</h2>
          <ul className="nt-menu">
            {shop.relics.map((item, index) => (
              <li key={item.id}><button type="button" disabled={item.sold || run.gold < item.price} onClick={() => send({ t: 'buyRelic', index })}>
                <RelicIcon id={item.id} size={22} /><span><b>{RELICS[item.id].name}</b><small>{RELICS[item.id].desc}</small></span>
                {item.sold ? <span className="nt-price">판매 완료</span> : <Price value={item.price} short={run.gold < item.price} />}
              </button></li>
            ))}
          </ul>
          <h2>간식 · 가방 {run.snacks.length}/{SNACK_SLOTS}</h2>
          <ul className="nt-menu">
            {shop.snacks.map((item, index) => (
              <li key={item.id}><button type="button" disabled={item.sold || run.gold < item.price || bagFull} onClick={() => send({ t: 'buySnack', index })}>
                <Glyph name={SNACK_GLYPH[item.id]} size={22} /><span><b>{SNACKS[item.id].name}</b><small>{bagFull && !item.sold ? '가방이 가득 찼어요.' : SNACKS[item.id].desc}</small></span>
                {item.sold ? <span className="nt-price">판매 완료</span> : <Price value={item.price} short={run.gold < item.price} />}
              </button></li>
            ))}
          </ul>
          <h2>서비스</h2>
          <ul className="nt-menu">
            <li><button type="button" disabled={!canRemove} onClick={() => setRemoving(true)}>
              <Glyph name="scissors" size={22} /><span><b>카드 정리</b><small>{shop.removed ? '오늘은 이미 정리했어요.' : run.deck.length <= 5 ? '덱이 너무 얇아요.' : '덱에서 카드 한 장을 덜어 내요.'}</small></span>
              {shop.removed ? <span className="nt-price">완료</span> : <Price value={shop.removePrice} short={run.gold < shop.removePrice} />}
            </button></li>
          </ul>
        </div>
      </div>
      {removing && <DeckModal deck={run.deck} pick="remove" kicker={`카드 정리 · ${shop.removePrice}골드`} title="어떤 카드를 덜어 낼까요?"
        onClose={() => setRemoving(false)} onPick={card => { send({ t: 'removeCard', uid: card.uid }); setRemoving(false); }} />}
    </Notice>
  );
}

export function EventScreen({ run, send }: { run: RunState; send: Send }) {
  const state = run.event!;
  const def = EVENTS[state.id];
  const [picking, setPicking] = useState<number | null>(null);
  const pickChoice = picking === null ? null : def.choices[picking];
  const numerals = ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ'];
  return (
    <Notice glyph="question" kicker="수상한 객차 · INCIDENT" title={def.title}
      foot={<><small>{state.result === null ? '하나를 고르세요.' : '이야기가 끝났어요.'}</small><button type="button" className="nt-btn nt-btn-ink" disabled={state.result === null} onClick={() => send({ t: 'leave' })}>다음 역으로<Glyph name="arrow" size={18} /></button></>}>
      <p className="nt-story">{state.result ?? def.text}</p>
      {state.result === null && (
        <div className="nt-choices">
          {def.choices.map((choice, index) => {
            const ok = !choice.available || choice.available(run);
            return (
              <button key={choice.label} type="button" className="nt-choice" disabled={!ok}
                onClick={() => (choice.pick ? setPicking(index) : send({ t: 'eventChoice', index }))}>
                <span className="nt-choice-no">{numerals[index]}</span>
                <span><b>{choice.label}</b><small>{ok ? choice.detail : `${choice.detail} · 지금은 할 수 없어요`}</small></span>
                <Glyph name="arrow" size={20} />
              </button>
            );
          })}
        </div>
      )}
      {pickChoice && picking !== null && (
        <DeckModal deck={run.deck} pick={pickChoice.pick} filter={pickChoice.pick === 'upgrade' ? canUpgrade : undefined}
          kicker={def.title} title={pickChoice.detail} onClose={() => setPicking(null)}
          onPick={card => { send({ t: 'eventChoice', index: picking, uid: card.uid }); setPicking(null); }} />
      )}
    </Notice>
  );
}

export function TreasureScreen({ run, send }: { run: RunState; send: Send }) {
  const chest = run.treasure!;
  return (
    <Notice glyph="crate" kicker="화물칸 · CARGO" title={chest.opened ? '상자 안에 이런 게!' : '주인 없는 화물 상자'} lead={chest.opened ? undefined : '자물쇠가 헐거워요. 열어 볼까요?'}
      foot={<><small>{chest.opened ? '가방에 넣었어요.' : ''}</small>{chest.opened
        ? <button type="button" className="nt-btn nt-btn-ink" onClick={() => send({ t: 'leave' })}>다음 역으로<Glyph name="arrow" size={18} /></button>
        : <button type="button" className="nt-btn nt-btn-ink" onClick={() => send({ t: 'openTreasure' })}><Glyph name="crate" size={18} />상자 열기</button>}</>}>
      {chest.opened && (
        <ul className="nt-ledger">
          <li><div className="nt-ledger-row"><Glyph name="coin" size={28} /><span><b>골드 {chest.gold}</b><small>바닥에 흩어진 동전을 주웠어요.</small></span><span /></div></li>
          {chest.relic && <li><div className="nt-ledger-row"><RelicIcon id={chest.relic} size={28} /><span><b>{RELICS[chest.relic].name}</b><small>{RELICS[chest.relic].desc}</small></span><span /></div></li>}
        </ul>
      )}
    </Notice>
  );
}
