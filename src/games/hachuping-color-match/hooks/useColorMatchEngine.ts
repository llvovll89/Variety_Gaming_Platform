import { useEffect, type RefObject } from "react";
import { ColorMatchEngine } from "../game/engine";
import { computeLetterboxTransform, renderColorMatch, getHitOptionFromPoint } from "../game/renderer";
import type { DifficultyLevel } from "../game/constants";

export function useColorMatchEngine(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  bestScore: number,
  onGameOver: (finalScore: number) => void,
  onReady: (engine: ColorMatchEngine) => void,
  difficulty: DifficultyLevel,
): void {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new ColorMatchEngine(bestScore, onGameOver, difficulty);
    onReady(engine);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = (): void => {
      const parent = canvas.parentElement;
      const width = parent?.clientWidth ?? window.innerWidth;
      const height = parent?.clientHeight ?? window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      const transform = computeLetterboxTransform(width, height);
      renderColorMatch(ctx, transform, engine.getGameState(), (id) => engine.getOptionFlashAlpha(id));
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("orientationchange", resize);

    const handleClick = (e: MouseEvent): void => {
      const rect = canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const transform = computeLetterboxTransform(canvas.width / dpr, canvas.height / dpr);

      const optionId = getHitOptionFromPoint(transform, screenX, screenY, engine.getGameState());
      if (optionId !== null) {
        engine.selectOption(optionId);
      }
    };

    canvas.addEventListener("click", handleClick);

    const handleTouch = (e: TouchEvent): void => {
      e.preventDefault();
      const touch = e.changedTouches[0];
      if (!touch) return;

      const rect = canvas.getBoundingClientRect();
      const screenX = touch.clientX - rect.left;
      const screenY = touch.clientY - rect.top;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const transform = computeLetterboxTransform(canvas.width / dpr, canvas.height / dpr);

      const optionId = getHitOptionFromPoint(transform, screenX, screenY, engine.getGameState());
      if (optionId !== null) {
        engine.selectOption(optionId);
      }
    };

    canvas.addEventListener("touchstart", handleTouch, { passive: false });

    const onVisibilityChange = (): void => {
      if (document.hidden) engine.pauseGame();
    };
    const onBlur = (): void => engine.pauseGame();
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onBlur);

    const unsubscribe = engine.uiStore.subscribe(() => {
      if (canvas.width && canvas.height) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const width = canvas.width / dpr;
        const height = canvas.height / dpr;
        const transform = computeLetterboxTransform(width, height);
        renderColorMatch(ctx, transform, engine.getGameState(), (id) => engine.getOptionFlashAlpha(id));
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
