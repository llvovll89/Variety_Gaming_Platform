import { useEffect, useMemo, useState } from 'react';
import { Lightning, Stack, Trash, Fire, HourglassMedium } from '@phosphor-icons/react';
import { ENEMIES, STATUS_INFO, aliveEnemies, attackDamage, cardStats, checkPlay, needsTarget, type CardInstance, type Command, type Fx, type RunState, type StatusId } from '../engine';
import { Conductor, ENEMY_ART } from './art';
import { CardView, HpBar, IntentBadge, Modal, StatusList } from './parts';

function FxLayer({ items }: { items: Fx[] }) {
  return (
    <span className="nt-fx-layer" aria-hidden="true">
      {items.filter(item => !(item.kind === 'status' && item.label?.startsWith('move:'))).map((item, index) => {
        let text = '';
        if (item.kind === 'damage') text = `-${item.amount}`;
        else if (item.kind === 'block') text = `+${item.amount} 방어`;
        else if (item.kind === 'blocked') text = `막음 ${item.amount}`;
        else if (item.kind === 'heal') text = `+${item.amount}`;
        else if (item.label) text = `${STATUS_INFO[item.label as StatusId]?.name ?? ''} ${item.amount}`;
        return <span key={item.id} className={`nt-fx nt-fx-${item.kind}`} style={{ animationDelay: `${index * 110}ms`, top: `${index * 24}px`, ['--fx-shift' as string]: `${(index % 2 ? 1 : -1) * 18}px` }}>{text}</span>;
      })}
    </span>
  );
}

type PileName = 'draw' | 'discard' | 'exhausted';
const PILE_NAMES: Record<PileName, string> = { draw: '뽑을 카드', discard: '버린 카드', exhausted: '소멸·사용한 능력 카드' };

