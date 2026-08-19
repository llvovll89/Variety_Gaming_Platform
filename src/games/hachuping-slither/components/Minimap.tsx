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
      className="pointer-events-none absolute bottom-3 right-3 rounded-lg shadow-lg sm:bottom-4 sm:right-4"
      style={{ width: SIZE, height: SIZE }}
    />
  );
}
