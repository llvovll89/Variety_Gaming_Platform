import { useCallback, useEffect, useRef, useState } from 'react';
import * as T from 'three';
import type { BattleReplay, BattleSide } from '../game/battleReplay';
import { box, disposeObject, mesh, officerModel } from '../game/models';
import { TACTICS, UNIT_TYPES } from '../game/constants';
import type { GameEngine } from '../game/engine';

const DURATION = 5600;
export const battleProgress = (elapsed: number) => Math.max(0, Math.min(1, elapsed / DURATION));

function Battlefield({ report, instant, onProgress }: { report: BattleReplay; instant: boolean; onProgress: (p: number) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const skip = useRef(instant); skip.current = instant;
  const [fallback, setFallback] = useState(false);
  useEffect(() => {
    const target = canvas.current; if (!target) return;
    let renderer: T.WebGLRenderer | null = null;
    const scene = new T.Scene(); scene.background = new T.Color('#202020'); scene.fog = new T.Fog('#202020', 16, 40);
    const camera = new T.PerspectiveCamera(36, 1, .1, 70);
    scene.add(new T.HemisphereLight('#ffffff', '#454545', 2.4));
    const light = new T.DirectionalLight('#ffffff', 3.4); light.position.set(-5, 8, 5); scene.add(light);
    mesh(scene, new T.CylinderGeometry(18, 18, .1, 48), '#454545', 0, -.1);
    for (let i = 0; i < 20; i++) box(scene, i % 2 ? '#535353' : '#4a4a4a', .035, .02, 30, i * 1.5 - 15, 0);
    const army = (side: BattleSide, facing: number) => {
      const g = new T.Group(); scene.add(g);
      if (side.type === 'city') {
        box(g, '#999999', 3.8, 2, .8, 0, 1);
        for (const x of [-1.7, 1.7]) { box(g, '#b1b1b1', .9, 2.9, 1, x, 1.45); mesh(g, new T.ConeGeometry(.9, .65, 4), '#383838', x, 3.2); }
        box(g, '#252525', 1, 1.5, .9, 0, .75);
      } else {
        if (side.officer) { const m = officerModel(side.officer, side.type === 'cavalry'); m.rotation.y = facing; g.add(m); }
        for (let i = 0; i < 8; i++) {
          const soldier = new T.Group(); soldier.position.set((i % 4 - 1.5) * .55, 0, -1.1 - Math.floor(i / 4) * .55);
          box(soldier, facing > 0 ? '#c3c3c3' : '#555555', .25, .65, .25, 0, .55);
          mesh(soldier, new T.SphereGeometry(.17, 8, 6), '#9b9b9b', 0, 1.02);
          box(soldier, '#d2d2d2', .025, 1.4, .025, .2, .8); g.add(soldier);
        }
      }
      return g;
    };
    const a = army(report.attacker, Math.PI / 2), b = army(report.defender, -Math.PI / 2);
    const projectiles = new T.Group(); scene.add(projectiles);
    for (let i = 0; i < 6; i++) box(projectiles, '#eeeeee', .8, .03, .03, 0, 1.2 + i * .1, (i - 3) * .23);
    const impact = mesh(scene, new T.SphereGeometry(.5, 10, 8), report.tactic === 'fire' ? '#e2a273' : '#eeeeee', 1.6, 1.4);
    try { renderer = new T.WebGLRenderer({ canvas: target, antialias: true }); renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); renderer.outputColorSpace = T.SRGBColorSpace; }
    catch { setFallback(true); }
    const resize = () => {
      const { width, height } = target.getBoundingClientRect();
      renderer?.setSize(width, height, false); camera.aspect = width / Math.max(1, height);
      camera.position.set(0, 4.6, camera.aspect < 1.3 ? 19 : 14); camera.lookAt(0, 1, 0); camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize); observer.observe(target); resize();
    const start = performance.now(); let raf = 0, lastUpdate = -100;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const frame = (now: number) => {
      const p = skip.current || reduced ? 1 : battleProgress(now - start);
      const approach = Math.min(1, p / .33), strike = Math.max(0, Math.min(1, (p - .33) / .28));
      const retreat = Math.max(0, (p - .7) / .3);
      const ranged = report.attacker.type === 'archer' || report.tactic === 'fire' || report.tactic === 'confuse';
      a.position.x = -4 + (ranged ? .3 : 2.8) * approach - retreat * .6;
      b.position.x = 3 + (report.displaced ? strike * 1.2 : 0);
      a.position.y = !reduced && p < .33 ? Math.abs(Math.sin(p * 100)) * .08 : 0;
      a.rotation.z = p > .33 && p < .56 && !ranged ? Math.sin(strike * Math.PI * 3) * -.12 : 0;
      b.rotation.z = p > .4 && p < .62 ? Math.sin(strike * Math.PI * 4) * .06 : 0;
      projectiles.visible = ranged && p > .3 && p < .6;
      projectiles.position.x = -3 + strike * 6;
      impact.visible = p > .44 && p < .58 && report.tacticLanded !== false;
      impact.scale.setScalar(.5 + Math.sin(strike * Math.PI) * .9);
      renderer?.render(scene, camera);
      if (now - lastUpdate > 70 || p === 1) { onProgress(p); lastUpdate = now; }
      if (p < 1) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); observer.disconnect(); disposeObject(scene); renderer?.dispose(); };
  }, [report, onProgress]);
  return <div className="tk-battle-stage"><canvas ref={canvas} aria-label="전투 장면 재생" />{fallback && <p className="tk-stage-fallback">3D 표시를 사용할 수 없어 전투 경과와 결과를 표시합니다.</p>}</div>;
}

