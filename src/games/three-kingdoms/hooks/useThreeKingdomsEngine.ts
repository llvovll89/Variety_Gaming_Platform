import { useEffect, type RefObject } from "react";
import { GameEngine } from "../game/engine";
import type { FactionId } from "../game/types";

/**
 * Mounts the engine against a canvas and keeps it sized to its parent. Mirrors the
 * lifecycle hook the other games use, minus the auto-pause: a turn-based board has nothing
 * running in the background that losing focus could hurt.
 */
export function useThreeKingdomsEngine(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  playerFactionId: FactionId,
  onReady: (engine: GameEngine) => void,
): void {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new GameEngine(canvas, playerFactionId);
    onReady(engine);

    const resize = (): void => {
      const parent = canvas.parentElement;
      const width = parent?.clientWidth ?? window.innerWidth;
      const height = parent?.clientHeight ?? window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      engine.resize(width, height, dpr);
    };

    resize();
    engine.start();

    const observer = new ResizeObserver(resize);
    if (canvas.parentElement) observer.observe(canvas.parentElement);
    window.addEventListener("orientationchange", resize);

    return () => {
      observer.disconnect();
      window.removeEventListener("orientationchange", resize);
      engine.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerFactionId]);
}
