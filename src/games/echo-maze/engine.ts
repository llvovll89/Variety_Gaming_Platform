export type Difficulty = 'easy' | 'normal' | 'hard';
export const LEVELS = {
  easy: { label: '쉬움', size: 17, seconds: 95, vision: 5, description: '봉인 2개 · 안개 속 첫 탐험' },
  normal: { label: '보통', size: 23, seconds: 120, vision: 4, description: '봉인 3개 · 깨어나는 시간 함정' },
  hard: { label: '어려움', size: 29, seconds: 145, vision: 3, description: '봉인 4개 · 좁은 시야와 적은 귀환' },
};
export type Point = { x: number; y: number };
export const key = (p: Point) => `${p.x},${p.y}`;
export const DIRECTIONS = [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }];
export function generateMaze(size: number, random = Math.random) {
  const cells = Array.from({ length: size }, () => Array<number>(size).fill(1));
  const stack: Point[] = [{ x: 1, y: 1 }]; cells[1][1] = 0;
  while (stack.length) {
    const p = stack[stack.length - 1];
    const choices = DIRECTIONS.map(d => ({ x: p.x + d.x * 2, y: p.y + d.y * 2 })).filter(n => n.x > 0 && n.y > 0 && n.x < size - 1 && n.y < size - 1 && cells[n.y][n.x] === 1);
    if (!choices.length) { stack.pop(); continue; }
    const n = choices[Math.floor(random() * choices.length)];
    cells[(p.y + n.y) / 2][(p.x + n.x) / 2] = 0; cells[n.y][n.x] = 0; stack.push(n);
  }
  return cells;
}
export function distances(cells: number[][], start: Point) {
  const found = new Map<string, number>([[key(start), 0]]), queue = [start];
  for (let i = 0; i < queue.length; i++) for (const d of DIRECTIONS) {
    const p = { x: queue[i].x + d.x, y: queue[i].y + d.y };
    if (cells[p.y]?.[p.x] !== 0 || found.has(key(p))) continue;
    found.set(key(p), found.get(key(queue[i]))! + 1); queue.push(p);
  }
  return found;
}
export class MazeRun {
  cells: number[][]; player = { x: 1, y: 1 }; exit: Point;
  remaining: number; status: 'playing' | 'won' | 'lost' = 'playing';
  paused = false; steps = 0; collected = 0; anchor: Point | null = null; returns = 3; pulses = 3; reveal = 0;
  visited = new Set<string>(['1,1']); shards = new Set<string>(); message = '보라색 봉인을 모두 모아 출구를 여세요.';
  seals = new Set<string>(); traps = new Set<string>(); sealsCollected = 0; requiredSeals = 0; elapsed = 0; trapHits = 0;
  get trapsActive() { return this.elapsed % 6 < 3; }
  constructor(public difficulty: Difficulty, random = Math.random) {
    const level = LEVELS[difficulty]; this.cells = generateMaze(level.size, random); this.remaining = level.seconds;
    const sorted = [...distances(this.cells, this.player)].sort((a, b) => b[1] - a[1]);
    const [x, y] = sorted[0][0].split(',').map(Number); this.exit = { x, y };
    this.returns = difficulty === 'hard' ? 1 : 2;
    this.pulses = difficulty === 'hard' ? 2 : 3;
    const candidates = sorted.filter(([id, distance]) => id !== key(this.exit) && distance >= 8);
    const deadEnds = candidates.filter(([id]) => {
      const [x, y] = id.split(',').map(Number);
      return DIRECTIONS.filter(d => this.cells[y + d.y]?.[x + d.x] === 0).length === 1;
    });
    const count = difficulty === 'easy' ? 2 : difficulty === 'normal' ? 3 : 4;
    for (const [id] of [...deadEnds, ...candidates]) {
      const [x, y] = id.split(',').map(Number);
      if ([...this.seals].every(s => { const [a,b] = s.split(',').map(Number); return Math.abs(a-x)+Math.abs(b-y) >= 4; })) this.seals.add(id);
      if (this.seals.size === count) break;
    }
    this.requiredSeals = this.seals.size;
    for (const [id, distance] of candidates) {
      if (this.seals.has(id) || distance % 7 !== 0) continue;
      this.traps.add(id);
      if (this.traps.size >= (difficulty === 'easy' ? 3 : difficulty === 'normal' ? 7 : 12)) break;
    }
    // Spread rewards across distant branches, never on objectives or traps.
    for (const [id, distance] of sorted) {
      const [sx, sy] = id.split(',').map(Number);
      if (id === key(this.exit) || this.seals.has(id) || this.traps.has(id) || distance < 8) continue;
      if ([...this.shards].every(s => { const [a, b] = s.split(',').map(Number); return Math.abs(a - sx) + Math.abs(b - sy) >= 5; })) this.shards.add(id);
      if (this.shards.size >= (difficulty === 'easy' ? 3 : 5)) break;
    }
  }
  tick(seconds: number) {
    if (this.paused || this.status !== 'playing') return;
    if (!Number.isFinite(seconds) || seconds < 0) return;
    this.elapsed += seconds;
    this.remaining = Math.max(0, this.remaining - seconds); this.reveal = Math.max(0, this.reveal - seconds);
    if (!this.remaining) { this.status = 'lost'; this.message = '시간이 다 되었어요.'; }
  }
  move(direction: number) {
    if (this.paused || this.status !== 'playing' || !DIRECTIONS[direction]) return;
    const d = DIRECTIONS[direction], p = { x: this.player.x + d.x, y: this.player.y + d.y };
    if (this.cells[p.y]?.[p.x] !== 0) return;
    this.player = p; this.steps++; this.visited.add(key(p));
    if (this.shards.delete(key(p))) { this.remaining += 10; this.collected++; this.message = '시간 조각 발견! +10초'; }
    if (this.seals.delete(key(p))) { this.sealsCollected++; this.message = `봉인 해제! ${this.sealsCollected}/${this.requiredSeals} · ${this.seals.size ? '남은 봉인을 찾아보세요.' : '출구가 열렸어요!'}`; }
    if (this.traps.has(key(p)) && this.trapsActive) { this.trapHits++; this.remaining = Math.max(0, this.remaining - 6); this.message = '시간 함정! −6초 · 빛이 꺼질 때 건너세요.'; }
    if (!this.remaining) { this.status = 'lost'; this.message = '시간 함정에 남은 시간을 잃었어요.'; return; }
    if (key(p) === key(this.exit)) {
      if (this.seals.size) this.message = `출구가 잠겨 있어요. 봉인 ${this.seals.size}개를 더 모으세요.`;
      else { this.status = 'won'; this.message = '모든 봉인을 풀고 탈출했어요!'; }
    }
  }
  action(action: 'anchor' | 'return' | 'pulse') {
    if (this.paused || this.status !== 'playing') return;
    if (action === 'anchor') { this.anchor = { ...this.player }; this.message = '기억 닻을 남겼어요. 언제든 돌아오세요.'; }
    if (action === 'return' && this.anchor && this.returns > 0) { this.player = { ...this.anchor }; this.returns--; this.message = '기억 닻으로 돌아왔어요. 시간은 그대로 흘러요.'; }
    if (action === 'pulse' && this.pulses > 0 && this.remaining > 4) { this.pulses--; this.remaining -= 4; this.reveal = 5; this.message = '메아리! 5초 동안 전체 미로가 보여요. −4초'; }
  }
}
