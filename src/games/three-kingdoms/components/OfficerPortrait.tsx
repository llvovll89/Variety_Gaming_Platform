import { officerPortraitStyle } from '../game/officerPortraits';
import { HANJA_FONT, PALETTE } from "../game/constants";
import type { GameState, Officer } from "../game/types";

interface Props {
  officer: Officer;
  state: GameState;
  /** Square art thumbnail; the same crop is used in lists and officer details. */
  size?: number;
  showName?: boolean;
}

/** Illustrated portraits shared with 삼국영지, extended for the complete PK roster. */
export function OfficerPortrait({ officer, state, size = 56, showName = false }: Props) {
  const faction = officer.faction ? state.factions[officer.faction] : null;
  const color = faction?.color ?? PALETTE.neutral;

  return (
    <span className="tk-officer-portrait inline-flex flex-col items-center gap-0.5">
      <span
        className="tk-portrait-art"
        style={{ ...officerPortraitStyle(officer.id), width: size, height: size, borderColor:color }}
        role="img"
        aria-label={`${officer.name} 초상`}
      />
      {showName && (
        <span className="text-[10px] font-semibold leading-none" style={{ fontFamily: HANJA_FONT }}>
          {officer.name}
        </span>
      )}
    </span>
  );
}
