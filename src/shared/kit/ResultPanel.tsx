import type { ReactNode } from 'react';
import { NextGameActions, ScoreFeedback } from './nextGame';
import { primaryClass, secondaryClass, type ButtonClasses } from './buttons';

export interface ResultAction { label: string; onClick: () => void; icon?: ReactNode }
export interface ResultPanelProps {
  /** id for the headline, so the surrounding GameDialog can use it as labelledBy. */
  titleId?: string;
  eyebrow?: ReactNode;
  headline: ReactNode;
  score?: { value: number; unit?: string; previousBest?: number };
  stats?: { label: string; value: ReactNode }[];
  /** A records column, e.g. this device's TOP 10. */
  records?: ReactNode;
  /** Badges or stickers earned this run. */
  rewards?: ReactNode;
  primary: ResultAction;
  secondary?: ResultAction[];
  /** "What to play next"; on by default. */
  showNext?: boolean;
  /** 'split' puts records in a second column on wide screens. */
  layout?: 'single' | 'split';
  buttons?: ButtonClasses;
}

/** Content of a result dialog: the same order in every game, styled by the game's --kit-* values. */
export function ResultPanel({ titleId, eyebrow, headline, score, stats, records, rewards, primary, secondary = [], showNext = true, layout = 'single', buttons }: ResultPanelProps) {
  const summary = (
    <div>
      {eyebrow && <p className="kit-eyebrow">{eyebrow}</p>}
      <h2 id={titleId} className="kit-title">{headline}</h2>
      {score && <>
        <p className="kit-score">{score.value.toLocaleString()}{score.unit && <small>{score.unit}</small>}</p>
        {score.previousBest !== undefined && <ScoreFeedback score={score.value} previousBest={score.previousBest} unit={score.unit} />}
      </>}
      {stats && stats.length > 0 && <dl className="kit-stats">{stats.map(stat => <div key={stat.label}><dt>{stat.label}</dt><dd>{stat.value}</dd></div>)}</dl>}
      {rewards && <div className="kit-section">{rewards}</div>}
    </div>
  );
  const actions = <>
    <div className="kit-actions">
      <button type="button" autoFocus className={primaryClass(buttons)} onClick={primary.onClick}>{primary.icon}{primary.label}</button>
      {secondary.map(action => <button key={action.label} type="button" className={secondaryClass(buttons)} onClick={action.onClick}>{action.icon}{action.label}</button>)}
    </div>
    {showNext && <NextGameActions />}
  </>;
  if (layout === 'split') return <div className="kit-split"><div>{summary}{actions}</div>{records && <div>{records}</div>}</div>;
  return <>{summary}{records && <div className="kit-section">{records}</div>}{actions}</>;
}
