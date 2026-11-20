import { useCallback, useEffect, useRef, useState } from "react";
import { useRecords } from "../../platform/meta/api";
import { usePlayReport } from "../../shared/kit/usePlayReport";
import { usePlayClock } from "../../shared/kit/usePlayClock";
import type { RunRewards, UnlockedAchievement } from "../../platform/meta/types";
import { FirstTurns } from "./components/FirstTurns";
import type { GameProps } from "../../platform/types";
import { useExitGuard } from "../../platform/exitGuard";
import { useUISnapshot } from "../../shared/hooks/useUISnapshot";
import { MapCanvas } from "./components/MapCanvas";
import { StartMenu } from "./components/StartMenu";
import { TopBar } from "./components/TopBar";
import { OfficerEditor } from './components/OfficerEditor';
import { BattlePreview } from './components/BattlePreview';
import { BattlePlayback } from './components/BattlePlayback';
import { StrategicMap } from './components/StrategicMap';
import { GuideBar } from './components/GuideBar';
import { OfficerPortrait } from './components/OfficerPortrait';
import { citiesOf } from './game/state';
import './three-kingdoms.css';
import './pk-interface.css';
import { InspectorPanel } from "./components/InspectorPanel";
import { LogStrip } from "./components/LogStrip";
import { OverviewSheet } from "./components/OverviewSheet";
import { ResultScreen } from "./components/ResultScreen";
import { emptySnapshot } from "./game/uiStore";
import { clearSave, loadGame } from "./game/save";
import type { GameEngine } from "./game/engine";
import type { FactionId, GameState } from "./game/types";