export default function CombatView({ run, onCommand, photo, locked, onOpenDeck }: {
  run: RunState;
  onCommand: (command: Command) => void;
  photo: string | null;
  locked: boolean;
  onOpenDeck: () => void;
}) {
  const combat = run.combat!;
  const { player } = combat;
  const alive = aliveEnemies(combat);
  const [selected, setSelected] = useState<number | null>(null);
  const [focusTarget, setFocusTarget] = useState<number | null>(null);
  const [pile, setPile] = useState<PileName | null>(null);
  const [hint, setHint] = useState('');

  const selectedCard = combat.hand.find(card => card.uid === selected) ?? null;
  const targeting = !!selectedCard && needsTarget(selectedCard) && alive.length > 1;
  const previewTarget = alive.find(enemy => enemy.uid === focusTarget) ?? (alive.length === 1 ? alive[0] : undefined);

  useEffect(() => {
    if (selected !== null && !combat.hand.some(card => card.uid === selected)) setSelected(null);
    if (focusTarget !== null && !alive.some(enemy => enemy.uid === focusTarget)) setFocusTarget(null);
  }, [combat.hand, alive, selected, focusTarget]);
  useEffect(() => { setHint(''); }, [combat.turn]);

  const play = (card: CardInstance, target?: number) => {
    const check = checkPlay(run, card.uid, target);
    if (!check.ok) { setHint(check.reason); return; }
    onCommand({ t: 'play', uid: card.uid, target: check.target });
    setSelected(null);
    setHint('');
  };

  const pressCard = (card: CardInstance) => {
    if (locked) return;
    if (cardStats(card).cost > player.energy) { setSelected(card.uid); setHint('에너지가 부족해요. 턴을 마치면 다시 채워집니다.'); return; }
    if (selected !== card.uid) {
      setSelected(card.uid);
      setHint(needsTarget(card) && alive.length > 1 ? '어느 적에게 쓸까요? 적을 눌러 주세요.' : '한 번 더 누르면 사용합니다.');
      return;
    }
    if (needsTarget(card) && alive.length > 1) {
      if (focusTarget !== null && alive.some(enemy => enemy.uid === focusTarget)) play(card, focusTarget);
      else setHint('어느 적에게 쓸까요? 적을 눌러 주세요.');
      return;
    }
    play(card);
  };

  const pressEnemy = (uid: number) => {
    if (locked) return;
    setFocusTarget(uid);
    if (selectedCard && needsTarget(selectedCard)) play(selectedCard, uid);
  };

  const endTurn = () => {
    if (locked) return;
    setSelected(null);
    onCommand({ t: 'endTurn' });
  };

  useEffect(() => {
    if (locked) return;
    const handler = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement;
      if (/INPUT|TEXTAREA|SELECT/.test(target.tagName) || document.querySelector('dialog[open]')) return;
      const key = event.key.toLowerCase();
      if (/^[0-9]$/.test(key)) {
        const index = key === '0' ? 9 : Number(key) - 1;
        const card = combat.hand[index];
        if (card) { event.preventDefault(); pressCard(card); }
      } else if (key === 'e') {
        event.preventDefault();
        endTurn();
      } else if (key === 'arrowleft' || key === 'arrowright') {
        if (!alive.length) return;
        event.preventDefault();
        const current = alive.findIndex(enemy => enemy.uid === focusTarget);
        const step = key === 'arrowright' ? 1 : -1;
        setFocusTarget(alive[(current + step + alive.length) % alive.length].uid);
      } else if ((key === 'enter' || key === ' ') && selectedCard && !target.closest('button')) {
        event.preventDefault();
        pressCard(selectedCard);
      } else if (key === 'escape' && selected !== null) {
        event.preventDefault();
        event.stopPropagation();
        setSelected(null);
        setHint('');
      }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  });

  const playableCount = combat.hand.filter(card => cardStats(card).cost <= player.energy).length;
  const incoming = useMemo(() => alive.reduce((sum, enemy) => {
    const move = ENEMIES[enemy.defId].moves[enemy.intent];
    return sum + (move?.effects ?? []).reduce((s, e) => s + (e.k === 'attack' ? attackDamage(e.n, enemy.statuses, player.statuses) * (e.times ?? 1) : 0), 0);
  }, 0), [alive, player.statuses]);
  const fxFor = (target: 'player' | number) => combat.fx.filter(item => item.target === target);
  const lastHit = (target: 'player' | number) => [...combat.fx].reverse().find(item => item.target === target && item.kind === 'damage')?.id;
  const moveLabel = (uid: number) => combat.fx.find(item => item.target === uid && item.label?.startsWith('move:'));
  const pileCards = pile ? [...combat[pile]].sort((a, b) => (pile === 'draw' ? a.id.localeCompare(b.id) : 0) || a.uid - b.uid) : [];

  return (
    <section className={`nt-combat nt-combat-${combat.kind}`} aria-label="전투">
      <div className="nt-stage">
        <div className="nt-fighter nt-player">
          <span className="nt-fighter-art" key={`p-${lastHit('player') ?? 0}`}>
            <span className={lastHit('player') ? 'nt-hit' : ''}><Conductor photo={photo} /></span>
          </span>
          <FxLayer items={fxFor('player')} />
          <div className="nt-fighter-info">
            <strong className="nt-fighter-name">견습 차장</strong>
            <HpBar hp={run.hp} max={run.maxHp} block={player.block} label="내 체력" />
            <StatusList statuses={player.statuses} />
          </div>
        </div>

        <div className={`nt-enemies count-${combat.enemies.length}`}>
          {combat.enemies.map(enemy => {
            const def = ENEMIES[enemy.defId];
            const Art = ENEMY_ART[enemy.defId];
            const dead = enemy.hp <= 0;
            const label = moveLabel(enemy.uid);
            const isTarget = !dead && (focusTarget === enemy.uid || (targeting && previewTarget?.uid === enemy.uid));
            return (
              <div key={enemy.uid} className={`nt-fighter nt-enemy nt-enemy-${def.kind}${dead ? ' is-dead' : ''}${targeting && !dead ? ' is-targetable' : ''}${isTarget ? ' is-focused' : ''}`}>
                {!dead && <IntentBadge enemy={enemy} damageTo={base => attackDamage(base, enemy.statuses, player.statuses)} />}
                {label && <span key={label.id} className="nt-move-bubble" aria-hidden="true">{label.label!.slice(5)}</span>}
                <button type="button" className="nt-enemy-button" disabled={dead || locked}
                  aria-label={`${def.name}, 체력 ${enemy.hp} / ${enemy.maxHp}${enemy.block ? `, 방어 ${enemy.block}` : ''}${targeting ? '. 눌러서 대상으로 지정' : ''}`}
                  onClick={() => pressEnemy(enemy.uid)}>
                  <span className="nt-fighter-art" key={`e-${enemy.uid}-${lastHit(enemy.uid) ?? 0}`}>
                    <span className={lastHit(enemy.uid) ? 'nt-hit' : ''}><Art /></span>
                  </span>
                </button>
                <FxLayer items={fxFor(enemy.uid)} />
                <div className="nt-fighter-info">
                  <strong className="nt-fighter-name">{def.name}</strong>
                  <HpBar hp={enemy.hp} max={enemy.maxHp} block={enemy.block} label={`${def.name} 체력`} />
                  <StatusList statuses={enemy.statuses} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="nt-table">
        <div className="nt-table-top">
          <div className="nt-energy" aria-label={`에너지 ${player.energy} / ${player.maxEnergy}`}>
            <Lightning size={18} weight="fill" aria-hidden="true" />
            <b>{player.energy}</b><span>/{player.maxEnergy}</span>
          </div>
          <p className="nt-hint" role="status" aria-live="polite">
            {hint || (incoming > 0 ? `이번 턴에 받을 공격 ${incoming}${player.block ? ` · 방어 ${player.block}` : ''}` : `${combat.turn}번째 턴 · 카드를 골라 사용하세요`)}
          </p>
          <div className="nt-piles">
            <button type="button" onClick={() => setPile('draw')} aria-label={`뽑을 카드 ${combat.draw.length}장 보기`}><Stack size={16} aria-hidden="true" />{combat.draw.length}</button>
            <button type="button" onClick={() => setPile('discard')} aria-label={`버린 카드 ${combat.discard.length}장 보기`}><Trash size={16} aria-hidden="true" />{combat.discard.length}</button>
            {combat.exhausted.length > 0 && <button type="button" onClick={() => setPile('exhausted')} aria-label={`소멸한 카드 ${combat.exhausted.length}장 보기`}><Fire size={16} aria-hidden="true" />{combat.exhausted.length}</button>}
          </div>
        </div>
        <div className="nt-hand" role="group" aria-label={`손패 ${combat.hand.length}장`}>
          {combat.hand.length === 0 && <p className="nt-empty-hand">손에 카드가 없어요. 턴을 마치세요.</p>}
          {combat.hand.map((card, index) => {
            const affordable = cardStats(card).cost <= player.energy;
            return (
              <div key={card.uid} className={`nt-hand-slot${affordable ? '' : ' is-unaffordable'}`} style={{ ['--i' as string]: index, ['--n' as string]: combat.hand.length }}>
                <span className="nt-hand-key" aria-hidden="true">{index === 9 ? 0 : index + 1}</span>
                <CardView card={card} selected={selected === card.uid} onClick={() => pressCard(card)}
                  ctx={{ damage: base => attackDamage(base, player.statuses, previewTarget?.statuses), block: player.block }} />
              </div>
            );
          })}
        </div>
        <div className="nt-table-bottom">
          <button type="button" className="nt-link-button" onClick={onOpenDeck}>덱 전체 {run.deck.length}장</button>
          <button type="button" className={`nt-end-turn${playableCount === 0 ? ' is-ready' : ''}`} onClick={endTurn} disabled={locked}>
            <HourglassMedium size={18} weight="fill" aria-hidden="true" />턴 종료<kbd>E</kbd>
          </button>
        </div>
      </div>

      <div className="nt-sr-log" aria-live="polite">{combat.log.slice(-1)[0]}</div>

      {pile && (
        <Modal label={PILE_NAMES[pile]} onClose={() => setPile(null)} wide>
          <p className="nt-modal-kicker">{PILE_NAMES[pile]} · {pileCards.length}장</p>
          <h2>{pile === 'draw' ? '아직 뽑지 않은 카드' : pile === 'discard' ? '이번 전투에서 쓴 카드' : '이번 전투에서는 다시 오지 않아요'}</h2>
          {pile === 'draw' && <p className="nt-muted">순서는 감춰 두고 이름순으로 보여 드려요.</p>}
          <div className="nt-card-grid">{pileCards.length ? pileCards.map(card => <CardView key={card.uid} card={card} compact />) : <p className="nt-muted">비어 있어요.</p>}</div>
        </Modal>
      )}
    </section>
  );
}
