import type { GameEngine } from '../game/engine';
import { axialToOffset } from '../game/hex';
import { MAP_WIDTH, MAP_HEIGHT } from '../game/constants';

export function StrategicMap({ engine }: { engine: GameEngine }) {
  const s = engine.getState();
  return <div className="tk-minimap" aria-label="중원 전략 지도"><span>중원 전도</span><div>{Object.values(s.cities).map(c => {
    const p = axialToOffset(c.coord);
    return <button key={c.id} aria-label={`${c.name} 위치로 이동`} title={`${c.name} · ${c.faction ? s.factions[c.faction].name : '중립'}`} style={{ left: `${(p.col + 0.5) / MAP_WIDTH * 100}%`, top: `${(p.row + 0.5) / MAP_HEIGHT * 100}%`, borderColor: c.faction ? s.factions[c.faction].color : '#aaa' }} onClick={() => { engine.clearSelection(); engine.focus(c.coord); engine.select(c.coord); }}>{c.name}</button>;
  })}</div></div>;
}
