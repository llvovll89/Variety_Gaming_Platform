import { useEffect, useRef } from 'react';
import { drawCrystal, drawWorm } from '../game/models';
import { getBodyPaletteById } from '../game/bodyPalettes';

export default function WormPreview({ paletteId, imageUrl }: { paletteId: string; imageUrl: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!, c = canvas.getContext('2d');
    if (!c) return;
    const image = new Image(); if (imageUrl) image.src = imageUrl;
    const palette = getBodyPaletteById(paletteId).colors;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    const draw = (now: number) => {
      const width = canvas.clientWidth, height = canvas.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
        canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      }
      c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, width, height);
      const scale = Math.min(width / 560, height / 400);
      c.translate(width / 2, height / 2); c.scale(scale, scale);
      const time = motion.matches ? 0 : now / 1000;
      const points = Array.from({ length: 46 }, (_, i) => {
        const t = i / 45;
        return { x: 142 - t * 306, y: Math.sin(t * Math.PI * 2.1 + .2) * 43 - 10 + Math.sin(time * 1.4 + t * 4) * 3 };
      });
      drawCrystal(c, -148, -112, 23, 45, time); drawCrystal(c, 185, -98, 16, 160, time); drawCrystal(c, 72, -132, 11, 45, time);
      drawWorm(c, points, 25, palette, 60, -.25, imageUrl ? image : null); drawCrystal(c, -48, 92, 6, 280, time);
      if (!motion.matches) frame = requestAnimationFrame(draw);
    };
    const refresh = () => { cancelAnimationFrame(frame); draw(0); };
    const observer = new ResizeObserver(refresh); observer.observe(canvas);
    image.onload = refresh; motion.addEventListener('change', refresh); refresh();
    return () => { cancelAnimationFrame(frame); observer.disconnect(); motion.removeEventListener('change', refresh); image.onload = null; };
  }, [paletteId, imageUrl]);
  return <canvas ref={ref} className="slither-preview" role="img" aria-label="선택한 색상과 캐릭터가 적용된 입체 지렁이 미리보기" />;
}
