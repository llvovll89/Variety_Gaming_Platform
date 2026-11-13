import { useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import {
  ENEMIES, SNACKS, STATUS_INFO, aliveEnemies, attackDamage, cardStats, checkPlay, checkSnack, cuesForFx, needsTarget,
  type CardInstance, type Command, type Fx, type Frame, type RunState, type StatusId,
} from '../engine';
import { sound } from './sound';
import { Carriage, Conductor, ENEMY_ART } from './art';
import { Glyph } from './glyphs';
import { CardView, HpBar, IntentTag, Modal, StatusList } from './parts';

function FxLayer({ items }: { items: Fx[] }) {
  return (
    <span className="nt-fx-layer" aria-hidden="true">
      {items.map((item, index) => {
        let text = '';
        if (item.kind === 'damage') text = `${item.amount}`;
        else if (item.kind === 'block') text = `방어 +${item.amount}`;
        else if (item.kind === 'blocked') text = '막음';
        else if (item.kind === 'heal') text = `+${item.amount}`;
        else if (item.label) text = `${STATUS_INFO[item.label as StatusId]?.name ?? ''} ${item.amount}`;
        const big = item.kind === 'damage' && item.amount >= 15;
        return (
          <span key={item.id} className={`nt-fx nt-fx-${item.kind}${big ? ' is-big' : ''}`}
            style={{ animationDelay: `${index * 120}ms`, top: `${(index % 3) * 26}px`, ['--fx-shift' as string]: `${(index % 2 ? 1 : -1) * (8 + (index % 3) * 8)}px` }}>{text}</span>
        );
      })}
    </span>
  );
}

type PileName = 'draw' | 'discard' | 'exhausted';
const PILE_NAMES: Record<PileName, string> = { draw: '뽑을 더미', discard: '버린 더미', exhausted: '소멸한 카드' };
type Ribbon = { key: number; kind: 'player' | 'enemy' | 'win' | 'lose'; title: string; sub: string };
type DragState = { uid: number; x0: number; y0: number; x: number; y: number; moved: boolean; originX: number; originY: number };

const FRAME_MS = { player: 620, enemy: 820 };

export default function CombatView({ run, onCommand, photo, locked, ending, onEnded, aimSnack, onCancelSnack }: {
  run: RunState;
  onCommand: (command: Command) => void;
  photo: string | null;
  locked: boolean;
  /** Set once the fight is over; the view plays its last beat, then calls onEnded. */
  ending: 'win' | 'lose' | null;
  onEnded: () => void;
  aimSnack: number | null;
  onCancelSnack: () => void;
}) {
  const combat = run.combat!;
  const [selected, setSelected] = useState<number | null>(null);
  const [focusTarget, setFocusTarget] = useState<number | null>(null);
  const [pile, setPile] = useState<PileName | null>(null);
  const [hint, setHint] = useState<{ text: string; warn?: boolean } | null>(null);
  const [replay, setReplay] = useState<{ key: number; step: number } | null>(null);
  const [ribbon, setRibbon] = useState<Ribbon | null>(null);
  const [flying, setFlying] = useState<{ seq: number; card: CardInstance; x: number; y: number } | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const suppressClick = useRef(false);
  const started = useRef<number | null>(null);
  const flown = useRef<number | null>(combat.lastPlayed?.seq ?? null);
  const root = useRef<HTMLElement>(null);
  const handRef = useRef<HTMLDivElement>(null);
  const enemyRefs = useRef(new Map<number, HTMLElement>());
  const showRibbon = (next: Ribbon) => {
    setRibbon(next);
    sound.play(next.kind === 'enemy' ? 'horn' : next.kind === 'player' ? 'whistle' : next.kind === 'win' ? 'victory' : 'defeat');
    if (next.kind === 'player') sound.play('deal', 0.6, 0.35);
  };
  const warn = (text: string) => { setHint({ text, warn: true }); sound.play('buzz'); };

  // ── Replay of the enemy turn, one beat at a time ──
  const replayKey = combat.frames.length ? run.fxSeq : null;
  useEffect(() => {
    if (replayKey === null || started.current === replayKey) return;
    started.current = replayKey;
    setSelected(null);
    setReplay({ key: replayKey, step: -1 });
    showRibbon({ key: replayKey, kind: 'enemy', title: '상대의 차례', sub: 'SHADOWS MOVE' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replayKey]);
  useEffect(() => {
    if (!replay) return;
    const frames = combat.frames;
    if (replay.step >= frames.length) {
      setReplay(null);
      if (!ending) showRibbon({ key: Date.now(), kind: 'player', title: `${combat.turn}번째 턴`, sub: 'YOUR MOVE' });
      return;
    }
    const current = frames[replay.step];
    const wait = replay.step < 0 ? 700 : current.actor === 'player' ? FRAME_MS.player : FRAME_MS.enemy;
    const timer = window.setTimeout(() => setReplay(r => (r && r.key === replay.key ? { ...r, step: r.step + 1 } : r)), wait);
    return () => window.clearTimeout(timer);
  }, [replay, combat.frames, combat.turn, ending]);
  const replaying = replay !== null;
  const frame: Frame | null = replay && replay.step >= 0 ? combat.frames[replay.step] ?? null : null;

  // ── Ending beat ──
  useEffect(() => {
    if (!ending || replaying) return;
    showRibbon({ key: Date.now(), kind: ending, title: ending === 'win' ? '객차를 지켜 냈어요' : '열차가 멈춰 섭니다', sub: ending === 'win' ? 'VICTORY' : 'END OF THE LINE' });
    const timer = window.setTimeout(onEnded, ending === 'win' ? 1300 : 1800);
    return () => window.clearTimeout(timer);
  }, [ending, replaying, onEnded]);

  // ── Card flight towards its target ──
  useLayoutEffect(() => {
    const last = combat.lastPlayed;
    if (!last || flown.current === last.seq) return;
    flown.current = last.seq;
    const box = root.current?.getBoundingClientRect();
    const hand = handRef.current?.getBoundingClientRect();
    const target = last.target !== undefined ? enemyRefs.current.get(last.target)?.getBoundingClientRect() : undefined;
    let x = 0, y = -160;
    if (box && hand) {
      const fromX = box.left + box.width / 2, fromY = hand.top + 40;
      if (target) { x = target.left + target.width / 2 - fromX; y = target.top + target.height / 2 - fromY; }
      else y = -Math.min(220, (hand.top - box.top) * 0.45);
    }
    setFlying({ seq: last.seq, card: last.card, x, y });
    sound.play('whoosh');
  }, [combat.lastPlayed]);
  useEffect(() => {
    if (!flying) return;
    const timer = window.setTimeout(() => setFlying(null), 560);
    return () => window.clearTimeout(timer);
  }, [flying]);

  // ── What the board shows: the replay frame while it plays, the live state otherwise ──
  const view = useMemo(() => {
    if (!frame) return { hp: run.hp, block: combat.player.block, statuses: combat.player.statuses, enemies: combat.enemies, fx: replaying ? [] : combat.fx };
    const enemies = combat.enemies.map(e => {
      const snap = frame.enemies.find(s => s.uid === e.uid);
      return snap ? { ...e, hp: snap.hp, block: snap.block, statuses: snap.statuses, intent: snap.intent } : e;
    });
    return { hp: frame.hp, block: frame.block, statuses: frame.playerStatuses, enemies, fx: frame.fx };
  }, [frame, replaying, run.hp, combat]);

  // Sound follows what is on screen: live effects, or the beat of the replay being shown.
  const fxKey = view.fx.length ? `${view.fx[0].id}:${view.fx.length}` : '';
  useEffect(() => {
    if (!fxKey) return;
    for (const event of cuesForFx(view.fx)) sound.play(event.cue, event.intensity, event.delay + 0.08);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fxKey]);
  const enragedCount = combat.enemies.filter(e => e.enraged).length;
  const lastEnraged = useRef(enragedCount);
  useEffect(() => {
    if (enragedCount > lastEnraged.current) sound.play('roar', 1, 0.2);
    lastEnraged.current = enragedCount;
  }, [enragedCount]);

  const { player } = combat;
  const alive = aliveEnemies(combat);
  const busy = locked || replaying || !!ending;
  const selectedCard = combat.hand.find(card => card.uid === selected) ?? null;
  const snackNeedsTarget = aimSnack !== null && !!SNACKS[run.snacks[aimSnack]]?.target;
  const wantsTarget = snackNeedsTarget || (!!selectedCard && needsTarget(selectedCard) && alive.length > 1);
  const previewTarget = alive.find(enemy => enemy.uid === focusTarget) ?? (alive.length === 1 ? alive[0] : undefined);

  useEffect(() => {
    if (selected !== null && !combat.hand.some(card => card.uid === selected)) setSelected(null);
    if (focusTarget !== null && !alive.some(enemy => enemy.uid === focusTarget)) setFocusTarget(null);
  }, [combat.hand, alive, selected, focusTarget]);
  useEffect(() => { setHint(null); }, [combat.turn]);
  useEffect(() => {
    if (snackNeedsTarget && aimSnack !== null) setHint({ text: `${SNACKS[run.snacks[aimSnack]].name}을(를) 줄 적을 고르세요. Esc로 취소.` });
  }, [snackNeedsTarget, aimSnack, run.snacks]);

  const play = (card: CardInstance, target?: number) => {
    const check = checkPlay(run, card.uid, target);
    if (!check.ok) { warn(check.reason); return; }
    onCommand({ t: 'play', uid: card.uid, target: check.target });
    setSelected(null);
    setHint(null);
  };

  const pressCard = (card: CardInstance) => {
    if (busy) return;
    if (suppressClick.current) { suppressClick.current = false; return; }
    if (aimSnack !== null) onCancelSnack();
    if (cardStats(card).cost > player.energy) { setSelected(card.uid); warn('증기가 부족해요. 턴을 마치면 다시 채워집니다.'); return; }
    if (selected !== card.uid) {
      setSelected(card.uid);
      sound.play('flick');
      setHint({ text: needsTarget(card) && alive.length > 1 ? '어느 적에게 쓸까요? 적을 누르거나 카드를 끌어다 놓으세요.' : '한 번 더 누르거나 위로 끌어 올리면 사용합니다.' });
      return;
    }
    if (needsTarget(card) && alive.length > 1) {
      if (focusTarget !== null && alive.some(enemy => enemy.uid === focusTarget)) play(card, focusTarget);
      else setHint({ text: '어느 적에게 쓸까요? 적을 눌러 주세요.' });
      return;
    }
    play(card);
  };

  const pressEnemy = (uid: number) => {
    if (busy) return;
    setFocusTarget(uid);
    if (snackNeedsTarget && aimSnack !== null) {
      if (checkSnack(run, aimSnack, uid).ok) onCommand({ t: 'useSnack', index: aimSnack, target: uid });
      onCancelSnack();
      setHint(null);
      return;
    }
    if (selectedCard && needsTarget(selectedCard)) play(selectedCard, uid);
  };

  const endTurn = () => {
    if (busy) return;
    setSelected(null);
    sound.play('lever');
    onCommand({ t: 'endTurn' });
  };

  // ── Drag to play ──
  const enemyAt = (x: number, y: number) => {
    for (const el of document.elementsFromPoint(x, y)) {
      const uid = (el as HTMLElement).dataset?.enemyUid;
      if (uid !== undefined) return Number(uid);
    }
    return undefined;
  };
  const onPointerDown = (card: CardInstance, event: ReactPointerEvent<HTMLDivElement>) => {
    if (busy || event.button !== 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    dragRef.current = { uid: card.uid, x0: event.clientX, y0: event.clientY, x: event.clientX, y: event.clientY, moved: false, originX: rect.left + rect.width / 2, originY: rect.top + 10 };
  };
  const onPointerMove = (card: CardInstance, event: ReactPointerEvent<HTMLDivElement>) => {
    const current = dragRef.current;
    if (!current || current.uid !== card.uid) return;
    const next = { ...current, x: event.clientX, y: event.clientY };
    if (!current.moved && Math.hypot(next.x - current.x0, next.y - current.y0) > 12) {
      next.moved = true;
      try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* pointer already gone */ }
      setSelected(card.uid);
      sound.play('flick');
    }
    dragRef.current = next;
    if (next.moved) {
      setDrag(next);
      if (needsTarget(card)) {
        const uid = enemyAt(next.x, next.y);
        if (uid !== undefined) setFocusTarget(uid);
      }
    }
  };
  const onPointerUp = (card: CardInstance) => {
    const current = dragRef.current;
    dragRef.current = null;
    if (!current || !current.moved) return;
    suppressClick.current = true;
    window.setTimeout(() => { suppressClick.current = false; }, 0);
    setDrag(null);
    const handTop = handRef.current?.getBoundingClientRect().top ?? window.innerHeight;
    const lifted = current.y < handTop - 24;
    if (cardStats(card).cost > player.energy) { warn('증기가 부족해요. 턴을 마치면 다시 채워집니다.'); return; }
    if (needsTarget(card)) {
      const uid = enemyAt(current.x, current.y);
      if (uid !== undefined) play(card, uid);
      else if (lifted && alive.length === 1) play(card, alive[0].uid);
      else setHint({ text: '적 위에 놓아야 써요.' });
    } else if (lifted) play(card);
  };
  const onPointerCancel = () => { dragRef.current = null; setDrag(null); };

  // ── Keyboard ──
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement;
      if (/INPUT|TEXTAREA|SELECT/.test(target.tagName) || document.querySelector('dialog[open]')) return;
      const key = event.key.toLowerCase();
      if (key === 'escape' && (selected !== null || aimSnack !== null)) {
        event.preventDefault();
        event.stopPropagation();
        setSelected(null);
        setHint(null);
        if (aimSnack !== null) onCancelSnack();
        return;
      }
      if (busy) return;
      if (/^[0-9]$/.test(key)) {
        const card = combat.hand[key === '0' ? 9 : Number(key) - 1];
        if (card) { event.preventDefault(); pressCard(card); }
      } else if (key === 'e') {
        event.preventDefault();
        endTurn();
      } else if (key === 'arrowleft' || key === 'arrowright') {
        if (!alive.length) return;
        event.preventDefault();
        const current = alive.findIndex(enemy => enemy.uid === focusTarget);
        setFocusTarget(alive[(current + (key === 'arrowright' ? 1 : -1) + alive.length) % alive.length].uid);
      } else if ((key === 'enter' || key === ' ') && selectedCard && !target.closest('button')) {
        event.preventDefault();
        pressCard(selectedCard);
      }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  });

  const playableCount = combat.hand.filter(card => cardStats(card).cost <= player.energy).length;
  const incoming = alive.reduce((sum, enemy) => {
    const move = ENEMIES[enemy.defId].moves[enemy.intent];
    return sum + (move?.effects ?? []).reduce((s, e) => s + (e.k === 'attack' ? attackDamage(e.n, enemy.statuses, player.statuses) * (e.times ?? 1) : 0), 0);
  }, 0);
  const fxFor = (target: 'player' | number) => view.fx.filter(item => item.target === target);
  const lastHit = (target: 'player' | number) => [...view.fx].reverse().find(item => item.target === target && item.kind === 'damage')?.id;
  const bigHit = view.fx.find(item => item.target === 'player' && item.kind === 'damage' && item.amount >= 8);
  const pileCards = pile ? [...combat[pile]].sort((a, b) => (pile === 'draw' ? a.id.localeCompare(b.id) : 0) || a.uid - b.uid) : [];
  const dragging = drag ? combat.hand.find(card => card.uid === drag.uid) : undefined;
  const aiming = !!dragging && needsTarget(dragging);
  const remaining = Math.max(0, incoming - player.block);

  let hintNode: ReactNode;
  if (hint) hintNode = hint.text;
  else if (replaying) hintNode = '상대가 움직이는 중…';
  else if (ending) hintNode = '';
  else if (incoming > 0) hintNode = <>이번 턴 받을 공격 <b>{incoming}</b>{player.block ? <> · 방어 {player.block} → 남는 피해 <b>{remaining}</b></> : null}</>;
  else hintNode = '상대는 이번 턴에 공격하지 않아요. 힘을 모아 두세요.';

  return (
    <section ref={root} className={`nt-combat nt-combat-${combat.kind}`} aria-label="전투">
      <div className="nt-carriage">
        <Carriage boss={combat.kind === 'boss'} />
        <div className={`nt-stage${bigHit ? ' is-shaking' : ''}`} key={bigHit ? `shake-${bigHit.id}` : 'stage'}>
          <div className={`nt-fighter nt-player${frame?.actor === 'player' ? ' is-acting' : ''}`}>
            <span className="nt-fighter-art">
              <span className="nt-body" key={`p-${lastHit('player') ?? 0}`}>
                <span className={lastHit('player') ? 'nt-hit' : ''}><Conductor photo={photo} /></span>
              </span>
            </span>
            <FxLayer items={fxFor('player')} />
            <div className="nt-plate">
              <span className="nt-plate-name">견습 차장<small>CONDUCTOR</small></span>
              <HpBar hp={view.hp} max={run.maxHp} block={view.block} label="내 체력" />
              <StatusList statuses={view.statuses} />
            </div>
          </div>

          <div className={`nt-enemies count-${combat.enemies.length}`}>
            {view.enemies.map(enemy => {
              const def = ENEMIES[enemy.defId];
              const Art = ENEMY_ART[enemy.defId];
              const dead = enemy.hp <= 0;
              const isFocused = !dead && focusTarget === enemy.uid && (wantsTarget || aiming || !!selectedCard);
              const acting = frame?.actor === enemy.uid;
              return (
                <div key={enemy.uid} className={`nt-fighter nt-enemy nt-enemy-${def.kind}${dead ? ' is-dead' : ''}${(wantsTarget || aiming) && !dead ? ' is-targetable' : ''}${isFocused ? ' is-focused' : ''}${acting ? ' is-acting' : ''}`}>
                  {!dead && <IntentTag enemy={enemy} damageTo={base => attackDamage(base, enemy.statuses, view.statuses)} />}
                  <button type="button" className="nt-enemy-button" disabled={dead || busy} data-enemy-uid={enemy.uid}
                    ref={el => { if (el) enemyRefs.current.set(enemy.uid, el); else enemyRefs.current.delete(enemy.uid); }}
                    aria-label={`${def.name}, 체력 ${enemy.hp} / ${enemy.maxHp}${enemy.block ? `, 방어 ${enemy.block}` : ''}${wantsTarget ? '. 눌러서 대상으로 지정' : ''}`}
                    onClick={() => pressEnemy(enemy.uid)}>
                    <span className="nt-fighter-art" data-enemy-uid={enemy.uid}>
                      <span className="nt-body" key={`e-${enemy.uid}-${lastHit(enemy.uid) ?? 0}`} data-enemy-uid={enemy.uid}>
                        <span className={lastHit(enemy.uid) ? 'nt-hit' : ''} data-enemy-uid={enemy.uid}><Art /></span>
                      </span>
                    </span>
                  </button>
                  <FxLayer items={fxFor(enemy.uid)} />
                  <div className="nt-plate">
                    <span className="nt-plate-name">{def.name}<small>{def.kind === 'boss' ? '종착역의 주인' : def.kind === 'elite' ? '강적' : ''}</small></span>
                    <HpBar hp={enemy.hp} max={enemy.maxHp} block={enemy.block} label={`${def.name} 체력`} />
                    <StatusList statuses={enemy.statuses} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {ribbon && (
          <div key={ribbon.key} className={`nt-ribbon is-${ribbon.kind}`} role="status" onAnimationEnd={() => { if (ribbon.kind === 'player' || ribbon.kind === 'enemy') setRibbon(null); }}>
            <small>{ribbon.sub}</small><b>{ribbon.title}</b>
          </div>
        )}
        {flying && <div key={flying.seq} className="nt-flying" style={{ ['--fly-x' as string]: `${flying.x}px`, ['--fly-y' as string]: `${flying.y}px` }} aria-hidden="true"><CardView card={flying.card} /></div>}
      </div>

      <div className="nt-table">
        <p className={`nt-hint${hint?.warn ? ' is-warn' : ''}`} role="status" aria-live="polite">{hintNode}</p>
        <div className="nt-table-left">
          <div className={`nt-gauge${player.energy === 0 ? ' is-empty' : ''}`} role="img" aria-label={`증기 ${player.energy} / ${player.maxEnergy}`}>
            <b>{player.energy}<span>/{player.maxEnergy}</span></b><small>STEAM</small>
          </div>
          <button type="button" className="nt-pile" onClick={() => setPile('draw')} aria-label={`뽑을 더미 ${combat.draw.length}장 보기`}><Glyph name="deck" size={16} /><b>{combat.draw.length}</b><span>뽑을 더미</span></button>
        </div>
        <div ref={handRef} className={`nt-hand${replaying || ending ? ' is-waiting' : ''}`} role="group" aria-label={`손패 ${combat.hand.length}장`} key={`hand-${combat.turn}`}>
          {combat.hand.length === 0 && !ending && <p className="nt-empty-hand">손에 카드가 없어요. 턴을 마치세요.</p>}
          {combat.hand.map((card, index) => {
            const affordable = cardStats(card).cost <= player.energy;
            const isDragging = drag?.uid === card.uid && drag.moved;
            const follow = isDragging && !needsTarget(card);
            return (
              <div key={card.uid}
                className={`nt-hand-slot${affordable ? '' : ' is-unaffordable'}${selected === card.uid && !isDragging ? ' is-selected' : ''}${isDragging ? (follow ? ' is-dragging' : ' is-aiming') : ''}`}
                style={{ ['--i' as string]: index, ['--n' as string]: combat.hand.length, ...(follow && drag ? { transform: `translate(${drag.x - drag.x0}px, ${drag.y - drag.y0}px) rotate(${(drag.x - drag.x0) / 30}deg) scale(1.06)` } : {}) }}
                onPointerDown={event => onPointerDown(card, event)} onPointerMove={event => onPointerMove(card, event)}
                onPointerUp={() => onPointerUp(card)} onPointerCancel={onPointerCancel}>
                <span className="nt-hand-key" aria-hidden="true">{index === 9 ? 0 : index + 1}</span>
                <CardView card={card} selected={selected === card.uid} onClick={() => pressCard(card)}
                  ctx={{ damage: base => attackDamage(base, player.statuses, previewTarget?.statuses), block: player.block }} />
              </div>
            );
          })}
        </div>
        <div className="nt-table-right">
          <button type="button" className="nt-pile" onClick={() => setPile('discard')} aria-label={`버린 더미 ${combat.discard.length}장 보기`}><Glyph name="discard" size={16} /><b>{combat.discard.length}</b><span>버린 더미</span></button>
          {combat.exhausted.length > 0 && <button type="button" className="nt-pile" onClick={() => setPile('exhausted')} aria-label={`소멸한 카드 ${combat.exhausted.length}장 보기`}><Glyph name="ember" size={16} /><b>{combat.exhausted.length}</b><span>소멸</span></button>}
          <button type="button" className={`nt-end${playableCount === 0 && !busy ? ' is-ready' : ''}`} onClick={endTurn} disabled={busy}>
            <b><Glyph name="hourglass" size={18} />턴 종료</b><small>E 키</small>
          </button>
        </div>
      </div>

      {aiming && drag && (
        <svg className="nt-aim" aria-hidden="true">
          <path d={`M${drag.originX} ${drag.originY} Q${drag.originX} ${Math.min(drag.originY, drag.y) - 80} ${drag.x} ${drag.y}`} />
          <circle cx={drag.x} cy={drag.y} r="12" />
        </svg>
      )}

      <div className="nt-sr" aria-live="polite">{combat.log.slice(-1)[0]}</div>

      {pile && (
        <Modal label={PILE_NAMES[pile]} onClose={() => setPile(null)} wide>
          <p className="nt-modal-kicker">{PILE_NAMES[pile]} · {pileCards.length}장</p>
          <h2>{pile === 'draw' ? '아직 뽑지 않은 카드' : pile === 'discard' ? '이번 전투에서 쓴 카드' : '이번 전투에서는 돌아오지 않아요'}</h2>
          {pile === 'draw' && <p>순서는 감춰 두고 이름순으로 보여 드려요.</p>}
          <div className="nt-card-grid">{pileCards.length ? pileCards.map(card => <CardView key={card.uid} card={card} size="compact" />) : <p>비어 있어요.</p>}</div>
        </Modal>
      )}
    </section>
  );
}