/** Map-first command desk, with city navigation and contextual officer assignments. */
export default function ThreeKingdomsApp({ onExit, launchIntent }: GameProps) {
  const [initialSave] = useState(() => launchIntent === "resume" ? loadGame() : null);
  const [factionId, setFactionId] = useState<FactionId | null>(initialSave?.playerFactionId ?? null);
  const [engine, setEngine] = useState<GameEngine | null>(null);
  const [overview, setOverview] = useState(false);
  const [editor, setEditor] = useState(false);
  const [help, setHelp] = useState(false);
  const snapshot = useUISnapshot(engine?.ui ?? null, emptySnapshot());
  // A restored save is handed to the engine once it exists, since the engine builds a fresh
  // scenario in its constructor and only then can adopt someone else's board.
  const resumeRef = useRef<GameState | null>(initialSave);
  // The first three turns of a new campaign get a short guide; a resumed one does not.
  const [tutorial, setTutorial] = useState<{ startTurn: number } | null>(null);
  const records = useRecords();
  const [rewards, setRewards] = useState<RunRewards | null>(null);
  const reported = useRef<GameEngine | null>(null);
  // Achievements earned mid-campaign (출사표, 성 n개) are shown on the result screen with the rest.
  const earnedOnTheWay = useRef<UnlockedAchievement[]>([]);
  const clock = usePlayClock(!!engine && snapshot.result === "playing");
  const { elapsed } = clock;
  // 저장하고 나간 날도 플레이 시간과 연속 도장에 들어가도록, 끝나지 않은 천하통일의 시간을 보고한다.
  const play = usePlayReport(clock, records, !!engine && snapshot.result === "playing");

  const handleReady = useCallback((next: GameEngine) => {
    setEngine(next);
    if (resumeRef.current) {
      // React StrictMode replays the mount effect. Both engine instances must restore.
      next.adopt(structuredClone(resumeRef.current));
    }
  }, []);

  const startNew = useCallback((id: FactionId) => {
    resumeRef.current = null;
    setTutorial({ startTurn: 0 });
    setFactionId(id);
  }, []);

  const restart = useCallback(() => {
    clearSave();
    resumeRef.current = null;
    setRewards(null);
    earnedOnTheWay.current = [];
    play.reset();
    setEngine(null);
    setFactionId(null);
  }, [play]);

  const resume = useCallback(() => {
    const saved = loadGame();
    if (!saved) return;
    resumeRef.current = saved;
    setTutorial(null);
    setFactionId(saved.playerFactionId);
  }, []);

  // The guide counts from the turn the new campaign actually began on.
  useEffect(() => {
    if (tutorial?.startTurn === 0 && engine && snapshot.turn > 0) setTutorial({ startTurn: snapshot.turn });
  }, [tutorial, engine, snapshot.turn]);
  // How far the campaign has come, every turn: cities held is progress (it only ever counts the peak).
  useEffect(() => {
    // Also on the deciding turn, so the cities taken in it still count.
    if (engine && snapshot.player) {
      earnedOnTheWay.current.push(...records.reportProgress("started", 1), ...records.reportProgress("cities", snapshot.player.cities));
    }
  }, [engine, snapshot.turn, snapshot.player?.cities, snapshot.result, records]);
  // A campaign that ends (통일 or 멸망) is the run, reported once.
  useEffect(() => {
    if (!engine || snapshot.result === "playing" || reported.current === engine) return;
    reported.current = engine;
    const won = snapshot.result === "victory";
    const run = records.reportRun({ durationMs: elapsed(), reportedMs: play.reportedMs(), outcome: won ? "win" : "lose", score: won ? snapshot.turn : undefined,
      stats: { turns: snapshot.turn, cities: snapshot.player?.cities ?? 0, officers: snapshot.player?.officers ?? 0 } });
    setRewards({ ...run, unlocked: [...earnedOnTheWay.current, ...run.unlocked] });
    earnedOnTheWay.current = [];
  }, [engine, snapshot.result, snapshot.turn, snapshot.player, records, elapsed, play]);

  // Leaving saves first and stays only if that save fails.
  const leave = () => { if (!engine || engine.saveForExit()) onExit(); };

  // Browser back during a campaign leaves the same way as the toolbar button.
  useExitGuard(factionId ? leave : null);

  if (!factionId) {
    return <StartMenu onStart={startNew} onResume={resume} onExit={onExit} />;
  }

  const state = engine?.getState() ?? null;
  const leader = state && state.officers[state.factions[factionId].leaderId];

  return (
    <div className="tk-game">
      <div className="tk-toolbar"><strong>三國志 <span>패업</span> <b>PK</b></strong><span className="tk-mode">중원 쟁패 · 군주 지휘</span><button onClick={() => setHelp(v=>!v)} aria-expanded={help}>조작 안내</button><button onClick={() => setEditor(true)} disabled={!engine || snapshot.busy || snapshot.result !== 'playing'}>PK 장수 편집</button></div>
      <TopBar
        snapshot={snapshot}
        onEndTurn={() => engine?.endTurn()}
        onSkip={() => engine?.skipPlayback()}
        onOverview={() => setOverview(true)}
        onSave={() => engine?.save()}
        onExit={leave}
      />
      {tutorial && tutorial.startTurn > 0 && state && snapshot.turn < tutorial.startTurn + 3 && snapshot.result === "playing" &&
        <FirstTurns hidden={help} state={state} factionId={factionId} startTurn={tutorial.startTurn} turn={snapshot.turn} onClose={() => setTutorial(null)} />}
      {help && <div className="tk-help-panel"><div><b>一 · 도시 관리</b><p>내 도시 선택 → 내정·군사·건설 분류 → 담당 무장 선택 → 명령. 명령은 다음 순에 실행됩니다.</p></div><div><b>二 · 전장 지휘</b><p>군사 → 부대 편성·출진. 부대를 선택한 뒤 파란 칸으로 이동하고 붉은 적을 눌러 공격합니다.</p></div><div><b>三 · 시간 진행</b><p>명령을 마치면 10일 진행. 진행 중 가속 버튼으로 연출을 건너뛸 수 있습니다.</p></div><button onClick={()=>setHelp(false)}>닫기</button></div>}
      <div className="tk-war-room">
      <aside className="tk-domain-rail" aria-label="군주와 영지">
        {state && leader && <div className="tk-commanding-lord"><OfficerPortrait officer={leader} state={state} size={104}/><small>중원 쟁패</small><h2>{state.factions[factionId].name}<span>군주</span></h2><p>{snapshot.busy ? '전황이 진행되고 있습니다' : '당신의 명령을 기다립니다'}</p></div>}
        {engine && state && <nav className="tk-city-nav" aria-label="내 도시 바로가기"><span>내 도시 <small>{citiesOf(state,factionId).length}</small></span><div>{citiesOf(state,factionId).map(c=><button key={c.id} aria-pressed={snapshot.selected.kind==='city'&&snapshot.selected.cityId===c.id} onClick={()=>engine.inspect(c.coord, 'city')}><span>{c.name}<small>{state.internalOrders.filter(o=>o.cityId===c.id).length ? '명령 대기' : '도시 관리'}</small></span><strong>{(c.troops/1000).toFixed(1)}<small>천</small></strong></button>)}</div></nav>}
        {engine && state && <div className="tk-advice"><h3>군사의 제언</h3><GuideBar state={state} onFocus={hex=>engine.inspect(hex)} revision={snapshot.turn}/></div>}
        {engine && state && <details className="tk-mobile-advice"><summary>군사의 제언</summary><GuideBar state={state} onFocus={hex=>engine.inspect(hex)} revision={snapshot.turn}/></details>}
        <div className="tk-domain-note">내정과 군사 명령을 내린 뒤<br/>10일을 진행하세요.</div>
      </aside>
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
          <ResultScreen snapshot={snapshot} rewards={rewards} onRestart={restart} onExit={onExit} />
        )}
      </div>
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
