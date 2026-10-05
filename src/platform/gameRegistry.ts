import HachupingSliderApp from "../games/hachuping-slither/HachupingSliderApp";
import HachupingJumpApp from "../games/hachuping-jump/HachupingJumpApp";
import RuneRangerApp from "../games/hachuping-dodge/survivor/SurvivorApp";
import HachupingBalloonApp from "../games/hachuping-balloon/HachupingBalloonApp";
import HachupingMemoryApp from "../games/hachuping-memory/HachupingMemoryApp";
import HachupingColorMatchApp from "../games/hachuping-color-match/HachupingColorMatchApp";
import { lazy } from 'react';
const FantasyTacticsApp = lazy(() => import('../games/fantasy-tactics/FantasyTacticsApp'));
const EchoMazeApp = lazy(() => import('../games/echo-maze/EchoMazeApp'));
const HachupingWhackAMoleApp = lazy(() => import('../games/hachuping-whack-a-mole/HachupingWhackAMoleApp'));
const ThreeKingdomsApp = lazy(() => import('../games/three-kingdoms/ThreeKingdomsApp'));
const ThreeKingdomsCardApp = lazy(() => import('../games/three-kingdoms-card/ThreeKingdomsCardApp'));
import type { GameDefinition } from "./types";

/** Every playable game on the platform. Add a new entry here to list a new game on the hub. */
export const GAMES: GameDefinition[] = [
  {
    id: 'fantasy-tactics',
    title: '별빛 원정대',
    description: '네 동료와 떠나는 6개 챕터의 전술 RPG · 전직과 지형 전술로 바다 건너 별빛까지',
    thumbnail: '/art/fantasy-tactics/cover.png',
    accentColor: '#416d79',
    genres: ['전략'],
    tags: ['턴제', 'RPG', '판타지', '스토리', '전술'],
    featuredText: '등대에 돌아온 빛이 바다 건너에서 응답합니다. 숲과 언덕을 지나 항구·유령선·별이 떨어진 섬으로 원정을 이어 가세요.',
    Component: FantasyTacticsApp,
  },
  {
    id: "echo-maze",
    title: "메아리 미로",
    description: "내 사진으로 떠나는 3D 미로 탐험 · 기억 닻과 시간 조각을 이용해 탈출하세요",
    thumbnail: "/art/echo-maze.svg",
    accentColor: "#78b79b",
    genres: ["캐주얼"],
    tags: ["미로", "3D", "사진 캐릭터", "시간 제한"],
    Component: EchoMazeApp,
  },
  {
    id: "three-kingdoms-card",
    title: "삼국 영지",
    description: "장수를 모집하고 부대를 편성해 나만의 영지를 키우는 삼국지 카드 전략",
    thumbnail: "/art/three-kingdoms-card/valley.png",
    accentColor: "#d4b678",
    genres: ["전략"],
    tags: ["삼국지", "카드", "수집", "영지", "부대 편성"],
    featuredText: "72명의 장수를 모으고, 당신만의 영지에서 새로운 천하를 시작하세요.",
    Component: ThreeKingdomsCardApp,
  },
  {
    id: "three-kingdoms",
    title: "삼국지 패업 PK",
    description: "3D 중원 전장 · 장수별 모델과 PK 편집 · 육각 턴제 전략",
    thumbnail: "/art/three-kingdoms.svg",
    accentColor: "#7a2020",
    genres: ["전략"],
    tags: ["삼국지", "3D", "턴제", "PK", "전쟁"],
    Component: ThreeKingdomsApp,
  },
  {
    id: "hachuping-slither",
    title: "슬리더",
    description: "별을 먹고 커지는 지렁이 게임",
    thumbnail: "/art/slither.svg",
    accentColor: "#72bd85",
    genres: ["액션", "캐주얼"],
    tags: ["성장", "지렁이", "아케이드", "점수"],
    Component: HachupingSliderApp,
  },
  {
    id: "hachuping-dodge",
    title: "룬 레인저",
    description: "자동 사격과 레벨업으로 미니언 군단을 돌파하는 생존 액션 RPG",
    thumbnail: "/rune-ranger.svg",
    accentColor: "#77cba3",
    genres: ["액션"],
    tags: ["생존", "RPG", "자동 전투", "레벨업"],
    Component: RuneRangerApp,
  },
  {
    id: "hachuping-jump",
    title: "점프",
    description: "장애물 사이를 뚫고 날아가는 점프 게임",
    thumbnail: "/art/jump.svg",
    accentColor: "#4fd8ff",
    genres: ["액션", "캐주얼"],
    tags: ["점프", "비행", "장애물", "아케이드"],
    Component: HachupingJumpApp,
  },
  {
    id: "hachuping-memory",
    title: "동물 친구 기억력",
    description: "패턴을 보고 따라하는 7세 두뇌 발달 게임",
    thumbnail: "/art/memory.svg",
    accentColor: "#ff6fa5",
    genres: ["키즈", "캐주얼"],
    tags: ["기억력", "동물", "두뇌", "패턴"],
    releaseStatus: "coming-soon",
    disabled: true,
    Component: HachupingMemoryApp,
  },
  {
    id: "hachuping-whack-a-mole",
    title: "두더지 잡기",
    description: "톡! 톡! 3D 두더지와 즐기는 30초 순발력 챌린지",
    thumbnail: "/art/mole-3d.png",
    accentColor: "#ff9020",
    genres: ["액션", "캐주얼", "키즈"],
    tags: ["두더지", "반응 속도", "3D", "30초"],
    Component: HachupingWhackAMoleApp,
  },
  {
    id: "hachuping-color-match",
    title: "색깔 맞추기",
    description: "화면에 뜬 색과 같은 색을 빠르게 찾는 반응속도 게임",
    thumbnail: "/art/color-match.svg",
    accentColor: "#22c55e",
    genres: ["키즈", "캐주얼"],
    tags: ["색깔", "반응 속도", "교육"],
    releaseStatus: "coming-soon",
    disabled: true,
    Component: HachupingColorMatchApp,
  },
  {
    id: "hachuping-balloon",
    title: "풍선 터뜨리기",
    description: "떠오르는 풍선을 톡톡 터치해서 터뜨리는 놀이 (7세 미만도 쉽게)",
    thumbnail: "/art/balloon.svg",
    accentColor: "#ffb020",
    genres: ["키즈", "캐주얼"],
    tags: ["풍선", "터치", "유아", "반응 속도"],
    releaseStatus: "coming-soon",
    disabled: true,
    Component: HachupingBalloonApp,
  },
];

export function getGameById(id: string): GameDefinition | undefined {
  return GAMES.find((g) => g.id === id && !g.disabled);
}
