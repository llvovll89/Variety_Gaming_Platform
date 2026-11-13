import { TRAP_PHASE_SECONDS, type MazeRun } from './engine';

export default function RunStatus({ run }: { run: MazeRun }) {
  const seconds = (Math.ceil(run.trapPhaseRemaining * 10) / 10).toFixed(1);
  return <section className="maze-objectives" aria-label="탐험 진행 상황">
    <div className="maze-objective" data-open={run.sealsRemaining===0}>
      <div aria-live="polite" aria-atomic="true"><span>봉인 {run.sealsCollected} / {run.requiredSeals}</span><strong>{run.sealsRemaining ? `봉인 ${run.sealsRemaining}개 더 필요` : '출구가 열렸어요!'}</strong></div>
      <p>{run.sealsRemaining ? '보라색 수정을 모두 모으면 출구가 열려요.' : '이제 빛나는 출구로 이동하세요.'}</p>
      <progress max={run.requiredSeals} value={run.sealsCollected} aria-label="봉인 수집 진행"/>
    </div>
    <div className="maze-trap-status" data-active={run.trapsActive}>
      <div role="status"><span>{run.trapsActive ? '함정 활성' : '함정 휴면'}</span><strong>{run.trapsActive ? '밟으면 −6초' : '밟아도 시간 차감 없음'}</strong></div>
      <p>{run.paused ? '일시 정지 · ' : run.status!=='playing' ? '탐험 종료 · ' : ''}{run.trapsActive ? '휴면까지' : '활성까지'} <b>{seconds}초</b></p>
      <progress max={TRAP_PHASE_SECONDS} value={run.trapPhaseRemaining} aria-label="함정 상태 전환까지 남은 시간"/>
    </div>
  </section>;
}
