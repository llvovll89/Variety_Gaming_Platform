import { useCallback, useRef, useState } from "react";
import type { GameProps } from "../../platform/types";
import { useUISnapshot } from "../../shared/hooks/useUISnapshot";
import { MapCanvas } from "./components/MapCanvas";
import { StartMenu } from "./components/StartMenu";
import { TopBar } from "./components/TopBar";
import { InspectorPanel } from "./components/InspectorPanel";
import { LogStrip } from "./components/LogStrip";
import { ResultScreen } from "./components/ResultScreen";
import { emptySnapshot } from "./game/uiStore";
import { clearSave, loadGame } from "./game/save";
import { PALETTE } from "./game/constants";
import type { GameEngine } from "./game/engine";
import type { FactionId, GameState } from "./game/types";

/**
 * Screen shell for 삼국지 패업.
 *
 * Note the explicit paper background: the arcade shell is a dark theme, and without this
 * the ink-wash board would sit on #0f1419 and every panel edge would read as a mistake.
 */
export default function ThreeKingdomsApp({ onExit }: GameProps) {
  const [factionId, setFactionId] = useState<FactionId | null>(null);
  const [engine, setEngine] = useState<GameEngine | null>(null);
  const snapshot = useUISnapshot(engine?.ui ?? null, emptySnapshot());
  // A restored save is handed to the engine once it exists, since the engine builds a fresh
  // scenario in its constructor and only then can adopt someone else's board.
  const resumeRef = useRef<GameState | null>(null);

  const handleReady = useCallback((next: GameEngine) => {
    setEngine(next);
    if (resumeRef.current) {
      next.adopt(resumeRef.current);
      resumeRef.current = null;
    }
  }, []);

  const startNew = useCallback((id: FactionId) => {
    resumeRef.current = null;
    setFactionId(id);
  }, []);

  const restart = useCallback(() => {
    clearSave();
    resumeRef.current = null;
    setEngine(null);
    setFactionId(null);
  }, []);

  const resume = useCallback(() => {
    const saved = loadGame();
    if (!saved) return;
    resumeRef.current = saved;
    setFactionId(saved.playerFactionId);
  }, []);

  if (!factionId) {
    return <StartMenu onStart={startNew} onResume={resume} onExit={onExit} />;
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden" style={{ background: PALETTE.paper }}>
      <TopBar snapshot={snapshot} onEndTurn={() => engine?.endTurn()} onExit={onExit} />
      <div className="relative min-h-0 flex-1">
        <MapCanvas playerFactionId={factionId} onReady={handleReady} />
        {snapshot.result !== "playing" && (
          <ResultScreen snapshot={snapshot} onRestart={restart} onExit={onExit} />
        )}
      </div>
      <LogStrip log={snapshot.log} onFocus={(entry) => entry.focus && engine?.focus(entry.focus)} />
      {engine && <InspectorPanel engine={engine} state={engine.getState()} snapshot={snapshot} />}
    </div>
  );
}
