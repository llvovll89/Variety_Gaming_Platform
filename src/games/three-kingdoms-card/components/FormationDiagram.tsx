import { FORMATIONS, type Formation } from "../lib/tactics";

const POINTS: Record<Formation, readonly (readonly [number, number])[]> = {
  basic: [[50, 20], [25, 43], [75, 43], [25, 70], [50, 70], [75, 70]],
  fish: [[50, 15], [35, 38], [65, 38], [20, 65], [50, 65], [80, 65]],
  circle: [[50, 45], [50, 16], [22, 32], [22, 65], [78, 32], [78, 65], [50, 78]],
  wedge: [[50, 14], [35, 36], [65, 36], [20, 60], [80, 60], [50, 80]],
  goose: [[50, 60], [16, 18], [30, 36], [70, 36], [84, 18], [30, 72], [70, 72]],
  crane: [[50, 68], [15, 23], [25, 44], [38, 60], [85, 23], [75, 44], [62, 60]],
  square: [[50, 48], [22, 20], [50, 20], [78, 20], [22, 76], [50, 76], [78, 76], [22, 48], [78, 48]],
  eight: [[50, 48], [50, 15], [25, 25], [16, 48], [25, 72], [50, 82], [75, 72], [84, 48], [75, 25]],
};
export default function FormationDiagram({ formation }: { formation: Formation }) {
  return <svg viewBox="0 0 100 96" className="formation-diagram" role="img" aria-label={`${FORMATIONS[formation].name} 배치도`}>
    <path d="M10 88H90 M50 4V10 M46 8L50 4L54 8" fill="none" stroke="currentColor" opacity=".3" />
    {POINTS[formation].map(([x, y], i) => <g key={i}><rect x={x - 7} y={y - 7} width={14} height={14} rx={2} className={i === 0 ? "diagram-commander" : "diagram-soldier"} />{i === 0 && <text x={x} y={y + 3} textAnchor="middle" fontSize={9}>主</text>}</g>)}
  </svg>;
}