export function BattlePlayback({ engine }: { engine: GameEngine }) {
  const scene = engine.getBattleScene()!;
  const [skip, setSkip] = useState(scene.instant);
  const [progress, setProgress] = useState(scene.instant ? 1 : 0);
  const dialog = useRef<HTMLDialogElement>(null);
  const update = useCallback((p: number) => setProgress(p), []);
  const finished = progress >= 1;
  useEffect(() => { dialog.current?.showModal(); }, []);
  const report = scene.report;
  const close = () => engine.closeBattleScene();
  const fastForward = () => { setSkip(true); setProgress(1); };
  const stage = finished ? '전투 종료' : progress < .3 ? '진군' : progress < .65 ? report.tactic ? TACTICS[report.tactic].label : '교전' : '전열 정비';
  const side = (s: BattleSide, label: string) => {
    const fraction = Math.max(0, Math.min(1, (progress - .38) / .3));
    const troops = Math.round(s.before + (s.after - s.before) * fraction);
    return <section className="tk-combatant"><small>{label} · {s.type === 'city' ? '도시 수비군' : UNIT_TYPES[s.type].label}</small><h3 title={s.name}>{s.name}</h3><strong>{troops.toLocaleString()} <small>명</small></strong><div className="tk-troop-track"><span style={{ width: `${troops / Math.max(1, s.before) * 100}%` }} /></div><p>{finished ? `전장 병력 감소 ${(s.before - s.after).toLocaleString()}` : `교전 전 ${s.before.toLocaleString()}`}{finished && s.after === 0 ? ' · 전장 이탈' : ''}</p>{s.wallBefore !== undefined && <p>성벽 {s.wallBefore.toLocaleString()} → {finished ? s.wallAfter?.toLocaleString() : '교전 중'}</p>}</section>;
  };
  return <dialog ref={dialog} className="tk-replay" aria-labelledby="tk-replay-title" onCancel={e => { e.preventDefault(); if (finished) close(); else fastForward(); }}>
    <header><div><small>BATTLE</small><h2 id="tk-replay-title">{report.attacker.name} <span>대</span> {report.defender.name}</h2></div><span className="tk-battle-phase" role="status">{stage}</span></header>
    <div className="tk-replay-body"><Battlefield report={report} instant={skip} onProgress={update} /><div className="tk-combatants">{side(report.attacker, '공격')}{side(report.defender, '방어')}</div><p className="tk-battle-description" aria-live="polite">{finished ? [report.tactic ? `${TACTICS[report.tactic].label} ${report.tacticLanded ? '성공' : '실패'}` : '일반 공격 완료', report.displaced ? '적 부대가 한 칸 밀려났습니다.' : '전투 결과가 지도에 반영되었습니다.'].join(' · ') : '전투가 진행 중입니다. 건너뛰어도 전투 결과는 같습니다.'}</p></div>
    <footer>{engine.getState().phase !== 'player' && <button onClick={() => engine.skipPlayback()}>이번 턴 모두 건너뛰기</button>}{finished ? <button className="tk-primary" onClick={close}>전장으로 돌아가기</button> : <button className="tk-primary" onClick={fastForward}>전투 건너뛰기 · SKIP</button>}</footer>
  </dialog>;
}
