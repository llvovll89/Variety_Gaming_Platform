import { useEffect, useRef, useState } from 'react';
import { MoleScene } from '../game/renderer';
export default function MolePreview() {
  const canvas=useRef<HTMLCanvasElement>(null);
  const [failed,setFailed]=useState(false);
  useEffect(()=> {
    const element=canvas.current;
    if(!element)return;
    let view:MoleScene;
    try{view=new MoleScene(element,true);}catch{setFailed(true);return;}
    let disposed=false;
    const resize=()=>{if(disposed)return;const r=element.getBoundingClientRect();view.resize(r.width,r.height);};
    const observer=new ResizeObserver(resize);observer.observe(element);resize();
    let frame=0;const draw=(t:number)=>{view.render(null,()=>0,t/1000);frame=requestAnimationFrame(draw);};frame=requestAnimationFrame(draw);
    return()=>{disposed=true;observer.disconnect();cancelAnimationFrame(frame);view.dispose();};
  },[]);
  return <div className="mole-preview"><canvas ref={canvas} role="img" aria-label="오렌지 안전모를 쓴 두더지 세 마리가 민트색 3D 게임판에서 고개를 내밀고 있어요"/>{failed&&<p>3D 미리보기를 불러올 수 없어요. 하드웨어 가속을 확인해 주세요.</p>}</div>;
}
