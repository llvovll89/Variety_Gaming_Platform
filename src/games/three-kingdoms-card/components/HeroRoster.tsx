

import { useState } from "react";
import { createCollectedHero, DISMISS_REFUND, type DemoHero } from "../lib/demoGame";
import { catalogHero, FACTIONS, HERO_CATALOG, HERO_ROSTER_LIMIT, RARITIES, type HeroKey } from "../lib/heroCatalog";
import { HeroCard, HeroPortrait, Stars } from "./HeroVisual";
import { effectiveHero, type EquipmentItem } from "../lib/equipment";

const SORTS = {
  recent: { label: "최근 획득순", compare: (_a: DemoHero, _b: DemoHero) => 0 },
  stars: { label: "등급 높은순", compare: (a: DemoHero, b: DemoHero) => b.stars - a.stars || b.level - a.level },
  level: { label: "레벨 높은순", compare: (a: DemoHero, b: DemoHero) => b.level - a.level || b.stars - a.stars },
  power: { label: "종합 능력순", compare: (a: DemoHero, b: DemoHero) => total(b) - total(a) },
  name: { label: "이름순", compare: (a: DemoHero, b: DemoHero) => a.name.localeCompare(b.name, "ko") },
} as const;
const total = (h: DemoHero) => h.leadership + h.strength + h.intelligence + h.politics + h.charm;

