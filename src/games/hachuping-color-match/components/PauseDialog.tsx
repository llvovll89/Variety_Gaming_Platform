import { useEffect, useRef } from "react";
import { PlayIcon } from "@phosphor-icons/react/dist/icons/Play";

interface PauseDialogProps {
  score: number;
  seconds: number;
  onResume: () => void;
  onMainMenu: () => void;
}

export default function PauseDialog({ score, seconds, onResume, onMainMenu }: PauseDialogProps) {
  const resume = useRef<HTMLButtonElement>(null);
  useEffect(() => resume.current?.focus(), []);
  return (
    <div className="cm-sheet" style={{ background: "#20243f66", zIndex: 5 }}>
      <div className="cm-card motion-safe:animate-panel-in" role="dialog" aria-modal="true" aria-labelledby="cm-pause-title" style={{ textAlign: "center" }}>
        <h2 id="cm-pause-title" style={{ margin: "0 0 6px", fontSize: 26, fontWeight: 900 }}>잠깐 쉬어요</h2>
        <p style={{ margin: "0 0 22px", color: "var(--cm-muted)", fontSize: 14 }}>
          시간도 함께 멈췄어요. 지금 <b className="cm-num" style={{ color: "var(--cm-ink)" }}>{score}점</b>, {seconds}초 남았어요.
        </p>
        <div style={{ display: "grid", gap: 10 }}>
          <button ref={resume} className="cm-primary" onClick={onResume}><PlayIcon size={18} weight="fill" /> 계속하기</button>
          <button className="cm-secondary" onClick={onMainMenu}>처음 화면으로</button>
        </div>
      </div>
    </div>
  );
}
