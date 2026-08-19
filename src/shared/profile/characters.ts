import hachupingUrl from "../assets/하츄핑.webp";
import char1Url from "../assets/1.jpg";
import char2Url from "../assets/2.jpg";
import char3Url from "../assets/3.jpg";

export interface Character {
  id: string;
  name: string;
  image: string;
}

/** Built-in character roster, shared by every game on the platform. */
export const CHARACTERS: Character[] = [
  { id: "hachuping", name: "하츄핑", image: hachupingUrl },
  { id: "char1", name: "캐릭터 1", image: char1Url },
  { id: "char2", name: "캐릭터 2", image: char2Url },
  { id: "char3", name: "캐릭터 3", image: char3Url },
];

export const DEFAULT_CHARACTER_ID = CHARACTERS[0].id;
export const DEFAULT_CHARACTER_IMAGE = CHARACTERS[0].image;

export function getCharacterById(id: string): Character {
  return CHARACTERS.find((c) => c.id === id) ?? CHARACTERS[0];
}
