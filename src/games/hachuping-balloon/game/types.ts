export interface Balloon {
  id: number;
  baseX: number; // spawn x — the resting center that sway oscillates around
  x: number; // current logical-space x (baseX + sway offset), recomputed each tick
  y: number; // logical-space y, decreases as the balloon rises
  riseSpeed: number; // logical units / s
  swayPhase: number;
  swayAmplitude: number;
  swaySpeed: number;
  radius: number;
  hue: number;
  age: number;
}

export interface PopEffect {
  x: number;
  y: number;
  hue: number;
  age: number;
}

export interface UISnapshot {
  status: "playing" | "paused" | "gameover";
  score: number;
  bestScore: number;
  timeRemaining: number;
  finalScore: number | null;
}
