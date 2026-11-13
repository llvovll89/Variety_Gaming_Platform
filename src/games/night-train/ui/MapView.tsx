import { useEffect, useMemo, useRef } from 'react';
import { BOSS_FLOOR, NODE_NAMES, REGIONS, availableNodes, type Command, type MapNode, type NodeType, type RunState } from '../engine';
import { Glyph, NODE_GLYPH } from './glyphs';

const ROW = 84;
const PAD = 60;
const SIDE = 64;

export default function MapView({ run, onCommand, locked, readOnly = false, onPeek }: {
  run: RunState;
  onCommand?: (c: Command) => void;
  locked?: boolean;
  readOnly?: boolean;
  onPeek?: (node: MapNode | null) => void;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const open = useMemo(() => new Set(readOnly ? [] : availableNodes(run.map, run.path).map(node => node.id)), [run.map, run.path, readOnly]);
  const visited = new Set(run.path);
  const height = PAD * 2 + BOSS_FLOOR * ROW;
  const y = (floor: number) => height - PAD - floor * ROW;
  const byId = useMemo(() => new Map(run.map.map(node => [node.id, node])), [run.map]);
  const current = run.path.length ? byId.get(run.path[run.path.length - 1]) : undefined;
  const xOf = (node: MapNode) => `calc(${SIDE}px + (100% - ${SIDE + 28}px) * ${node.x})`;

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const floor = current ? current.floor + 1 : 0;
    el.scrollTo({ top: Math.max(0, y(floor) - el.clientHeight * 0.6) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, height]);

  return (
    <div className="nt-map-scroll" ref={scroller}>
      <div className="nt-map" style={{ height }}>
        <div className="nt-map-bands" aria-hidden="true">
          {REGIONS.map(region => {
            const top = region.to === BOSS_FLOOR ? 0 : y(region.to) - ROW / 2;
            const bottom = region.from === 0 ? height : y(region.from) + ROW / 2;
            return <div key={region.name} className="nt-map-band" style={{ top, height: bottom - top }}><span>{region.name}</span></div>;
          })}
        </div>
        <svg className="nt-map-rails" style={{ left: SIDE, width: `calc(100% - ${SIDE + 28}px)` }} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" aria-hidden="true">
          {run.map.flatMap(node => node.next.map(id => {
            const next = byId.get(id)!;
            const traveled = visited.has(node.id) && run.path.indexOf(id) === run.path.indexOf(node.id) + 1 && visited.has(id);
            const reachable = current?.id === node.id && open.has(id);
            return (
              <line key={`${node.id}-${id}`} x1={node.x * 100} y1={y(node.floor)} x2={next.x * 100} y2={y(next.floor)} vectorEffect="non-scaling-stroke"
                className={traveled ? 'is-traveled' : reachable ? 'is-open' : ''} />
            );
          }))}
        </svg>
        {run.map.map(node => {
          const isOpen = open.has(node.id);
          const isVisited = visited.has(node.id);
          const isCurrent = current?.id === node.id;
          const name = NODE_NAMES[node.type];
          return (
            <button key={node.id} type="button"
              className={`nt-node nt-node-${node.type}${isOpen ? ' is-open' : ''}${isVisited ? ' is-visited' : ''}${isCurrent ? ' is-current' : ''}`}
              style={{ left: xOf(node), top: y(node.floor) }}
              disabled={!isOpen || locked}
              onMouseEnter={() => onPeek?.(node)} onMouseLeave={() => onPeek?.(null)} onFocus={() => onPeek?.(node)} onBlur={() => onPeek?.(null)}
              aria-label={`${node.floor === BOSS_FLOOR ? '종착역' : `${node.floor + 1}번째 역`}: ${name}${isOpen ? ', 출발 가능' : isVisited ? ', 지나온 역' : ''}`}
              onClick={() => onCommand?.({ t: 'travel', nodeId: node.id })}>
              <Glyph name={NODE_GLYPH[node.type]} size={node.type === 'boss' ? 36 : 22} strokeWidth={node.type === 'boss' ? 1.6 : 1.9} />
              {(isOpen || node.type === 'boss') && <span className="nt-node-label">{name}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function MapLegend() {
  const types: NodeType[] = ['battle', 'elite', 'event', 'shop', 'rest', 'treasure'];
  return (
    <ul className="nt-legend nt-sheet" aria-label="역 종류">
      {types.map(type => <li key={type}><Glyph name={NODE_GLYPH[type]} size={18} />{NODE_NAMES[type]}</li>)}
    </ul>
  );
}
