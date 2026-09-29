import { useState, type CSSProperties } from "react";
import { aggregateStats } from "../../lib/battleEngine";
import { activeTroop, playerTroop, troopCapacity, type DemoHero } from "../../lib/demoGame";
import { catalogHero, RARITIES } from "../../lib/heroCatalog";
import { FACTION_SYNERGY, troopSynergy } from "../../lib/synergy";
import { APTITUDE_BONUS, FORMATION_KEYS, FORMATIONS, UNIT_KEYS, UNITS } from "../../lib/tactics";
import { HeroPortrait } from "../HeroVisual";
import { number, TroopTabs, type Tab, type TabProps } from "./shared";

const SLOT_NAMES = ["주장", "부장 1", "부장 2"] as const;

export default function FormationTab({ state, act, onNavigate, onInspect }: TabProps & { onNavigate: (tab: Tab) => void; onInspect: (hero: DemoHero) => void }) {
  const [reinforcements, setReinforcements] = useState("300");
  const troop = activeTroop(state);
  const capacity = troopCapacity(state);
  const members = troop.heroIds.flatMap(id => state.heroes.filter(h => h.id === id));
  const commander = state.heroes.find(h => h.id === troop.heroIds[0]);
  const stats = commander ? aggregateStats(playerTroop(state)) : { leadership: 0, strength: 0, intelligence: 0 };
  const synergy = troopSynergy(members.map(h => h.templateKey));
  const usedElsewhere = (heroId: string, slot: number) =>
    state.troops.some((t, ti) => t.heroIds.some((selected, s) => selected === heroId && !(ti === state.activeTroop && s === slot)));

  return <section>
    <div className="page-title">
      <div><h1>{troop.name}을 편성하다</h1></div>
      <span className="subtle-tag">주장 100% + 부장 각 30%</span>
    </div>
    <TroopTabs state={state} act={act} />
    {!state.heroes.length && <div className="inline-guide">
      <p>편성할 장수가 없습니다. 먼저 모집관에서 장수를 얻으세요.</p>
      <button className="seal-button" onClick={() => onNavigate("모집관")}>장수 모집</button>
    </div>}
    <div className="formation-layout">
      <div>
        <div className="formation-grid">
          {troop.heroIds.map((id, index) => {
            const h = state.heroes.find(hero => hero.id === id);
            return <article className={`formation-slot ${h ? "slot-filled" : ""}`} key={index} style={h ? { "--rarity": RARITIES[h.stars - 1].color } as CSSProperties : undefined}>
              <div className="slot-label"><span>{SLOT_NAMES[index]}</span><small>{index === 0 ? "지휘" : "보좌"}</small></div>
              {h
                ? <button className="slot-portrait" onClick={() => onInspect(h)} aria-label={`${h.name} 상세 보기`}><HeroPortrait templateKey={h.templateKey} /><span>{"★".repeat(h.stars)}</span></button>
                : <div className="slot-empty"><span>＋</span><small>장수를 배치하세요</small></div>}
              <select aria-label={`${SLOT_NAMES[index]} 선택`} value={id ?? ""} disabled={!state.heroes.length || (index > 0 && !commander)}
                onChange={e => act({ type: "assign", slot: index, heroId: e.target.value || null })}>
                <option value="">미배치</option>
                {state.heroes.map(hero => <option key={hero.id} value={hero.id} disabled={usedElsewhere(hero.id, index)}>{hero.name} · {hero.stars}성 · Lv.{hero.level}</option>)}
              </select>
            </article>;
          })}
        </div>
        <dl className="army-stats">
          {([["통솔", stats.leadership], ["무력", stats.strength], ["지력", stats.intelligence]] as const).map(([label, value]) => (
            <div key={label}><dt>종합 {label}</dt><dd>{value.toFixed(1)}</dd></div>
          ))}
        </dl>
        <div className={`synergy-panel ${synergy ? "is-active" : ""}`}>
          <strong>세력 시너지</strong>
          {synergy
            ? <span>{synergy.faction} {synergy.count}명 · {synergy.name}{synergy.label} — {synergy.description}</span>
            : <span className="muted">같은 세력 장수 2명 이상 편성 시 발동 · {Object.entries(FACTION_SYNERGY).map(([f, s]) => `${f} ${s.name}`).join(" / ")}</span>}
        </div>
        <div className="tactic-row">
          <strong>병종</strong>
          <div className="segmented" role="group" aria-label="병종 선택">
            {UNIT_KEYS.map(u => <button key={u} aria-pressed={troop.unit === u} onClick={() => act({ type: "setUnit", unit: u })}>{UNITS[u].symbol} {UNITS[u].name}</button>)}
          </div>
          <small className="muted">
            {UNITS[troop.unit].name}은 {UNITS[UNITS[troop.unit].beats].name}에 강하고 {UNITS[UNIT_KEYS.find(u => UNITS[u].beats === troop.unit)!].name}에 약합니다.
            {commander && (catalogHero(commander.templateKey).role === UNITS[troop.unit].role
              ? ` 주장 ${commander.name}(${UNITS[troop.unit].role}) 적성 일치: 피해 +${APTITUDE_BONUS * 100}%`
              : ` ${UNITS[troop.unit].role} 주장이면 적성 보너스 +${APTITUDE_BONUS * 100}%`)}
          </small>
        </div>
        <div className="tactic-row">
          <strong>진형</strong>
          <div className="segmented" role="group" aria-label="진형 선택">
            {FORMATION_KEYS.map(f => <button key={f} aria-pressed={troop.formation === f} onClick={() => act({ type: "setFormation", formation: f })}>{FORMATIONS[f].name}</button>)}
          </div>
          <small className="muted">{FORMATIONS[troop.formation].description}</small>
        </div>
        <p className="muted small formation-note">같은 이름의 장수도 서로 다른 카드라면 함께 편성할 수 있습니다. 주장 해제 시 부대 전체가 해제되고 병력은 예비군으로 돌아갑니다.</p>
      </div>
      <aside className="reinforce-panel">
        <span className="panel-symbol" aria-hidden="true">兵</span>
        <h2>병력 보충</h2>
        <p className="troop-count">{number(troop.currentTroops)}<small> / {number(capacity)}명</small></p>
        <progress aria-label="배치 병력" value={troop.currentTroops} max={Math.max(1, capacity)} />
        <p className="muted small">병사 1명당 예비군 1명과 식량 1을 사용합니다.</p>
        <label htmlFor="reinforcements">보충할 병력</label>
        <input id="reinforcements" type="number" min={1} step={1} value={reinforcements} onChange={e => setReinforcements(e.target.value)} />
        <button className="seal-button" disabled={!commander} onClick={() => act({ type: "reinforce", count: Number(reinforcements) })}>병력 보충하기</button>
        <button className="outline-button" onClick={() => onNavigate("출정")}>원정지 살펴보기</button>
      </aside>
    </div>
  </section>;
}
