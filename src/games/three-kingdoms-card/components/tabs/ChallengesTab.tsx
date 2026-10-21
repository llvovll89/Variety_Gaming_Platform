import { useEffect, useRef, useState } from "react";
import { battlefield, BATTLEFIELDS, challengeOpponent, DAILY_CHALLENGE_LIMIT, dailyWarReward, TOWER_FLOORS, towerReward, TRAINING_TROOPS, WAR_OFFICERS, WAR_SHOP, WAR_SHOP_KEYS } from "../../lib/challenges";
import { activeTroop } from "../../lib/demoGame";
import { catalogHero, HERO_CATALOG, HERO_ROSTER_LIMIT } from "../../lib/heroCatalog";
import { UNITS } from "../../lib/tactics";
import BattleReplay from "../BattleReplay";
import { HeroPortrait } from "../HeroVisual";
import { number, TroopTabs, type Tab, type TabProps } from "./shared";

export type ChallengeView = "연무탑" | "요일 전장" | "교환소";
export default function ChallengesTab({ state, act, mode, onNavigate }: TabProps & { mode: ChallengeView; onNavigate: (tab: Tab) => void }) {
  const [floor, setFloor] = useState(Math.min(TOWER_FLOORS, state.warRoom.towerFloor + 1));
  const [tier, setTier] = useState(1);
  const [heroId, setHeroId] = useState("");
  const [officerKey, setOfficerKey] = useState<typeof WAR_OFFICERS[number]>("gaoshun");
  const now = Date.now();
  const room = state.warRoom, troop = activeTroop(state);
  const commander = state.heroes.find(h => h.id === troop.heroIds[0]);
  const report = room.lastReport;
  const reportRef = useRef<HTMLElement>(null);
  const opponentRef = useRef<HTMLElement>(null);
  const previousReport = useRef(report?.id);
  useEffect(() => { if (report && report.id !== previousReport.current) { reportRef.current?.focus(); reportRef.current?.scrollIntoView({ block: "start" }); } previousReport.current = report?.id; }, [report?.id]);
  const isTower = mode === "연무탑", level = isTower ? floor : tier;
  const opponent = mode !== "교환소" ? challengeOpponent(isTower ? "tower" : "daily", level, now) : null;
  const opponentKey = HERO_CATALOG.find(h => h.name === opponent?.commander.name)?.key;
  const reward = isTower ? towerReward(level) : dailyWarReward(level);
  const replay = isTower && floor <= room.towerFloor;
  const field = battlefield(now);
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  return <section className="challenges-page">
    <div className="page-title"><div><h1>{mode === "연무탑" ? "연무탑" : mode === "요일 전장" ? field.name : "전공 교환소"}</h1><p className="muted small">{mode === "연무탑" ? "편성과 진법으로 돌파하는 30개 관문. 첫 승리 보상은 한 번만 지급됩니다." : mode === "요일 전장" ? "매일 바뀌는 전장 효과에 맞춰 부대를 운용하십시오." : "연무탑과 요일 전장에서 모은 전공으로 성장 자원을 교환합니다."}</p></div><span className="medal-balance"><span aria-hidden="true">功</span> 전공 <strong>{number(room.medals)}</strong></span></div>
    {mode === "교환소" ? <>
      <p className="war-rule">전공은 이월됩니다. 교환 횟수만 매일 자정에 초기화됩니다.</p>
      <div className="war-shop-grid">{WAR_SHOP_KEYS.map((item, i) => {
        const offer = WAR_SHOP[item], remaining = offer.limit - room.shopCounts[i];
        const learner = state.heroes.find(h => h.id === heroId && h.level < 100);
        return <article className="war-shop-item" key={item}><div className="shop-item-heading"><h2>{offer.name}</h2><span>전공 {offer.price}</span></div><p>{offer.description}</p>
          {item === "tickets" && <div className="shop-emblem" aria-hidden="true">令</div>}
          {item === "manual" && <label>병법서를 사용할 장수<select value={learner?.id ?? ""} onChange={e => setHeroId(e.target.value)}><option value="">장수 선택</option>{state.heroes.filter(h => h.level < 100).map(h => <option key={h.id} value={h.id}>{h.name} · {h.stars}성 · Lv.{h.level}</option>)}</select></label>}
          {item === "officer" && <><div className="shop-officer"><HeroPortrait templateKey={officerKey} /><div><strong>{catalogHero(officerKey).name}</strong><small>3성 · Lv.1</small><small>{catalogHero(officerKey).faction} · {catalogHero(officerKey).role}</small></div></div><label>초빙할 장수<select value={officerKey} onChange={e => setOfficerKey(e.target.value as typeof officerKey)}>{WAR_OFFICERS.map(key => <option key={key} value={key}>{catalogHero(key).name} · {catalogHero(key).faction}</option>)}</select></label></>}
          <small>오늘 남은 교환 {remaining} / {offer.limit}</small><button className="seal-button" disabled={!remaining || room.medals < offer.price || (item === "manual" && !learner) || (item === "officer" && state.heroes.length >= HERO_ROSTER_LIMIT) || (item === "tickets" && state.recruitmentTickets > 997)} onClick={() => act({ type: "warShop", item, heroId, officerKey })}>{!remaining ? "오늘 교환 완료" : `${offer.price}전공으로 교환`}</button>
        </article>;
      })}</div>
    </> : <>
      <TroopTabs state={state} act={act} />
      <p className="war-rule">양군에 훈련 병력 {number(TRAINING_TROOPS)}명을 지급합니다. 실제 병력·예비군·식량은 감소하지 않습니다. 장수 능력과 특수능력, 연구·병종·진형 효과는 적용됩니다.</p>
      {!commander && <div className="inline-guide"><p>도전할 부대에 주장을 먼저 배치하세요.</p><button className="seal-button" onClick={() => onNavigate("부대 편성")}>부대 편성</button></div>}
      {isTower ? <>
        <div className="tower-progress"><strong>최고 돌파 {room.towerFloor} / {TOWER_FLOORS}층</strong><progress aria-label="연무탑 돌파도" value={room.towerFloor} max={TOWER_FLOORS} /><small>{room.towerFloor === TOWER_FLOORS ? "모든 관문 돌파! 완료한 층에서 다른 조합을 시험할 수 있습니다." : `${room.towerFloor + 1}층에 도전할 수 있습니다.`}</small></div>
        <div className="tower-floors" role="group" aria-label="연무탑 층 선택">{Array.from({ length: TOWER_FLOORS }, (_, i) => i + 1).map(n => <button key={n} aria-pressed={floor === n} disabled={n > room.towerFloor + 1} className={n <= room.towerFloor ? "is-cleared" : ""} onClick={() => setFloor(n)}><strong>{n}층</strong><small>{n <= room.towerFloor ? "돌파" : n === room.towerFloor + 1 ? "도전" : "잠김"}</small></button>)}</div>
      </> : <>
        <div className="battlefield-rule"><span>{weekdays[new Date(now).getDay()]}요일</span><div><strong>{field.description}</strong><small>해당 병종의 양군에 동일하게 적용됩니다.</small></div><span>남은 도전 {DAILY_CHALLENGE_LIMIT - room.dailyAttempts} / {DAILY_CHALLENGE_LIMIT}</span></div>
        <div className="difficulty-picker" role="group" aria-label="요일 전장 난이도">{[1, 2, 3].map(n => <button key={n} aria-pressed={tier === n} onClick={() => setTier(n)}><strong>{["초급", "중급", "상급"][n - 1]}</strong><small>승리 보상 전공 {dailyWarReward(n).medals}</small></button>)}</div>
        <details className="battlefield-calendar"><summary>요일별 전장 효과</summary>{BATTLEFIELDS.map((field, i) => <div key={field.name} className={i === new Date(now).getDay() ? "is-today" : ""}><b>{weekdays[i]}</b><strong>{field.name}</strong><span>{field.description}</span></div>)}</details>
      </>}
      {opponent && <article ref={opponentRef} tabIndex={-1} className="challenge-opponent"><div className="challenge-enemy">{opponentKey && <HeroPortrait templateKey={opponentKey} />}<div><small>{isTower ? `${floor}층 수문장` : `${tier}단계 상대`}</small><h2>{opponent.commander.name}</h2><p>{UNITS[opponent.unit!].name} · 훈련 병력 {number(TRAINING_TROOPS)}</p><small>통솔 {opponent.commander.leadership} · 무력 {opponent.commander.strength} · 지력 {opponent.commander.intelligence}{opponent.deputies.length ? ` · 부장 ${opponent.deputies.length}명` : ""}</small></div></div><div className="challenge-order"><strong>{replay ? "돌파한 층 복습" : "승리 보상"}</strong><p>{replay ? "추가 보상 없음 · 횟수 제한 없음" : `전공 ${reward.medals} · 금 ${number(reward.gold)} · 경험치 ${reward.experience}`}</p><small>{isTower ? "도전 횟수 제한 없음" : "승패에 관계없이 1회 차감됩니다."} 같은 조건과 편성은 동일한 결과로 재현됩니다.</small><button className="seal-button" disabled={!commander || (!isTower && room.dailyAttempts >= DAILY_CHALLENGE_LIMIT)} onClick={() => act({ type: "challenge", mode: isTower ? "tower" : "daily", level })}>{isTower ? `${floor}층 ${replay ? "다시 도전" : "돌파 도전"}` : room.dailyAttempts >= DAILY_CHALLENGE_LIMIT ? "오늘 도전 완료" : `${tier}단계 전장 도전`}</button><button className="outline-button" onClick={() => onNavigate("부대 편성")}>병종·진형 변경</button></div></article>}
      {report && <article className="challenge-report" aria-label="도전전 결과" ref={reportRef} tabIndex={-1}><div className="section-heading"><div><h2>{report.targetName} · {report.winner === "ATTACKER" ? "승리" : report.winner === "DRAW" ? "무승부" : "패배"}</h2><p className="muted small">{new Date(report.createdAt).toLocaleString("ko-KR")} · 실제 병력 손실 없음</p></div><span>{report.rewarded ? `전공 +${report.medals} · 금 +${report.goldReward} · 경험치 +${report.experienceReward} / 철재 +${report.materialReward ?? 0}` : "지급 보상 없음"}</span></div>{isTower && room.towerFloor < TOWER_FLOORS && <button className="outline-button next-tower-floor" onClick={() => { setFloor(room.towerFloor + 1); opponentRef.current?.focus(); opponentRef.current?.scrollIntoView({ block: "center" }); }}>다음 관문 {room.towerFloor + 1}층 준비</button>}<BattleReplay key={report.id} report={report} training /><details className="report-transcript"><summary>전투 전문</summary><ol className="battle-lines">{report.logs.map((line, i) => <li key={i}>{line}</li>)}</ol></details></article>}
    </>}
  </section>;
}
