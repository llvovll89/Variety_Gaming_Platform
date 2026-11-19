import type { AnimalType } from "./types";

export const ANIMALS: AnimalType[] = ["cat", "rabbit", "bear", "fox", "panda"];

export const ANIMAL_EMOJIS: Record<AnimalType, string> = {
  cat: "🐱",
  rabbit: "🐰",
  bear: "🐻",
  fox: "🦊",
  panda: "🐼",
};

/** Slow shows each card longer, for younger children; records are kept per speed. */
export type MemorySpeed = 'slow' | 'normal';
export const SPEEDS: Record<MemorySpeed, { label: string; note: string; factor: number }> = {
  slow: { label: '천천히', note: '처음이라면', factor: 1.6 },
  normal: { label: '보통', note: '익숙해졌다면', factor: 1 },
};

export const GAME_CONFIG = {
  cardCounts: [4, 6, 8, 9, 12],
  cardAnimationDuration: 300,
  sequenceDelay: 600,
  transitionDelay: 1000,
};
