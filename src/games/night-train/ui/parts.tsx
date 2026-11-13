import { useEffect, useRef, type ReactNode } from 'react';
import {
  CARDS, ENEMIES, RARITY_NAMES, RELICS, STATUS_INFO, TYPE_NAMES, cardStats, describeCard,
  type CardInstance, type DescribeContext, type EnemyState, type StatusId, type Statuses,
} from '../engine';
import { CARD_GLYPH, Glyph, RELIC_GLYPH, STATUS_GLYPH } from './glyphs';

export function Modal({ label, onClose, children, wide = false }: { label: string; onClose?: () => void; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog ref={ref} className={`nt-modal${wide ? ' nt-modal-wide' : ''}`} aria-label={label}
      onCancel={event => { event.preventDefault(); onClose?.(); }}>
      {onClose && <button type="button" className="nt-modal-close" aria-label="닫기" onClick={onClose}><Glyph name="close" size={18} /></button>}
      {children}
    </dialog>
  );
}

const SERIAL = Object.fromEntries(Object.keys(CARDS).map((id, index) => [id, String(index + 1).padStart(3, '0')]));
const RARITY_PIPS = { starter: 0, common: 1, uncommon: 2, rare: 3 } as const;
const TYPE_LABEL = { attack: '공격', skill: '기술', power: '능력' } as const;

/** Splits a rule line so numbers can be set in the display face and coloured when modified. */
function RuleLine({ text, base }: { text: string; base: string }) {
  const parts = text.split(/(\d+)/);
  const nums = text.match(/\d+/g)?.map(Number) ?? [];
  const baseNums = base.match(/\d+/g)?.map(Number) ?? [];
  const tone = nums[0] !== undefined && baseNums[0] !== undefined && nums[0] !== baseNums[0] ? (nums[0] > baseNums[0] ? ' is-boosted' : ' is-reduced') : '';
  const keyword = text === '소멸' || text === '전투 내내 유지';
  return <span className={`${tone}${keyword ? ' is-keyword' : ''}`}>{parts.map((part, i) => (i % 2 ? <b key={i}>{part}</b> : part))}</span>;
}

export function CardView({ card, ctx, selected, disabled, onClick, label, size, showUpgrade, className = '' }: {
  card: CardInstance;
  ctx?: DescribeContext;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  label?: string;
  size?: 'compact' | 'large';
  showUpgrade?: boolean;
  className?: string;
}) {
  const def = CARDS[card.id];
  const shown = showUpgrade ? { ...card, up: true } : card;
  const stats = cardStats(shown);
  const lines = describeCard(shown, ctx);
  const baseLines = describeCard(shown);
  const cheaper = stats.cost < def.cost;
  const body = (
    <>
      <span className={`nt-card-cost${cheaper ? ' is-cheaper' : ''}`} aria-hidden="true">{stats.cost}</span>
      <span className="nt-card-band" aria-hidden="true">{TYPE_LABEL[def.type]}<i>No.{SERIAL[card.id]}</i></span>
      <span className="nt-card-name">{def.name}</span>
      <span className="nt-card-art" aria-hidden="true"><Glyph name={CARD_GLYPH[card.id]} size={size === 'compact' ? 26 : 32} strokeWidth={1.6} /></span>
      <span className="nt-card-text">{lines.map((text, i) => <RuleLine key={text + i} text={text} base={baseLines[i] ?? text} />)}</span>
      <span className="nt-card-flavor">{def.flavor}</span>
      <span className="nt-card-foot" aria-hidden="true">
        <span>{RARITY_NAMES[def.rarity]}</span>
        <span className="nt-rarity">{[1, 2, 3].map(n => <span key={n} className={n <= RARITY_PIPS[def.rarity] ? 'on' : ''} />)}</span>
      </span>
    </>
  );
  const classes = `nt-card nt-card-${def.type} nt-rarity-${def.rarity}${selected ? ' is-selected' : ''}${shown.up ? ' is-up' : ''}${size ? ` is-${size}` : ''} ${className}`;
  const aria = label ?? `${def.name}${shown.up ? '+' : ''}, 비용 ${stats.cost}, ${TYPE_NAMES[def.type]}. ${lines.join(', ')}`;
  if (!onClick) return <div className={classes} role="img" aria-label={aria}>{body}</div>;
  return <button type="button" className={classes} aria-label={aria} aria-pressed={selected} disabled={disabled} onClick={onClick}>{body}</button>;
}

