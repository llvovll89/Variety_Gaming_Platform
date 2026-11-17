import { useId, useState, type ReactNode } from 'react';
import { GameDialog } from './GameDialog';
import { primaryClass, secondaryClass, type ButtonClasses } from './buttons';
import { settingsStore } from './settings';

export interface HelpPage { title: string; body: ReactNode; art?: ReactNode }
export interface HelpDialogProps {
  pages: HelpPage[];
  onClose: () => void;
  /** Remembered when closed, so a first-run help opens only once (see shouldShowHelp). */
  firstRunKey?: string;
  className?: string;
  buttons?: ButtonClasses;
}

/** True until the player has closed the help with this key once. */
export function shouldShowHelp(firstRunKey: string): boolean {
  return !settingsStore.get().seenHelp[firstRunKey];
}

/** How to play, one page at a time. */
export function HelpDialog({ pages, onClose, firstRunKey, className, buttons }: HelpDialogProps) {
  const titleId = useId();
  const [index, setIndex] = useState(0);
  const page = pages[Math.min(index, pages.length - 1)];
  const last = index >= pages.length - 1;
  const close = () => { if (firstRunKey) settingsStore.markHelpSeen(firstRunKey); onClose(); };
  if (!page) return null;
  return (
    <GameDialog labelledBy={titleId} onClose={close} className={className}>
      <p className="kit-eyebrow">게임 방법{pages.length > 1 ? ` · ${index + 1}/${pages.length}` : ''}</p>
      <h2 id={titleId} className="kit-title">{page.title}</h2>
      {page.art && <div className="kit-help-art">{page.art}</div>}
      <div>{page.body}</div>
      <div className="kit-pager">
        {index > 0 ? <button type="button" className={secondaryClass(buttons)} onClick={() => setIndex(index - 1)}>이전</button> : <span />}
        {pages.length > 1 && <span className="kit-pager-dots" aria-hidden="true">{pages.map((p, i) => <i key={p.title} aria-current={i === index} />)}</span>}
        <button type="button" autoFocus className={primaryClass(buttons)} onClick={last ? close : () => setIndex(index + 1)}>{last ? '시작하기' : '다음'}</button>
      </div>
    </GameDialog>
  );
}
