import {useEffect,useRef,useState} from 'react';
import { Minus, Plus } from '@phosphor-icons/react';
import {MovingScene} from './scene';
import {LEVELS,type State,type Point} from './engine';
import Room from './FallbackRoom';
export default function ThreeRoom({state,onPossess,onPoint,onCargo,preview=false}:{state:State;onPossess?:(id:string)=>void;onPoint?:(p:Point)=>void;onCargo?:(id:string)=>void;preview?:boolean}) {
  const host=useRef<HTMLDivElement>(null),scene=useRef<MovingScene|null>(null),select=useRef(onPossess),point=useRef(onPoint),cargo=useRef(onCargo),[failed,setFailed]=useState(false),[zoom,setZoom]=useState(1);select.current=onPossess;point.current=onPoint;cargo.current=onCargo;
  useEffect(()=>{if(!host.current)return;try{const next=new MovingScene(host.current,state,id=>select.current?.(id),p=>point.current?.(p),id=>cargo.current?.(id));scene.current=next;setFailed(false);setZoom(1);return()=>{next.dispose();scene.current=null;};}catch{setFailed(true);}},[state.levelIndex]);
  useEffect(()=>{scene.current?.sync(state);},[state]);
  const change=(delta:number)=>{const next=Math.max(.8,Math.min(1.5,zoom+delta));setZoom(next);if(scene.current){scene.current.zoom=next;scene.current.resize();}};
  if(failed)return <Room state={state} onPossess={onPossess} onPoint={onPoint} onCargo={onCargo} preview={preview}/>;
  return <div className={`gm-three-room${preview?' gm-three-preview':''}`}><div ref={host} className="gm-canvas-host" role="img" aria-label={`${LEVELS[state.levelIndex].name}의 3D 이사 현장. 빙의할 가구는 아래 목록에서도 선택할 수 있어요.`}/>{!preview&&<div className="gm-zoom"><button aria-label="방 축소" disabled={zoom<=.8} onClick={()=>change(-.1)}><Minus size={17}/></button><span>{Math.round(zoom*100)}%</span><button aria-label="방 확대" disabled={zoom>=1.5} onClick={()=>change(.1)}><Plus size={17}/></button></div>}</div>;
}
