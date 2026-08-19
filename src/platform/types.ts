import type { ComponentType } from "react";
import type { Profile } from "../shared/profile/useProfile";

export interface GameProps {
  onExit: () => void;
  /** Cross-game player identity (name + character), owned by the platform shell. */
  profile: Profile;
}

export interface GameDefinition {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  accentColor: string; // CSS color used for the card's glow/accent
  Component: ComponentType<GameProps>;
}
