import hachupingUrl from "../assets/하츄핑.webp";

export interface Character {
  id: string;
  name: string;
  image: string;
}

export const CHARACTERS: Character[] = [{ id: "hachuping", name: "하츄핑", image: hachupingUrl }];

export const DEFAULT_CHARACTER_ID = CHARACTERS[0].id;
export const DEFAULT_CHARACTER_IMAGE = CHARACTERS[0].image;

export function getCharacterById(id: string): Character {
  return CHARACTERS.find((c) => c.id === id) ?? CHARACTERS[0];
}