export function StatusList({ statuses }: { statuses: Statuses }) {
  const entries = (Object.entries(statuses) as [StatusId, number][]).filter(([, value]) => value);
  return (
    <ul className="nt-statuses" aria-label="상태">
      {entries.map(([id, value]) => {
        const info = STATUS_INFO[id];
        return (
          <li key={id} className={info.debuff ? 'is-debuff' : 'is-buff'} title={`${info.name} ${value}: ${info.desc}`} aria-label={`${info.name} ${value}. ${info.desc}`}>
            <Glyph name={STATUS_GLYPH[id]} size={14} strokeWidth={2} /><span aria-hidden="true">{value}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function intentSummary(enemy: Pick<EnemyState, 'defId' | 'intent'>, damageTo: (base: number) => number) {
  const move = ENEMIES[enemy.defId].moves[enemy.intent];
  if (!move) return { move: null, damage: 0, hits: 0, text: '' };
  let damage = 0, hits = 0;
  const parts: string[] = [];
  for (const effect of move.effects) {
    if (effect.k === 'attack') {
      damage = damageTo(effect.n);
      hits = effect.times ?? 1;
      parts.push(hits > 1 ? `${damage}×${hits} 공격` : `${damage} 공격`);
    } else if (effect.k === 'block' || effect.k === 'blockAll') parts.push(`방어 ${effect.n}`);
    else if (effect.k === 'buff' || effect.k === 'buffAll') parts.push(`${STATUS_INFO[effect.status].name} +${effect.n}`);
    else if (effect.k === 'debuff') parts.push(`${STATUS_INFO[effect.status].name} ${effect.n} 걸기`);
  }
  return { move, damage, hits, text: parts.join(', ') };
}

/** The enemy's next move, printed on a luggage tag hanging above its head. */
export function IntentTag({ enemy, damageTo }: { enemy: Pick<EnemyState, 'defId' | 'intent'>; damageTo: (base: number) => number }) {
  const { move, damage, hits, text } = intentSummary(enemy, damageTo);
  if (!move) return null;
  const attack = move.intent.startsWith('attack');
  const defend = move.intent.includes('defend');
  const buff = move.intent.includes('buff') && !move.intent.includes('debuff');
  const debuff = move.intent.includes('debuff');
  return (
    <>
      <div className={`nt-tag${attack ? ' is-attack' : ''}`} role="img" title={`${move.name}: ${text}`} aria-label={`다음 행동 ${move.name}: ${text}`}>
        {attack && <><Glyph name="sword" size={16} strokeWidth={2} /><b>{damage}{hits > 1 ? `×${hits}` : ''}</b></>}
        {defend && <Glyph name="shield" size={16} strokeWidth={2} />}
        {buff && <Glyph name="up" size={16} strokeWidth={2} />}
        {debuff && <Glyph name="spiral" size={16} strokeWidth={2} />}
        <span className="nt-tag-name">{move.name}</span>
      </div>
      <span className="nt-tag-string" aria-hidden="true" />
    </>
  );
}

export function RelicIcon({ id, size = 22 }: { id: string; size?: number }) {
  return <Glyph name={RELIC_GLYPH[RELICS[id]?.icon] ?? 'spark'} size={size} />;
}

export function HpBar({ hp, max, block = 0, label }: { hp: number; max: number; block?: number; label: string }) {
  const ratio = `${Math.max(0, Math.min(1, hp / max)) * 100}%`;
  return (
    <div className={`nt-hp${block > 0 ? ' has-block' : ''}`} role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={hp}
      aria-valuetext={`${hp} / ${max}${block ? `, 방어 ${block}` : ''}`}>
      <span className="nt-hp-lag" style={{ width: `calc(${ratio} - 2px)` }} />
      <span className="nt-hp-fill" style={{ width: `calc(${ratio} - 2px)` }} />
      <span className="nt-hp-text">{hp} / {max}</span>
      {block > 0 && <span className="nt-block" aria-hidden="true"><Glyph name="shield" size={30} strokeWidth={1.6} /><b>{block}</b></span>}
    </div>
  );
}

export function Stamp({ glyph, size = 30, className = '' }: { glyph: string; size?: number; className?: string }) {
  return <span className={`nt-stamp ${className}`} aria-hidden="true"><Glyph name={glyph} size={size} /></span>;
}
