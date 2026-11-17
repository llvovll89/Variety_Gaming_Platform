import type { ReactNode } from 'react';
import { Stars } from './Stars';

export interface LevelEntry {
  id: string;
  title: string;
  subtitle?: ReactNode;
  stars?: number;
  maxStars?: number;
  locked?: boolean;
  /** The level the player is on now. */
  current?: boolean;
}

/** Level select: locked levels stay visible but disabled, so the player sees what is ahead. */
export function LevelGrid({ levels, onSelect, label = '단계 선택', className }: { levels: LevelEntry[]; onSelect: (id: string) => void; label?: string; className?: string }) {
  return (
    <ol className={className ? `kit-levels ${className}` : 'kit-levels'} aria-label={label}>
      {levels.map(level => (
        <li key={level.id}>
          <button type="button" disabled={level.locked} aria-current={level.current || undefined} onClick={() => onSelect(level.id)}>
            <b>{level.title}</b>
            {level.locked ? <small>잠겨 있어요</small> : level.subtitle && <small>{level.subtitle}</small>}
            {!level.locked && level.stars !== undefined && <Stars value={level.stars} max={level.maxStars} size={14} />}
          </button>
        </li>
      ))}
    </ol>
  );
}
