import { useRef } from "react";
import { useDodgeEngine } from "../hooks/useDodgeEngine";
import type { DodgeEngine } from "../game/engine";

interface GameCanvasProps {
  characterImageUrl: string;
  bestScore: number;
  onDeath: (finalScore: number) => void;
  onReady: (engine: DodgeEngine) => void;
}

export default function GameCanvas({ characterImageUrl, bestScore, onDeath, onReady }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useDodgeEngine(canvasRef, characterImageUrl, bestScore, onDeath, onReady);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <canvas ref={canvasRef} className="block h-full w-full touch-none select-none" />
    </div>
  );
}
