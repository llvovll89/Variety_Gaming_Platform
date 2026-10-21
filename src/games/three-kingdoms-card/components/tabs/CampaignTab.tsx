import { useState } from "react";
import { assignedIds } from "../../lib/demoGame";
import { busyHeroIds, expeditionReward, MILESTONES, milestoneProgress, RESEARCH, RESEARCH_KEYS, remainingTime, researchCost, ROUTES, ROUTE_KEYS, type RouteKey } from "../../lib/campaign";
import { HeroPortrait } from "../HeroVisual";
import { number, type TabProps } from "./shared";

export default function CampaignTab({ state, act }: TabProps) {
  const [heroId, setHeroId] = useState("");
  const [route, setRoute] = useState<RouteKey>("scout");
  const [showCompleted, setShowCompleted] = useState(false);
  const now = Date.now();
  const campaign = state.campaign;
  const unavailable = [...assignedIds(state), ...busyHeroIds(state)];
  const available = state.heroes.filter(h => !unavailable.includes(h.id));
  const selected = available.find(h => h.id === heroId);
  const reward = selected ? expeditionReward(state, selected.id, route) : null;
  const job = campaign.researchJob;
  const milestones = MILESTONES.filter(m => showCompleted || !campaign.claimedMilestones.includes(m.id));
  return <section className="campaign-page">
    <div className="page-title"><div><h1>군정</h1><p className="muted small">연구로 기반을 넓히고 대기 장수에게 임무를 맡기십시오.</p></div><span className="subtle-tag">공적 {campaign.claimedMilestones.length} / {MILESTONES.length}</span></div>
    <div className="section-heading"><h2>태학 연구</h2><span className="muted small">동시에 1개 · 완료 후 영구 적용</span></div>
    {job && <div className="research-job" role="status"><div><strong>{RESEARCH[job.key].name} Lv.{campaign.research[job.key] + 1}</strong><small>{remainingTime(job.finishesAt, now)} · 접속하지 않아도 진행됩니다.</small></div><button className="seal-button" disabled={job.finishesAt > now} onClick={() => act({ type: "completeResearch" })}>{job.finishesAt > now ? "연구 중" : "연구 완료 적용"}</button></div>}
    <div className="research-grid">{RESEARCH_KEYS.map(key => {
      const rule = RESEARCH[key], level = campaign.research[key], cost = researchCost(level), maxed = level >= rule.max;
      return <article className="research-card" key={key}><div className="research-title"><h3>{rule.name}</h3><span>Lv.{level}<small> / {rule.max}</small></span></div><p>{rule.description} <strong>{key === "training" ? "−" : "+"}{(level * rule.perLevel).toFixed(1)}%</strong></p><progress aria-label={`${rule.name} 연구 레벨`} value={level} max={rule.max} /><small>{maxed ? "모든 연구를 마쳤습니다." : `다음 레벨: ${key === "training" ? "−" : "+"}${((level + 1) * rule.perLevel).toFixed(1)}% · ${remainingTime(cost.duration, 0).replace(" 남음", "")}`}</small><button className="outline-button" disabled={maxed || !!job || state.castle.gold < cost.gold || state.castle.food < cost.food} onClick={() => act({ type: "startResearch", key })}>{maxed ? "연구 완성" : "연구 시작"}</button>{!maxed && <small>금 {number(cost.gold)} · 식량 {number(cost.food)}{job ? " · 다른 연구 진행 중" : ""}</small>}</article>;
    })}</div>

    <div className="section-heading"><h2>장수 파견</h2><span className="muted small">동시에 2개 · 병력 손실 없음</span></div>
    <p className="muted small">미편성 장수는 등급에 관계없이 참여합니다. 정치와 매력이 높을수록 자원 보상이 늘고, 귀환 시 경험치를 얻습니다.</p>
    <div className="expedition-active">{campaign.expeditions.map(mission => {
      const hero = state.heroes.find(h => h.id === mission.heroId)!;
      const done = now >= mission.finishesAt;
      return <article className={`expedition-mission ${done ? "is-ready" : ""}`} key={mission.id}><HeroPortrait templateKey={hero.templateKey} /><div><strong>{ROUTES[mission.route].name} · {hero.name}</strong><small>{remainingTime(mission.finishesAt, now)}</small><progress aria-label={`${hero.name} 파견 진행도`} value={Math.min(now - mission.startedAt, mission.finishesAt - mission.startedAt)} max={mission.finishesAt - mission.startedAt} /><small>금 {number(mission.gold)} · 식량 {number(mission.food)} · 경험치 {mission.experience}</small></div><button className="seal-button" disabled={!done} onClick={() => act({ type: "claimExpedition", expeditionId: mission.id })}>{done ? "귀환 보상 받기" : "파견 중"}</button></article>;
    })}</div>
    <div className="expedition-planner"><label>파견 장수<select value={selected?.id ?? ""} onChange={e => setHeroId(e.target.value)}><option value="">장수 선택</option>{available.map(h => <option key={h.id} value={h.id}>{h.name} · {h.stars}성 · Lv.{h.level}</option>)}</select></label><label>임무<select value={route} onChange={e => setRoute(e.target.value as RouteKey)}>{ROUTE_KEYS.map(key => <option value={key} key={key}>{ROUTES[key].name} · {ROUTES[key].minutes}분</option>)}</select></label><div className="expedition-estimate"><p>{ROUTES[route].description}</p><small>{reward ? `확정 보상: 금 ${number(reward.gold)} · 식량 ${number(reward.food)} · 경험치 ${reward.experience}` : "장수를 선택하면 확정 보상이 표시됩니다."}</small></div><button className="seal-button" disabled={!selected || campaign.expeditions.length >= 2} onClick={() => { if (selected) { const next = act({ type: "sendExpedition", heroId: selected.id, route }); if (next) setHeroId(""); } }}>파견 보내기</button>{!available.length && <p className="muted small">대기 장수가 없습니다. 장수를 모집하거나 부대 편성을 해제하면 파견할 수 있습니다.</p>}</div>

    <div className="section-heading"><h2>군주의 공적</h2><button className="quiet-button" aria-pressed={showCompleted} onClick={() => setShowCompleted(!showCompleted)}>{showCompleted ? "미완료만 보기" : "완료한 공적 포함"}</button></div>
    <p className="muted small">기간 제한 없이 도전하는 누적 목표입니다. 각 보상은 한 번만 받습니다.</p>
    <ul className="milestone-list">{milestones.map(m => {
      const progress = milestoneProgress(state, m.metric), claimed = campaign.claimedMilestones.includes(m.id), ready = progress >= m.goal;
      return <li className={claimed ? "is-claimed" : ready ? "is-ready" : ""} key={m.id}><div><strong>{m.name}</strong><small>{({ stage: "토벌 단계", collection: "만난 장수", research: "총 연구 레벨", dispatch: "파견 완료" })[m.metric]} {Math.min(progress, m.goal)} / {m.goal}</small></div><progress aria-label={`${m.name} 달성도`} value={Math.min(progress, m.goal)} max={m.goal} /><span>금 {number(m.gold)}<small>초빙장 {m.tickets}장</small></span><button className="outline-button" disabled={claimed || !ready} onClick={() => act({ type: "claimMilestone", milestoneId: m.id })}>{claimed ? "수령 완료" : ready ? "보상 받기" : "도전 중"}</button></li>;
    })}</ul>{milestones.length === 0 && <p className="campaign-complete">모든 공적을 달성했습니다. 토벌 전선과 장수 육성은 계속할 수 있습니다.</p>}
  </section>;
}
