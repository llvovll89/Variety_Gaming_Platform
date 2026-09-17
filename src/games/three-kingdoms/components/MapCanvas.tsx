import { useCallback, useRef } from "react";
import { useThreeKingdomsEngine } from "../hooks/useThreeKingdomsEngine";
import type { GameEngine } from "../game/engine";
import type { FactionId } from "../game/types";

interface Props {
  playerFactionId: FactionId;
  onReady: (engine: GameEngine) => void;
}

/**
 * The board. Pointer Events only, and every game object is painted into the canvas rather
 * than mounted as DOM, which is how the rest of the arcade does hit-testing too.
 */
export function MapCanvas({ playerFactionId, onReady }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const ready = useCallback(
    (engine: GameEngine) => {
      engineRef.current = engine;
      onReady(engine);
    },
    [onReady],
  );

  useThreeKingdomsEngine(canvasRef, playerFactionId, ready);

  const local = (e: { clientX: number; clientY: number }): { x: number; y: number } => {
    const rect = canvasRef.current?.getBoundingClientRect();
    return { x: e.clientX - (rect?.left ?? 0), y: e.clientY - (rect?.top ?? 0) };
  };

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full touch-none select-none"
      aria-label="중원 지도. 도시나 부대를 눌러 선택하고, 끌어서 이동하며, 두 손가락으로 확대합니다."
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        engineRef.current?.pointerDown(e.pointerId, local(e));
      }}
      onPointerMove={(e) => engineRef.current?.pointerMove(e.pointerId, local(e))}
      onPointerUp={(e) => engineRef.current?.pointerUp(e.pointerId)}
      onPointerCancel={(e) => engineRef.current?.pointerCancel(e.pointerId)}
      onLostPointerCapture={(e) => engineRef.current?.pointerCancel(e.pointerId)}
      onPointerLeave={() => engineRef.current?.pointerLeave()}
      onWheel={(e) => engineRef.current?.wheel(e.deltaY, local(e))}
    />
  );
}
