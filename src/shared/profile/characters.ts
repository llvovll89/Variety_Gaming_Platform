import hachupingUrl from "../assets/하츄핑.webp";

export interface Character {
  id: string;
  name: string;
  image: string;
}

/**
 * char1-3 point at /public root paths rather than a static import: those source
 * images are personal photos kept out of the repo (see .gitignore), so a fresh
 * clone has no file for the bundler to resolve at build time. Referencing them
 * as plain public-folder URLs keeps the build green even when the files are
 * absent locally — they just 404 as an image instead of failing the build.
 */
export const CHARACTERS: Character[] = [
  { id: "hachuping", name: "하츄핑", image: hachupingUrl },
  { id: "char1", name: "캐릭터 1", image: "/1.jpg" },
  { id: "char2", name: "캐릭터 2", image: "/2.jpg" },
  { id: "char3", name: "캐릭터 3", image: "/3.jpg" },
];

export const DEFAULT_CHARACTER_ID = CHARACTERS[0].id;
export const DEFAULT_CHARACTER_IMAGE = CHARACTERS[0].image;

export function getCharacterById(id: string): Character {
  return CHARACTERS.find((c) => c.id === id) ?? CHARACTERS[0];
}
