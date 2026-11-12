import type { LeaderboardEntry } from '../../../shared/leaderboard';
import { ArrowRightIcon } from '@phosphor-icons/react/dist/icons/ArrowRight';
import { ArrowLeftIcon } from '@phosphor-icons/react/dist/icons/ArrowLeft';
import { TrophyIcon } from '@phosphor-icons/react/dist/icons/Trophy';
import { CursorClickIcon } from '@phosphor-icons/react/dist/icons/CursorClick';
import { TimerIcon } from '@phosphor-icons/react/dist/icons/Timer';
import { DIFFICULTY_CONFIGS, type DifficultyLevel } from '../game/constants';
import MolePreview from './MolePreview';
const descriptions={easy:'한 마리씩, 여유롭게 연습해요.',normal:'두 마리를 번갈아 잡으며 리듬을 타요.',hard:'세 마리가 동시에! 빠른 손에 도전해요.'};
export default function StartMenu({onStart,onExit,bestScore,difficulty,onDifficultyChange,legacyBest,legacyLeaderboard,focusDifficulty}:{onStart:()=>void;onExit:()=>void;bestScore:number;difficulty:DifficultyLevel;onDifficultyChange:(d:DifficultyLevel)=>void;legacyBest:number;legacyLeaderboard:LeaderboardEntry[];focusDifficulty:boolean}) {
  return <main className="mole-menu">
    <nav className="mole-nav"><button className="mole-quiet" onClick={onExit}><ArrowLeftIcon size={18}/> 게임 허브</button><span>GH PLAY / 두더지 잡기</span><div className="mole-record" aria-live="polite"><TrophyIcon size={18} weight="fill"/> {DIFFICULTY_CONFIGS[difficulty].name} 최고 <b>{bestScore.toLocaleString()}</b></div></nav>
    <div className="mole-menu-main">
      <section className="mole-intro"><span className="mole-eyebrow">30초 순발력 챌린지</span><h1>두더지 잡기<span>톡! 톡!<br/>{" "}잡는 재미.</span></h1><p>빼꼼 나타난 두더지를 톡!<br/>작은 타이밍으로 큰 기록을 만들어 보세요.</p>
        <fieldset className="mole-difficulty"><legend>오늘의 난이도</legend><div>{(['easy','normal','hard'] as const).map((d,i)=><button key={d} autoFocus={focusDifficulty&&difficulty===d} aria-pressed={difficulty===d} onClick={()=>onDifficultyChange(d)}><span>{'ⅠⅡⅢ'[i]}</span>{DIFFICULTY_CONFIGS[d].name}</button>)}</div><p aria-live="polite">{descriptions[difficulty]} 최고점과 TOP 10은 난이도별로 저장돼요.</p></fieldset>
        {(legacyBest>0||legacyLeaderboard.length>0)&&<details className="mole-legacy-records"><summary>이전 통합 기록 · 최고 {legacyBest.toLocaleString()}점</summary><p>난이도 정보가 없는 이전 기록이에요. 새 난이도별 기록과 따로 보관해요.</p><ol>{legacyLeaderboard.map((entry,i)=><li key={i}>{i+1}위 · {entry.score.toLocaleString()}점</li>)}</ol></details>}
        <button className="mole-primary mole-start" onClick={onStart}>게임 시작 <ArrowRightIcon size={23} weight="bold"/></button>
      </section>
      <section className="mole-showcase" aria-label="게임 미리보기"><div className="mole-big-word" aria-hidden="true">MOLE<br/>POP!</div><MolePreview/><span className="mole-showcase-caption">준비됐어? 이번엔 내가 더 빠를걸!</span></section>
    </div>
    <footer className="mole-menu-footer"><p><CursorClickIcon size={22}/><span><b>보이면, 톡!</b> 클릭 또는 터치로 +10점</span></p><p><TimerIcon size={22}/><span><b>딱 30초의 몰입</b> 놓치지 않고 연속으로 잡아보세요</span></p><small>키보드 Q W E / A S D / Z X C 지원</small></footer>
  </main>;
}
