import { LANES, LEAD_IN_MS, type Grade, type PlayState } from './engine';
import { LANE_COLORS } from './ForestFriends';
import { beatMs, COUNT_IN } from './music';

/** 음표가 먼 끝에서 판정선까지 오는 데 걸리는 시간. 길수록 미리 보고 준비할 수 있다. */
export const FALL_MS = 2000;
/** 트랙 먼 끝이 가까운 끝보다 몇 배 멀리 있나. 클수록 원근이 세다. */
const DEPTH = 3.2;
/** 딱!/좋아! 와 반짝이가 사라지는 시간. */
const POP_MS = 560;
const BEAM_MS = 260;

/** 방금 맞힌 자리. 놓친 것은 말하지 않는다. */
export interface Pop { lane: number; at: number; grade: Exclude<Grade, 'miss'> }

export interface View {
  width: number;
  height: number;
  /** 트랙 먼 끝의 세로 위치. 위쪽 무대(동물 친구들) 발밑이다. */
  top: number;
  hitY: number;
  /** 판정선에서 트랙 반폭. */
  half: number;
  cx: number;
  /** 움직임 줄이기: 장식(반딧불·박자 맥동·반짝이)을 그리지 않는다. */
  calm: boolean;
}

export function viewOf(canvas: { width: number; height: number }, dpr: number, top: number, calm: boolean): View {
  const width = canvas.width / dpr, height = canvas.height / dpr;
  const hitY = height - Math.max(30, Math.min(56, height * 0.12));
  const trackTop = Math.min(top, hitY * 0.5);
  // 가로로 누운 화면에서 트랙이 납작하게 퍼지지 않도록 폭을 높이에 묶는다.
  const half = Math.min(width * 0.48, 320, (hitY - trackTop) * 1.5);
  return { width, height, top: trackTop, hitY, half, cx: width / 2, calm };
}

/** p(0=먼 끝에 막 나타남, 1=판정선)에서의 원근 배율. */
const projOf = (p: number) => 1 / (DEPTH - (DEPTH - 1) * p);

/** 원근 배율 → 화면 세로 위치. 배율에 대해 직선이라 먼 데는 촘촘하고 가까울수록 빨라진다. */
function yOf(view: View, proj: number) {
  const b = (view.hitY - view.top) / (1 - 1 / DEPTH);
  return view.hitY - b + b * proj;
}
const projAtY = (view: View, y: number) => {
  const b = (view.hitY - view.top) / (1 - 1 / DEPTH);
  return (y - view.hitY + b) / b;
};

/** 레인 경계 e(-1 ~ 1)의 가로 위치. */
const xOf = (view: View, e: number, proj: number) => view.cx + e * view.half * proj;
const laneEdge = (lane: number) => -1 + (2 * lane) / LANES;

function trapezoid(ctx: CanvasRenderingContext2D, view: View, e0: number, e1: number, p0: number, p1: number) {
  ctx.beginPath();
  ctx.moveTo(xOf(view, e0, p0), yOf(view, p0));
  ctx.lineTo(xOf(view, e1, p0), yOf(view, p0));
  ctx.lineTo(xOf(view, e1, p1), yOf(view, p1));
  ctx.lineTo(xOf(view, e0, p1), yOf(view, p1));
  ctx.closePath();
}

const frac = (n: number) => n - Math.floor(n);

function forest(ctx: CanvasRenderingContext2D, view: View, now: number) {
  const { width, height } = view;
  // 양옆 전나무 그림자. 화면 폭에서 정해지는 고정 배치라 프레임마다 같다.
  ctx.fillStyle = '#0a1a24';
  const trees = Math.ceil(width / 90) + 2;
  for (let i = 0; i < trees; i++) {
    const x = (i / (trees - 1)) * width;
    const edge = Math.abs(x - width / 2) / (width / 2);
    if (edge < 0.45) continue;
    const h = height * (0.35 + 0.35 * edge) * (0.8 + 0.2 * frac(Math.sin(i * 91.7) * 999));
    const w = 34 + 30 * edge;
    ctx.beginPath();
    ctx.moveTo(x, height - h);
    ctx.lineTo(x + w, height);
    ctx.lineTo(x - w, height);
    ctx.closePath();
    ctx.fill();
  }
  if (view.calm) return;
  // 반딧불: 천천히 떠다니며 깜빡인다.
  for (let i = 0; i < 16; i++) {
    const x = frac(Math.sin(i * 12.9898) * 43758.5) * width + Math.sin(now / 2100 + i) * 14;
    const y = frac(Math.sin(i * 78.233) * 12345.6) * height * 0.8 + Math.cos(now / 1700 + i * 2) * 10;
    const a = (Math.sin(now / 520 + i * 1.7) + 1) / 2;
    ctx.globalAlpha = 0.25 + a * 0.6;
    ctx.fillStyle = '#fff3a0';
    ctx.shadowColor = '#ffe066';
    ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(x, y, 1.6 + a * 1.4, 0, Math.PI * 2); ctx.fill();
  }
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
}

