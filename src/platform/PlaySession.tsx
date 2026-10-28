import { createContext, useContext } from 'react';
import type { GameDefinition } from './types';
import { PLAY_INFO, recommendNext, scoreMessage } from './playExperience';

export const PlaySession = createContext<{ games: readonly GameDefinition[]; gameId: string; selectGame: (id: string) => void; exit: () => void } | null>(null);

const styles = '.jump-dialog-panel:has(>.arcade-next),.balloon-dialog:has(>.arcade-next),.survivor-dialog:has(>.arcade-next),.kf-result:has(>.arcade-next),.maze-overlay>section:has(>.arcade-next),.tk-result>div:has(>.arcade-next){max-height:calc(100dvh - 32px);overflow-y:auto;overscroll-behavior:contain}.arcade-next.arcade-next{display:flex;flex-direction:column;gap:8px;align-self:stretch;width:100%;min-width:0;margin-top:16px;padding-top:14px;border-top:1px solid #8885;text-align:left;font-family:Pretendard,system-ui,sans-serif;color:inherit}.arcade-next.arcade-next>p{font-size:12px;line-height:1.6;margin:0;color:inherit;opacity:.85}.arcade-next.arcade-next button{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;min-height:44px;padding:10px 12px;margin:0;border:1px solid #8885;border-radius:6px;background:#8881;color:inherit;text-align:left;font:inherit;font-size:12px;line-height:1.5;cursor:pointer;box-shadow:none;white-space:normal}.arcade-next.arcade-next button:hover{background:#8883}.arcade-next.arcade-next button:active{transform:translateY(1px)}.arcade-next.arcade-next button:focus-visible{outline:3px solid currentColor;outline-offset:2px}.arcade-next.arcade-next button span{display:flex;flex-direction:column;gap:2px;min-width:0}.arcade-next.arcade-next button b{font-size:12px;font-weight:700}.arcade-next.arcade-next button small{font-size:11px;opacity:.8}.arcade-next.arcade-next .arcade-next-hub{justify-content:center;border:0;background:transparent;text-decoration:underline;text-underline-offset:3px}.arcade-score-feedback.arcade-score-feedback{font:600 13px/1.6 Pretendard,system-ui,sans-serif;color:inherit;margin:8px 0;overflow-wrap:anywhere}';

export function ScoreFeedback({ score, previousBest, unit }: { score: number; previousBest: number; unit?: string }) {
  return <p className="arcade-score-feedback" style={{ fontSize: 13, lineHeight: 1.6 }}>{scoreMessage(score, previousBest, unit)}</p>;
}

/** Render inside each game's result dialog, so native modal focus stays correct. */
export function NextGameActions() {
  const session = useContext(PlaySession);
  if (!session) return null;
  const similar = recommendNext(session.games, session.gameId, 'similar');
  const different = recommendNext(session.games, session.gameId, 'different');
  return <div className="arcade-next" role="group" aria-label="다음 한 판 고르기"><style>{styles}</style>
    <p>다음엔 어떤 한 판을 해볼까요?</p>
    {similar && <button type="button" onClick={() => session.selectGame(similar.id)}><span><small>비슷한 재미</small><b>{similar.title}</b><small>{PLAY_INFO[similar.id]?.duration}</small></span><span aria-hidden="true">↗</span></button>}
    {different && different.id !== similar?.id && <button type="button" onClick={() => session.selectGame(different.id)}><span><small>다른 분위기</small><b>{different.title}</b><small>{PLAY_INFO[different.id]?.duration}</small></span><span aria-hidden="true">↗</span></button>}
    <button type="button" className="arcade-next-hub" onClick={session.exit}>게임 목록으로</button>
  </div>;
}
