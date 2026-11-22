import { PlayIcon } from "@phosphor-icons/react/dist/icons/Play";
import { AUTOFOCUS, GameDialog } from "../../../shared/kit/GameDialog";

interface PauseDialogProps {
  score: number;
  seconds: number;
  onResume: () => void;
  onMainMenu: () => void;
}

export default function PauseDialog({ score, seconds, onResume, onMainMenu }: PauseDialogProps) {
  return (
    <GameDialog className="cm-card cm-dialog cm-dialog-pause motion-safe:animate-panel-in" labelledBy="cm-pause-title" onClose={onResume}>
        <h2 id="cm-pause-title" style={{ margin: "0 0 6px", fontSize: 26, fontWeight: 900 }}>잠깐 쉬어요</h2>
        <p style={{ margin: "0 0 22px", color: "var(--cm-muted)", fontSize: 14 }}>
          시간도 함께 멈췄어요. 지금 <b className="cm-num" style={{ color: "var(--cm-ink)" }}>{score}점</b>, {seconds}초 남았어요.
        </p>
        <div style={{ display: "grid", gap: 10 }}>
          <button {...AUTOFOCUS} className="cm-primary" onClick={onResume}><PlayIcon size={18} weight="fill" /> 계속하기</button>
          <button className="cm-secondary" onClick={onMainMenu}>처음 화면으로</button>
        </div>
    </GameDialog>
  );
}
