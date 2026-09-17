import { useEffect, useRef } from "react";
import { archetypeOf, drawPortrait } from "../game/portrait";
import { HANJA_FONT, PALETTE } from "../game/constants";
import type { GameState, Officer } from "../game/types";

interface Props {
  officer: Officer;
  state: GameState;
  /** Logical width in CSS pixels; height follows the 0.82 portrait aspect. */
  size?: number;
  showName?: boolean;
}

/** Portrait bust. Redraws only when the officer or the faction colour actually changes. */
export function OfficerPortrait({ officer, state, size = 56, showName = false }: Props) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const faction = officer.faction ? state.factions[officer.faction] : null;
  const color = faction?.color ?? PALETTE.neutral;
  const isLord = faction?.leaderId === officer.id;
  const h = Math.round(size / 0.82);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, h);
    drawPortrait(ctx, size, h, officer, color, archetypeOf(officer, isLord));
  }, [officer, color, isLord, size, h]);

  return (
    <span className="inline-flex flex-col items-center gap-0.5">
      <canvas
        ref={ref}
        style={{ width: size, height: h, borderRadius: 3 }}
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
