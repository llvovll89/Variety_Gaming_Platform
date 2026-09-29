

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { actDemo, assignedIds, OFFLINE_CAP_SECONDS, offlineSummary, createCollectedHero, createDemo, demoSchema, production, STORAGE_KEY, syncDemo, type DemoAction, type DemoHero, type DemoState } from "../lib/demoGame";
import { HERO_CATALOG } from "../lib/heroCatalog";
import HeroDetails from "./HeroDetails";
import HeroRoster from "./HeroRoster";
import SummonReveal from "./SummonReveal";
import FormationTab from "./tabs/FormationTab";
import RecruitTab from "./tabs/RecruitTab";
import { menus, number, type Tab } from "./tabs/shared";
import SortieTab from "./tabs/SortieTab";
import TerritoryTab from "./tabs/TerritoryTab";


function Onboarding({ onStart, error, children }: { onStart: (lord: string, castle: string) => void; error: string; children: ReactNode }) {
  const [lord, setLord] = useState(""); const [castle, setCastle] = useState("");
  function submit(event: FormEvent) { event.preventDefault(); onStart(lord, castle); }
  return <main className="onboarding"><div className="onboard-art" /><div className="onboard-content"><a className="brand-lockup" href="#start"><span className="brand-seal">三</span><span>삼국 영지<small>인연으로 쓰는 새로운 천하</small></span></a><div className="onboard-intro"><p className="eyebrow">아직 이름 없는 당신의 이야기</p><h1>천하에,<br />당신의 이름을 새기다.</h1><p>정해진 군주도, 주어진 명장도 없습니다.<br />첫 번째 인연을 만나 당신만의 세력을 일으키세요.</p></div><form id="start" className="onboard-form" onSubmit={submit}><div><label htmlFor="lord-name">군주 이름</label><input autoComplete="off" id="lord-name" placeholder="어떤 이름으로 기억될까요?" value={lord} onChange={e => setLord(e.target.value)} required maxLength={12} /></div><div><label htmlFor="castle-name">영지 이름</label><input autoComplete="off" id="castle-name" placeholder="당신의 첫 영지" value={castle} onChange={e => setCastle(e.target.value)} required maxLength={12} /></div><p className="starter-note"><span>장수 0명</span><span>빈 부대</span><span>첫 모집 초빙장 3장</span></p>{error && <p role="alert" className="error-text">{error}</p>}<button className="seal-button" type="submit">나의 이야기 시작하기</button></form>{children}<p className="onboard-save">가입 없이 플레이 · 이 브라우저에 자동 저장</p></div></main>;
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

function awayMessage(away: ReturnType<typeof offlineSummary>) {
  const hours = Math.floor(away.seconds / 3600); const minutes = Math.floor(away.seconds % 3600 / 60);
  const gains = [["금", away.gold], ["식량", away.food], ["예비군", away.reserves], ["초빙장", away.tickets]]
    .filter(([, n]) => Number(n) > 0).map(([label, n]) => `${label} +${number(Number(n))}`);
  const capped = away.seconds > OFFLINE_CAP_SECONDS ? ` (자원은 최대 ${OFFLINE_CAP_SECONDS / 3600}시간분까지 쌓입니다)` : "";
  return `돌아오셨군요! ${hours ? `${hours}시간 ` : ""}${minutes}분 동안 ${gains.length ? gains.join(", ") : "변화 없음"}${capped}`;
}

export default function GameDemo() {
  const [state, setState] = useState<DemoState | null>(null);
  const current = useRef<DemoState | null>(null);
  const summonLock = useRef(false);
  const [tab, setTab] = useState<Tab>("모집관");
  const [message, setMessage] = useState(""); const [error, setError] = useState(false);
  const [storageWarning, setStorageWarning] = useState(false);
  const [selectedBattle, setSelectedBattle] = useState<string | null>(null);
  const [reveal, setReveal] = useState<DemoHero[] | null>(null);
  const [inspect, setInspect] = useState<{ hero: DemoHero; owned: boolean } | null>(null);
  const [showCatalog, setShowCatalog] = useState(false);
  const [onboardError, setOnboardError] = useState("");

  useEffect(() => {
    if (!message || error) return;
    const timer = setTimeout(() => setMessage(""), 4200);
    return () => clearTimeout(timer);
  }, [message, error]);

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
        if (parsed.success) {
          initial = syncDemo(parsed.data, Date.now());
          const away = offlineSummary(parsed.data, initial);
          if (parsed.data.lordName && away.seconds >= 300) setMessage(awayMessage(away));
        }
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

  const rates = production(state);
  const preview = (key: typeof HERO_CATALOG[number]["key"]) => setInspect({ hero: createCollectedHero(key, 5, `preview-${key}`), owned: false });

  return <div className="game-shell" ref={contentRef}><aside className="side-rail"><a className="brand-lockup" href="#main"><span className="brand-seal">三</span><span>삼국 영지<small>인연으로 쓰는 천하</small></span></a><div className="lord-profile"><span>{state.lordName.slice(0, 1)}</span><div><strong>{state.lordName}</strong><small>{state.castleName}의 군주</small></div></div><nav aria-label="게임 메뉴">{menus.map(menu => <button key={menu.name} aria-current={tab === menu.name ? "page" : undefined} onClick={() => { setTab(menu.name); setMessage(""); }}><span className="nav-symbol" aria-hidden="true">{menu.symbol}</span><span>{menu.name}<small>{menu.caption}</small></span></button>)}</nav><div className="rail-bottom"><div className="local-indicator"><i />로컬 자동 저장</div><SaveControls onBackup={backup} onRestore={restore} onReset={reset} /></div></aside>
    <div className="game-body"><header className="resource-header"><div className="current-location"><span>{state.castleName}</span><small>나의 영지</small></div><div className="resource-items">{(["gold", "food", "reserves"] as const).map((key, i) => <div className="resource" key={key}><span className={`resource-symbol symbol-${key}`} aria-hidden="true">{["金", "糧", "兵"][i]}</span><div><small>{["금", "식량", "예비군"][i]}</small><strong>{number(state.castle[key])}</strong></div><span className="resource-rate">+{rates[key].toFixed(1)}/분</span></div>)}</div><div className="ticket-count"><span aria-hidden="true">令</span><small>초빙장</small><strong>{state.recruitmentTickets}</strong></div></header>
    <main id="main" className="game-main">{message && <div className={`toast ${error ? "toast-error" : ""}`} role="status">{message}<button aria-label="알림 닫기" onClick={() => setMessage("")}>×</button></div>}{storageWarning && <p className="error-text" role="alert">저장소를 사용할 수 없습니다. 종료 전에 백업 파일을 내려받으세요.</p>}

    {tab === "모집관" && <RecruitTab state={state} act={act} onShowCatalog={() => { setShowCatalog(true); setTab("장수 명부"); }} onPreview={preview} />}

    {tab === "장수 명부" && <HeroRoster heroes={state.heroes} assignedIds={assignedIds(state)} showCatalog={showCatalog} onShowCatalog={setShowCatalog} onRecruit={() => setTab("모집관")} onInspect={hero => setInspect({ hero, owned: true })} onPreview={preview} onDismissMany={heroIds => act({ type: "dismissMany", heroIds })} />}

    {tab === "부대 편성" && <FormationTab state={state} act={act} onNavigate={setTab} onInspect={hero => setInspect({ hero, owned: true })} />}

    {tab === "영지" && <TerritoryTab state={state} act={act} />}

    {tab === "출정" && <SortieTab state={state} act={act} onNavigate={setTab} selectedBattle={selectedBattle} onSelectBattle={setSelectedBattle} />}
    </main><footer className="game-footer"><div className="mobile-save-controls"><SaveControls onBackup={backup} onRestore={restore} onReset={reset} /></div><span>삼국 영지 · 로컬 플레이</span><span>기록은 현재 브라우저에 저장됩니다. 백업 파일로 진행 상황을 보관할 수 있습니다.</span></footer></div>
    {reveal && <SummonReveal heroes={reveal} onClose={closeReveal} onRoster={() => { closeReveal(); setShowCatalog(false); setTab("장수 명부"); }} />}
    {inspect && <HeroDetails key={inspect.hero.id} hero={inspect.owned ? state.heroes.find(h => h.id === inspect.hero.id) ?? inspect.hero : inspect.hero} owned={inspect.owned} gold={state.castle.gold} heroes={state.heroes} troopIds={assignedIds(state)} onAct={action => { const next = act(action); if (next && (action.type === "dismiss" || !next.heroes.some(h => h.id === inspect.hero.id))) setInspect(null); }} onClose={() => setInspect(null)} onFormation={() => { setInspect(null); setTab("부대 편성"); }} />}
  </div>;
}
