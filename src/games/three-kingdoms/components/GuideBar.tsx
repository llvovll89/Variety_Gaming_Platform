import { useState } from "react";
import { adviceFor, currentObjective, type Advice } from "../game/advice";
import { PALETTE } from "../game/constants";
import type { GameState } from "../game/types";
import type { HexCoord } from "../game/hex";

interface Props {
  state: GameState;
  onFocus: (hex: HexCoord) => void;
  /** Bumped by the engine snapshot so the advice recomputes after every action. */
  revision: number;
}

const TONE: Record<Advice["tone"], { color: string; mark: string }> = {
  danger: { color: "#a33226", mark: "급" },
  action: { color: "#1f4e79", mark: "행" },
  growth: { color: "#1f5c3a", mark: "정" },
  done: { color: "#6b6357", mark: "완" },
};

/**
 * Objective plus the single most useful next move, always visible. This is the difference
 * between opening the game and knowing what it wants from you, and opening the game and
 * staring at twelve cities.
 */
export function GuideBar({ state, onFocus, revision }: Props) {
  const [open, setOpen] = useState(false);
  // revision is only here to force a recompute; reading it keeps the dependency honest.
  void revision;

  const objective = currentObjective(state);
  const advice = adviceFor(state, 4);
  const top = advice[0];
  if (!top) return null;
  const tone = TONE[top.tone];

  return (
    <div
      className="pointer-events-auto border-b text-xs"
      style={{ background: "rgba(244,237,222,0.96)", borderColor: PALETTE.inkFaint, color: PALETTE.ink }}
    >
      <div className="flex items-center gap-2 px-3 py-1.5">
        <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold text-white" style={{ background: tone.color }}>
          {tone.mark}
        </span>
        <button
          type="button"
          onClick={() => top.focus && onFocus(top.focus)}
          disabled={!top.focus}
          className="min-w-0 flex-1 truncate text-left font-semibold disabled:cursor-default"
          style={{ color: tone.color }}
        >
          {top.text}
        </button>
        <span className="shrink-0 tabular-nums opacity-55" style={{ transition: "none" }}>
          성 {objective.owned}/{objective.total}
        </span>
        {advice.length > 1 && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="shrink-0 rounded border px-1.5 py-0.5 text-[10px]"
            style={{ borderColor: PALETTE.inkSoft }}
          >
            {open ? "접기" : `할 일 ${advice.length}`}
          </button>
        )}
      </div>

      {open && (
        <ul className="border-t px-3 py-1" style={{ borderColor: PALETTE.inkFaint }}>
          {advice.slice(1).map((a, i) => (
            <li key={i} className="py-0.5">
              <button
                type="button"
                onClick={() => a.focus && onFocus(a.focus)}
                disabled={!a.focus}
                className="text-left disabled:cursor-default"
                style={{ color: TONE[a.tone].color }}
              >
                {a.text}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
