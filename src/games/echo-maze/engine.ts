export type Difficulty = 'easy' | 'normal' | 'hard';
export const LEVELS = {
  easy: { label: '쉬움', size: 13, seconds: 120, vision: 99, description: '전체 지도를 보며 여유롭게' },
  normal: { label: '보통', size: 19, seconds: 150, vision: 5, description: '안개 속에서 길을 기억하기' },
  hard: { label: '어려움', size: 25, seconds: 180, vision: 3, description: '좁은 시야, 더 깊어진 미로' },
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
  visited = new Set<string>(['1,1']); shards = new Set<string>(); message = '빛나는 출구를 찾아 떠나세요.';
  constructor(public difficulty: Difficulty, random = Math.random) {
    const level = LEVELS[difficulty]; this.cells = generateMaze(level.size, random); this.remaining = level.seconds;
    const sorted = [...distances(this.cells, this.player)].sort((a, b) => b[1] - a[1]);
    const [x, y] = sorted[0][0].split(',').map(Number); this.exit = { x, y };
    // Spread rewards across distant branches, never on the spawn or exit.
    for (const [id, distance] of sorted) {
      const [sx, sy] = id.split(',').map(Number);
      if (id === key(this.exit) || distance < 8) continue;
      if ([...this.shards].every(s => { const [a, b] = s.split(',').map(Number); return Math.abs(a - sx) + Math.abs(b - sy) >= 5; })) this.shards.add(id);
      if (this.shards.size >= (difficulty === 'easy' ? 3 : 5)) break;
    }
  }
  tick(seconds: number) {
    if (this.paused || this.status !== 'playing') return;
    this.remaining = Math.max(0, this.remaining - seconds); this.reveal = Math.max(0, this.reveal - seconds);
    if (!this.remaining) { this.status = 'lost'; this.message = '시간이 다 되었어요.'; }
  }
  move(direction: number) {
    if (this.paused || this.status !== 'playing' || !DIRECTIONS[direction]) return;
    const d = DIRECTIONS[direction], p = { x: this.player.x + d.x, y: this.player.y + d.y };
    if (this.cells[p.y]?.[p.x] !== 0) return;
    this.player = p; this.steps++; this.visited.add(key(p));
    if (this.shards.delete(key(p))) { this.remaining += 10; this.collected++; this.message = '시간 조각 발견! +10초'; }
    if (key(p) === key(this.exit)) { this.status = 'won'; this.message = '미로를 탈출했어요!'; }
  }
  action(action: 'anchor' | 'return' | 'pulse') {
    if (this.paused || this.status !== 'playing') return;
    if (action === 'anchor') { this.anchor = { ...this.player }; this.message = '기억 닻을 남겼어요. 언제든 돌아오세요.'; }
    if (action === 'return' && this.anchor && this.returns > 0) { this.player = { ...this.anchor }; this.returns--; this.message = '기억 닻으로 돌아왔어요. 시간은 그대로 흘러요.'; }
    if (action === 'pulse' && this.pulses > 0 && this.remaining > 4) { this.pulses--; this.remaining -= 4; this.reveal = 5; this.message = '메아리! 5초 동안 전체 미로가 보여요. −4초'; }
  }
}
