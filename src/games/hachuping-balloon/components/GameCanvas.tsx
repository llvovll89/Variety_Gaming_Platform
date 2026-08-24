import { useRef } from "react";
import { useBalloonEngine } from "../hooks/useBalloonEngine";
import type { BalloonEngine } from "../game/engine";

interface GameCanvasProps {
  characterImageUrl: string;
  bestScore: number;
  onReady: (engine: BalloonEngine) => void;
}

export default function GameCanvas({ characterImageUrl, bestScore, onReady }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useBalloonEngine(canvasRef, characterImageUrl, bestScore, onReady);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <canvas ref={canvasRef} className="block h-full w-full touch-none select-none" />
    </div>
  );
}
