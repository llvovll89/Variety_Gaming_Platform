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
import { GuideBar } from './components/GuideBar';
import { citiesOf } from './game/state';
import './three-kingdoms.css';
import { InspectorPanel } from "./components/InspectorPanel";
import { LogStrip } from "./components/LogStrip";
import { OverviewSheet } from "./components/OverviewSheet";
import { ResultScreen } from "./components/ResultScreen";
import { emptySnapshot } from "./game/uiStore";
import { clearSave, loadGame } from "./game/save";
import type { GameEngine } from "./game/engine";
import type { FactionId, GameState } from "./game/types";

/** Map-first command desk, with city navigation and contextual officer assignments. */
export default function ThreeKingdomsApp({ onExit }: GameProps) {
  const [factionId, setFactionId] = useState<FactionId | null>(null);
  const [engine, setEngine] = useState<GameEngine | null>(null);
  const [overview, setOverview] = useState(false);
  const [editor, setEditor] = useState(false);
  const [help, setHelp] = useState(false);
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
      <div className="tk-toolbar"><strong>三國志 <span>패업</span> <b>PK</b></strong><span className="tk-mode">중원 쟁패 · 군주 지휘</span><button onClick={() => setHelp(v=>!v)} aria-expanded={help}>조작 안내</button><button onClick={() => setEditor(true)} disabled={!engine || snapshot.busy || snapshot.result !== 'playing'}>PK 장수 편집</button></div>
      <TopBar
        snapshot={snapshot}
        onEndTurn={() => engine?.endTurn()}
        onSkip={() => engine?.skipPlayback()}
        onOverview={() => setOverview(true)}
        onExit={() => { engine?.save(); onExit(); }}
      />
      {help && <div className="tk-help-panel"><div><b>一 · 도시 관리</b><p>내 도시 선택 → 내정·군사·건설 분류 → 담당 무장 선택 → 명령. 명령은 다음 순에 실행됩니다.</p></div><div><b>二 · 전장 지휘</b><p>군사 → 부대 편성·출진. 부대를 선택한 뒤 파란 칸으로 이동하고 붉은 적을 눌러 공격합니다.</p></div><div><b>三 · 시간 진행</b><p>명령을 마치면 10일 진행. 진행 중 가속 버튼으로 연출을 건너뛸 수 있습니다.</p></div><button onClick={()=>setHelp(false)}>닫기</button></div>}
      {engine && state && <nav className="tk-city-nav" aria-label="내 도시 바로가기"><span>領地 <small>내 도시</small></span><div>{citiesOf(state,factionId).map(c=><button key={c.id} aria-pressed={snapshot.selected.kind==='city'&&snapshot.selected.cityId===c.id} onClick={()=>engine.inspect(c.coord)}>{c.name}<small>{state.internalOrders.filter(o=>o.cityId===c.id).length ? '명령 대기' : '도시 관리'}</small></button>)}</div><span className="tk-phase-label">{snapshot.busy?'진행 중':'명령 대기'} · {snapshot.turn}순</span></nav>}
      {engine && state && <div className="tk-advice"><GuideBar state={state} onFocus={hex=>engine.inspect(hex)} revision={snapshot.turn}/></div>}
      <div className="tk-battlefield">
        <div className="tk-map-area">
          <MapCanvas playerFactionId={factionId} onReady={handleReady} />
          <details className="tk-view-controls"><summary>지도 시점 · 확대</summary><div aria-label="지도 시점 조절">
            <button onClick={() => engine?.rotateView(-Math.PI / 6)} aria-label="시점 왼쪽 회전">↶ 회전</button>
            <button onClick={() => engine?.rotateView(Math.PI / 6)} aria-label="시점 오른쪽 회전">회전 ↷</button>
            <button onClick={() => engine?.tiltView()}>시점 전환</button>
            <button onClick={() => engine?.zoomView(1.2)} aria-label="지도 확대">＋</button>
            <button onClick={() => engine?.zoomView(1 / 1.2)} aria-label="지도 축소">−</button>
            <button onClick={() => engine?.toggleGrid()}>격자</button>
          </div></details>
          {engine && <StrategicMap engine={engine} />}
          <div className="tk-map-help">드래그 이동 · 휠 확대 · 도시 선택 → 장수 편성 → 출진</div>
        </div>
        <aside className="tk-command-panel" aria-label="명령 및 선택 정보">{engine && state && <InspectorPanel key={snapshot.selected.kind==='city'?snapshot.selected.cityId:snapshot.selected.kind} engine={engine} state={state} snapshot={snapshot} />}</aside>
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
          onJump={(hex) => engine?.inspect(hex)}
          onClose={() => setOverview(false)}
        />
      )}
    </div>
  );
}
