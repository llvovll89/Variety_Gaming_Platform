import type { UISnapshot } from '../game/types';
import { ITEMS, type ItemKind } from '../game/items';
import { GATES_PER_STAGE, STAGES } from '../game/stages';
export default function HUD({ snapshot: s }: { snapshot: UISnapshot }) {
  const effects: { kind: ItemKind; time: number; duration: number }[] = [
    { kind: 'shield', time: s.shieldTime, duration: 6 }, { kind: 'magnet', time: s.magnetTime, duration: 8 },
    { kind: 'double', time: s.doubleTime, duration: 8 }, { kind: 'slow', time: s.slowTime, duration: 6 },
  ];
  return <>
    <div className="pointer-events-none absolute left-3 top-[max(0.75rem,env(safe-area-inset-top))] w-36 text-[#58415c] sm:left-5 sm:top-5 sm:w-44">
      <div className="rounded-2xl border-2 border-white bg-[#fffaf0]/95 px-3 py-2 shadow-sm">
        <div className="text-[10px] font-extrabold tracking-widest text-[#987550]">SCORE · 점수</div>
        <div className="text-3xl font-black leading-tight tabular-nums">{s.score.toLocaleString()}</div>
        <div className="mt-1 flex justify-between text-[11px] font-bold"><span className="text-[#a66a13]">★ {s.stars}개</span><span>최고 {s.bestScore}</span></div>
        {s.hearts > 0 && <div className="mt-1 text-xs font-bold text-[#dd5876]">♥ 하트 쿠션 준비!</div>}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1">
        {effects.filter(e => e.time > 0).map(e => <div key={e.kind} className="rounded-lg border border-white bg-white/95 px-2 py-1.5" style={{ color: ITEMS[e.kind].color }}>
          <div className="text-[10px] font-bold">{ITEMS[e.kind].name}</div><div className="text-xs font-black tabular-nums">{e.time.toFixed(1)}초</div>
          <div role="progressbar" aria-label={`${ITEMS[e.kind].name} 남은 시간`} aria-valuemin={0} aria-valuemax={e.duration} aria-valuenow={Number(e.time.toFixed(1))} className="mt-1 h-1 rounded-full bg-black/5"><div className="h-full rounded-full" style={{ width: `${e.time / e.duration * 100}%`, background: ITEMS[e.kind].color }} /></div>
        </div>)}
      </div>
    </div>
    <div className="pointer-events-none absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 w-[min(88%,360px)] -translate-x-1/2 rounded-2xl border border-white/80 bg-[#fffaf0]/95 px-4 py-2 text-[#68516c] shadow-sm">
      <div className="flex justify-between text-xs font-bold"><span>{s.stage + 1} / {STAGES.length} · {STAGES[s.stage].name}</span><span>{s.stageCleared} / {GATES_PER_STAGE}</span></div>
      <div className="mt-2 flex gap-1" aria-label={`장애물 ${GATES_PER_STAGE}개 중 ${s.stageCleared}개 통과`}>{Array.from({ length: GATES_PER_STAGE }, (_, i) => <span key={i} className={`h-1.5 flex-1 rounded-full ${i < s.stageCleared ? 'bg-[#c26f9c]' : 'bg-[#e7d9e2]'}`} />)}</div>
    </div>
    {s.journeyPhase === 'intro' && s.status === 'playing' && <div role="status" className="pointer-events-none absolute left-1/2 top-[29%] w-[min(85%,340px)] -translate-x-1/2 rounded-2xl border border-white/80 bg-[#fffaf0]/95 p-4 text-center text-[#68516c] shadow-lg">
      <p className="text-[10px] font-bold tracking-[0.2em]">STAGE {s.stage + 1}</p><h2 className="mt-1 text-xl font-black">{STAGES[s.stage].name}</h2><p className="mt-1 text-xs">{STAGES[s.stage].subtitle}</p>
    </div>}
    {(s.journeyPhase === 'checkpoint' || s.journeyPhase === 'finale') && s.status === 'playing' && <div role="status" className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#30233a]/25 p-5 backdrop-blur-[2px]">
      <div className="w-full max-w-sm rounded-3xl border-2 border-white bg-[#fffaf0]/95 p-6 text-center text-[#68516c] shadow-xl">
        <p className="text-[11px] font-black tracking-[0.22em] text-[#b0648b]">{s.journeyPhase === 'finale' ? 'ALL STAGES CLEAR' : 'STAGE CLEAR'}</p>
        <h2 className="mt-2 text-2xl font-black">{STAGES[s.stage].name} 완료!</h2>
        <p className="mt-2 text-sm font-bold">이번 세계 +{s.lastStageScore.toLocaleString()}점</p>
        {s.journeyPhase === 'checkpoint' ? <><div className="mx-auto my-4 h-px w-16 bg-[#dfc8d4]"/><p className="text-xs">다음 세계</p><p className="mt-1 text-lg font-black">{STAGES[s.stage + 1].name}</p></> : <p className="mt-3 text-sm">별빛 여행을 완주했어요!</p>}
        <p className="mt-4 text-xs font-bold tabular-nums">{Math.max(1, Math.ceil(s.phaseTime))}초 뒤 자동으로 계속합니다</p>
      </div>
    </div>}
  </>;
}