export default function HeroRoster({ heroes, equipment = [], assignedIds, busyIds = [], showCatalog, onShowCatalog, onRecruit, onInspect, onPreview, onDismissMany }: {
  heroes: DemoHero[];
  equipment?: EquipmentItem[];
  assignedIds: (string | null)[];
  busyIds?: string[];
  showCatalog: boolean;
  onShowCatalog: (value: boolean) => void;
  onRecruit: () => void;
  onInspect: (hero: DemoHero) => void;
  onPreview: (key: HeroKey) => void;
  onDismissMany: (heroIds: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"cards" | "list">("cards");
  const [faction, setFaction] = useState("전체");
  const [grade, setGrade] = useState(0);
  const [sort, setSort] = useState<keyof typeof SORTS>("recent");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [bulkStars, setBulkStars] = useState(1);
  const bulk = heroes.filter(h => !h.locked && !h.favorite && h.stars <= bulkStars && !assignedIds.includes(h.id) && !busyIds.includes(h.id));
  const bulkRefund = bulk.reduce((sum, h) => sum + DISMISS_REFUND[h.stars - 1], 0);
  const ownedKeys = new Set(heroes.map(h => h.templateKey));
  const pool = showCatalog ? HERO_CATALOG.map(h => createCollectedHero(h.key, 5, `catalog-${h.key}`)) : heroes.map(h => effectiveHero(equipment, h));
  const ordered = showCatalog ? pool : sort === "recent" ? [...pool].reverse() : [...pool].sort(SORTS[sort].compare);
  const visible = ordered.filter(hero => {
    const template = catalogHero(hero.templateKey);
    return (showCatalog || !favoritesOnly || hero.favorite) && (faction === "전체" || template.faction === faction)
      && (showCatalog || !grade || hero.stars === grade)
      && `${hero.name} ${template.title} ${template.role}`.includes(query.trim());
  });
  const resetFilters = () => { setQuery(""); setFaction("전체"); setGrade(0); setFavoritesOnly(false); };

  return <section>
    <div className="page-title"><div><h1>{showCatalog ? "천하의 장수 도감" : "나의 장수 명부"}</h1></div><button className="seal-button" onClick={onRecruit}>장수 모집하러 가기</button></div>
    <div className="roster-toolbar"><div className="segmented">
      <button aria-pressed={!showCatalog} onClick={() => onShowCatalog(false)}>보유 장수 {heroes.length}/{HERO_ROSTER_LIMIT}</button>
      <button aria-pressed={showCatalog} onClick={() => onShowCatalog(true)}>장수 도감 {HERO_CATALOG.length}명</button>
    </div><span className="roster-progress">만난 장수 <strong>{ownedKeys.size}</strong> / {HERO_CATALOG.length}명</span></div>
    <div className="roster-view-switch segmented" role="group" aria-label="명부 표시 방식"><button aria-pressed={view === "cards"} onClick={() => setView("cards")}>장수 카드</button><button aria-pressed={view === "list"} onClick={() => setView("list")}>능력치 목록</button></div>
    <div className="roster-search-row">
      <label className="roster-search"><span>장수 찾기</span><input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="이름·별호·역할로 검색" /></label>
      {!showCatalog && <label className="filter-label">등급<select value={grade} onChange={e => setGrade(Number(e.target.value))}><option value={0}>전체 등급</option>{RARITIES.map(r => <option key={r.stars} value={r.stars}>{r.stars}성 {r.name}</option>)}</select></label>}
      {!showCatalog && <label className="filter-label">정렬<select value={sort} onChange={e => setSort(e.target.value as keyof typeof SORTS)}>{Object.entries(SORTS).map(([key, s]) => <option key={key} value={key}>{s.label}</option>)}</select></label>}
    </div>
    {!showCatalog && <div className="hero-protection"><button className="outline-button" aria-pressed={favoritesOnly} onClick={() => setFavoritesOnly(!favoritesOnly)}>★ 즐겨찾기만 보기</button><small className="muted">잠금·즐겨찾기 장수는 일괄 방출과 승급 재료에서 제외됩니다.</small></div>}
    <div className="faction-tabs" role="group" aria-label="세력 필터">{["전체", ...FACTIONS].map(value => <button key={value} aria-pressed={faction === value} onClick={() => setFaction(value)}><span>{value}</span><small>{value === "전체" ? pool.length : pool.filter(h => catalogHero(h.templateKey).faction === value).length}</small></button>)}</div>
    {!showCatalog && heroes.length > 0 && <div className="bulk-dismiss">
      <label className="filter-label">일괄 방출<select value={bulkStars} onChange={e => setBulkStars(Number(e.target.value))}>{[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}성 이하</option>)}</select></label>
      <button className="outline-button" disabled={!bulk.length} onClick={() => { if (window.confirm(`편성·파견하지 않은 ${bulkStars}성 이하 장수 ${bulk.length}명을 방출하고 금 ${bulkRefund}을 받을까요?`)) onDismissMany(bulk.map(h => h.id)); }}>
        대기 {bulk.length}명 방출 (금 +{bulkRefund})
      </button>
    </div>}
    <p className="roster-result" role="status">{visible.length}명 표시{showCatalog ? " · 대표 5성 초상입니다. 각 장수는 1~5성으로 모집할 수 있습니다." : " · 카드를 누르면 능력치와 편성을 확인할 수 있습니다."}</p>
    {!showCatalog && heroes.length === 0 ? <div className="empty-state"><div className="empty-card" aria-hidden="true"><span>將</span></div><h2>아직 비어 있는 장수 명부</h2><p>천하의 {HERO_CATALOG.length}명 중 첫 번째 인연을 만나세요.</p><button className="seal-button" onClick={onRecruit}>첫 장수 모집하기</button></div>
      : visible.length === 0 ? <div className="empty-state compact"><h2>조건에 맞는 장수가 없습니다</h2><p>이름이나 세력·등급을 바꿔 보세요.</p><button className="outline-button" onClick={resetFilters}>검색 조건 초기화</button></div>
      : view === "list" ? <div className="roster-table-scroll"><table className="roster-table"><caption className="sr-only">장수 능력치 비교 목록</caption><thead><tr>{["장수", "등급", "레벨", "통솔", "무력", "지력", "정치", "매력", "편성"].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead><tbody>{visible.map(hero => <tr key={hero.id}><th scope="row"><button onClick={() => showCatalog ? onPreview(hero.templateKey as HeroKey) : onInspect(hero)}><HeroPortrait templateKey={hero.templateKey} /><span>{hero.name}<small>{catalogHero(hero.templateKey).faction} · {catalogHero(hero.templateKey).role}</small></span></button></th><td><Stars stars={hero.stars} /></td><td>{hero.level}</td>{[hero.leadership, hero.strength, hero.intelligence, hero.politics, hero.charm].map((stat, i) => <td key={i} className={stat >= 90 ? "high-stat" : ""}>{stat}</td>)}<td>{showCatalog ? ownedKeys.has(hero.templateKey) ? "보유" : "미보유" : assignedIds.includes(hero.id) ? "편성 중" : busyIds.includes(hero.id) ? "파견 중" : "대기"}</td></tr>)}</tbody></table></div>
      : <div className="hero-grid">{visible.map(hero => <div className="roster-entry" key={hero.id}>
        <HeroCard hero={hero} dispatched={!showCatalog && busyIds.includes(hero.id)} assigned={!showCatalog && assignedIds.includes(hero.id)} onClick={() => showCatalog ? onPreview(hero.templateKey as HeroKey) : onInspect(hero)} />
        {showCatalog && <span className={`catalog-ownership ${ownedKeys.has(hero.templateKey) ? "is-owned" : ""}`}>{ownedKeys.has(hero.templateKey) ? "보유 중" : "아직 만나지 못한 장수"}</span>}
      </div>)}</div>}
  </section>;
}
