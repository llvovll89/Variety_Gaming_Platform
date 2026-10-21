import { useEffect, useState } from "react";
import type { DemoBattle } from "../lib/demoGame";
import { number } from "./tabs/shared";

export default function BattleReplay({ report, practice = false, training = false }: { report: DemoBattle; practice?: boolean; training?: boolean }) {
  const replay = report.replay;
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const last = (replay?.frames.length ?? 1) - 1;
  useEffect(() => {
    if (!playing || step >= last) return;
    const timer = setTimeout(() => setStep(s => s + 1), 850);
    return () => clearTimeout(timer);
  }, [playing, step, last]);
  if (!replay) return <p className="legacy-report">이전 전투는 아래 전투 전문에서 확인할 수 있습니다.</p>;
  const frame = replay.frames[step];
  return <div className="battle-replay">
    <div className="replay-top"><strong>전황 재현</strong><span>{frame.turn === 0 ? "교전 대기" : `${frame.turn} / ${report.turns}턴`}</span><span>{step === last ? "전투 종료" : "전투 기록 재생"}</span></div>
    <div className="replay-field">{(["attacker", "defender"] as const).map((side, i) => <div className={`replay-army army-${side}`} key={side}><span className="army-banner">{i === 0 ? "我" : "敵"}</span><h3>{i === 0 ? replay.attackerName : replay.defenderName}</h3><span className="soldier-line" aria-hidden="true">{frame[side] > 0 ? "⚑ ⚑ ⚑" : "敗"}</span><strong>{number(frame[side])}<small> 명</small></strong><progress aria-label={`${i === 0 ? "아군" : "적군"} 남은 병력`} max={Math.max(1, replay.frames[0][side])} value={frame[side]} /></div>)}<span className="clash-mark" aria-hidden="true">交戰</span></div>
    <p className="replay-message" role="status">{frame.message}</p>
    <div className="replay-controls"><button className="outline-button" disabled={step === 0} onClick={() => { setPlaying(false); setStep(s => Math.max(0, s - 1)); }}>이전</button><button className="seal-button" onClick={() => { if (step === last) { setStep(0); setPlaying(true); } else setPlaying(!playing); }}>{step === last ? "다시 재생" : playing ? "일시정지" : "전투 재생"}</button><button className="outline-button" disabled={step === last} onClick={() => { setPlaying(false); setStep(s => Math.min(last, s + 1)); }}>다음</button><button className="quiet-button" disabled={step === last} onClick={() => { setPlaying(false); setStep(last); }}>결과 보기</button></div>
    <label className="replay-seek">재생 위치<input aria-label="전투 재생 위치" type="range" min={0} max={last} value={step} onChange={e => { setPlaying(false); setStep(Number(e.target.value)); }} /></label>
    <p className="muted small">{practice ? "모의전 재생입니다. 실제 병력·자원·경험치는 변하지 않습니다." : training ? "훈련 병력으로 진행한 도전전입니다. 실제 병력은 보존되며 보상은 승리 시 한 번만 반영됩니다." : "재생은 저장된 전황을 보여줍니다. 병력과 보상은 출정 시 한 번만 반영됩니다."}</p>
  </div>;
}
