import { catalogHero } from "./heroCatalog";

// Measured cell boundaries keep neighboring portraits out of each crop.
const expandedX = [0, 230, 459, 687, 915, 1145];
const expandedY = [0, 220, 440, 664, 883, 1103, 1374];
export function portraitStyle(key: string) {
  const hero = catalogHero(key);
  if (hero.atlas === "expansion2") return {
    backgroundImage: "url('/art/three-kingdoms-card/heroes-expansion-2.png')",
    backgroundSize: "400% 300%",
    backgroundPosition: `${(hero.tile % 4) * 100 / 3}% ${Math.floor(hero.tile / 4) * 50}%`,
  };
  if (hero.atlas === "original") return {
    backgroundImage: "url('/art/three-kingdoms-card/heroes.png')",
    backgroundSize: "300% 200%",
    backgroundPosition: `${(hero.tile % 3) * 50}% ${Math.floor(hero.tile / 3) * 100}%`,
  };
  const col = hero.tile % 5; const row = Math.floor(hero.tile / 5);
  const x = expandedX[col]; const y = expandedY[row];
  const width = expandedX[col + 1] - x;
  const height = Math.min(expandedY[row + 1] - y, width);
  return {
    backgroundImage: "url('/art/three-kingdoms-card/heroes-expanded.png')",
    backgroundSize: `${1145 / width * 100}% ${1374 / height * 100}%`,
    backgroundPosition: `${x / (1145 - width) * 100}% ${y / (1374 - height) * 100}%`,
  };
}
