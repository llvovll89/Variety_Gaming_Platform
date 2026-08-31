import { useEffect, useRef } from "react";
import { drawMinimap } from "../game/minimapRenderer";
import type { UISnapshot } from "../game/types";

const SIZE = 140;

interface MinimapProps {
  minimap: UISnapshot["minimap"];
}

export default function Minimap({ minimap }: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    drawMinimap(ctx, minimap, SIZE);
  }, [minimap]);

  return (
    <canvas
      ref={canvasRef}
      width={SIZE}
      height={SIZE}
      className="pointer-events-none absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] right-[max(0.75rem,env(safe-area-inset-right))] rounded-lg shadow-lg sm:bottom-[max(1rem,env(safe-area-inset-bottom))] sm:right-[max(1rem,env(safe-area-inset-right))]"
      style={{ width: SIZE, height: SIZE }}
    />
  );
}
