import HachupingSliderApp from "../games/hachuping-slither/HachupingSliderApp";
import HachupingJumpApp from "../games/hachuping-jump/HachupingJumpApp";
import RuneRangerApp from "../games/hachuping-dodge/survivor/SurvivorApp";
import HachupingBalloonApp from "../games/hachuping-balloon/HachupingBalloonApp";
import HachupingMemoryApp from "../games/hachuping-memory/HachupingMemoryApp";
import HachupingWhackAMoleApp from "../games/hachuping-whack-a-mole/HachupingWhackAMoleApp";
import HachupingColorMatchApp from "../games/hachuping-color-match/HachupingColorMatchApp";
import type { GameDefinition } from "./types";

/** Every playable game on the platform. Add a new entry here to list a new game on the hub. */
export const GAMES: GameDefinition[] = [
  {
    id: "hachuping-slither",
    title: "슬리더",
    description: "별을 먹고 커지는 지렁이 게임",
    thumbnail: "/art/slither.svg",
    accentColor: "#72bd85",
    Component: HachupingSliderApp,
  },
  {
    id: "hachuping-dodge",
    title: "룬 레인저",
    description: "자동 사격과 레벨업으로 미니언 군단을 돌파하는 생존 액션 RPG",
    thumbnail: "/rune-ranger.svg",
    accentColor: "#77cba3",
    Component: RuneRangerApp,
  },
  {
    id: "hachuping-jump",
    title: "점프",
    description: "장애물 사이를 뚫고 날아가는 점프 게임",
    thumbnail: "/art/jump.svg",
    accentColor: "#4fd8ff",
    Component: HachupingJumpApp,
  },
  {
    id: "hachuping-memory",
    title: "동물 친구 기억력",
    description: "패턴을 보고 따라하는 7세 두뇌 발달 게임",
    thumbnail: "/art/memory.svg",
    accentColor: "#ff6fa5",
    disabled: true,
    Component: HachupingMemoryApp,
  },
  {
    id: "hachuping-whack-a-mole",
    title: "두더지 잡기",
    description: "떠오르는 두더지를 탭해서 잡는 반응속도 게임",
    thumbnail: "/art/mole.svg",
    accentColor: "#ff9020",
    disabled: true,
    Component: HachupingWhackAMoleApp,
  },
  {
    id: "hachuping-color-match",
    title: "색깔 맞추기",
    description: "화면에 뜬 색과 같은 색을 빠르게 찾는 반응속도 게임",
    thumbnail: "/art/color-match.svg",
    accentColor: "#22c55e",
    disabled: true,
    Component: HachupingColorMatchApp,
  },
  {
    id: "hachuping-balloon",
    title: "풍선 터뜨리기",
    description: "떠오르는 풍선을 톡톡 터치해서 터뜨리는 놀이 (7세 미만도 쉽게)",
    thumbnail: "/art/balloon.svg",
    accentColor: "#ffb020",
    disabled: true,
    Component: HachupingBalloonApp,
  },
];

export function getGameById(id: string): GameDefinition | undefined {
  return GAMES.find((g) => g.id === id && !g.disabled);
}
