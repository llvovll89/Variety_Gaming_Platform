import { GOOD_MS, LANES, type PlayState } from './engine';

/** 음표가 위에서 판정선까지 내려오는 데 걸리는 시간. 길수록 미리 보고 준비할 수 있다. */
export const FALL_MS = 2000;

export const LANE_COLORS = ['#ff8fab', '#ffd166', '#6fd3c7'];
export const LANE_FACES = ['🐰', '🐻', '🐸'];

export interface View { width: number; height: number; hitY: number }

export function viewOf(canvas: { width: number; height: number }, dpr: number): View {
  const width = canvas.width / dpr, height = canvas.height / dpr;
  // 판정선은 아래쪽에 둔다. 그 아래는 손가락이 올라오는 자리라 음표를 그리지 않는다.
  return { width, height, hitY: height - 34 };
}

/** 지금 시각에서 음표가 놓일 세로 위치. 판정선 위가 음수가 아니라 작은 값이다. */
export function noteY(view: View, noteTime: number, now: number): number {
  return view.hitY - ((noteTime - now) / FALL_MS) * (view.hitY - 10);
}

/** 한 프레임. 캔버스만 건드리고 상태는 바꾸지 않는다. */
export function draw(ctx: CanvasRenderingContext2D, view: View, state: PlayState, now: number, flash: readonly number[]): void {
  const { width, height, hitY } = view;
  ctx.clearRect(0, 0, width, height);
  const laneWidth = width / LANES;

  for (let lane = 0; lane < LANES; lane++) {
    const x = lane * laneWidth;
    ctx.fillStyle = lane % 2 ? '#fffaf2' : '#fff4e6';
    ctx.fillRect(x, 0, laneWidth, height);
    // 방금 두드린 자리에 번지는 빛.
    const lit = flash[lane] ?? 0;
    if (lit > now - 220) {
      ctx.globalAlpha = Math.max(0, (lit - (now - 220)) / 220) * 0.5;
      ctx.fillStyle = LANE_COLORS[lane];
      ctx.fillRect(x, 0, laneWidth, height);
      ctx.globalAlpha = 1;
    }
  }

  ctx.strokeStyle = '#e4d6c0';
  ctx.lineWidth = 2;
  for (let lane = 1; lane < LANES; lane++) {
    ctx.beginPath(); ctx.moveTo(lane * laneWidth, 0); ctx.lineTo(lane * laneWidth, height); ctx.stroke();
  }

  // 판정선: 여기 닿을 때 두드린다.
  ctx.strokeStyle = '#c7b299';
  ctx.setLineDash([9, 7]);
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, hitY); ctx.lineTo(width, hitY); ctx.stroke();
  ctx.setLineDash([]);

  const radius = Math.min(26, laneWidth * 0.3);
  for (const note of state.song.notes) {
    const result = state.results[note.id];
    if (result !== undefined && result !== 'miss') continue;
    const y = noteY(view, note.time, now);
    if (y < -radius || note.time - now > FALL_MS) continue;
    if (y > hitY + 40) continue;
    const x = note.lane * laneWidth + laneWidth / 2;
    ctx.globalAlpha = result === 'miss' ? 0.25 : 1;
    ctx.fillStyle = LANE_COLORS[note.lane];
    ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ffffffcc';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // 다음 음표가 아주 가까우면 판정선을 굵게 해서 "지금!"을 알린다.
  const soon = state.song.notes.find(n => state.results[n.id] === undefined && Math.abs(n.time - now) <= GOOD_MS);
  if (soon) {
    ctx.strokeStyle = LANE_COLORS[soon.lane];
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(0, hitY); ctx.lineTo(width, hitY); ctx.stroke();
  }
}
