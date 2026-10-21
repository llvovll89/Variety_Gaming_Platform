import { useState } from "react";
import { activeTroop, type DemoAction, type DemoState } from "../lib/demoGame";
import { FORMATIONS, UNITS } from "../lib/tactics";
import { busyHeroIds } from "../lib/campaign";
export default function FormationPresets({ state, act }: { state: DemoState; act: (action: DemoAction) => DemoState | undefined }) {
  const [names, setNames] = useState(() => state.presets.map((preset, i) => preset?.name ?? ["돌격 부대", "방어 부대", "계략 부대"][i]));
  return <details className="formation-presets"><summary>편성 프리셋 · 장수·병종·진형 조합 저장</summary><p className="muted small">현재 선택한 부대에 적용합니다. 병력 수는 저장하지 않으며 초과 병력은 예비군으로 돌려보냅니다. 다른 부대·파견 중인 장수는 가져올 수 없습니다.</p><div className="preset-grid">{state.presets.map((preset, i) => {
    const missing = preset?.heroIds.some(id => id && !state.heroes.some(h => h.id === id));
    const blocked = preset?.heroIds.some(id => id && (busyHeroIds(state).includes(id) || state.troops.some((t, ti) => ti !== state.activeTroop && t.heroIds.includes(id))));
    return <article key={i}><label>프리셋 {i + 1}<input maxLength={16} value={names[i]} onChange={e => setNames(prev => prev.map((name, index) => index === i ? e.target.value : name))} /></label>{preset ? <><strong>{preset.name}</strong><p>{preset.heroIds.map(id => id ? state.heroes.find(h => h.id === id)?.name ?? "미보유 장수" : "미배치").join(" / ")}</p><small>{UNITS[preset.unit].name} · {FORMATIONS[preset.formation].name}</small></> : <p className="muted small">저장한 편성이 없습니다.</p>}<div><button className="outline-button" disabled={!activeTroop(state).heroIds[0] || !names[i].trim()} onClick={() => { if (preset && !window.confirm(`'${preset.name}' 프리셋을 현재 편성으로 덮어쓸까요?`)) return; act({ type: "savePreset", slot: i, name: names[i] }); }}>{preset ? "현재 편성으로 덮어쓰기" : "현재 편성 저장"}</button><button className="seal-button" disabled={!preset || missing || blocked} onClick={() => act({ type: "loadPreset", slot: i })}>{missing ? "미보유 장수 포함" : blocked ? "다른 임무에서 사용 중" : "편성 적용"}</button></div></article>;
  })}</div></details>;
}
