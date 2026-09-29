
import type { CSSProperties } from "react";
import { catalogHero, RARITIES } from "../lib/heroCatalog";
import type { DemoHero } from "../lib/demoGame";
import { heroSkills } from "../lib/heroSkills";
import { portraitStyle } from "../lib/heroPortrait";

export function rarityStyle(stars: number): CSSProperties { return { "--rarity": RARITIES[stars - 1].color } as CSSProperties; }
export function HeroPortrait({ templateKey, className = "" }: { templateKey: string; className?: string }) {
  const hero = catalogHero(templateKey);
  return <div className={`hero-portrait ${className}`} role="img" aria-label={`${hero.name} 초상`} style={portraitStyle(templateKey)} />;
}
export function Stars({ stars }: { stars: number }) {
  return <span className="stars" aria-label={`${stars}성`}>{"★".repeat(stars)}<span className="empty-stars">{"★".repeat(5 - stars)}</span></span>;
}
export function HeroCard({ hero, onClick, assigned = false }: { hero: DemoHero; onClick?: () => void; assigned?: boolean }) {
  const template = catalogHero(hero.templateKey);
  return <button className={`hero-card rarity-${hero.stars}`} style={rarityStyle(hero.stars)} onClick={onClick} aria-label={`${hero.stars}성 ${hero.name} 상세 보기`}>
    <div className="card-art"><HeroPortrait templateKey={hero.templateKey} /><span className="faction-seal">{template.faction}</span><span className="card-rarity">{RARITIES[hero.stars - 1].name}</span>{assigned && <span className="assigned-ribbon">출전 중</span>}
      <div className="card-nameplate"><Stars stars={hero.stars} /><strong>{hero.name}</strong><small>{template.title}</small></div></div>
    <div className="card-caption"><div className="card-meta"><span>{template.role}</span><span>Lv.{hero.level}{hero.statPoints > 0 && <b className="point-badge"> ＋{hero.statPoints}P</b>}</span></div><dl className="card-statline">{([["통솔", hero.leadership], ["무력", hero.strength], ["지력", hero.intelligence], ["정치", hero.politics], ["매력", hero.charm]] as const).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>{(() => { const skills = heroSkills(hero.templateKey, hero.stars); return skills.length > 0 && <div className="card-skills">{skills.map(s => <span key={s.name} className={s.common ? "skill-chip" : "skill-chip unique"}>{s.name}{s.label}</span>)}</div>; })()}</div>
  </button>;
}
