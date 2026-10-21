
import type { CSSProperties } from "react";
import { catalogHero, HERO_CATALOG, RARITIES } from "../lib/heroCatalog";
import type { DemoHero } from "../lib/demoGame";
import { heroSkills } from "../lib/heroSkills";
import { portraitStyle } from "../lib/heroPortrait";

export function rarityStyle(stars: number): CSSProperties { return { "--rarity": RARITIES[stars - 1].color } as CSSProperties; }
export function HeroPortrait({ templateKey, className = "" }: { templateKey: string; className?: string }) {
  if (!HERO_CATALOG.some(h => h.key === templateKey)) return <div className={`hero-portrait npc-portrait ${className}`} role="img" aria-label="적군 지휘관"><span aria-hidden="true">敵</span></div>;
  const hero = catalogHero(templateKey);
  return <div className={`hero-portrait ${className}`} role="img" aria-label={`${hero.name} 초상`} style={portraitStyle(templateKey)} />;
}
export function Stars({ stars }: { stars: number }) {
  return <span className="stars" aria-label={`${stars}성`}>{"★".repeat(stars)}<span className="empty-stars">{"★".repeat(5 - stars)}</span></span>;
}
export function HeroCard({ hero, onClick, assigned = false, dispatched = false }: { hero: DemoHero; onClick?: () => void; assigned?: boolean; dispatched?: boolean }) {
  const template = catalogHero(hero.templateKey);
  const skills = heroSkills(hero.templateKey, hero.stars);
  const potential = heroSkills(hero.templateKey, 5);
  return <button className={`hero-card rarity-${hero.stars}`} style={rarityStyle(hero.stars)} onClick={onClick} aria-label={`${hero.stars}성 ${hero.name} 상세 보기`}>
    <div className="card-art"><HeroPortrait templateKey={hero.templateKey} /><span className="faction-seal">{template.faction}</span><span className="card-rarity">{RARITIES[hero.stars - 1].name}</span>{(assigned || dispatched) && <span className="assigned-ribbon">{dispatched ? "파견 중" : "편성 중"}</span>}
      <div className="card-nameplate"><Stars stars={hero.stars} /><strong>{hero.name}{hero.favorite && <small aria-label="즐겨찾기"> ★</small>}{hero.locked && <small aria-label="잠금"> · 잠금</small>}</strong><small>{template.title}</small></div></div>
    <div className="card-caption"><div className="card-meta"><span>{template.role}</span><span>Lv.{hero.level}{hero.statPoints > 0 && <b className="point-badge"> ＋{hero.statPoints}P</b>}</span></div><dl className="card-statline">{([["통솔", hero.leadership], ["무력", hero.strength], ["지력", hero.intelligence], ["정치", hero.politics], ["매력", hero.charm]] as const).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><div className="card-skills">{potential.map(p => {
      const active = skills.find(s => s.name === p.name);
      return <span key={p.name} className={`skill-chip ${p.common ? "" : "unique"} ${active ? "is-active" : "is-locked"}`} title={active ? `${active.name}${active.label}: ${active.description}` : `${p.name}: 3성부터 발현`}><b>{p.name}{active?.label}</b><small>{active ? p.common ? "공용" : "고유" : "3성 해금"}</small></span>;
    })}</div></div>
  </button>;
}
