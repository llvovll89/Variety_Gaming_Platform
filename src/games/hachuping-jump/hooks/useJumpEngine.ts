import { useEffect, type RefObject } from "react";
import { JumpEngine } from "../game/engine";

export function useJumpEngine(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  characterImageUrl: string,
  bestScore: number,
  onDeath: (finalScore: number) => void,
  onReady: (engine: JumpEngine) => void,
): void {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new JumpEngine(canvas, characterImageUrl, bestScore, onDeath);
    onReady(engine);

    const resize = (): void => {
      const parent = canvas.parentElement;
      const width = parent?.clientWidth ?? window.innerWidth;
      const height = parent?.clientHeight ?? window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      engine.resize(width, height, dpr);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("orientationchange", resize);

    // Auto-pause when the tab/window loses focus, so stepping away doesn't get the
    // player killed while unattended.
    const onVisibilityChange = (): void => {
      if (document.hidden) engine.pause();
    };
    const onBlur = (): void => engine.pause();
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onBlur);

    engine.start();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("orientationchange", resize);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onBlur);
      engine.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
