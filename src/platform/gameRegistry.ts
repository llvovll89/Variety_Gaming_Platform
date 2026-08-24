import hachupingThumb from "../shared/assets/하츄핑.webp";
import HachupingSliderApp from "../games/hachuping-slither/HachupingSliderApp";
import HachupingJumpApp from "../games/hachuping-jump/HachupingJumpApp";
import HachupingDodgeApp from "../games/hachuping-dodge/HachupingDodgeApp";
import HachupingBalloonApp from "../games/hachuping-balloon/HachupingBalloonApp";
import HachupingMemoryApp from "../games/hachuping-memory/HachupingMemoryApp";
import type { GameDefinition } from "./types";

/** Every playable game on the platform. Add a new entry here to list a new game on the hub. */
export const GAMES: GameDefinition[] = [
  {
    id: "hachuping-memory",
    title: "동물 친구 기억력",
    description: "패턴을 보고 따라하는 7세 두뇌 발달 게임",
    thumbnail: hachupingThumb,
    accentColor: "#ff6fa5",
    Component: HachupingMemoryApp,
  },
  {
    id: "hachuping-slither",
    title: "슬리더",
    description: "별을 먹고 커지는 지렁이 게임",
    thumbnail: hachupingThumb,
    accentColor: "#ff6fa5",
    Component: HachupingSliderApp,
  },
  {
    id: "hachuping-jump",
    title: "점프",
    // TODO: 사용자가 직접 섬네일 이미지를 제공하면 games/hachuping-jump/assets/에 넣고 여기서 교체
    description: "장애물 사이를 뚫고 날아가는 점프 게임",
    thumbnail: hachupingThumb,
    accentColor: "#4fd8ff",
    Component: HachupingJumpApp,
  },
  {
    id: "hachuping-dodge",
    title: "오브 피하기",
    // TODO: 사용자가 직접 섬네일 이미지를 제공하면 games/hachuping-dodge/assets/에 넣고 여기서 교체
    description: "쏟아지는 에너지 오브를 피해 최대한 오래 살아남는 게임",
    thumbnail: hachupingThumb,
    accentColor: "#c084fc",
    Component: HachupingDodgeApp,
  },
  {
    id: "hachuping-balloon",
    title: "풍선 터뜨리기",
    // TODO: 사용자가 직접 섬네일 이미지를 제공하면 games/hachuping-balloon/assets/에 넣고 여기서 교체
    description: "떠오르는 풍선을 톡톡 터치해서 터뜨리는 놀이 (7세 미만도 쉽게)",
    thumbnail: hachupingThumb,
    accentColor: "#ffb020",
    Component: HachupingBalloonApp,
  },
];

export function getGameById(id: string): GameDefinition | undefined {
  return GAMES.find((g) => g.id === id);
}
