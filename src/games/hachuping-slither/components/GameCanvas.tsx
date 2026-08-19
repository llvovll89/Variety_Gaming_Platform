import { useRef } from "react";
import { useGameEngine } from "../hooks/useGameEngine";
import type { GameEngine } from "../game/engine";

interface GameCanvasProps {
  playerName: string;
  characterImageUrl: string;
  onDeath: (finalScore: number) => void;
  onReady: (engine: GameEngine) => void;
}

export default function GameCanvas({
  playerName,
  characterImageUrl,
  onDeath,
  onReady,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useGameEngine(canvasRef, playerName, characterImageUrl, onDeath, onReady);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <canvas ref={canvasRef} className="block h-full w-full touch-none select-none" />
    </div>
  );
}
