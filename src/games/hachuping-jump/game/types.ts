import type { ItemKind } from "./items";
export type ObstacleKind = "candy" | "mushroom" | "cloud" | "crystal";
export interface BonusStar {
  y: number;
  collected: boolean;
}

export interface Obstacle {
  id: number;
  kind: ObstacleKind;
  baseCenterY: number;
  baseGapHeight: number;
  age: number;
  x: number; // logical-space left edge
  gapCenterY: number;
  gapHeight: number;
  passed: boolean;
  star: BonusStar | null;
  item: { kind: ItemKind; collected: boolean } | null;
  hue: number; // per-obstacle color, so a run of pillars doesn't look monotone
}

export interface PlayerState {
  y: number;
  vy: number;
  rotation: number;
  alive: boolean;
}

export interface UISnapshot {
  status: "playing" | "paused" | "dead" | "won";
  score: number;
  bestScore: number;
  finalScore: number | null;
  stars: number;
  shieldTime: number;
  magnetTime: number;
  doubleTime: number;
  slowTime: number;
  hearts: number;
  stage: number;
  stageCleared: number;
  bannerTime: number;
}

export interface PickupFx { x: number; y: number; text: string; color: string; life: number }
