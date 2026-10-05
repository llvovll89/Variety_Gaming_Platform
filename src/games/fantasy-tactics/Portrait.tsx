import { useEffect, useRef } from 'react';
import type { Role } from './game';
import { artReady, portrait } from './art';

export function Portrait({ role, large = false, promoted = false }: { role: Role; large?: boolean; promoted?: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = canvas.current?.getContext('2d'); if (!c) return;
    const draw = () => { c.clearRect(0, 0, 120, 120); c.fillStyle = '#182149'; c.fillRect(0,0,120,120); portrait(c, role, promoted); };
    let active = true; draw(); void artReady.then(() => { if (active) draw(); });
    return () => { active = false; };
  }, [role, promoted]);
  return <canvas ref={canvas} width={120} height={120} className={`ft-portrait ${large ? 'ft-portrait-large' : ''}`} aria-hidden="true" />;
}
