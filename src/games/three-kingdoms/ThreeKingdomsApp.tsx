import { useCallback, useRef, useState } from "react";
import type { GameProps } from "../../platform/types";
import { useUISnapshot } from "../../shared/hooks/useUISnapshot";
import { MapCanvas } from "./components/MapCanvas";
import { StartMenu } from "./components/StartMenu";
import { TopBar } from "./components/TopBar";
import { OfficerEditor } from './components/OfficerEditor';
import { BattlePreview } from './components/BattlePreview';
import { BattlePlayback } from './components/BattlePlayback';
import { StrategicMap } from './components/StrategicMap';
import './three-kingdoms.css';
import { InspectorPanel } from "./components/InspectorPanel";
import { LogStrip } from "./components/LogStrip";
import { OverviewSheet } from "./components/OverviewSheet";
import { ResultScreen } from "./components/ResultScreen";
import { emptySnapshot } from "./game/uiStore";
import { clearSave, loadGame } from "./game/save";
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
  const [editor, setEditor] = useState(false);
  const snapshot = useUISnapshot(engine?.ui ?? null, emptySnapshot());
  // A restored save is handed to the engine once it exists, since the engine builds a fresh
  // scenario in its constructor and only then can adopt someone else's board.
  const resumeRef = useRef<GameState | null>(null);

  const handleReady = useCallback((next: GameEngine) => {
    setEngine(next);
    if (resumeRef.current) {
      // React StrictMode replays the mount effect. Both engine instances must restore.
      next.adopt(structuredClone(resumeRef.current));
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
    <div className="tk-game">
      <div className="tk-toolbar"><strong>삼국지 패업 <b>PK</b></strong><button onClick={() => setEditor(true)} disabled={!engine || snapshot.busy || snapshot.result !== 'playing'}>PK 장수 편집</button><span className="tk-mode">{engine?.viewMode()} · 중원 쟁패</span></div>
      <TopBar
        snapshot={snapshot}
        onEndTurn={() => engine?.endTurn()}
        onSkip={() => engine?.skipPlayback()}
        onOverview={() => setOverview(true)}
        onExit={() => { engine?.save(); onExit(); }}
      />
      <div className="tk-battlefield">
        <div className="tk-map-area">
          <MapCanvas playerFactionId={factionId} onReady={handleReady} />
          <div className="tk-view-controls" aria-label="지도 시점 조절">
            <button onClick={() => engine?.rotateView(-Math.PI / 6)} aria-label="시점 왼쪽 회전">↶ 회전</button>
            <button onClick={() => engine?.rotateView(Math.PI / 6)} aria-label="시점 오른쪽 회전">회전 ↷</button>
            <button onClick={() => engine?.tiltView()}>시점 전환</button>
            <button onClick={() => engine?.zoomView(1.2)} aria-label="지도 확대">＋</button>
            <button onClick={() => engine?.zoomView(1 / 1.2)} aria-label="지도 축소">−</button>
            <button onClick={() => engine?.toggleGrid()}>격자</button>
          </div>
          {engine && <StrategicMap engine={engine} />}
          <div className="tk-map-help">드래그 이동 · 휠 확대 · 도시 선택 → 장수 편성 → 출진</div>
        </div>
        <aside className="tk-command-panel" aria-label="명령 및 선택 정보">{engine && state && <InspectorPanel engine={engine} state={state} snapshot={snapshot} />}</aside>
        {snapshot.result !== "playing" && (
          <ResultScreen snapshot={snapshot} onRestart={restart} onExit={onExit} />
        )}
      </div>
      <LogStrip log={snapshot.log} onFocus={(entry) => entry.focus && engine?.focus(entry.focus)} />
      {editor && engine && <OfficerEditor engine={engine} onClose={() => setEditor(false)} />}
      {engine?.pendingAttack() && <BattlePreview engine={engine} snapshot={snapshot} />}
      {engine?.getBattleScene() && <BattlePlayback engine={engine} />}
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
