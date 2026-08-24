import { useRef, useEffect, useCallback } from "react";
import type { MemoryGameEngine } from "../game/engine";
import { MemoryGameRenderer } from "../game/renderer";

interface GameCanvasProps {
  engine: MemoryGameEngine | null;
  onReady: (engine: MemoryGameEngine) => void;
}

export default function GameCanvas({ engine, onReady }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<MemoryGameRenderer | null>(null);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!canvasRef.current || !engine || !rendererRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const cardIndex = rendererRef.current.getCardAt(x, y);
      if (cardIndex !== null && cardIndex < engine.uiStore.getSnapshot().gameState.cards.length) {
        engine.playerClickCard(cardIndex);
      }
    },
    [engine]
  );

  useEffect(() => {
    if (!canvasRef.current || !engine) return;

    if (!rendererRef.current) {
      rendererRef.current = new MemoryGameRenderer(canvasRef.current);
      onReady(engine);
    }

    const animate = () => {
      rendererRef.current?.render(engine.uiStore.getSnapshot().gameState);
      requestAnimationFrame(animate);
    };

    const animationId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationId);
  }, [engine, onReady]);

  return (
    <canvas
      ref={canvasRef}
      onClick={handleCanvasClick}
      width={600}
      height={700}
      style={{
        backgroundColor: "#fff9f5",
        borderRadius: "20px",
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
        maxWidth: "600px",
        height: "auto",
        cursor: "pointer",
        border: "3px solid #f0f0f0",
        transition: "box-shadow 0.3s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 12px 32px rgba(0, 0, 0, 0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.12)";
      }}
    />
  );
}
