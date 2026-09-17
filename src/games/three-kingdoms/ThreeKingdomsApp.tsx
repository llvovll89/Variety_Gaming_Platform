import { useCallback, useRef, useState } from "react";
import type { GameProps } from "../../platform/types";
import { useUISnapshot } from "../../shared/hooks/useUISnapshot";
import { MapCanvas } from "./components/MapCanvas";
import { StartMenu } from "./components/StartMenu";
import { TopBar } from "./components/TopBar";
import { GuideBar } from "./components/GuideBar";
import { InspectorPanel } from "./components/InspectorPanel";
import { LogStrip } from "./components/LogStrip";
import { OverviewSheet } from "./components/OverviewSheet";
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
 *
 * Vertical order is deliberate — resources, then "what to do now", then the board, then the
 * log, then whatever is selected. A first-time player reads top to bottom and arrives at the
 * map already knowing what the game wants from them.
 */
export default function ThreeKingdomsApp({ onExit }: GameProps) {
  const [factionId, setFactionId] = useState<FactionId | null>(null);
  const [engine, setEngine] = useState<GameEngine | null>(null);
  const [overview, setOverview] = useState(false);
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

  const state = engine?.getState() ?? null;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden" style={{ background: PALETTE.paper }}>
      <TopBar
        snapshot={snapshot}
        onEndTurn={() => engine?.endTurn()}
        onSkip={() => engine?.skipPlayback()}
        onOverview={() => setOverview(true)}
        onExit={onExit}
      />
      {state && (
        <GuideBar
          state={state}
          revision={snapshot.turn * 1000 + snapshot.log.length}
          onFocus={(hex) => engine?.focus(hex)}
        />
      )}
      <div className="relative min-h-0 flex-1">
        <MapCanvas playerFactionId={factionId} onReady={handleReady} />
        {snapshot.result !== "playing" && (
          <ResultScreen snapshot={snapshot} onRestart={restart} onExit={onExit} />
        )}
      </div>
      <LogStrip log={snapshot.log} onFocus={(entry) => entry.focus && engine?.focus(entry.focus)} />
      {engine && state && <InspectorPanel engine={engine} state={state} snapshot={snapshot} />}
      {overview && state && (
        <OverviewSheet
          state={state}
          snapshot={snapshot}
          onJump={(hex) => engine?.focus(hex)}
          onClose={() => setOverview(false)}
        />
      )}
    </div>
  );
}
