"use client";
import type { CSSProperties } from "react";
import { catalogHero, RARITIES } from "@/lib/heroCatalog";
import type { DemoHero } from "@/lib/demoGame";
import { portraitStyle } from "@/lib/heroPortrait";

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
    <div className="card-art"><HeroPortrait templateKey={hero.templateKey} /><span className="faction-seal">{template.faction}</span><span className="card-rarity">{RARITIES[hero.stars - 1].name}</span>{assigned && <span className="assigned-ribbon">출전 편성</span>}</div>
    <div className="card-caption"><Stars stars={hero.stars} /><div className="card-name"><strong>{hero.name}</strong><span>Lv.{hero.level}</span></div><p>{template.title}</p><div className="card-statline"><span>통 <b>{hero.leadership}</b></span><span>무 <b>{hero.strength}</b></span><span>지 <b>{hero.intelligence}</b></span><span>정 <b>{hero.politics}</b></span></div></div>
  </button>;
}
