import { useEffect, type RefObject } from "react";
import { WhackAMoleEngine } from "../game/engine";
import { computeLetterboxTransform, renderWhackAMole, getHitMoleFromPoint } from "../game/renderer";
import type { DifficultyLevel } from "../game/constants";

export function useWhackAMoleEngine(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  bestScore: number,
  onGameOver: (finalScore: number) => void,
  onReady: (engine: WhackAMoleEngine) => void,
  difficulty: DifficultyLevel,
): void {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new WhackAMoleEngine(bestScore, onGameOver, difficulty);
    onReady(engine);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle canvas resize
    const resize = (): void => {
      const parent = canvas.parentElement;
      const width = parent?.clientWidth ?? window.innerWidth;
      const height = parent?.clientHeight ?? window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      // Render initial state
      const transform = computeLetterboxTransform(width, height);
      renderWhackAMole(ctx, transform, engine.getGameState(), (moleId) => engine.getMoleHitFlashAlpha(moleId));
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("orientationchange", resize);

    // Handle canvas clicks to hit moles
    const handleClick = (e: MouseEvent): void => {
      const rect = canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;

      // Account for device pixel ratio
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const transform = computeLetterboxTransform(canvas.width / dpr, canvas.height / dpr);

      const moleId = getHitMoleFromPoint(transform, screenX, screenY, engine.getGameState());
      if (moleId !== null) {
        engine.hitMole(moleId);
      }
    };

    canvas.addEventListener("click", handleClick);

    // Handle touch for mobile
    const handleTouch = (e: TouchEvent): void => {
      e.preventDefault();
      for (const touch of e.touches) {
        const rect = canvas.getBoundingClientRect();
        const screenX = touch.clientX - rect.left;
        const screenY = touch.clientY - rect.top;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const transform = computeLetterboxTransform(canvas.width / dpr, canvas.height / dpr);

        const moleId = getHitMoleFromPoint(transform, screenX, screenY, engine.getGameState());
        if (moleId !== null) {
          engine.hitMole(moleId);
        }
      }
    };

    canvas.addEventListener("touchstart", handleTouch, { passive: false });

    // Auto-pause when tab loses focus
    const onVisibilityChange = (): void => {
      if (document.hidden) engine.pauseGame();
    };
    const onBlur = (): void => engine.pauseGame();
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onBlur);

    // Subscribe to UI updates for re-rendering
    const unsubscribe = engine.uiStore.subscribe(() => {
      if (canvas.width && canvas.height) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const width = canvas.width / dpr;
        const height = canvas.height / dpr;
        const transform = computeLetterboxTransform(width, height);
        renderWhackAMole(ctx, transform, engine.getGameState(), (moleId) => engine.getMoleHitFlashAlpha(moleId));
      }
    });

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("orientationchange", resize);
      canvas.removeEventListener("click", handleClick);
      canvas.removeEventListener("touchstart", handleTouch);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onBlur);
      unsubscribe();
      engine.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
