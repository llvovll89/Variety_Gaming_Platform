
export interface Character {
  id: string;
  name: string;
  image: string;
}

export const CHARACTERS: Character[] = [
  { id: "game-default", name: "게임 기본 캐릭터", image: "/art/star-avatar.svg" },
];

export const GAME_CHARACTER_IMAGES: Record<string, string> = {
  "hachuping-slither": "/art/snake-avatar.svg",
  "hachuping-jump": "/art/bird-avatar.svg",
  "hachuping-balloon": "/art/star-avatar.svg",
};

export const DEFAULT_CHARACTER_ID = CHARACTERS[0].id;
export const DEFAULT_CHARACTER_IMAGE = CHARACTERS[0].image;

export function getCharacterById(id: string): Character {
  return CHARACTERS.find((c) => c.id === id) ?? CHARACTERS[0];
}
