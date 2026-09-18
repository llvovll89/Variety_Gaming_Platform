import { useEffect, useRef, useState } from 'react';
import * as T from 'three';
import { disposeObject, officerModel } from '../game/models';
import type { Officer } from '../game/types';

export function OfficerModelView({ officer }: { officer: Officer }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    let renderer: T.WebGLRenderer;
    try { renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true }); }
    catch { setFailed(true); return; }
    const scene = new T.Scene();
    const model = officerModel(officer); scene.add(model);
    scene.add(new T.HemisphereLight('#ecf1f0', '#625c4f', 2.8));
    const light = new T.DirectionalLight('#fff0d8', 3.3); light.position.set(-3, 5, 4); scene.add(light);
    const camera = new T.PerspectiveCamera(35, 1, 0.1, 50); camera.position.set(0, 1.8, 6.8); camera.lookAt(0, 1.4, 0);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
    renderer.outputColorSpace = T.SRGBColorSpace;
    let yaw = -0.35, dragging = false, last = 0;
    const draw = () => { model.rotation.y = yaw; renderer.render(scene, camera); };
    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      renderer.setSize(width, height, false); camera.aspect = width / Math.max(1, height); camera.updateProjectionMatrix(); draw();
    };
    const down = (e: PointerEvent) => { dragging = true; last = e.clientX; canvas.setPointerCapture(e.pointerId); };
    const move = (e: PointerEvent) => { if (dragging) { yaw += (e.clientX - last) * 0.015; last = e.clientX; draw(); } };
    const up = () => { dragging = false; };
    const key = (e: KeyboardEvent) => { if (['ArrowLeft', 'ArrowRight'].includes(e.key)) { e.preventDefault(); yaw += e.key === 'ArrowLeft' ? -0.2 : 0.2; draw(); } };
    canvas.addEventListener('pointerdown', down); canvas.addEventListener('pointermove', move); canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up); canvas.addEventListener('keydown', key);
    const observer = new ResizeObserver(resize); observer.observe(canvas); resize();
    return () => { observer.disconnect(); canvas.removeEventListener('pointerdown', down); canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerup', up); canvas.removeEventListener('pointercancel', up); canvas.removeEventListener('keydown', key); disposeObject(model); renderer.dispose(); };
  }, [officer]);
  return <div className="tk-model-view">{failed ? <p>이 기기에서는 3D 미리보기를 사용할 수 없습니다.</p> : <canvas ref={ref} tabIndex={0} aria-label={`${officer.name} 3D 모델. 드래그 또는 좌우 방향키로 회전`} />}<span>드래그 / ← → 회전</span></div>;
}
