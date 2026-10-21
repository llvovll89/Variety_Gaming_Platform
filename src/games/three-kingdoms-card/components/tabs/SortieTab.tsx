import { activeTroop, SWEEP_LIMIT, sweepReward, troopSlots, type DemoBattle } from "../../lib/demoGame";
import { heroSkills } from "../../lib/heroSkills";
import { troopSynergy } from "../../lib/synergy";
import { unitMultiplier, UNITS } from "../../lib/tactics";
import { number, TroopTabs, type Tab, type TabProps } from "./shared";
import BattleReplay from "../BattleReplay";
import { HeroPortrait } from "../HeroVisual";
import { useEffect, useRef, useState } from "react";
import { aggregateStats } from "../../lib/battleEngine";
import { playerTroop } from "../../lib/demoGame";
import { FORMATIONS } from "../../lib/tactics";
import { practiceBattle } from "../../lib/practice";
import UnitMatchups from "../UnitMatchups";

const FIRST_STAGE_SEALS = ["黃巾", "山賊", "黑山"] as const;
const STAGE_SEALS = ["先", "駐", "本"] as const;
const TIERS = ["초급", "중급", "상급"] as const;
const RESULT_LABEL = { ATTACKER: "승리", DEFENDER: "패배", DRAW: "무승부" } as const;

