import { useEffect, useState, type RefObject } from 'react';
import { WhackAMoleEngine } from '../game/engine';
import { MoleScene, type TargetPoint } from '../game/renderer';
import { MOLE_KEYS, type DifficultyLevel } from '../game/constants';

export function useWhackAMoleEngine(canvasRef: RefObject<HTMLCanvasElement | null>, bestScore: number,
  onGameOver: (score: number) => void, onReady: (engine: WhackAMoleEngine) => void, difficulty: DifficultyLevel) {
  const [targets,setTargets]=useState<TargetPoint[]>([]);
  const [error,setError]=useState(false);
  useEffect(()=> {
    const canvas=canvasRef.current; if(!canvas) return;
    let view: MoleScene;
    try {view=new MoleScene(canvas);} catch {setError(true); return;}
    const engine=new WhackAMoleEngine(bestScore,onGameOver,difficulty);
    const resize=()=> {const rect=canvas.getBoundingClientRect(); view.resize(rect.width,rect.height); view.render(engine.getGameState(),engine.getMoleHitFlashAlpha,0); setTargets(view.targets());};
    const observer=new ResizeObserver(resize); observer.observe(canvas); resize();
    let frame=0;
    const draw=(time:number)=> {view.render(engine.getGameState(),engine.getMoleHitFlashAlpha,time/1000); frame=requestAnimationFrame(draw);};
    frame=requestAnimationFrame(draw);
    const key=(e:KeyboardEvent)=> {
      if(e.repeat || e.altKey || e.ctrlKey || e.metaKey || (e.target instanceof HTMLElement && ['INPUT','TEXTAREA'].includes(e.target.tagName))) return;
      const id=MOLE_KEYS.indexOf(e.key.toLowerCase());
      if(id>=0) {e.preventDefault(); engine.hitMole(id);}
      if(e.key==='Escape' && ['ready','playing','paused'].includes(engine.getGameState().status)) {
        e.preventDefault();
        if(engine.getGameState().status==='paused') engine.resumeGame(); else engine.pauseGame();
      }
    };
    const visibility=()=> {if(document.hidden) engine.pauseGame();};
    const blur=()=>engine.pauseGame();
    window.addEventListener('keydown',key); window.addEventListener('blur',blur); document.addEventListener('visibilitychange',visibility);
    onReady(engine);
    return ()=> {observer.disconnect(); cancelAnimationFrame(frame); view.dispose(); engine.destroy(); window.removeEventListener('keydown',key); window.removeEventListener('blur',blur); document.removeEventListener('visibilitychange',visibility);};
    // A keyed canvas owns one session, including its initial score and callbacks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);
  return {targets,error};
}
