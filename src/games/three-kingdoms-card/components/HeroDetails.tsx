
import { useEffect, useRef } from "react";
import { DISMISS_REFUND, promoteCost, resetStatsCost, STAT_CAP, STAT_KEYS, STAT_POINTS_PER_LEVEL, type DemoAction, type DemoHero } from "../lib/demoGame";
import { heroSkills } from "../lib/heroSkills";
import { SKILL_KINDS, skillLabel, skillTier } from "../lib/skills";
import { baseStats, catalogHero, RARITIES } from "../lib/heroCatalog";
import { HeroPortrait, rarityStyle, Stars } from "./HeroVisual";
import { UNIT_KEYS, UNITS } from "../lib/tactics";
import { HERO_BONDS } from "../lib/synergy";
import { EQUIPMENT, equipmentStats, type EquipmentItem } from "../lib/equipment";

export default function HeroDetails({ hero, owned, gold, heroes = [], troopIds = [], equipment = [], onEquipment, onAct, onClose, onFormation }: { hero: DemoHero; owned: boolean; gold: number; heroes?: DemoHero[]; troopIds?: readonly (string | null)[]; equipment?: EquipmentItem[]; onEquipment?: () => void; onAct: (action: DemoAction) => unknown; onClose: () => void; onFormation: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const template = catalogHero(hero.templateKey);
  const bonds = HERO_BONDS.filter(b => b.keys.includes(hero.templateKey));
  const bonus = equipmentStats(equipment, hero.id);
  useEffect(() => { dialog.current?.showModal(); }, []);
  return <dialog className="hero-dialog" ref={dialog} onCancel={onClose} aria-labelledby="hero-name" style={rarityStyle(hero.stars)}>
    <button className="dialog-close" onClick={onClose} aria-label="장수 상세 닫기">×</button>
    <div className="hero-detail-visual"><HeroPortrait templateKey={hero.templateKey} /><div className="hero-identity"><Stars stars={hero.stars} /><h3>{hero.name}</h3><p>{template.faction} · {template.role} · Lv.{hero.level}</p><small>{template.title}</small></div></div>
    <div className="hero-detail-body"><div className="detail-tags"><span className="faction-seal">{template.faction}</span><span>{template.role}</span><span>{owned ? "보유 장수" : "도감 미리보기"}</span><Stars stars={hero.stars} /></div><h2 id="hero-name">{hero.name}<small>{template.title}</small></h2><p className="hero-quote">“{template.quote}”</p>
      {owned && <div className="hero-protection"><button className="outline-button" aria-pressed={hero.favorite} onClick={() => onAct({ type: "setHeroFlag", heroId: hero.id, flag: "favorite", value: !hero.favorite })}>{hero.favorite ? "★ 즐겨찾기" : "☆ 즐겨찾기"}</button><button className="outline-button" aria-pressed={hero.locked} onClick={() => onAct({ type: "setHeroFlag", heroId: hero.id, flag: "locked", value: !hero.locked })}>{hero.locked ? "잠금 해제" : "장수 잠금"}</button></div>}
      <dl className="detail-stats">{[["통솔", hero.leadership + bonus.leadership], ["무력", hero.strength + bonus.strength], ["지력", hero.intelligence + bonus.intelligence], ["정치", hero.politics], ["매력", hero.charm]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd><meter aria-label={`${label} 능력치`} min={0} max={300} value={Number(value)} /></div>)}</dl>
      {owned && <div className="hero-equipment"><strong>장비 · 통솔 +{bonus.leadership} / 무력 +{bonus.strength} / 지력 +{bonus.intelligence}</strong><p className="small muted">{equipment.filter(i => i.heroId === hero.id).map(i => `${EQUIPMENT[i.key].name} +${i.level}`).join(" · ") || "장착한 장비가 없습니다."}</p>{onEquipment && <button className="outline-button" onClick={onEquipment}>대장간에서 장비 관리</button>}</div>}
      {owned && <div className="stat-alloc"><div className="stat-alloc-head"><strong>남은 포인트 {hero.statPoints}</strong><small>레벨업마다 {STAT_POINTS_PER_LEVEL}포인트 · 능력치 최대 {STAT_CAP}</small></div>
        <div className="stat-alloc-row">{STAT_KEYS.map((key, i) => <div key={key}><span>{["통솔", "무력", "지력", "정치", "매력"][i]}</span><button className="outline-button" aria-label={`${["통솔", "무력", "지력", "정치", "매력"][i]} 1 올리기`} disabled={hero.statPoints < 1 || hero[key] >= STAT_CAP} onClick={() => onAct({ type: "allocate", heroId: hero.id, stat: key, amount: 1 })}>＋1</button><button className="outline-button" aria-label={`${["통솔", "무력", "지력", "정치", "매력"][i]} 5 올리기`} disabled={hero.statPoints < 1 || hero[key] >= STAT_CAP} onClick={() => onAct({ type: "allocate", heroId: hero.id, stat: key, amount: Math.min(5, hero.statPoints, STAT_CAP - hero[key]) })}>＋5</button></div>)}</div>
        <button className="outline-button" disabled={!hero.spent.some(n => n > 0) || gold < resetStatsCost(hero.level)} onClick={() => onAct({ type: "resetStats", heroId: hero.id })}>능력치 초기화 (금 {resetStatsCost(hero.level)})</button></div>}
      {owned && (() => {
        const materials = heroes.filter(h => h.id !== hero.id && h.templateKey === hero.templateKey && h.stars === hero.stars && !h.locked && !h.favorite && !troopIds.includes(h.id));
        const material = [...materials].sort((a, b) => a.level - b.level)[0];
        const inTroop = troopIds.includes(hero.id);
        return <div className="hero-manage">
          <button className="seal-button" disabled={hero.stars >= 5 || !material || gold < promoteCost(hero.stars)} onClick={() => material && onAct({ type: "promote", heroId: hero.id, materialId: material.id })}>{hero.stars >= 5 ? "최고 등급" : `${hero.stars + 1}성 승급 (재료 ${materials.length}장 · 금 ${promoteCost(hero.stars)})`}</button>
          <button className="outline-button" disabled={inTroop || hero.locked} title={hero.locked ? "잠금을 해제한 뒤 방출하세요." : inTroop ? "편성·파견 중인 장수는 방출할 수 없습니다." : undefined} onClick={() => { if (window.confirm(`${hero.name}(${hero.stars}성)을 방출하고 금 ${DISMISS_REFUND[hero.stars - 1]}을 받을까요?`)) onAct({ type: "dismiss", heroId: hero.id }); }}>방출 (금 +{DISMISS_REFUND[hero.stars - 1]})</button>
          <small className="muted">같은 장수·같은 등급 카드 1장을 재료로 등급을 올립니다. 레벨과 배분 능력치는 유지됩니다.</small>
        </div>;
      })()}
      <div className="hero-aptitude"><strong>적성 병종</strong><span>{UNIT_KEYS.filter(key => UNITS[key].role === template.role).map(key => UNITS[key].name).join(" · ") || "영지 경영·파견 특화"}</span></div>
      {bonds.length > 0 && <details className="hero-bond-reference"><summary>함께 편성하면 좋은 장수 · 인연 {bonds.length}종</summary>{bonds.map(bond => <div key={bond.name} className="bond-recipe"><strong>{bond.name}</strong><span>{bond.keys.map(key => `${catalogHero(key).name}${heroes.some(h => h.templateKey === key) ? "(보유)" : ""}`).join(" · ")} 중 {bond.required}명</span><small>{bond.description}</small></div>)}</details>}
      <h3 className="comparison-title">특수능력</h3>
      {heroSkills(hero.templateKey, hero.stars).length === 0 ? <p className="muted small">{hero.stars}성은 특수능력이 없습니다. 3성부터 발현됩니다.</p>
        : <ul className="skill-list">{heroSkills(hero.templateKey, hero.stars).map(s => <li key={s.name}><strong>{s.name}{s.label}</strong><span>{s.common ? "공용" : "고유"}</span><small>{s.description}</small></li>)}</ul>}
      <table className="grade-table skill-table"><thead><tr><th>등급</th>{heroSkills(hero.templateKey, 5).map(s => <th key={s.name}>{s.name}</th>)}</tr></thead><tbody>{[1, 2, 3, 4, 5].map(stars => <tr key={stars} className={stars === hero.stars ? "current-grade" : ""}><th>{stars}성</th>{heroSkills(hero.templateKey, 5).map(s => <td key={s.name}>{skillTier(stars) === 0 ? "—" : `${skillLabel(skillTier(stars))} ${SKILL_KINDS[s.kind].describe(SKILL_KINDS[s.kind].values[skillTier(stars) - 1])}`}</td>)}</tr>)}</tbody></table>
      <div className="hero-level"><span>Lv.{hero.level} · 경험치 {hero.experience} / {hero.level === 100 ? "최대" : hero.level * 100}</span><span>통솔 병력 {hero.maxTroops + (hero.leadership + bonus.leadership) * 10}명</span></div>
      <h3 className="comparison-title">같은 장수, 다른 잠재력</h3><p className="muted small">등급별 1레벨 기본 능력치입니다. 모집 시 1~5성 모두 등장합니다.</p>
      <table className="grade-table"><thead><tr><th>등급</th><th>통솔</th><th>무력</th><th>지력</th><th>정치</th><th>매력</th></tr></thead><tbody>{RARITIES.map(r => { const stats = baseStats(hero.templateKey, r.stars); return <tr key={r.stars} className={r.stars === hero.stars ? "current-grade" : ""}><th style={{ color: r.color }}>{r.stars}성 {r.name}</th><td>{stats.leadership}</td><td>{stats.strength}</td><td>{stats.intelligence}</td><td>{stats.politics}</td><td>{stats.charm}</td></tr>; })}</tbody></table>
      <button className="seal-button detail-action" onClick={owned ? onFormation : onClose}>{owned ? "부대 편성으로 이동" : "도감 닫기"}</button>
    </div>
  </dialog>;
}
