import { useCallback, useRef } from "react";
import { LightningIcon } from "@phosphor-icons/react/dist/icons/Lightning";
import type { GameEngine } from "../game/engine";

interface BoostButtonProps {
  engine: GameEngine;
  canBoost: boolean;
}

/**
 * Press-and-hold boost control for touch devices. Steering already happens via
 * drag-anywhere-on-canvas (see input.ts), so boost needs its own hit target rather than
 * piggybacking on the steering touch — otherwise every move drains score.
 */
export default function BoostButton({ engine, canBoost }: BoostButtonProps) {
  const pointerIdRef = useRef<number | null>(null);

  const start = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      pointerIdRef.current = e.pointerId;
      e.currentTarget.setPointerCapture?.(e.pointerId);
      engine.setBoosting(true);
    },
    [engine],
  );

  const end = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (pointerIdRef.current !== null && e.pointerId !== pointerIdRef.current) return;
      pointerIdRef.current = null;
      engine.setBoosting(false);
    },
    [engine],
  );

  return (
    <button
      onPointerDown={start}
      onPointerUp={end}
      onPointerCancel={end}
      onPointerLeave={end}
      onContextMenu={(e) => e.preventDefault()}
      aria-label="부스트"
      className="absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-[max(1rem,env(safe-area-inset-left))] z-10 flex h-16 w-16 touch-none select-none items-center justify-center rounded-full text-white transition active:scale-90 sm:h-20 sm:w-20"
      style={{
        background: canBoost
          ? "linear-gradient(135deg, rgba(236,72,153,0.9), rgba(219,39,119,0.75))"
          : "rgba(255,255,255,0.08)",
        border: canBoost ? "2px solid rgba(255,255,255,0.5)" : "1.5px solid rgba(255,255,255,0.15)",
        boxShadow: canBoost ? "0 0 24px rgba(236,72,153,0.6)" : "none",
        opacity: canBoost ? 1 : 0.5,
      }}
    >
      <LightningIcon size={30} weight="fill" />
    </button>
  );
}
