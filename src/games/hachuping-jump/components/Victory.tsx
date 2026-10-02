import { TrophyIcon } from '@phosphor-icons/react/dist/icons/Trophy';
export default function Victory({ score, onRestart, onMenu }: { score: number; onRestart: () => void; onMenu: () => void }) {
 return <div className="jump-dialog" role="dialog" aria-modal="true" aria-labelledby="jump-victory-title"><div className="jump-dialog-panel"><TrophyIcon size={56} weight="duotone"/><h2 id="jump-victory-title">별빛 여행 완료!</h2><p>여섯 개의 세계를 모두 통과했어요.</p><p className="jump-final-score">{score.toLocaleString()}<small> 점</small></p><p>스테이지 클리어 보너스 포함</p><button autoFocus onClick={onRestart} className="jump-button jump-button-primary">다시 시작</button><button onClick={onMenu} className="jump-button">메인 메뉴</button></div></div>;
}
