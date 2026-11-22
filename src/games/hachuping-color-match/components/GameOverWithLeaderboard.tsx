import { ArrowCounterClockwiseIcon } from "@phosphor-icons/react/dist/icons/ArrowCounterClockwise";
import { AUTOFOCUS, GameDialog } from "../../../shared/kit/GameDialog";
import { NextGameActions, ScoreFeedback } from "../../../platform/PlaySession";
import type { LeaderboardEntry } from "../../../shared/hooks/useLeaderboard";
import type { UISnapshot } from "../game/types";

interface GameOverProps {
  finalScore: number;
  previousBest: number;
  snapshot: UISnapshot;
  leaderboard: LeaderboardEntry[];
  /** Records are kept per difficulty, so the board says whose they are. */
  difficultyName: string;
  /** Stickers and today's challenge earned this run. */
  rewards?: React.ReactNode;
  playerRank: number | null; // rank if entered top 10, null otherwise
  onRestart: () => void;
  onMainMenu: () => void;
}

export default function GameOverWithLeaderboard({ finalScore, previousBest, snapshot, leaderboard, difficultyName, rewards, playerRank, onRestart, onMainMenu }: GameOverProps) {
  const tries = snapshot.totalCorrect + snapshot.totalWrong;
  const accuracy = tries ? Math.round((snapshot.totalCorrect / tries) * 100) : 0;
  return (
    // 결과 화면은 Escape로 닫지 않는다. 다시 할지 난이도를 바꿀지 골라야 한다.
    <GameDialog className="cm-card cm-dialog cm-dialog-result motion-safe:animate-panel-in" labelledBy="cm-result-title" dismissible={false} onClose={onMainMenu}>
        <div style={{ textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--cm-muted)" }}>시간 끝!</p>
          <h2 id="cm-result-title" className="cm-num" style={{ margin: "2px 0 0", fontSize: 56, lineHeight: 1.1 }}>{finalScore}<span style={{ fontSize: 22, marginLeft: 4 }}>점</span></h2>
          <ScoreFeedback score={finalScore} previousBest={previousBest} unit="점" />
          {rewards}
          {playerRank && <p style={{ margin: "4px 0 0", fontSize: 14, fontWeight: 800, color: "var(--cm-ok)" }}>{difficultyName} 기록 {playerRank}위에 올랐어요</p>}
        </div>

        <dl style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, margin: "20px 0", textAlign: "center" }}>
          {[["맞힌 개수", `${snapshot.totalCorrect}개`], ["최고 연속", `${snapshot.bestStreak}번`], ["정확도", `${accuracy}%`]].map(([label, value]) => (
            <div key={label} style={{ padding: "10px 4px", borderRadius: 14, background: "var(--cm-board)" }}>
              <dt style={{ fontSize: 12, fontWeight: 700, color: "var(--cm-muted)" }}>{label}</dt>
              <dd className="cm-num" style={{ margin: "2px 0 0", fontSize: 20 }}>{value}</dd>
            </div>
          ))}
        </dl>
        <p style={{ margin: "-8px 0 18px", textAlign: "center", fontSize: 13, color: "var(--cm-muted)" }}>레벨 {snapshot.level}까지 올라갔어요.</p>

        {leaderboard.length > 0 && (
          <section aria-labelledby="cm-board-title" style={{ marginBottom: 20 }}>
            <h3 id="cm-board-title" style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 800 }}>이 기기 {difficultyName} TOP {Math.min(10, leaderboard.length)}</h3>
            <ol tabIndex={0} aria-label={`이 기기 ${difficultyName} 순위`} style={{ listStyle: "none", margin: 0, padding: 4, maxHeight: 176, overflowY: "auto", border: "1px solid var(--cm-line)", borderRadius: 16 }}>
              {leaderboard.map((entry, i) => {
                const mine = playerRank === i + 1;
                return (
                  <li key={`${entry.score}-${entry.timestamp}`} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", borderRadius: 12, background: mine ? "var(--cm-ink)" : "transparent", color: mine ? "#fff" : "inherit", fontSize: 14 }}>
                    <span style={{ fontWeight: 700 }}>{i + 1}위{mine ? " · 방금 기록" : ""}</span>
                    <b className="cm-num">{entry.score}</b>
                  </li>
                );
              })}
            </ol>
          </section>
        )}

        <div style={{ display: "grid", gap: 10 }}>
          <button type="button" {...AUTOFOCUS} className="cm-primary" onClick={onRestart}><ArrowCounterClockwiseIcon size={18} weight="bold" /> 한 번 더</button>
          <button type="button" className="cm-secondary" onClick={onMainMenu}>난이도 바꾸기</button>
        </div>
        <NextGameActions />
    </GameDialog>
  );
}
