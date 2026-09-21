import { ArrowClockwiseIcon } from '@phosphor-icons/react/dist/icons/ArrowClockwise';
import { TrophyIcon } from '@phosphor-icons/react/dist/icons/Trophy';
import { ArrowLeftIcon } from '@phosphor-icons/react/dist/icons/ArrowLeft';
import type { LeaderboardEntry } from '../../../shared/hooks/useLeaderboard';
import type { UISnapshot } from '../game/types';
import GameDialog from './GameDialog';
export default function GameOverWithLeaderboard({finalScore,bestScore,leaderboard,playerRank,onRestart,onMainMenu,snapshot}:{
  finalScore:number;bestScore:number;leaderboard:LeaderboardEntry[];playerRank:number|null;onRestart:()=>void;onMainMenu:()=>void;snapshot:UISnapshot;
}) {
  const accuracy=snapshot.attempts?Math.round(snapshot.totalMolesHit/snapshot.attempts*100):0;
  return <GameDialog label="게임 결과" onClose={onMainMenu}>
    <div className="mole-results"><section className="mole-result-main"><div className="mole-trophy"><TrophyIcon size={42} weight="fill"/></div><p className="mole-eyebrow">30초 챌린지 완료</p><h2>{finalScore>0&&finalScore>=bestScore?'멋진 기록이에요!':'한 판 더, 더 빠르게!'}</h2><div className="mole-final-score">{finalScore.toLocaleString()}<span>POINTS</span></div>
      <div className="mole-result-stats"><div><b>{snapshot.totalMolesHit}</b><span>잡은 두더지</span></div><div><b>{snapshot.bestCombo}</b><span>최고 콤보</span></div><div><b>{accuracy}%</b><span>명중률</span></div></div>
      <button className="mole-primary" onClick={onRestart} autoFocus><ArrowClockwiseIcon size={20}/> 다시 도전</button><button className="mole-quiet" onClick={onMainMenu}><ArrowLeftIcon size={18}/> 난이도 선택으로</button>
    </section><section className="mole-result-ranking"><h3>나의 TOP 10</h3><p>이 기기에 저장된 기록이에요.</p><ol>{leaderboard.map((entry,i)=><li key={`${entry.timestamp}-${i}`} data-current={i+1===playerRank}><span>{String(i+1).padStart(2,'0')}</span><span>{i+1===playerRank?'이번 기록':new Date(entry.timestamp).toLocaleDateString('ko-KR',{month:'short',day:'numeric'})}</span><b>{entry.score}</b></li>)}</ol></section></div>
  </GameDialog>;
}
