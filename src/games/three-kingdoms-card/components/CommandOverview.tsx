import { activeTroop, DAILY_QUESTS, troopSlots, type DemoState } from "../lib/demoGame";
import { FORMATIONS, UNITS } from "../lib/tactics";
import { HeroPortrait } from "./HeroVisual";
import { number, type Tab } from "./tabs/shared";
import { MILESTONES, milestoneProgress, RESEARCH, remainingTime } from "../lib/campaign";

/**
 * The first session in four steps (모집 → 편성 → 보충 → 출정), shown until the first battle.
 * Each step is done by the state itself, so it never asks for something already done.
 */
function FirstSteps({ state, onNavigate }: { state: DemoState; onNavigate: (tab: Tab) => void }) {
  const troop = activeTroop(state);
  const steps: { label: string; detail: string; tab: Tab; done: boolean }[] = [
    { label: "장수 모집", detail: "모집관에서 초빙장으로 첫 장수를 맞이합니다.", tab: "모집관", done: state.heroes.length > 0 },
    { label: "부대 편성", detail: "부대 편성에서 주장 자리에 장수를 배치합니다.", tab: "부대 편성", done: !!troop.heroIds[0] },
    { label: "병력 보충", detail: "예비군과 식량으로 부대 병력을 채웁니다.", tab: "부대 편성", done: troop.currentTroops > 0 },
    { label: "첫 출정", detail: "출정에서 가까운 거점을 토벌합니다.", tab: "출정", done: state.battles.length > 0 },
  ];
  const current = steps.findIndex(step => !step.done);
  if (current < 0) return null;
  return <section className="first-steps" aria-labelledby="first-steps-title">
    <h2 id="first-steps-title">첫 출정까지 <small>{current} / {steps.length}</small></h2>
    <ol>{steps.map((step, i) => <li key={step.label} data-state={step.done ? "done" : i === current ? "current" : "todo"}>
      <button type="button" onClick={() => onNavigate(step.tab)} aria-current={i === current ? "step" : undefined}>
        <span aria-hidden="true">{step.done ? "✓" : i + 1}</span>
        <strong>{step.label}<span className="sr-only">{step.done ? " (완료)" : i === current ? " (지금 할 일)" : ""}</span></strong>
        <small>{step.detail}</small>
      </button>
    </li>)}</ol>
  </section>;
}

export default function CommandOverview({ state, onNavigate, onChallenge }: { state: DemoState; onNavigate: (tab: Tab) => void; onChallenge?: () => void }) {
  const troop = activeTroop(state);
  const commander = state.heroes.find(h => h.id === troop.heroIds[0]);
  const next: Tab = !state.heroes.length ? "모집관" : !commander || !troop.currentTroops ? "부대 편성" : "출정";
  const instructions = !state.heroes.length ? "초빙장으로 첫 장수를 모집하십시오." : !commander ? "주장을 배치해 부대의 지휘권을 맡기십시오." : !troop.currentTroops ? "예비군과 식량으로 출정 병력을 보충하십시오." : `${troop.name}의 출정 준비가 끝났습니다.`;
  const claimable = DAILY_QUESTS.filter((q, i) => !state.daily.claimed[i] && state.daily.progress[i] >= q.goal).length;
  const job = state.campaign.researchJob;
  const goal = MILESTONES.find(m => !state.campaign.claimedMilestones.includes(m.id));
  return <div className="command-overview">
    <FirstSteps state={state} onNavigate={onNavigate} />
    <div className="command-heading"><div><span className="command-seal" aria-hidden="true">軍令</span><div><h1>{state.castleName} 지휘소</h1><p>{state.lordName} 군주 · 제{state.stage}차 토벌</p></div></div><span className="command-date">출전 가능 {state.troops.slice(0, troopSlots(state)).filter(t => t.heroIds[0] && t.currentTroops > 0).length}개 부대</span></div>
    <div className="command-columns"><div className="campaign-map">
      <div className="map-caption"><strong>영지 주변 정세</strong><span>세 거점을 토벌하면 다음 전선 개방</span></div>
      <svg className="map-roads" viewBox="0 0 700 280" preserveAspectRatio="none" aria-hidden="true"><path d="M135 195 Q260 220 335 100 T570 80 M335 100 Q400 190 535 220" /></svg>
      <button className="map-home" onClick={event => { const root = event.currentTarget.getRootNode() as Document | ShadowRoot; root.querySelector("#territory-management")?.scrollIntoView({ block: "start" }); }}><span>城</span><strong>{state.castleName}</strong><small>본성 · 내정 관리</small></button>
      {state.targets.map((target, i) => <button key={target.id} className={`map-target map-target-${i} ${!target.currentTroops ? "is-cleared" : ""}`} onClick={() => onNavigate("출정")}><span>{!target.currentTroops ? "定" : "⚑"}</span><strong>{target.name}</strong><small>{target.currentTroops ? `${number(target.currentTroops)}명 주둔` : "토벌 완료"}</small></button>)}
      <div className="map-legend"><i /> 아군 영지 <i /> 토벌 거점 <span>{state.targets.filter(t => !t.currentTroops).length}/3 거점 확보</span></div>
    </div><aside className="military-dispatch"><h2>군사 보고</h2><div className="dispatch-commander">{commander ? <HeroPortrait templateKey={commander.templateKey} /> : <span className="vacant-commander">將</span>}<div><strong>{commander?.name ?? "주장 미배치"}</strong><small>{troop.name} · {UNITS[troop.unit].name}</small><small>{FORMATIONS[troop.formation].name} · 병력 {number(troop.currentTroops)}</small></div></div><p>{instructions}</p><button className="seal-button" onClick={() => onNavigate(next)}>{next === "모집관" ? "첫 장수 모집" : next === "부대 편성" ? "부대 정비" : "출정 명령"}</button><button className="dispatch-quest" onClick={event => { const root = event.currentTarget.getRootNode() as Document | ShadowRoot; root.querySelector("#daily-quests")?.scrollIntoView({ block: "start" }); }}>일일 과제 <strong>{claimable ? `보상 ${claimable}건 수령 가능` : `${state.daily.claimed.filter(Boolean).length}/3 완료`}</strong></button></aside></div>
    <button className="campaign-briefing" onClick={() => onNavigate("군정")}><div><strong>{job ? `${RESEARCH[job.key].name} 연구` : "연구와 파견"}</strong><small>{job ? remainingTime(job.finishesAt, Date.now()) : "자원 생산 · 최대 병력 · 피해 감소를 영구 강화"}</small></div><div><strong>파견 {state.campaign.expeditions.length} / 2</strong><small>{state.campaign.expeditions.filter(e => e.finishesAt <= Date.now()).length}개 귀환 가능</small></div><div><strong>{goal?.name ?? "모든 공적 달성"}</strong><small>{goal ? `${milestoneProgress(state, goal.metric)} / ${goal.goal} · 금 ${number(goal.gold)}, 초빙장 ${goal.tickets}장` : "군정에서 완료한 공적을 확인하세요."}</small></div><span>군정 관리</span></button>
    <div className="war-room-entry"><div><h3>연무관</h3><p>연무탑 {state.warRoom.towerFloor} / 30층 · 보유 전공 {number(state.warRoom.medals)}</p><small>실제 병력 손실 없이 전술을 겨루고 전공으로 장수를 초빙합니다.</small></div><button className="outline-button" onClick={onChallenge ?? (() => onNavigate("출정"))}>연무관 입장</button></div>
  </div>;
}
