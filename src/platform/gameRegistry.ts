import hachupingThumb from "../shared/assets/하츄핑.webp";
import HachupingSliderApp from "../games/hachuping-slither/HachupingSliderApp";
import HachupingJumpApp from "../games/hachuping-jump/HachupingJumpApp";
import type { GameDefinition } from "./types";

/** Every playable game on the platform. Add a new entry here to list a new game on the hub. */
export const GAMES: GameDefinition[] = [
  {
    id: "hachuping-slither",
    title: "하츄핑 슬리더",
    description: "별을 먹고 커지는 지렁이 게임",
    thumbnail: hachupingThumb,
    accentColor: "#ff6fa5",
    Component: HachupingSliderApp,
  },
  {
    id: "hachuping-jump",
    title: "하츄핑 점프",
    // TODO: 사용자가 직접 섬네일 이미지를 제공하면 games/hachuping-jump/assets/에 넣고 여기서 교체
    description: "장애물 사이를 뚫고 날아가는 점프 게임",
    thumbnail: hachupingThumb,
    accentColor: "#4fd8ff",
    Component: HachupingJumpApp,
  },
];

export function getGameById(id: string): GameDefinition | undefined {
  return GAMES.find((g) => g.id === id);
}
