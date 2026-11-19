import { useRef } from "react";
import { useGameEngine } from "../hooks/useGameEngine";
import type { GameEngine } from "../game/engine";
import type { RunEnd } from "../game/types";

interface GameCanvasProps {
  playerName: string;
  characterImageUrl: string;
  bodyPaletteColors: string[];
  onDeath: (end: RunEnd) => void;
  onReady: (engine: GameEngine) => void;
  timeLimit?: number | null;
}

export default function GameCanvas({
  playerName,
  characterImageUrl,
  bodyPaletteColors,
  onDeath,
  onReady,
  timeLimit = null,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useGameEngine(canvasRef, playerName, characterImageUrl, bodyPaletteColors, onDeath, onReady, timeLimit);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <canvas ref={canvasRef} className="block h-full w-full touch-none select-none" />
    </div>
  );
}
