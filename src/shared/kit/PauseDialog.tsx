import { useId, type ReactNode } from 'react';
import { GameDialog } from './GameDialog';
import { primaryClass, secondaryClass, type ButtonClasses } from './buttons';
import { useKitGame } from './context';
import { SettingsPanel } from './SettingsPanel';

export interface PauseDialogProps {
  onResume: () => void;
  /** Leave the run: to the game's menu or the hub, as the game decides. */
  onQuit: () => void;
  quitLabel?: string;
  onRestart?: () => void;
  onHelp?: () => void;
  title?: string;
  /** One line about the run so far, e.g. "남은 시간 12초 · 340점". */
  summary?: ReactNode;
  /** Extra rows under the buttons. */
  children?: ReactNode;
  /** Sound settings for this game under the buttons. Defaults to true. */
  showSettings?: boolean;
  className?: string;
  buttons?: ButtonClasses;
}

/** Pausing the run. Escape resumes, like the resume button. */
export function PauseDialog({ onResume, onQuit, quitLabel = '메뉴로', onRestart, onHelp, title = '잠깐 멈췄어요', summary, children, showSettings = true, className, buttons }: PauseDialogProps) {
  const titleId = useId();
  const game = useKitGame();
  return (
    <GameDialog labelledBy={titleId} onClose={onResume} className={className}>
      <h2 id={titleId} className="kit-title">{title}</h2>
      {summary && <p className="kit-summary">{summary}</p>}
      <div className="kit-actions">
        <button type="button" autoFocus className={primaryClass(buttons)} onClick={onResume}>계속하기</button>
        {onRestart && <button type="button" className={secondaryClass(buttons)} onClick={onRestart}>처음부터</button>}
        {onHelp && <button type="button" className={secondaryClass(buttons)} onClick={onHelp}>게임 방법</button>}
        <button type="button" className={secondaryClass(buttons)} onClick={onQuit}>{quitLabel}</button>
      </div>
      {children}
      {showSettings && game && <div className="kit-section"><SettingsPanel compact gameId={game.gameId} /></div>}
    </GameDialog>
  );
}
