import { useEffect, useMemo, useRef } from 'react';
import { BOSS_FLOOR, NODE_NAMES, availableNodes, type Command, type MapNode, type RunState } from '../engine';
import { NODE_ICONS } from './parts';

const ROW = 86;
const PAD = 54;

export default function MapView({ run, onCommand, locked, readOnly = false }: { run: RunState; onCommand?: (c: Command) => void; locked?: boolean; readOnly?: boolean }) {
  const scroller = useRef<HTMLDivElement>(null);
  const open = useMemo(() => new Set(readOnly ? [] : availableNodes(run.map, run.path).map(node => node.id)), [run.map, run.path, readOnly]);
  const visited = new Set(run.path);
  const height = PAD * 2 + BOSS_FLOOR * ROW;
  const y = (node: MapNode) => height - PAD - node.floor * ROW;
  const byId = useMemo(() => new Map(run.map.map(node => [node.id, node])), [run.map]);
  const current = run.path.length ? byId.get(run.path[run.path.length - 1]) : undefined;

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const floor = current ? current.floor + 1 : 0;
    const target = height - PAD - floor * ROW - el.clientHeight * 0.62;
    el.scrollTo({ top: Math.max(0, target), behavior: 'auto' });
  }, [current, height]);

  return (
    <div className="nt-map-scroll" ref={scroller}>
      <div className="nt-map" style={{ height }}>
        <svg className="nt-map-rails" viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" aria-hidden="true">
          {run.map.flatMap(node => node.next.map(id => {
            const next = byId.get(id)!;
            const traveled = visited.has(node.id) && visited.has(id) && run.path.indexOf(id) === run.path.indexOf(node.id) + 1;
            const reachable = current?.id === node.id && open.has(id);
            return (
              <line key={`${node.id}-${id}`} x1={node.x * 100} y1={y(node)} x2={next.x * 100} y2={y(next)}
                className={traveled ? 'is-traveled' : reachable ? 'is-open' : ''} vectorEffect="non-scaling-stroke" />
            );
          }))}
        </svg>
        {run.map.map(node => {
          const Icon = NODE_ICONS[node.type];
          const isOpen = open.has(node.id);
          const isVisited = visited.has(node.id);
          const isCurrent = current?.id === node.id;
          const name = NODE_NAMES[node.type];
          return (
            <button key={node.id} type="button"
              className={`nt-node nt-node-${node.type}${isOpen ? ' is-open' : ''}${isVisited ? ' is-visited' : ''}${isCurrent ? ' is-current' : ''}`}
              style={{ left: `${node.x * 100}%`, top: y(node) }}
              disabled={!isOpen || locked}
              aria-label={`${node.floor === BOSS_FLOOR ? '종착역' : `${node.floor + 1}번째 역`}: ${name}${isOpen ? ', 출발 가능' : isVisited ? ', 지나온 역' : ''}`}
              onClick={() => onCommand?.({ t: 'travel', nodeId: node.id })}>
              <Icon size={node.type === 'boss' ? 34 : 22} weight={isOpen || isCurrent ? 'fill' : 'duotone'} aria-hidden="true" />
              {(isOpen || node.type === 'boss') && <span className="nt-node-label">{name}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function MapLegend() {
  return (
    <ul className="nt-legend" aria-label="역 종류">
      {(['battle', 'elite', 'event', 'shop', 'rest', 'treasure'] as const).map(type => {
        const Icon = NODE_ICONS[type];
        return <li key={type} className={`nt-node-${type}`}><Icon size={16} weight="fill" aria-hidden="true" />{NODE_NAMES[type]}</li>;
      })}
    </ul>
  );
}
