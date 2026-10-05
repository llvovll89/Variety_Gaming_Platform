import { Ghost, ArrowCounterClockwise, ArrowRight, Clock, Play } from '@phosphor-icons/react';
import { TimeRun, same } from './engine';

export function tutorialStep(run:TimeRun){return run.echoes.some(trace=>same(trace[trace.length-1],run.level.plates[0]))?2:same(run.player,run.level.plates[0])?1:0;}
export function TutorialGuide({run}:{run:TimeRun}){
  const step=tutorialStep(run),lines=[['A 발판까지 이동하세요','바닥의 A 원을 눌러 이동하거나 방향 버튼을 사용하세요.'],['A 위에서 「지금 되감기」를 누르세요','내가 출발점으로 돌아가고, 방금 움직인 내가 유령으로 남아요.'],['유령이 A를 밟으면 열린 문을 지나 출구로!','유령은 A에 계속 서 있어요. 나는 오른쪽의 빛나는 출구로 이동하세요.']];
  return <section className="ts-tutorial-guide" aria-label="첫 방 따라하기" aria-live="polite"><span>따라하기 {step+1} / 3 · 시간 제한 없는 연습</span><b>{lines[step][0]}</b><p>{run.echoes.length&&step<2?'발판 밖에서 되감았어요. A까지 이동한 뒤 발판 위에서 다시 되감아 주세요.':lines[step][1]}</p><div>{lines.map((_,i)=><i key={i} className={i<=step?'is-complete':''}/>)}</div></section>;
}
export function HowToPlay({onPractice,onClose}:{onPractice:()=>void;onClose:()=>void}){
  return <><span className="ts-eyebrow">혼자가 아니라, 과거의 나와 함께</span><h2>유령에게 발판을 맡기세요</h2><p>목표는 <b>빛나는 출구로 탈출</b>하는 거예요.<br/>발판에서 내려오면 문이 닫히니까,<br/>과거의 나를 남겨 문을 열어 두는 게임입니다.</p><div className="ts-guide-example" aria-label="발판에 나를 남기고 출구로 이동"><span><Ghost size={28}/><b>과거의 나</b><small>A 발판 지키기</small></span><ArrowRight size={25}/><span><Play size={28}/><b>지금의 나</b><small>열린 문으로 탈출</small></span></div><ol className="ts-guide-steps"><li><b>먼저 A 발판까지 이동</b><span>원하는 바닥 칸을 누르거나 방향 버튼으로 움직이세요.</span></li><li><b>발판 위에서 「지금 되감기」</b><span>나는 처음으로 돌아가고, 유령이 방금 경로를 따라와요.</span></li><li><b>유령이 발판에 서면 출구로 이동</b><span>일찍 되감으면 유령은 남은 시간 동안 마지막 칸에 머물러요.</span></li></ol><div className="ts-guide-notes"><p><Clock size={17}/>일반 방은 10초마다 자동으로 되감겨요.</p><p><ArrowCounterClockwise size={17}/>실수하면 마지막 유령을 지우거나 방을 다시 시작하세요.</p><p>처음엔 시간 제한 없는 따라하기로 천천히 배울 수 있어요.</p></div><button className="ts-primary" onClick={onPractice}>첫 방 따라하기<ArrowRight size={20}/></button><button className="ts-erase" onClick={onClose}>설명 닫기</button></>;
}