function outlined(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, fill: string, weight = 900) {
  ctx.font = `${weight} ${Math.round(size)}px Pretendard, system-ui, sans-serif`;
  ctx.lineWidth = Math.max(4, size * 0.16);
  ctx.strokeStyle = '#0c1630';
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
}

/** 한 프레임. 캔버스만 건드리고 상태는 바꾸지 않는다. */
export function draw(ctx: CanvasRenderingContext2D, view: View, state: PlayState, now: number, flash: readonly number[], pops: readonly Pop[] = []): void {
  const { width, height, hitY } = view;
  ctx.clearRect(0, 0, width, height);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';

  forest(ctx, view, now);

  const beat = beatMs(state.song.level);
  const phase = now >= LEAD_IN_MS ? frac((now - LEAD_IN_MS) / beat) : 1;
  const pulse = view.calm ? 0 : Math.max(0, 1 - phase * 3.5);
  const pFar = 0;
  const near = projAtY(view, height + 4); // 트랙은 판정선 아래 화면 끝까지 이어진다

  // 트랙 바닥
  trapezoid(ctx, view, -1, 1, projOf(pFar), near);
  const floor = ctx.createLinearGradient(0, view.top, 0, height);
  floor.addColorStop(0, '#0d1b3acc');
  floor.addColorStop(1, '#16305af0');
  ctx.fillStyle = floor;
  ctx.fill();

  // 레인마다 옅은 제 색, 방금 친 레인은 빛기둥
  for (let lane = 0; lane < LANES; lane++) {
    const e0 = laneEdge(lane), e1 = laneEdge(lane + 1);
    trapezoid(ctx, view, e0, e1, projOf(pFar), near);
    ctx.globalAlpha = 0.07;
    ctx.fillStyle = LANE_COLORS[lane];
    ctx.fill();
    const age = now - (flash[lane] ?? -1e9);
    if (age >= 0 && age < BEAM_MS) {
      const beam = ctx.createLinearGradient(0, hitY, 0, view.top);
      beam.addColorStop(0, LANE_COLORS[lane]);
      beam.addColorStop(1, 'transparent');
      ctx.globalAlpha = (1 - age / BEAM_MS) * 0.75;
      ctx.fillStyle = beam;
      trapezoid(ctx, view, e0, e1, projOf(pFar), 1);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // 레인 칸막이와 박자에 맞춰 빛나는 가장자리
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#ffffff22';
  for (let lane = 1; lane < LANES; lane++) {
    const e = laneEdge(lane);
    ctx.beginPath(); ctx.moveTo(xOf(view, e, projOf(pFar)), view.top); ctx.lineTo(xOf(view, e, near), height); ctx.stroke();
  }
  // 박마다 먼 데서 가까이로 흘러오는 가로줄. 박이 눈에 보이게 한다.
  if (now >= LEAD_IN_MS - beat) {
    ctx.strokeStyle = '#ffffff';
    for (let k = 0; k < 4; k++) {
      const t = (Math.ceil((now - LEAD_IN_MS) / beat) + k) * beat + LEAD_IN_MS;
      const p = 1 - (t - now) / FALL_MS;
      if (p < 0 || p > 1) continue;
      const pr = projOf(p);
      ctx.globalAlpha = 0.08 + 0.1 * p;
      ctx.lineWidth = 1 + pr;
      ctx.beginPath(); ctx.moveTo(xOf(view, -1, pr), yOf(view, pr)); ctx.lineTo(xOf(view, 1, pr), yOf(view, pr)); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#a8f0ff';
  ctx.shadowColor = '#7fe3ff';
  ctx.shadowBlur = 8 + pulse * 18;
  ctx.globalAlpha = 0.55 + pulse * 0.45;
  for (const e of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(xOf(view, e, projOf(pFar)), view.top); ctx.lineTo(xOf(view, e, near), height); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;

  // 가운데 큰 콤보와 판정 글씨. 음표보다 먼저 그려 음표를 가리지 않는다.
  const last = pops[pops.length - 1];
  const midY = view.top + (hitY - view.top) * 0.42;
  if (state.combo >= 2) {
    const bump = last ? Math.max(0, 1 - (now - last.at) / 160) : 0;
    const size = Math.min(76, width * 0.17) * (1 + bump * 0.22);
    ctx.globalAlpha = 0.92;
    outlined(ctx, '콤보', view.cx, midY - size * 0.72, Math.max(13, size * 0.24), '#bfe9ff', 800);
    outlined(ctx, String(state.combo), view.cx, midY, size, '#ffffff');
    ctx.globalAlpha = 1;
  }
  if (last && now - last.at < POP_MS) {
    const t = (now - last.at) / POP_MS;
    const size = Math.min(34, width * 0.085) * (last.grade === 'perfect' ? 1.1 : 1) * (1 + Math.max(0, 0.25 - t) * 1.2);
    ctx.globalAlpha = 1 - t * t;
    outlined(ctx, last.grade === 'perfect' ? '딱 맞아요!' : '좋아요!', view.cx, midY + Math.min(62, width * 0.15), size, last.grade === 'perfect' ? '#ffd166' : '#8ff0de');
    ctx.globalAlpha = 1;
  }

  // 음표: 레인 색으로 빛나는 막대
  for (const note of state.song.notes) {
    const result = state.results[note.id];
    if (result !== undefined && result !== 'miss') continue;
    const p = 1 - (note.time - now) / FALL_MS;
    if (p < 0) continue;
    const pr = projOf(p);
    const y = yOf(view, pr);
    if (y > height + 20) continue;
    const e0 = laneEdge(note.lane), e1 = laneEdge(note.lane + 1);
    const inset = (e1 - e0) * 0.08;
    const x0 = xOf(view, e0 + inset, pr), x1 = xOf(view, e1 - inset, pr);
    const h = Math.max(5, 17 * pr);
    ctx.globalAlpha = result === 'miss' ? 0.22 : Math.min(1, p * 4);
    ctx.fillStyle = LANE_COLORS[note.lane];
    ctx.shadowColor = LANE_COLORS[note.lane];
    ctx.shadowBlur = view.calm ? 0 : 16;
    ctx.beginPath(); ctx.roundRect(x0, y - h / 2, x1 - x0, h, h / 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffffd9';
    ctx.beginPath(); ctx.roundRect(x0 + h * 0.6, y - h * 0.18, x1 - x0 - h * 1.2, h * 0.36, h * 0.18); ctx.fill();
  }
  ctx.globalAlpha = 1;

  // 판정선과 레인별 받침 고리
  ctx.strokeStyle = '#ffffff';
  ctx.shadowColor = '#bff6ff';
  ctx.shadowBlur = view.calm ? 0 : 14 + pulse * 10;
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(xOf(view, -1.02, 1), hitY); ctx.lineTo(xOf(view, 1.02, 1), hitY); ctx.stroke();
  ctx.shadowBlur = 0;
  for (let lane = 0; lane < LANES; lane++) {
    const x = xOf(view, laneEdge(lane) + 1 / LANES, 1);
    const rx = (view.half / LANES) * 0.72;
    const age = now - (flash[lane] ?? -1e9);
    const lit = age >= 0 && age < 180 ? 1 - age / 180 : 0;
    ctx.beginPath(); ctx.ellipse(x, hitY, rx * (1 + lit * 0.08), rx * 0.3 * (1 + lit * 0.2), 0, 0, Math.PI * 2);
    ctx.globalAlpha = 0.2 + lit * 0.6;
    ctx.fillStyle = LANE_COLORS[lane];
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.lineWidth = 3;
    ctx.strokeStyle = LANE_COLORS[lane];
    ctx.stroke();
  }

  // 맞힌 자리에서 튀는 반짝이
  if (!view.calm) {
    for (const pop of pops) {
      const t = (now - pop.at) / POP_MS;
      if (t < 0 || t > 1) continue;
      const x = xOf(view, laneEdge(pop.lane) + 1 / LANES, 1);
      const count = pop.grade === 'perfect' ? 12 : 7;
      ctx.fillStyle = pop.grade === 'perfect' ? '#fff3a0' : LANE_COLORS[pop.lane];
      for (let i = 0; i < count; i++) {
        const angle = Math.PI + (i / (count - 1)) * Math.PI + Math.sin(i * 3.1 + pop.lane) * 0.15;
        const r = 12 + t * (50 + (i % 3) * 14);
        ctx.globalAlpha = 1 - t;
        ctx.beginPath(); ctx.arc(x + Math.cos(angle) * r, hitY + Math.sin(angle) * r * 0.9, (1 - t) * 4 + 1, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  // 박 세기: 셋, 둘, 하나, 시작!
  const countBeat = Math.ceil((LEAD_IN_MS - now) / beat);
  let label = '';
  if (countBeat > COUNT_IN) label = '준비~';
  else if (countBeat >= 1) label = String(countBeat);
  else if (now < LEAD_IN_MS + beat) label = '시작!';
  if (label) {
    const t = label === '준비~' ? 0 : frac((LEAD_IN_MS - now) / beat);
    const scale = label === '준비~' ? 1 : 0.85 + Math.max(0, t - 0.6) * 0.6;
    ctx.globalAlpha = label === '시작!' ? Math.max(0, 1 - (now - LEAD_IN_MS) / beat) : 1;
    outlined(ctx, label, view.cx, view.top + (hitY - view.top) * 0.4, Math.min(84, width * 0.2) * scale, label === '시작!' ? '#ffd166' : '#ffffff');
    ctx.globalAlpha = 1;
  }
}
