import { useEffect, useRef, type ReactNode } from 'react';
import {
  ArrowFatUp, Bed, Bell, Compass, Cookie, Cube, Drop, Fire, Flame, Flask, Gift, Ghost, HandFist, HardHat, Lamp, Lightning,
  Question, Shield, ShieldCheckered, Skull, Sparkle, Stack, Storefront, Sword, Ticket, TrainRegional, Watch, Wind, X,
} from '@phosphor-icons/react';
import {
  CARDS, ENEMIES, RARITY_NAMES, RELICS, STATUS_INFO, TYPE_NAMES, cardStats, describeCard,
  type CardInstance, type DescribeContext, type EnemyState, type NodeType, type StatusId, type Statuses,
} from '../engine';

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
      {onClose && <button type="button" className="nt-modal-close" aria-label="닫기" onClick={onClose}><X size={20} weight="bold" /></button>}
      {children}
    </dialog>
  );
}

export function CardView({ card, ctx, selected, disabled, onClick, label, compact, showUpgrade }: {
  card: CardInstance;
  ctx?: DescribeContext;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  label?: string;
  compact?: boolean;
  showUpgrade?: boolean;
}) {
  const def = CARDS[card.id];
  const shown = showUpgrade ? { ...card, up: true } : card;
  const stats = cardStats(shown);
  const lines = describeCard(shown, ctx);
  const costChanged = showUpgrade && stats.cost !== def.cost;
  const body = (
    <>
      <span className={`nt-card-cost${costChanged ? ' is-upgraded' : ''}`} aria-hidden="true">{stats.cost}</span>
      <span className="nt-card-head">
        <span className="nt-card-name">{def.name}{shown.up ? '+' : ''}</span>
        <span className="nt-card-type">{TYPE_NAMES[def.type]} · {RARITY_NAMES[def.rarity]}</span>
      </span>
      <span className="nt-card-art" aria-hidden="true"><CardGlyph id={card.id} /></span>
      <span className="nt-card-text">{lines.map(text => <span key={text}>{text}</span>)}</span>
      {!compact && <span className="nt-card-flavor">{def.flavor}</span>}
    </>
  );
  const className = `nt-card nt-card-${def.type} nt-rarity-${def.rarity}${selected ? ' is-selected' : ''}${shown.up ? ' is-up' : ''}${compact ? ' is-compact' : ''}`;
  const aria = label ?? `${def.name}${shown.up ? '+' : ''}, 비용 ${stats.cost}, ${TYPE_NAMES[def.type]}. ${lines.join(', ')}`;
  if (!onClick) return <div className={className} role="img" aria-label={aria}>{body}</div>;
  return <button type="button" className={className} aria-label={aria} aria-pressed={selected} disabled={disabled} onClick={onClick}>{body}</button>;
}

const GLYPHS: Record<string, typeof Sword> = {
  punch: Ticket, coat: Shield, 'lantern-flash': Lamp, 'double-punch': Ticket, whistle: TrainRegional, 'sudden-stop': Lightning,
  spark: Sparkle, gust: Wind, 'ember-toss': Fire, 'trunk-swing': Cube, umbrella: Shield, blanket: Bed, timetable: Stack,
  coffee: Flask, 'fog-window': Drop, 'steam-blast': Wind, 'luggage-slam': Cube, 'shooting-star': Sparkle, 'brake-lever': HandFist,
  'first-aid': Gift, 'luggage-wall': ShieldCheckered, focus: ArrowFatUp, 'iron-coat': ShieldCheckered, 'barbed-wire': Sparkle,
  rhythm: HandFist, 'last-train': TrainRegional, 'coal-burst': Flame, boiler: Fire, 'fire-engine': Flame, starlight: Sparkle, fortress: ShieldCheckered,
};

function CardGlyph({ id }: { id: string }) {
  const Icon = GLYPHS[id] ?? Sparkle;
  return <Icon size={30} weight="duotone" />;
}

const STATUS_ICONS: Record<StatusId, typeof Sword> = {
  strength: HandFist, weak: Drop, vulnerable: ShieldCheckered, burn: Flame, thorns: Sparkle, plating: Shield, drawUp: Stack, kindle: Fire,
};

export function StatusList({ statuses }: { statuses: Statuses }) {
  const entries = (Object.entries(statuses) as [StatusId, number][]).filter(([, value]) => value);
  if (!entries.length) return null;
  return (
    <ul className="nt-statuses" aria-label="상태">
      {entries.map(([id, value]) => {
        const Icon = STATUS_ICONS[id];
        const info = STATUS_INFO[id];
        return (
          <li key={id} className={info.debuff ? 'is-debuff' : 'is-buff'} title={`${info.name} ${value}: ${info.desc}`} aria-label={`${info.name} ${value}. ${info.desc}`}>
            <Icon size={14} weight="fill" aria-hidden="true" /><span aria-hidden="true">{value}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function intentSummary(enemy: EnemyState, damageTo: (base: number) => number) {
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

export function IntentBadge({ enemy, damageTo }: { enemy: EnemyState; damageTo: (base: number) => number }) {
  const { move, damage, hits, text } = intentSummary(enemy, damageTo);
  if (!move) return null;
  const attack = move.intent.startsWith('attack');
  const defend = move.intent.includes('defend');
  const buff = move.intent.includes('buff') && !move.intent.includes('debuff');
  const debuff = move.intent.includes('debuff');
  return (
    <div className={`nt-intent${attack ? ' is-attack' : ''}`} title={`${move.name}: ${text}`} aria-label={`다음 행동 ${move.name}: ${text}`}>
      {attack && <><Sword size={16} weight="fill" aria-hidden="true" /><b>{damage}{hits > 1 ? `×${hits}` : ''}</b></>}
      {defend && <Shield size={16} weight="fill" aria-hidden="true" />}
      {buff && <ArrowFatUp size={16} weight="fill" aria-hidden="true" />}
      {debuff && <Drop size={16} weight="fill" aria-hidden="true" />}
      <span className="nt-intent-name">{move.name}</span>
    </div>
  );
}

const RELIC_ICONS: Record<string, typeof Sword> = {
  lantern: Lamp, thermos: Flask, glove: HandFist, candy: Cookie, scarf: Wind, cap: HardHat, bell: Bell, coal: Cube,
  flint: Fire, compass: Compass, ticket: Ticket, watch: Watch,
};

export function RelicIcon({ id, size = 22 }: { id: string; size?: number }) {
  const Icon = RELIC_ICONS[RELICS[id]?.icon] ?? Sparkle;
  return <Icon size={size} weight="duotone" aria-hidden="true" />;
}

export const NODE_ICONS: Record<NodeType, typeof Sword> = {
  battle: Ghost, elite: Skull, rest: Bed, shop: Storefront, event: Question, treasure: Gift, boss: TrainRegional,
};

export function HpBar({ hp, max, block = 0, label }: { hp: number; max: number; block?: number; label: string }) {
  const ratio = Math.max(0, Math.min(1, hp / max));
  return (
    <div className={`nt-hp${block > 0 ? ' has-block' : ''}`} role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={hp}
      aria-valuetext={`${hp} / ${max}${block ? `, 방어 ${block}` : ''}`}>
      <span className="nt-hp-fill" style={{ width: `${ratio * 100}%` }} />
      <span className="nt-hp-text">{hp} / {max}</span>
      {block > 0 && <span className="nt-block-badge" aria-hidden="true"><Shield size={14} weight="fill" />{block}</span>}
    </div>
  );
}
