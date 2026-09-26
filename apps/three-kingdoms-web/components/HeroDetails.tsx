"use client";
import { useEffect, useRef } from "react";
import type { DemoHero } from "@/lib/demoGame";
import { baseStats, catalogHero, RARITIES } from "@/lib/heroCatalog";
import { HeroPortrait, rarityStyle, Stars } from "./HeroVisual";

export default function HeroDetails({ hero, owned, onClose, onFormation }: { hero: DemoHero; owned: boolean; onClose: () => void; onFormation: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const template = catalogHero(hero.templateKey);
  useEffect(() => { dialog.current?.showModal(); }, []);
  return <dialog className="hero-dialog" ref={dialog} onCancel={onClose} aria-labelledby="hero-name" style={rarityStyle(hero.stars)}>
    <button className="dialog-close" onClick={onClose} aria-label="장수 상세 닫기">×</button>
    <div className="hero-detail-visual"><HeroPortrait templateKey={hero.templateKey} /><div className="portrait-inscription"><span>{template.faction} · {template.role}</span><strong>{template.title}</strong></div></div>
    <div className="hero-detail-body"><p className="eyebrow">{template.faction} · {template.role} · {owned ? "보유 장수" : "장수 도감 · 미리보기"}</p><Stars stars={hero.stars} /><h2 id="hero-name">{hero.name}<small>{template.title}</small></h2><p className="hero-quote">“{template.quote}”</p>
      <dl className="detail-stats">{[["통솔", hero.leadership], ["무력", hero.strength], ["지력", hero.intelligence], ["정치", hero.politics]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd><meter aria-label={`${label} 능력치`} min={0} max={200} value={Number(value)} /></div>)}</dl>
      <div className="hero-level"><span>Lv.{hero.level} · 경험치 {hero.experience} / {hero.level === 100 ? "최대" : hero.level * 100}</span><span>통솔 병력 {hero.maxTroops + hero.leadership * 10}명</span></div>
      <h3 className="comparison-title">같은 장수, 다른 잠재력</h3><p className="muted small">등급별 1레벨 기본 능력치입니다. 모집 시 1~5성 모두 등장합니다.</p>
      <table className="grade-table"><thead><tr><th>등급</th><th>통솔</th><th>무력</th><th>지력</th><th>정치</th></tr></thead><tbody>{RARITIES.map(r => { const stats = baseStats(hero.templateKey, r.stars); return <tr key={r.stars} className={r.stars === hero.stars ? "current-grade" : ""}><th style={{ color: r.color }}>{r.stars}성 {r.name}</th><td>{stats.leadership}</td><td>{stats.strength}</td><td>{stats.intelligence}</td><td>{stats.politics}</td></tr>; })}</tbody></table>
      <button className="gold-button detail-action" onClick={owned ? onFormation : onClose}>{owned ? "부대 편성으로 이동" : "도감 닫기"}</button>
    </div>
  </dialog>;
}
