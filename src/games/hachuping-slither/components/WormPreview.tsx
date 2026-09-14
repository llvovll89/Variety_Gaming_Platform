import { useEffect, useRef } from 'react';
import { drawCrystal, drawWorm } from '../game/models';
import { getBodyPaletteById } from '../game/bodyPalettes';

export default function WormPreview({ paletteId, imageUrl }: { paletteId: string; imageUrl: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!, c = canvas.getContext('2d');
    if (!c) return;
    const image = new Image(); image.src = imageUrl;
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
      c.fillStyle = '#06171c66'; c.beginPath(); c.ellipse(8, 109, 231, 70, 0, 0, Math.PI * 2); c.fill();
      const side = c.createLinearGradient(0, 35, 0, 104); side.addColorStop(0, '#526252'); side.addColorStop(1, '#192f2c');
      c.fillStyle = side; c.beginPath(); c.ellipse(0, 77, 222, 66, 0, 0, Math.PI * 2); c.fill();
      const top = c.createLinearGradient(-180, -30, 180, 110); top.addColorStop(0, '#526f5e'); top.addColorStop(1, '#263f39');
      c.fillStyle = top; c.beginPath(); c.ellipse(0, 56, 222, 66, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#b5d99c4d'; c.lineWidth = 1; c.stroke();
      c.beginPath(); c.ellipse(0, 56, 198, 52, 0, 0, Math.PI * 2); c.strokeStyle = '#b5d99c28'; c.stroke();
      const points = Array.from({ length: 46 }, (_, i) => {
        const t = i / 45;
        return { x: 142 - t * 306, y: Math.sin(t * Math.PI * 2.1 + .2) * 43 - 10 + Math.sin(time * 1.4 + t * 4) * 3 };
      });
      drawCrystal(c, -148, -112, 23, 45, time); drawCrystal(c, 185, -98, 16, 160, time); drawCrystal(c, 72, -132, 11, 45, time);
      drawWorm(c, points, 32, palette, 330, -.25, image); drawCrystal(c, -48, 92, 13, 45, time);
      if (!motion.matches) frame = requestAnimationFrame(draw);
    };
    const refresh = () => { cancelAnimationFrame(frame); draw(0); };
    const observer = new ResizeObserver(refresh); observer.observe(canvas);
    image.onload = refresh; motion.addEventListener('change', refresh); refresh();
    return () => { cancelAnimationFrame(frame); observer.disconnect(); motion.removeEventListener('change', refresh); image.onload = null; };
  }, [paletteId, imageUrl]);
  return <canvas ref={ref} className="slither-preview" role="img" aria-label="선택한 색상과 캐릭터가 적용된 입체 지렁이 미리보기" />;
}
