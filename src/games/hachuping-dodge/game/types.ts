export interface Orb {
  id: number;
  x: number;
  y: number; // logical-space center
  vx: number;
  vy: number; // logical units / s
  radius: number;
  hue: number; // golden-angle hue, same trick as hachuping-jump's obstacles
  age: number; // seconds since spawn — drives this orb's own pulse/spark phase
}

export interface BonusStar {
  x: number;
  y: number;
  age: number; // seconds since spawn — drives despawn-after-timeout and pulse
  collected: boolean;
}

export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alive: boolean;
}

export interface UISnapshot {
  status: "playing" | "paused" | "dead";
  score: number;
  timeAlive: number;
  bestScore: number;
  finalScore: number | null;
}
