import { useRef } from "react";
import { useColorMatchEngine } from "../hooks/useColorMatchEngine";
import type { ColorMatchEngine } from "../game/engine";
import type { DifficultyLevel } from "../game/constants";

interface GameCanvasProps {
  bestScore: number;
  onGameOver: (finalScore: number) => void;
  onReady: (engine: ColorMatchEngine) => void;
  difficulty: DifficultyLevel;
}

export default function GameCanvas({ bestScore, onGameOver, onReady, difficulty }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useColorMatchEngine(canvasRef, bestScore, onGameOver, onReady, difficulty);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <canvas ref={canvasRef} className="block h-full w-full touch-none select-none" />
    </div>
  );
}
