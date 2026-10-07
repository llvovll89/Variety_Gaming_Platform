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
      <canvas ref={canvasRef} tabIndex={0} aria-label="풍선 놀이 공간. 풍선을 터치하세요. 키보드는 방향키로 조준하고 스페이스 또는 엔터로 터뜨립니다." className="block h-full w-full touch-none select-none" />
    </div>
  );
}
