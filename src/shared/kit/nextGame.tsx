import { useContext } from 'react';
import { PlaySession } from '../../platform/playSessionContext';
import { recommendNext, scoreMessage } from '../../platform/playExperience';
import { nextCss } from './kitCss';

/**
 * Game result panels that are not kit dialogs yet still need to scroll on short screens. Each
 * selector goes away when its game moves to GameDialog, which scrolls on its own.
 */
const legacyScrollCss = '.jump-dialog-panel:has(>.kit-next),.balloon-dialog:has(>.kit-next),.kf-result:has(>.kit-next),.maze-overlay>section:has(>.kit-next),.tk-result>div:has(>.kit-next){max-height:calc(100dvh - 32px);overflow-y:auto;overscroll-behavior:contain}';

export function ScoreFeedback({ score, previousBest, unit }: { score: number; previousBest: number; unit?: string }) {
  // arcade-score-feedback stays for game stylesheets written against the old name.
  return <p className="kit-score-feedback arcade-score-feedback" style={{ fontSize: 13, lineHeight: 1.6 }}>{scoreMessage(score, previousBest, unit)}</p>;
}

/** Render inside each game's result dialog, so native modal focus stays correct. */
export function NextGameActions() {
  const session = useContext(PlaySession);
  if (!session) return null;
  const similar = recommendNext(session.games, session.gameId, 'similar');
  const different = recommendNext(session.games, session.gameId, 'different');
  return <div className="kit-next arcade-next" role="group" aria-label="다음 한 판 고르기"><style>{nextCss + legacyScrollCss}</style>
    <p>다음엔 어떤 한 판을 해볼까요?</p>
    {similar && <button type="button" onClick={() => session.selectGame(similar.id)}><span><small>비슷한 재미</small><b>{similar.title}</b><small>{similar.play.duration}</small></span><span aria-hidden="true">↗</span></button>}
    {different && different.id !== similar?.id && <button type="button" onClick={() => session.selectGame(different.id)}><span><small>다른 분위기</small><b>{different.title}</b><small>{different.play.duration}</small></span><span aria-hidden="true">↗</span></button>}
    <button type="button" className="kit-next-hub" onClick={session.exit}>게임 목록으로</button>
  </div>;
}
