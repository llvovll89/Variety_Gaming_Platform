import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  BOSS_FLOOR, NODE_NAMES, REGIONS, availableNodes, departureTime, regionIndex, stationNames,
  type Command, type MapNode, type NodeType, type RunState,
} from '../engine';
import { Glyph, NODE_GLYPH } from './glyphs';
import { sound } from './sound';

/**
 * 별빛선 as a metro diagram: octilinear lines coloured by region, white casings, station
 * roundels with the stop type inside, a terminal capsule for 새벽역 and a depot at the bottom.
 * Choosing a stop sends the train along the line before the run moves on.
 */
interface Geo { w: number; h: number; left: number; usable: number; row: number; top: number; depotY: number }

function geometry(width: number): Geo {
  const narrow = width < 520;
  const left = narrow ? 44 : 84, right = narrow ? 22 : 40, row = narrow ? 82 : 96, top = 78;
  const h = top + BOSS_FLOOR * row + 120;
  return { w: width, h, left, usable: Math.max(120, width - left - right), row, top, depotY: top + BOSS_FLOOR * row + 70 };
}

const yOf = (g: Geo, floor: number) => g.top + (BOSS_FLOOR - floor) * g.row;
const xOf = (g: Geo, node: MapNode) => g.left + node.x * g.usable;

/** Vertical, then 45°, then vertical — the way metro maps bend. */
function octilinear(x1: number, y1: number, x2: number, y2: number) {
  const dy = y1 - y2, adx = Math.abs(x2 - x1);
  if (adx >= dy - 6) return `M${x1} ${y1}L${x2} ${y2}`;
  const v = (dy - adx) / 2;
  return `M${x1} ${y1}V${y1 - v}L${x2} ${y1 - v - adx}V${y2}`;
}

type EdgeState = 'traveled' | 'open' | 'ahead' | 'dead';

