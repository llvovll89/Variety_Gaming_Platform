import { BUILDINGS, DAILY_QUESTS, MAX_BUILDING_LEVEL, production, upgradeCost } from "../../lib/demoGame";
import { number, type TabProps } from "./shared";

const BUILDING_SYMBOLS = { ADMINISTRATION: "府", FARM: "田", BARRACKS: "兵" } as const;

export default function TerritoryTab({ state, act }: TabProps) {
  const rates = production(state);
  const politicsBonus = Math.max(0, ...state.heroes.map(h => h.politics)) / 10;
  return <section>
    <div className="territory-banner">
      <div>
        <p className="eyebrow">{state.lordName} 군주의 터전</p>
        <h1>{state.castleName}</h1>
        <p>작은 영지에서 시작하는 새로운 천하.<br />생산 기반을 넓혀 다음 원정을 준비하세요.</p>
        <span className="subtle-tag">정치 보너스 +{politicsBonus.toFixed(1)}%</span>
      </div>
    </div>

    <div className="section-heading"><h2>일일 과제</h2><span className="muted small">매일 자정에 초기화됩니다.</span></div>
    <ul className="daily-list">
      {DAILY_QUESTS.map((q, i) => {
        const progress = Math.min(q.goal, state.daily.progress[i]);
        const claimed = state.daily.claimed[i];
        return <li key={q.name} className={claimed ? "is-claimed" : ""}>
          <div><strong>{q.name} {q.goal}회</strong><small>보상 {q.reward}</small></div>
          <progress aria-label={`${q.name} 진행도`} value={progress} max={q.goal} />
          <span>{progress} / {q.goal}</span>
          <button className="outline-button" disabled={claimed || progress < q.goal} onClick={() => act({ type: "claimDaily", index: i })}>{claimed ? "수령 완료" : "보상 받기"}</button>
        </li>;
      })}
    </ul>

    <div className="section-heading"><h2>영지 경영</h2><span className="muted small">머무르지 않아도 자원은 생산됩니다.</span></div>
    <div className="building-grid">
      {state.buildings.map(b => {
        const rule = BUILDINGS[b.type];
        const cost = upgradeCost(b.level);
        const maxed = b.level >= MAX_BUILDING_LEVEL;
        return <article className={`building-card building-${b.type}`} key={b.type}>
          <div className="building-header">
            <span className="building-body" aria-hidden="true">{BUILDING_SYMBOLS[b.type]}</span>
            <div><h3>{rule.name}</h3><span>Lv.{b.level} / {MAX_BUILDING_LEVEL}</span></div>
          </div>
          <div className="level-track" role="img" aria-label={`${rule.name} ${b.level}레벨, 최대 ${MAX_BUILDING_LEVEL}레벨`}>
            {Array.from({ length: MAX_BUILDING_LEVEL }, (_, i) => <i key={i} className={i < b.level ? "is-built" : ""} />)}
          </div>
          <p>{rule.description}</p>
          <strong className="building-production">{rule.label} +{rates[rule.resource].toFixed(1)}<small> /분</small></strong>
          <button className="outline-button" disabled={maxed || state.castle.gold < cost.gold || state.castle.food < cost.food} onClick={() => act({ type: "upgrade", building: b.type })}>
            {maxed ? "최대 레벨" : `${rule.name} 강화`}
          </button>
          <small className="building-cost">{maxed ? `${MAX_BUILDING_LEVEL}레벨 달성` : `금 ${number(cost.gold)} · 식량 ${number(cost.food)}`}</small>
        </article>;
      })}
    </div>
  </section>;
}
