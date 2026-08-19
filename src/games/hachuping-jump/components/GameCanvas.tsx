import { useRef } from "react";
import { useJumpEngine } from "../hooks/useJumpEngine";
import type { JumpEngine } from "../game/engine";

interface GameCanvasProps {
  characterImageUrl: string;
  bestScore: number;
  onDeath: (finalScore: number) => void;
  onReady: (engine: JumpEngine) => void;
}

export default function GameCanvas({ characterImageUrl, bestScore, onDeath, onReady }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useJumpEngine(canvasRef, characterImageUrl, bestScore, onDeath, onReady);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <canvas ref={canvasRef} className="block h-full w-full touch-none select-none" />
    </div>
  );
}
