import { NextGameActions, ScoreFeedback } from '../../../platform/PlaySession';
import { TrophyIcon } from '@phosphor-icons/react/dist/icons/Trophy';
import { AUTOFOCUS, GameDialog } from '../../../shared/kit/GameDialog';
export default function Victory({ score, previousBest, onRestart, onMenu, fromWorld = 1, rewards }: { score: number; previousBest: number; onRestart: () => void; onMenu: () => void; fromWorld?: number; rewards?: import('react').ReactNode }) {
 return <GameDialog className="jump-dialog" labelledBy="jump-victory-title" dismissible={false} onClose={onMenu}><TrophyIcon size={56} weight="duotone"/><h2 id="jump-victory-title">별빛 여행 완료!</h2><p>{fromWorld > 1 ? `${fromWorld}번째 세계부터 마지막 세계까지 날았어요.` : '여섯 개의 세계를 모두 통과했어요.'}</p><p className="jump-final-score">{score.toLocaleString()}<small> 점</small></p><p>스테이지 클리어 보너스 포함</p>{fromWorld === 1 && <ScoreFeedback score={score} previousBest={previousBest}/>}{rewards}<button {...AUTOFOCUS} onClick={onRestart} className="jump-button jump-button-primary">다시 시작</button><button onClick={onMenu} className="jump-button">메인 메뉴</button><NextGameActions/></GameDialog>;
}
