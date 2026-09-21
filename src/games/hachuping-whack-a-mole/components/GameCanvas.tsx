import { useRef } from 'react';
import { useWhackAMoleEngine } from '../hooks/useWhackAMoleEngine';
import { MOLE_KEYS, type DifficultyLevel } from '../game/constants';
import type { WhackAMoleEngine } from '../game/engine';
export default function GameCanvas({bestScore,onGameOver,onReady,difficulty,engine,activeMoles,onBack}: {
  bestScore:number; onGameOver:(score:number)=>void; onReady:(engine:WhackAMoleEngine)=>void;
  difficulty:DifficultyLevel; engine:WhackAMoleEngine|null; activeMoles:number[]; onBack:()=>void;
}) {
  const canvas=useRef<HTMLCanvasElement>(null);
  const {targets,error}=useWhackAMoleEngine(canvas,bestScore,onGameOver,onReady,difficulty);
  return <div className="mole-arena">
    <canvas ref={canvas} aria-hidden="true" />
    <div className="mole-targets" role="group" aria-label="두더지 게임판. Q W E, A S D, Z X C 키로도 칠 수 있습니다.">
      {targets.map(t=><button key={t.id} className="mole-target" aria-label={`${t.id+1}번 구멍${activeMoles.includes(t.id)?', 두더지 등장':''}`} data-active={activeMoles.includes(t.id)}
        style={{left:t.x,top:t.y,width:t.radius*2,height:t.radius*2}}
        onPointerDown={e=>{if(e.button!==0)return; e.preventDefault(); engine?.hitMole(t.id);}}
        onClick={e=>{if(e.detail===0)engine?.hitMole(t.id);}}><kbd>{MOLE_KEYS[t.id].toUpperCase()}</kbd>{(engine?.getMoleHitFlashAlpha(t.id)??0)>0&&<span className="mole-hit-label" aria-hidden="true">+10</span>}</button>)}
    </div>
    {error && <div className="mole-render-error" role="alert"><h2>게임 화면을 열지 못했어요</h2><p>브라우저의 하드웨어 가속을 켜고 다시 시도해 주세요.</p><button className="mole-primary" onClick={onBack}>메뉴로 돌아가기</button></div>}
  </div>;
}