export default function SortieTab({ state, act, onNavigate, selectedBattle, onSelectBattle }: TabProps & {
  onNavigate: (tab: Tab) => void; selectedBattle: string | null; onSelectBattle: (id: string) => void;
}) {
  const [order, setOrder] = useState<{ targetId: string; all: boolean } | null>(null);
  const [trial, setTrial] = useState<{ report: DemoBattle; attempt: number; troopIndex: number } | null>(null);
  const practiceRef = useRef<HTMLElement>(null);
  useEffect(() => { if (trial) { practiceRef.current?.focus(); practiceRef.current?.scrollIntoView({ block: "start" }); } }, [trial]);
  const orderRef = useRef<HTMLDivElement>(null);
  const reportRef = useRef<HTMLElement>(null);
  useEffect(() => { if (order) { orderRef.current?.focus(); orderRef.current?.scrollIntoView({ block: "center" }); } }, [order]);
  const troop = activeTroop(state);
  const commander = state.heroes.find(h => h.id === troop.heroIds[0]);
  const report = state.battles.find(b => b.id === selectedBattle) ?? state.battles[0];
  const reportId = report?.id;
  const previousBattle = useRef(selectedBattle);
  useEffect(() => {
    if (selectedBattle && reportId && previousBattle.current !== selectedBattle) { reportRef.current?.focus(); reportRef.current?.scrollIntoView({ block: "start" }); }
    previousBattle.current = selectedBattle;
  }, [selectedBattle, reportId]);
  const readyTroops = state.troops.slice(0, troopSlots(state)).filter(t => t.heroIds[0] && t.currentTroops > 0).length;
  const sweep = state.stage >= 2 ? sweepReward(state) : null;
  const destination = state.targets.find(t => t.id === order?.targetId);
  const stats = commander ? aggregateStats(playerTroop(state)) : null;
  return <section>
    <div className="page-title">
      <div><h1>토벌 출정</h1><p className="muted small">{state.stage}단계 · 세 곳을 모두 토벌하면 다음 단계가 열립니다.</p></div>
      <button className="outline-button" onClick={() => onNavigate("부대 편성")}>{troop.name} {number(troop.currentTroops)}명 · 편성</button>
    </div>
    <TroopTabs state={state} act={act} />
    <div className="sortie-doctrine"><strong>교전 규칙</strong><span>창병 &gt; 기병 &gt; 궁병 &gt; 창병</span><span>유리한 병종 피해 ×1.25 · 불리한 병종 ×0.8</span><span>통솔로 선공 결정 · 최대 10턴 자동 교전</span></div>
    <UnitMatchups selected={troop.unit} />
    {destination && order && <div ref={orderRef} tabIndex={-1} className="sortie-order" role="region" aria-label="출정 명령 확인"><div><h2>{destination.name} 토벌 명령</h2><p>{order.all ? `출전 가능한 ${readyTroops}개 부대가 순서대로 교전합니다.` : `${troop.name} · 주장 ${commander?.name ?? "미배치"} · ${UNITS[troop.unit].name} ${number(troop.currentTroops)}명 · ${FORMATIONS[troop.formation].name}`}</p><p>적장 {destination.commander.name} · {UNITS[destination.unit].name} {number(destination.currentTroops)}명</p>{!order.all && stats && <small>아군 종합 통솔 {stats.leadership.toFixed(1)} / 무력 {stats.strength.toFixed(1)} / 지력 {stats.intelligence.toFixed(1)}</small>}<p className="order-warning">교전 중 손실된 병력은 돌아오지 않습니다. 편성과 상성을 확인하십시오.</p></div><div className="order-actions"><button className="seal-button" disabled={destination.currentTroops === 0 || (order.all ? !readyTroops : !commander || !troop.currentTroops)} onClick={() => { act({ type: order.all ? "battleAll" : "battle", targetId: destination.id }); setOrder(null); }}>출정 실행</button><button className="outline-button" onClick={() => setOrder(null)}>명령 취소</button></div></div>}
    {!commander && <div className="inline-guide">
      <p>아직 출전할 주장이 없습니다. 모집과 부대 편성부터 시작하세요.</p>
      <button className="seal-button" onClick={() => onNavigate(state.heroes.length ? "부대 편성" : "모집관")}>출정 준비</button>
    </div>}

    {sweep && <div className="sweep-panel">
      <div><strong>{state.stage - 1}단계 소탕</strong><small>병력 손실 없이 금 {number(sweep.gold)} · 경험치 {sweep.experience} · 철재 3 ({troop.name} 장수에게 지급)</small></div>
      <button className="outline-button" disabled={!commander || state.daily.sweeps >= SWEEP_LIMIT} onClick={() => act({ type: "sweep" })}>
        소탕 ({SWEEP_LIMIT - state.daily.sweeps}/{SWEEP_LIMIT})
      </button>
    </div>}

    <div className="target-grid">
      {state.targets.map((target, i) => {
        const skills = heroSkills(target.commander.templateKey, target.commander.stars);
        const synergy = troopSynergy([target.commander, ...target.deputies].map(h => h.templateKey));
        const cleared = target.currentTroops === 0;
        const matchup = unitMultiplier(troop.unit, target.unit);
        return <article className={`target-card target-${i}`} key={target.id}>
          <div className="target-scenery">
            <HeroPortrait templateKey={target.commander.templateKey} />
            <span>{(state.stage === 1 ? FIRST_STAGE_SEALS : STAGE_SEALS)[i]}</span>
            <small>{state.stage}단계 {TIERS[i]} 토벌</small>
          </div>
          <div className="target-body">
            <h2>{target.name}</h2>
            <p>주장 {target.commander.name} · {target.commander.stars}성{skills.map(s => ` · ${s.name}${s.label}`).join("")}</p>
            {target.deputies.length > 0 && <p className="muted small">부장 {target.deputies.map(d => `${d.name}(${d.stars}성)`).join(", ")}</p>}
            {synergy && <p className="muted small">세력 시너지 {synergy.name}{synergy.label}</p>}
            <p className={`unit-matchup matchup-${matchup > 1 ? "good" : matchup < 1 ? "bad" : "even"}`}>
              적 병종 {UNITS[target.unit].symbol} {UNITS[target.unit].name} · {troop.name}({UNITS[troop.unit].name}) {matchup > 1 ? "유리" : matchup < 1 ? "불리" : "대등"}
            </p>
            <dl>
              <div><dt>잔여 병력</dt><dd>{number(target.currentTroops)}명</dd></div>
              <div><dt>승리 전리품</dt><dd>금 {target.goldReward}</dd></div>
            </dl>
            <button className="seal-button" disabled={!commander || cleared || troop.currentTroops === 0} onClick={() => setOrder({ targetId: target.id, all: false })}>
              {cleared ? "토벌 완료" : `${target.name} 토벌`}
            </button>
            <button className="outline-button practice-button" disabled={!commander || cleared || !troop.currentTroops} onClick={() => setTrial(prev => ({ report: practiceBattle(state, target.id, Math.random), attempt: (prev?.attempt ?? 0) + 1, troopIndex: state.activeTroop }))}>병력 손실 없는 모의전</button>
            {troopSlots(state) > 1 && !cleared && <button className="outline-button battle-all" disabled={readyTroops === 0} onClick={() => setOrder({ targetId: target.id, all: true })}>
              전군 출정 ({readyTroops}개 부대)
            </button>}
          </div>
        </article>;
      })}
    </div>

    {trial && <article className="practice-report" ref={practiceRef} tabIndex={-1} aria-label="모의전 결과"><div className="section-heading"><div><h2>{trial.report.targetName}</h2><p className="muted small">{state.troops[trial.troopIndex].name} · {RESULT_LABEL[trial.report.winner]} 예상 · 병력·자원·보상·전투 기록에 반영되지 않습니다.</p></div><button className="quiet-button" onClick={() => setTrial(null)}>모의전 닫기</button></div><p className="muted small">현재 편성으로 진행한 1회 시뮬레이션입니다. 계략과 맹장 발동에 따라 실전 결과는 달라집니다.</p><BattleReplay key={trial.attempt} report={trial.report} practice /></article>}

    <div className="section-heading">
      <div><h2>전투 기록</h2><p className="muted small">최대 10턴 자동 전투 · 최근 10회 보관</p></div>
      {report && <select aria-label="전투 기록 선택" value={report.id} onChange={e => onSelectBattle(e.target.value)}>
        {state.battles.map((b, i) => <option key={b.id} value={b.id}>{i === 0 ? "최근 · " : ""}{b.targetName} · {b.turns}턴</option>)}
      </select>}
    </div>
    {report
      ? <article ref={reportRef} tabIndex={-1} aria-label="전투 보고" className="battle-report">
        <div className="report-summary">
          <span className={`result-stamp result-${report.winner}`}>{RESULT_LABEL[report.winner]}</span>
          <div><h3>{report.targetName}</h3><p>{report.turns}턴 종료 · 아군 {number(report.attackerRemaining)}명 생존</p></div>
          <div className="reward-summary"><strong>금 +{report.goldReward}</strong><span>경험치 +{report.experienceReward}</span><span>철재 +{report.materialReward ?? 0}</span></div>
        </div>
        <BattleReplay key={report.id} report={report} />
        <details className="report-transcript"><summary>전투 전문 · {report.logs.length}건</summary><ol className="battle-lines">
          {report.logs.map((log, i) => <li className={log.includes("계략 발동") ? "strategy-line" : ""} key={i}>{log}</li>)}
        </ol></details>
      </article>
      : <div className="empty-report"><span>戰</span><p>첫 출정의 기록이 이곳에 남습니다.</p></div>}
  </section>;
}
