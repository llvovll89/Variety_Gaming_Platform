import { activeTroop, SWEEP_LIMIT, sweepReward, troopSlots } from "../../lib/demoGame";
import { heroSkills } from "../../lib/heroSkills";
import { troopSynergy } from "../../lib/synergy";
import { unitMultiplier, UNITS } from "../../lib/tactics";
import { number, TroopTabs, type Tab, type TabProps } from "./shared";

const FIRST_STAGE_SEALS = ["黃巾", "山賊", "黑山"] as const;
const STAGE_SEALS = ["先", "駐", "本"] as const;
const TIERS = ["초급", "중급", "상급"] as const;
const RESULT_LABEL = { ATTACKER: "승리", DEFENDER: "패배", DRAW: "무승부" } as const;

export default function SortieTab({ state, act, onNavigate, selectedBattle, onSelectBattle }: TabProps & {
  onNavigate: (tab: Tab) => void; selectedBattle: string | null; onSelectBattle: (id: string) => void;
}) {
  const troop = activeTroop(state);
  const commander = state.heroes.find(h => h.id === troop.heroIds[0]);
  const report = state.battles.find(b => b.id === selectedBattle) ?? state.battles[0];
  const readyTroops = state.troops.slice(0, troopSlots(state)).filter(t => t.heroIds[0] && t.currentTroops > 0).length;
  const sweep = state.stage >= 2 ? sweepReward(state) : null;
  return <section>
    <div className="page-title">
      <div><h1>영지 밖의 전장</h1><p className="muted small">{state.stage}단계 · 세 곳을 모두 토벌하면 다음 단계가 열립니다.</p></div>
      <button className="outline-button" onClick={() => onNavigate("부대 편성")}>{troop.name} {number(troop.currentTroops)}명 · 편성</button>
    </div>
    <TroopTabs state={state} act={act} />
    {!commander && <div className="inline-guide">
      <p>아직 출전할 주장이 없습니다. 모집과 부대 편성부터 시작하세요.</p>
      <button className="seal-button" onClick={() => onNavigate(state.heroes.length ? "부대 편성" : "모집관")}>출정 준비</button>
    </div>}

    {sweep && <div className="sweep-panel">
      <div><strong>{state.stage - 1}단계 소탕</strong><small>병력 손실 없이 금 {number(sweep.gold)} · 경험치 {sweep.experience} ({troop.name} 장수에게 지급)</small></div>
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
            <button className="seal-button" disabled={!commander || cleared || troop.currentTroops === 0} onClick={() => act({ type: "battle", targetId: target.id })}>
              {cleared ? "토벌 완료" : `${target.name} 토벌`}
            </button>
            {troopSlots(state) > 1 && !cleared && <button className="outline-button battle-all" disabled={readyTroops === 0} onClick={() => act({ type: "battleAll", targetId: target.id })}>
              전군 출정 ({readyTroops}개 부대)
            </button>}
          </div>
        </article>;
      })}
    </div>

    <div className="section-heading">
      <div><h2>전투 기록</h2><p className="muted small">최대 10턴 자동 전투 · 최근 10회 보관</p></div>
      {report && <select aria-label="전투 기록 선택" value={report.id} onChange={e => onSelectBattle(e.target.value)}>
        {state.battles.map((b, i) => <option key={b.id} value={b.id}>{i === 0 ? "최근 · " : ""}{b.targetName} · {b.turns}턴</option>)}
      </select>}
    </div>
    {report
      ? <article className="battle-report">
        <div className="report-summary">
          <span className={`result-stamp result-${report.winner}`}>{RESULT_LABEL[report.winner]}</span>
          <div><h3>{report.targetName}</h3><p>{report.turns}턴 종료 · 아군 {number(report.attackerRemaining)}명 생존</p></div>
          <div className="reward-summary"><strong>금 +{report.goldReward}</strong><span>경험치 +{report.experienceReward}</span></div>
        </div>
        <ol className="battle-lines">
          {report.logs.map((log, i) => <li className={log.includes("계략 발동") ? "strategy-line" : ""} key={i}>{log}</li>)}
        </ol>
      </article>
      : <div className="empty-report"><span>戰</span><p>첫 출정의 기록이 이곳에 남습니다.</p></div>}
  </section>;
}