export default function MapView({ run, onCommand, locked, readOnly = false, onPeek, peekId }: {
  run: RunState;
  onCommand?: (c: Command) => void;
  locked?: boolean;
  readOnly?: boolean;
  onPeek?: (node: MapNode | null) => void;
  peekId?: string | null;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [moving, setMoving] = useState<{ path: string; to: string } | null>(null);
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const g = useMemo(() => geometry(width || 480), [width]);
  const names = useMemo(() => stationNames(run.map, run.seed), [run.map, run.seed]);
  const byId = useMemo(() => new Map(run.map.map(node => [node.id, node])), [run.map]);
  const open = useMemo(() => new Set(readOnly ? [] : availableNodes(run.map, run.path).map(node => node.id)), [run.map, run.path, readOnly]);
  const visited = useMemo(() => new Set(run.path), [run.path]);
  const current = run.path.length ? byId.get(run.path[run.path.length - 1]) : undefined;
  // Everything still reachable from where the train stands; the rest of the network fades.
  const reachable = useMemo(() => {
    const seen = new Set<string>();
    const queue = current ? [...current.next] : run.map.filter(n => n.floor === 0).map(n => n.id);
    while (queue.length) {
      const id = queue.shift()!;
      if (seen.has(id)) continue;
      seen.add(id);
      queue.push(...(byId.get(id)?.next ?? []));
    }
    return seen;
  }, [current, run.map, byId]);

  const pos = (node: MapNode) => ({ x: node.type === 'boss' ? g.left + g.usable / 2 : xOf(g, node), y: yOf(g, node.floor) });
  const depot = { x: g.left + g.usable / 2, y: g.depotY };
  const here = current ? pos(current) : depot;
  const narrow = g.w < 520;

  useEffect(() => {
    const el = scroller.current;
    if (!el || !width) return;
    el.scrollTo({ top: Math.max(0, here.y - el.clientHeight * 0.62) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, width]);

  const edges: { key: string; d: string; color: string; state: EdgeState }[] = [];
  for (const node of run.map) {
    if (node.floor === 0) {
      const state: EdgeState = run.path[0] === node.id ? 'traveled' : run.path.length === 0 ? 'open' : 'dead';
      const p = pos(node);
      edges.push({ key: `depot-${node.id}`, d: octilinear(depot.x, depot.y, p.x, p.y), color: REGIONS[0].color, state });
    }
    for (const id of node.next) {
      const next = byId.get(id)!;
      const a = pos(node), b = pos(next);
      const i = run.path.indexOf(node.id);
      const state: EdgeState = i >= 0 && run.path[i + 1] === id ? 'traveled'
        : current?.id === node.id && open.has(id) ? 'open'
          : reachable.has(node.id) && reachable.has(id) ? 'ahead' : 'dead';
      edges.push({ key: `${node.id}-${id}`, d: octilinear(a.x, a.y, b.x, b.y), color: REGIONS[regionIndex(next.floor)].color, state });
    }
  }
  const order: Record<EdgeState, number> = { dead: 0, ahead: 1, traveled: 2, open: 3 };
  edges.sort((a, b) => order[a.state] - order[b.state]);

  const depart = (node: MapNode) => {
    if (locked || moving || !open.has(node.id)) return;
    const p = pos(node);
    setMoving({ path: octilinear(here.x, here.y, p.x, p.y), to: node.id });
    sound.play('whistle');
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    window.setTimeout(() => { setMoving(null); onCommand?.({ t: 'travel', nodeId: node.id }); }, reduce ? 0 : 720);
  };

  return (
    <div className={`nt-map-scroll${narrow ? ' is-narrow' : ''}`} ref={scroller}>
      <div className="nt-metro" style={{ height: g.h }}>
        <svg className="nt-metro-svg" width={g.w} height={g.h} viewBox={`0 0 ${g.w} ${g.h}`} aria-hidden="true">
          {/* zones */}
          {REGIONS.slice(0, 3).map((region, i) => {
            const top = yOf(g, region.to) - g.row / 2, bottom = i === 0 ? g.h : yOf(g, region.from) + g.row / 2;
            return <rect key={region.name} x="0" y={top} width={g.w} height={bottom - top} fill={region.color} opacity={i % 2 ? 0.07 : 0.04} />;
          })}
          {/* scenery: a river and two parks give the sheet a city-map feel */}
          <path d={`M0 ${yOf(g, 5.4)} C ${g.w * 0.3} ${yOf(g, 6.4)}, ${g.w * 0.6} ${yOf(g, 4.6)}, ${g.w} ${yOf(g, 5.8)}`} stroke="#9cc4dc" strokeWidth={narrow ? 14 : 20} fill="none" opacity=".45" />
          <ellipse cx={g.w * 0.82} cy={yOf(g, 1.5)} rx={narrow ? 30 : 48} ry="26" fill="#a9cf9a" opacity=".35" />
          <ellipse cx={g.w * 0.16} cy={yOf(g, 9.6)} rx={narrow ? 26 : 40} ry="22" fill="#a9cf9a" opacity=".3" />
          {/* lines: casing first, then colour, then the moving dashes on open track */}
          {edges.map(e => <path key={`c-${e.key}`} d={e.d} className={`nt-track-casing is-${e.state}`} />)}
          {edges.map(e => <path key={e.key} d={e.d} className={`nt-track is-${e.state}`} style={{ stroke: e.state === 'dead' ? undefined : e.color }} />)}
          {edges.filter(e => e.state === 'open').map(e => <path key={`f-${e.key}`} d={e.d} className="nt-track-flow" />)}
          {/* depot */}
          <rect x={depot.x - 38} y={depot.y - 4} width="76" height="26" rx="13" className="nt-depot" />
          <text x={depot.x} y={depot.y + 13} className="nt-depot-label" textAnchor="middle">출발 · 차고지</text>
        </svg>

        {/* zone tags */}
        {REGIONS.slice(0, 3).map((region, i) => (
          <span key={region.name} className="nt-zone" style={{ top: yOf(g, region.to) - g.row / 2 + 10, ['--zone' as string]: region.color }}>
            <b>{i + 1}</b>{!narrow && <em>{region.name}</em>}
          </span>
        ))}

        {run.map.map(node => {
          const p = pos(node);
          const isOpen = open.has(node.id), isVisited = visited.has(node.id), isCurrent = current?.id === node.id;
          const isDead = !isVisited && !isOpen && !reachable.has(node.id) && node.type !== 'boss';
          const color = REGIONS[regionIndex(node.floor)].color;
          const name = names.get(node.id) ?? '';
          const right = node.type === 'boss' ? false : node.x < 0.62;
          const showLabel = node.type === 'boss' || !narrow || isOpen || isCurrent || peekId === node.id;
          return (
            <button key={node.id} type="button"
              className={`nt-stop nt-stop-${node.type}${isOpen ? ' is-open' : ''}${isVisited ? ' is-visited' : ''}${isCurrent ? ' is-current' : ''}${isDead ? ' is-dead' : ''}${peekId === node.id ? ' is-peek' : ''}`}
              style={{ left: p.x, top: p.y, ['--line' as string]: color }}
              disabled={!isOpen || locked || !!moving}
              onMouseEnter={() => onPeek?.(node)} onMouseLeave={() => onPeek?.(null)} onFocus={() => onPeek?.(node)} onBlur={() => onPeek?.(null)}
              aria-label={`${name}역, ${node.floor === BOSS_FLOOR ? '종착역' : `${node.floor + 1}번째 역`}, ${NODE_NAMES[node.type]}${isOpen ? ', 출발 가능' : isVisited ? ', 지나온 역' : ''}`}
              onClick={() => depart(node)}>
              <span className="nt-stop-mark" aria-hidden="true"><Glyph name={NODE_GLYPH[node.type]} size={node.type === 'boss' ? 24 : 14} strokeWidth={2} /></span>
              {showLabel && (
                <span className={`nt-stop-label${right ? ' is-right' : ' is-left'}`} aria-hidden="true">
                  <b>{name}</b>
                  <small>{node.type === 'boss' ? '종착 · 검은 기관차' : `${String(node.floor + 1).padStart(2, '0')} · ${NODE_NAMES[node.type]}`}</small>
                </span>
              )}
            </button>
          );
        })}

        {!readOnly && (
          <span key={moving ? `m-${moving.to}` : `t-${current?.id ?? 'depot'}`} className={`nt-train${moving ? ' is-moving' : ''}`}
            style={moving ? { offsetPath: `path('${moving.path}')` } : { left: here.x, top: here.y }} aria-hidden="true">
            <Glyph name="locomotive" size={16} strokeWidth={2} />
          </span>
        )}
      </div>
    </div>
  );
}

const LEGEND: NodeType[] = ['battle', 'elite', 'event', 'shop', 'rest', 'treasure'];

/** Station-style departure board listing the next trains. */
export function DepartureBoard({ run, onCommand, onPeek, peekId, locked }: {
  run: RunState;
  onCommand: (c: Command) => void;
  onPeek: (node: MapNode | null) => void;
  peekId: string | null;
  locked?: boolean;
}) {
  const names = useMemo(() => stationNames(run.map, run.seed), [run.map, run.seed]);
  const next = availableNodes(run.map, run.path);
  const [leaving, setLeaving] = useState<string | null>(null);
  const board = (node: MapNode) => {
    if (locked || leaving) return;
    setLeaving(node.id);
    sound.play('whistle');
    window.setTimeout(() => onCommand({ t: 'travel', nodeId: node.id }), 420);
  };
  return (
    <section className="nt-departures" aria-labelledby="nt-departures-title">
      <header><span id="nt-departures-title">다음 열차</span><small>DEPARTURES · 새벽역 방면</small></header>
      <ol>
        {next.map((node, platform) => (
          <li key={node.id}>
            <button type="button" className={`nt-departure${peekId === node.id ? ' is-peek' : ''}${leaving === node.id ? ' is-leaving' : ''}`} disabled={locked || !!leaving}
              onMouseEnter={() => onPeek(node)} onMouseLeave={() => onPeek(null)} onFocus={() => onPeek(node)} onBlur={() => onPeek(null)}
              onClick={() => board(node)}
              style={{ ['--line' as string]: REGIONS[regionIndex(node.floor)].color }}>
              <span className="nt-departure-time">{departureTime(node.floor, platform)}</span>
              <span className="nt-departure-dest"><b>{names.get(node.id)}</b><small><Glyph name={NODE_GLYPH[node.type]} size={12} strokeWidth={2.2} />{NODE_NAMES[node.type]}</small></span>
              <span className="nt-departure-go">{leaving === node.id ? '출발' : '탑승'}</span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function MapLegend() {
  return (
    <div className="nt-legend nt-sheet" aria-label="노선도 범례">
      <ul className="nt-legend-lines">
        {REGIONS.map((region, i) => <li key={region.name}><i style={{ background: region.color }} />{i < 3 ? `${i + 1}구간 ` : ''}{region.name}</li>)}
      </ul>
      <ul className="nt-legend-stops">
        {LEGEND.map(type => <li key={type}><span className="nt-legend-mark"><Glyph name={NODE_GLYPH[type]} size={12} strokeWidth={2.2} /></span>{NODE_NAMES[type]}</li>)}
      </ul>
    </div>
  );
}
