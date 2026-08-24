import type { AnimalType } from "./types";

export const ANIMALS: AnimalType[] = ["cat", "rabbit", "bear", "fox", "panda"];

export const ANIMAL_EMOJIS: Record<AnimalType, string> = {
  cat: "🐱",
  rabbit: "🐰",
  bear: "🐻",
  fox: "🦊",
  panda: "🐼",
};

export const GAME_CONFIG = {
  cardCounts: [4, 6, 8, 9, 12],
  cardAnimationDuration: 300,
  sequenceDelay: 600,
  transitionDelay: 1000,
};
