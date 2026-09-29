// Experience is the remainder toward the next level, shared across winning heroes.
export function gainExperience(level: number, experience: number, reward: number) {
  let remaining = experience + reward;
  const original = level;
  while (level < 100 && remaining >= level * 100) {
    remaining -= level * 100;
    level++;
  }
  return { level, experience: level === 100 ? 0 : remaining, levelsGained: level - original };
}
