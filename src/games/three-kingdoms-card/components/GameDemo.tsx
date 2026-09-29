

import { useEffect, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { aggregateStats } from "../lib/battleEngine";
import { actDemo, BUILDINGS, createCollectedHero, createDemo, demoSchema, playerTroop, production, recruitmentCost, STORAGE_KEY, syncDemo, troopCapacity, upgradeCost, type DemoAction, type DemoHero, type DemoState } from "../lib/demoGame";
import { HERO_CATALOG, HERO_ROSTER_LIMIT, RARITIES } from "../lib/heroCatalog";
import { HeroPortrait } from "./HeroVisual";
import HeroDetails from "./HeroDetails";
import HeroRoster from "./HeroRoster";
import SummonReveal from "./SummonReveal";

const number = (n: number) => Math.floor(n).toLocaleString("ko-KR");
const menus = [{ name: "모집관", symbol: "招", caption: "새로운 인연" }, { name: "장수 명부", symbol: "將", caption: "나의 인재들" }, { name: "부대 편성", symbol: "軍", caption: "출정 준비" }, { name: "영지", symbol: "城", caption: "기반을 다지다" }, { name: "출정", symbol: "戰", caption: "천하로 나아가다" }] as const;
type Tab = typeof menus[number]["name"];

function Onboarding({ onStart, error, children }: { onStart: (lord: string, castle: string) => void; error: string; children: ReactNode }) {
  const [lord, setLord] = useState(""); const [castle, setCastle] = useState("");
  function submit(event: FormEvent) { event.preventDefault(); onStart(lord, castle); }
  return <main className="onboarding"><div className="onboard-art" /><div className="onboard-content"><a className="brand-lockup" href="#start"><span className="brand-seal">三</span><span>삼국 영지<small>인연으로 쓰는 새로운 천하</small></span></a><div className="onboard-intro"><p className="eyebrow">아직 이름 없는 당신의 이야기</p><h1>천하에,<br />당신의 이름을 새기다.</h1><p>정해진 군주도, 주어진 명장도 없습니다.<br />첫 번째 인연을 만나 당신만의 세력을 일으키세요.</p></div><form id="start" className="onboard-form" onSubmit={submit}><div><label htmlFor="lord-name">군주 이름</label><input autoComplete="off" id="lord-name" placeholder="어떤 이름으로 기억될까요?" value={lord} onChange={e => setLord(e.target.value)} required maxLength={12} /></div><div><label htmlFor="castle-name">영지 이름</label><input autoComplete="off" id="castle-name" placeholder="당신의 첫 영지" value={castle} onChange={e => setCastle(e.target.value)} required maxLength={12} /></div><p className="starter-note"><span>장수 0명</span><span>빈 부대</span><span>첫 모집 초빙장 3장</span></p>{error && <p role="alert" className="error-text">{error}</p>}<button className="gold-button" type="submit">나의 이야기 시작하기 <span aria-hidden="true">↗</span></button></form>{children}<p className="onboard-save">가입 없이 플레이 · 이 브라우저에 자동 저장</p></div></main>;
}

function SaveControls({ onBackup, onRestore, onReset }: {
  onBackup?: () => void;
  onRestore: (file?: File) => Promise<void>;
  onReset?: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  return <div className="save-controls">
    <div className="backup-actions">
      {onBackup && <button onClick={onBackup}>백업</button>}
      <button onClick={() => input.current?.click()}>불러오기</button>
    </div>
    {onReset && <button className="new-game" onClick={onReset}>새로운 이야기</button>}
    <input ref={input} type="file" accept="application/json,.json" aria-label="게임 백업 파일" hidden onChange={e => {
      const file = e.target.files?.[0]; e.target.value = ""; void onRestore(file);
    }} />
  </div>;
}

export default function GameDemo() {
  const [state, setState] = useState<DemoState | null>(null);
  const current = useRef<DemoState | null>(null);
  const summonLock = useRef(false);
  const [tab, setTab] = useState<Tab>("모집관");
  const [message, setMessage] = useState(""); const [error, setError] = useState(false);
  const [storageWarning, setStorageWarning] = useState(false);
  const [reinforcements, setReinforcements] = useState("300");
  const [selectedBattle, setSelectedBattle] = useState<string | null>(null);
  const [reveal, setReveal] = useState<DemoHero[] | null>(null);
  const [inspect, setInspect] = useState<{ hero: DemoHero; owned: boolean } | null>(null);
  const [showCatalog, setShowCatalog] = useState(false);
  const [onboardError, setOnboardError] = useState("");

  const contentRef = useRef<HTMLDivElement>(null);
  useEffect(() => { contentRef.current?.closest('.tkw-root')?.scrollTo(0, 0); }, [tab]);

  function persist(next: DemoState) {
    current.current = next; setState(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); }
    catch { setStorageWarning(true); }
  }
  useEffect(() => {
    let initial = createDemo(Date.now());
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = demoSchema.safeParse(JSON.parse(saved));
        if (parsed.success) initial = syncDemo(parsed.data, Date.now());
        else setMessage("저장 형식이 달라 새 게임을 준비했습니다. 백업 파일이 있다면 불러올 수 있습니다.");
      }
    } catch { setStorageWarning(true); }
    persist(initial);
    const timer = setInterval(() => { if (current.current) persist(syncDemo(current.current, Date.now())); }, 1000);
    return () => clearInterval(timer);
  }, []);

  function act(action: DemoAction) {
    if (!current.current || summonLock.current) return;
    try {
      const result = actDemo(current.current, action, Date.now(), Math.random, crypto.randomUUID());
      persist(result.state); setMessage(result.message); setError(false);
      if (action.type === "draw") {
        summonLock.current = true; setReveal(result.state.heroes.slice(-(action.amount ?? 1))); setMessage("");
      }
      if (action.type === "battle") setSelectedBattle(result.state.battles[0].id);
      return result.state;
    } catch (e) { setMessage(e instanceof Error ? e.message : "행동을 완료하지 못했습니다."); setError(true); }
  }
  function closeReveal() { summonLock.current = false; setReveal(null); }
  function reset() {
    if (!window.confirm("현재 군주와 모든 진행 기록을 지우고 새로 시작할까요? 필요한 기록은 먼저 백업하세요.")) return;
    persist(createDemo(Date.now())); setTab("모집관"); setMessage(""); setOnboardError(""); setInspect(null); closeReveal();
  }
  function backup() {
    if (!current.current) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(current.current)], { type: "application/json" }));
    const a = document.createElement("a"); a.href = url; a.download = "three-kingdoms-save.json"; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function restore(file?: File) {
    if (!file) return;
    try {
      setOnboardError("");
      if (file.size > 2_000_000) throw new Error("백업 파일이 너무 큽니다.");
      const parsed = demoSchema.safeParse(JSON.parse(await file.text()));
      if (!parsed.success) throw new Error("이 버전의 게임 백업 파일이 아닙니다.");
      if (!window.confirm("현재 진행 상황을 이 백업 기록으로 바꿀까요?")) return;
      persist(syncDemo(parsed.data, Date.now())); setTab("모집관"); setMessage("백업 기록을 불러왔습니다."); setError(false);
    } catch (e) { const message = e instanceof Error ? e.message : "백업을 읽을 수 없습니다."; setMessage(message); setOnboardError(message); setError(true); }
  }

  if (!state) return <main className="game-loading"><span className="brand-seal">三</span><h1>천하의 기록을 펼치는 중…</h1></main>;
  if (!state.lordName) return <Onboarding error={onboardError} onStart={(lordName, castleName) => {
    try { const result = actDemo(state, { type: "start", lordName, castleName }, Date.now(), Math.random, "start"); persist(result.state); setMessage(result.message); setOnboardError(""); }
    catch (e) { setOnboardError(e instanceof Error ? e.message : "이름을 확인하세요."); }
  }}><SaveControls onRestore={restore} /><p role="status">{!onboardError && message}</p>{storageWarning && <p role="alert" className="error-text">자동 저장을 사용할 수 없습니다. 게임 시작 후 백업으로 기록을 보관하세요.</p>}</Onboarding>;

  const rates = production(state); const capacity = troopCapacity(state);
  const commander = state.heroes.find(h => h.id === state.troop.heroIds[0]);
  const stats = commander ? aggregateStats(playerTroop(state)) : { leadership: 0, strength: 0, intelligence: 0 };
  const report = state.battles.find(b => b.id === selectedBattle) ?? state.battles[0];
  const ownedCount = new Set(state.heroes.map(h => h.templateKey)).size;
  const preview = (key: typeof HERO_CATALOG[number]["key"]) => setInspect({ hero: createCollectedHero(key, 5, `preview-${key}`), owned: false });

  return <div className="game-shell" ref={contentRef}><aside className="side-rail"><a className="brand-lockup" href="#main"><span className="brand-seal">三</span><span>삼국 영지<small>인연으로 쓰는 천하</small></span></a><div className="lord-profile"><span>{state.lordName.slice(0, 1)}</span><div><strong>{state.lordName}</strong><small>{state.castleName}의 군주</small></div></div><nav aria-label="게임 메뉴">{menus.map(menu => <button key={menu.name} aria-current={tab === menu.name ? "page" : undefined} onClick={() => { setTab(menu.name); setMessage(""); }}><span className="nav-symbol" aria-hidden="true">{menu.symbol}</span><span>{menu.name}<small>{menu.caption}</small></span></button>)}</nav><div className="rail-bottom"><div className="local-indicator"><i />로컬 자동 저장</div><SaveControls onBackup={backup} onRestore={restore} onReset={reset} /></div></aside>
    <div className="game-body"><header className="resource-header"><div className="current-location"><span>{state.castleName}</span><small>나의 영지</small></div><div className="resource-items">{(["gold", "food", "reserves"] as const).map((key, i) => <div className="resource" key={key}><span className={`resource-symbol symbol-${key}`} aria-hidden="true">{["金", "糧", "兵"][i]}</span><div><small>{["금", "식량", "예비군"][i]}</small><strong>{number(state.castle[key])}</strong></div><span className="resource-rate">+{rates[key].toFixed(1)}/분</span></div>)}</div><div className="ticket-count"><span aria-hidden="true">令</span><small>초빙장</small><strong>{state.recruitmentTickets}</strong></div></header>
    <main id="main" className="game-main">{message && <div className={`toast ${error ? "toast-error" : ""}`} role="status">{message}<button aria-label="알림 닫기" onClick={() => setMessage("")}>×</button></div>}{storageWarning && <p className="error-text" role="alert">저장소를 사용할 수 없습니다. 종료 전에 백업 파일을 내려받으세요.</p>}

    {tab === "모집관" && <section className="recruit-page"><div className="page-title"><div><p className="eyebrow">초현관 · 인재를 맞이하는 곳</p><h1>한 번의 인연이,<br className="mobile-break" /> 천하를 바꾼다.</h1></div><span className="subtle-tag">만난 장수 {ownedCount} / {HERO_CATALOG.length}명</span></div><div className="summon-hall"><div className="hall-mist" /><div className="hall-copy"><span className="hall-label">천하 초빙</span><h2>난세에 잠든<br />영웅을 부르다.</h2><p>당신을 기다리는 이름들.<br />같은 이름, 서로 다른 잠재력.<br />1성부터 5성까지, 인연은 지금 시작됩니다.</p><div className="hall-seal" aria-hidden="true">招賢</div></div><div className="hall-portraits" aria-hidden="true"><div className="featured-officer officer-left"><HeroPortrait templateKey="guanyu" /></div><div className="featured-officer officer-right"><HeroPortrait templateKey="zhugeliang" /></div><div className="featured-officer officer-center"><HeroPortrait templateKey="zhaoyun" /></div><div className="featured-caption"><span>촉 · 상산의 용</span><strong>조 운</strong><small>등장 장수 미리보기 · 보유 장수가 아닙니다</small></div></div><div className="summon-controls"><div><span className="summon-ticket-label">보유 초빙장 <b>{state.recruitmentTickets}장</b></span><small>초빙장 우선 사용 · 부족분은 1회당 금 300</small></div><button className="outline-button summon-one" disabled={state.castle.gold < recruitmentCost(state, 1) || state.heroes.length >= HERO_ROSTER_LIMIT} onClick={() => act({ type: "draw" })}><strong>1회 모집</strong><span>{state.recruitmentTickets > 0 ? "초빙장 1장" : "금 300"}</span></button><button className="gold-button summon-five" disabled={state.castle.gold < recruitmentCost(state, 5) || state.heroes.length + 5 > HERO_ROSTER_LIMIT} onClick={() => act({ type: "draw", amount: 5 })}><strong>5회 모집</strong><span>{recruitmentCost(state, 5) === 0 ? "초빙장 5장" : `${Math.min(5, state.recruitmentTickets) > 0 ? `초빙장 ${Math.min(5, state.recruitmentTickets)}장 + ` : ""}금 ${number(recruitmentCost(state, 5))}`}</span></button></div></div>
      <div className="recruit-info"><span>모든 장수는 모든 등급으로 등장합니다.</span><details><summary>모집 확률 확인</summary><div className="probability-popover">{RARITIES.map(r => <p key={r.stars}><span style={{ color: r.color }}>{r.stars}성 {r.name}</span><strong>{r.chance}%</strong></p>)}<small>각 등급 내 장수 {HERO_CATALOG.length}명은 균등 확률입니다.<br />5회 모집에도 확정 등급이나 보정은 없습니다.</small></div></details></div>
      <div className="section-heading"><div><p className="eyebrow">이 시대의 인연</p><h2>당신의 부름을 기다리는 장수</h2></div><button className="quiet-button" onClick={() => { setShowCatalog(true); setTab("장수 명부"); }}>전체 {HERO_CATALOG.length}명 보기 ↗</button></div><div className="catalog-strip">{HERO_CATALOG.filter(h => ["guanyu", "zhaoyun", "liubei", "zhangfei", "simayi", "zhangliao", "sunquan", "zhouyu", "huangyueying", "ganning", "diaochan", "yuanshao"].includes(h.key)).map(h => <button key={h.key} onClick={() => preview(h.key)}><HeroPortrait templateKey={h.key} /><div><small>{h.title}</small><strong>{h.name}</strong><span>{h.faction} · {h.role}</span></div></button>)}</div>
      {state.heroes.length === 0 && <div className="first-step"><span>첫 걸음</span><p>아직 함께할 장수가 없습니다. 초빙장으로 모집한 뒤 주장으로 편성해 보세요.</p><span>모집 → 편성 → 병력 보충 → 출정</span></div>}
    </section>}

    {tab === "장수 명부" && <HeroRoster heroes={state.heroes} assignedIds={state.troop.heroIds} showCatalog={showCatalog} onShowCatalog={setShowCatalog} onRecruit={() => setTab("모집관")} onInspect={hero => setInspect({ hero, owned: true })} onPreview={preview} />}

    {tab === "부대 편성" && <section><div className="page-title"><div><p className="eyebrow">당신의 깃발 아래</p><h1>첫 번째 군을 편성하다</h1></div><span className="subtle-tag">주장 100% + 부장 각 30%</span></div>{!state.heroes.length && <div className="inline-guide"><p>편성할 장수가 없습니다. 먼저 모집관에서 장수를 얻으세요.</p><button className="gold-button" onClick={() => setTab("모집관")}>장수 모집</button></div>}<div className="formation-layout"><div><div className="formation-grid">{state.troop.heroIds.map((id, index) => { const h = state.heroes.find(hero => hero.id === id); return <article className={`formation-slot ${h ? "slot-filled" : ""}`} key={index} style={h ? { "--rarity": RARITIES[h.stars - 1].color } as CSSProperties : undefined}><div className="slot-label"><span>{["주장", "부장 1", "부장 2"][index]}</span><small>{index === 0 ? "지휘" : "보좌"}</small></div>{h ? <button className="slot-portrait" onClick={() => setInspect({ hero: h, owned: true })} aria-label={`${h.name} 상세 보기`}><HeroPortrait templateKey={h.templateKey} /><span>{"★".repeat(h.stars)}</span></button> : <div className="slot-empty"><span>＋</span><small>장수를 배치하세요</small></div>}<select aria-label={["주장 선택", "부장 1 선택", "부장 2 선택"][index]} value={id ?? ""} disabled={!state.heroes.length || (index > 0 && !commander)} onChange={e => act({ type: "assign", slot: index, heroId: e.target.value || null })}><option value="">미배치</option>{state.heroes.map(hero => <option key={hero.id} value={hero.id} disabled={state.troop.heroIds.some((selected, slot) => selected === hero.id && slot !== index)}>{hero.name} · {hero.stars}성 · Lv.{hero.level}</option>)}</select></article>; })}</div><dl className="army-stats">{[["통솔", stats.leadership], ["무력", stats.strength], ["지력", stats.intelligence]].map(([label, value]) => <div key={label}><dt>종합 {label}</dt><dd>{Number(value).toFixed(1)}</dd></div>)}</dl><p className="muted small formation-note">같은 이름의 장수도 서로 다른 카드라면 함께 편성할 수 있습니다. 주장 해제 시 부대 전체가 해제되고 병력은 예비군으로 돌아갑니다.</p></div><aside className="reinforce-panel"><span className="panel-symbol" aria-hidden="true">兵</span><h2>병력 보충</h2><p className="troop-count">{number(state.troop.currentTroops)}<small> / {number(capacity)}명</small></p><progress aria-label="배치 병력" value={state.troop.currentTroops} max={Math.max(1, capacity)} /><p className="muted small">병사 1명당 예비군 1명과 식량 1을 사용합니다.</p><label htmlFor="reinforcements">보충할 병력</label><input id="reinforcements" type="number" min={1} step={1} value={reinforcements} onChange={e => setReinforcements(e.target.value)} /><button className="gold-button" disabled={!commander} onClick={() => act({ type: "reinforce", count: Number(reinforcements) })}>병력 보충하기</button><button className="outline-button" onClick={() => setTab("출정")}>원정지 살펴보기 ↗</button></aside></div></section>}

    {tab === "영지" && <section><div className="territory-banner"><div><p className="eyebrow">{state.lordName} 군주의 터전</p><h1>{state.castleName}</h1><p>작은 영지에서 시작하는 새로운 천하.<br />생산 기반을 넓혀 다음 원정을 준비하세요.</p><span className="subtle-tag">정치 보너스 +{(Math.max(0, ...state.heroes.map(h => h.politics)) / 10).toFixed(1)}%</span></div></div><div className="section-heading"><h2>영지 경영</h2><span className="muted small">머무르지 않아도 자원은 생산됩니다.</span></div><div className="building-grid">{state.buildings.map(b => { const rule = BUILDINGS[b.type]; const cost = upgradeCost(b.level); return <article className={`building-card building-${b.type}`} key={b.type}><div className="building-illustration" aria-hidden="true"><div className="roof roof-one" /><div className="roof roof-two" /><div className="building-body"><span>{b.type === "FARM" ? "田" : b.type === "BARRACKS" ? "兵" : "府"}</span></div></div><div className="building-header"><h3>{rule.name}</h3><span>Lv.{b.level}</span></div><p>{rule.description}</p><strong className="building-production">{rule.label} +{rates[rule.resource].toFixed(1)}<small> /분</small></strong><button className="outline-button" disabled={b.level >= 10 || state.castle.gold < cost.gold || state.castle.food < cost.food} onClick={() => act({ type: "upgrade", building: b.type })}>{b.level >= 10 ? "최대 레벨" : `${rule.name} 강화`}</button><small className="building-cost">{b.level >= 10 ? "10레벨 달성" : `금 ${number(cost.gold)} · 식량 ${number(cost.food)}`}</small></article>; })}</div></section>}

    {tab === "출정" && <section><div className="page-title"><div><p className="eyebrow">깃발을 올리고, 천하로</p><h1>영지 밖의 전장</h1></div><button className="outline-button" onClick={() => setTab("부대 편성")}>아군 {number(state.troop.currentTroops)}명 · 편성</button></div>{!commander && <div className="inline-guide"><p>아직 출전할 주장이 없습니다. 모집과 부대 편성부터 시작하세요.</p><button className="gold-button" onClick={() => setTab(state.heroes.length ? "부대 편성" : "모집관")}>출정 준비</button></div>}<div className="target-grid">{state.targets.map((target, i) => <article className={`target-card target-${i}`} key={target.id}><div className="target-scenery"><span>{["黃巾", "山賊", "黑山"][i]}</span><small>{["초급", "중급", "상급"][i]} 토벌</small></div><div className="target-body"><h2>{target.name}</h2><p>주장 {target.commander.name}</p><dl><div><dt>잔여 병력</dt><dd>{number(target.currentTroops)}명</dd></div><div><dt>승리 전리품</dt><dd>금 {target.goldReward}</dd></div></dl><button className="gold-button" disabled={!commander || target.currentTroops === 0 || state.troop.currentTroops === 0} onClick={() => act({ type: "battle", targetId: target.id })}>{target.currentTroops === 0 ? "토벌 완료" : `${target.name} 토벌`}</button></div></article>)}</div><div className="section-heading"><div><h2>전투 기록</h2><p className="muted small">최대 10턴 자동 전투 · 최근 10회 보관</p></div>{report && <select aria-label="전투 기록 선택" value={report.id} onChange={e => setSelectedBattle(e.target.value)}>{state.battles.map((b, i) => <option key={b.id} value={b.id}>{i === 0 ? "최근 · " : ""}{b.targetName} · {b.turns}턴</option>)}</select>}</div>{report ? <article className="battle-report"><div className="report-summary"><span className={`result-stamp result-${report.winner}`}>{report.winner === "ATTACKER" ? "승리" : report.winner === "DEFENDER" ? "패배" : "무승부"}</span><div><h3>{report.targetName}</h3><p>{report.turns}턴 종료 · 아군 {number(report.attackerRemaining)}명 생존</p></div><div className="reward-summary"><strong>금 +{report.goldReward}</strong><span>경험치 +{report.experienceReward}</span></div></div><ol className="battle-lines">{report.logs.map((log, i) => <li className={log.includes("계략 발동") ? "strategy-line" : ""} key={i}>{log}</li>)}</ol></article> : <div className="empty-report"><span>戰</span><p>첫 출정의 기록이 이곳에 남습니다.</p></div>}</section>}
    </main><footer className="game-footer"><div className="mobile-save-controls"><SaveControls onBackup={backup} onRestore={restore} onReset={reset} /></div><span>삼국 영지 · 로컬 플레이</span><span>기록은 현재 브라우저에 저장됩니다. 백업 파일로 진행 상황을 보관할 수 있습니다.</span></footer></div>
    {reveal && <SummonReveal heroes={reveal} onClose={closeReveal} onRoster={() => { closeReveal(); setShowCatalog(false); setTab("장수 명부"); }} />}
    {inspect && <HeroDetails key={inspect.hero.id} hero={inspect.hero} owned={inspect.owned} onClose={() => setInspect(null)} onFormation={() => { setInspect(null); setTab("부대 편성"); }} />}
  </div>;
}
