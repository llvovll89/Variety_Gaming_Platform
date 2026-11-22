import type { ComponentType } from "react";
import type { Profile } from "../shared/profile/useProfile";
import type { GameMeta } from "./meta/types";

export interface GameProps {
  onExit: () => void;
  launchIntent?: "start" | "resume";
  /** Cross-game player identity (name + character), owned by the platform shell. */
  profile: Profile;
}

/** 한 판·한 퍼즐·한 전투 기준으로 "얼마나 걸리고 무엇을 하는 게임인가". 캠페인 전체가 아니다. */
export interface PlayInfo {
  duration: string;
  minutes: number;
  controls: string;
  experience: string;
  save: string;
}

export interface GameDefinition {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  /** Larger version of the promotional cover art for the hub spotlight. */
  cover?: string;
  /** Small cover for the horizontal recommendation picker. */
  previewThumbnail?: string;
  /** Short spotlight copy, kept separate from detailed game descriptions. */
  spotlightText?: string;
  accentColor: string; // CSS color used for the card's glow/accent
  genres: readonly GameGenre[];
  tags: readonly string[];
  featuredText?: string;
  releaseStatus?: "available" | "coming-soon";
  /** Who the game is mainly for; decides how rewards are shown. Defaults from the 키즈 genre. */
  audience?: Audience;
  /** Records, achievements and daily challenges the game takes part in (data only). */
  meta?: GameMeta;
  /**
   * 허브가 시간별 추천과 오늘의 도전 후보를 고를 때 읽는다. 필수로 둔 것은, 예전에 이 값이
   * 플랫폼의 별도 맵에 있어서 빠뜨린 게임이 아무 말 없이 두 곳에서 사라졌기 때문이다.
   */
  play: PlayInfo;
  /**
   * 허브의 "이어하기". key에 저장본이 있을 때만 label()을 불러 게임 규칙을 읽어 온다.
   * 허브는 모든 게임에 대해 묻기 때문에, 먼저 열쇠만 보고 없는 게임은 그냥 넘어간다.
   */
  resume?: { key: string; label: () => Promise<string | null> };
  disabled?: boolean;
  Component: ComponentType<GameProps>;
}

export type GameGenre = "전략" | "액션" | "캐주얼" | "키즈";
export type Audience = "kids" | "general";

/** Kids games show stickers and gentle wording; the rest show achievements and numbers. */
export function audienceOf(game: Pick<GameDefinition, "audience" | "genres">): Audience {
  return game.audience ?? (game.genres.includes("키즈") ? "kids" : "general");
}
