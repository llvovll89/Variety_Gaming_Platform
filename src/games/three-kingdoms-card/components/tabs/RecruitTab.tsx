import { nextTicketIn, PITY_LIMIT, recruitmentCost } from "../../lib/demoGame";
import { HERO_CATALOG, HERO_ROSTER_LIMIT, RARITIES, type HeroKey } from "../../lib/heroCatalog";
import { HeroPortrait } from "../HeroVisual";
import { number, type TabProps } from "./shared";

const FEATURED: readonly string[] = ["guanyu", "zhaoyun", "liubei", "zhangfei", "simayi", "zhangliao", "sunquan", "zhouyu", "huangyueying", "ganning", "diaochan", "yuanshao"];

export default function RecruitTab({ state, act, onShowCatalog, onPreview }: TabProps & { onShowCatalog: () => void; onPreview: (key: HeroKey) => void }) {
  const ownedCount = new Set(state.heroes.map(h => h.templateKey)).size;
  const ticketWait = nextTicketIn(state, Date.now());
  const fiveCost = recruitmentCost(state, 5);
  const ticketsForFive = Math.min(5, state.recruitmentTickets);
  return <section className="recruit-page">
    <div className="page-title">
      <div><h1>한 번의 인연이,<br className="mobile-break" /> 천하를 바꾼다.</h1></div>
      <span className="subtle-tag">만난 장수 {ownedCount} / {HERO_CATALOG.length}명</span>
    </div>
    <div className="summon-hall">
      <div className="hall-mist" />
      <div className="hall-copy">
        <span className="hall-label">천하 초빙</span>
        <h2>난세에 잠든<br />영웅을 부르다.</h2>
        <p>당신을 기다리는 이름들.<br />같은 이름, 서로 다른 잠재력.<br />1성부터 5성까지, 인연은 지금 시작됩니다.</p>
        <div className="hall-seal" aria-hidden="true">招賢</div>
      </div>
      <div className="hall-portraits" aria-hidden="true">
        <div className="featured-officer officer-left"><HeroPortrait templateKey="guanyu" /></div>
        <div className="featured-officer officer-right"><HeroPortrait templateKey="zhugeliang" /></div>
        <div className="featured-officer officer-center"><HeroPortrait templateKey="zhaoyun" /></div>
        <div className="featured-caption"><span>촉 · 상산의 용</span><strong>조 운</strong><small>등장 장수 미리보기 · 보유 장수가 아닙니다</small></div>
      </div>
      <div className="summon-controls">
        <div>
          <span className="summon-ticket-label">보유 초빙장 <b>{state.recruitmentTickets}장</b></span>
          <small>초빙장 우선 사용 · 부족분은 1회당 금 300</small>
          <small>{ticketWait === null ? "초빙장이 가득 찼습니다 (최대 10장 충전)" : `다음 초빙장까지 ${Math.ceil(ticketWait / 60000)}분 · 30분마다 1장`}</small>
          <small className="pity-count">5성 확정까지 <b>{PITY_LIMIT - state.pity}회</b></small>
        </div>
        <button className="outline-button summon-one" disabled={state.castle.gold < recruitmentCost(state, 1) || state.heroes.length >= HERO_ROSTER_LIMIT} onClick={() => act({ type: "draw" })}>
          <strong>1회 모집</strong><span>{state.recruitmentTickets > 0 ? "초빙장 1장" : "금 300"}</span>
        </button>
        <button className="seal-button summon-five" disabled={state.castle.gold < fiveCost || state.heroes.length + 5 > HERO_ROSTER_LIMIT} onClick={() => act({ type: "draw", amount: 5 })}>
          <strong>5회 모집</strong>
          <span>{fiveCost === 0 ? "초빙장 5장" : `${ticketsForFive > 0 ? `초빙장 ${ticketsForFive}장 + ` : ""}금 ${number(fiveCost)}`}</span>
        </button>
      </div>
    </div>
    <div className="recruit-info">
      <span>모든 장수는 모든 등급으로 등장합니다.</span>
      <details>
        <summary>모집 확률 확인</summary>
        <div className="probability-popover">
          {RARITIES.map(r => <p key={r.stars}><span style={{ color: r.color }}>{r.stars}성 {r.name}</span><strong>{r.chance}%</strong></p>)}
          <small>각 등급 내 장수 {HERO_CATALOG.length}명은 균등 확률입니다.<br />{PITY_LIMIT}회 안에 5성 1명이 확정되며, 5회 모집에는 3성 이상 1명이 보장됩니다.</small>
        </div>
      </details>
    </div>
    <div className="section-heading">
      <div><h2>당신의 부름을 기다리는 장수</h2></div>
      <button className="quiet-button" onClick={onShowCatalog}>전체 {HERO_CATALOG.length}명 보기</button>
    </div>
    <div className="catalog-strip">
      {HERO_CATALOG.filter(h => FEATURED.includes(h.key)).map(h => (
        <button key={h.key} onClick={() => onPreview(h.key)}>
          <HeroPortrait templateKey={h.key} />
          <div><small>{h.title}</small><strong>{h.name}</strong><span>{h.faction} · {h.role}</span></div>
        </button>
      ))}
    </div>
    {state.heroes.length === 0 && <div className="first-step">
      <span>첫 걸음</span>
      <p>아직 함께할 장수가 없습니다. 초빙장으로 모집한 뒤 주장으로 편성해 보세요.</p>
      <span>모집 → 편성 → 병력 보충 → 출정</span>
    </div>}
  </section>;
}
