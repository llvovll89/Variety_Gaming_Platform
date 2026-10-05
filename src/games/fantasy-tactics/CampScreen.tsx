import { useEffect, useRef } from 'react';
import { CAMPS, type CampTopic } from './camp';
import { Battle, STAGES } from './game';
import { artReady, sprite } from './art';
import { Portrait } from './Portrait';
import type { Facing } from './animation';
import { PartyPanel } from './PartyPanel';
import { GrowthPanel } from './GrowthPanel';
import './camp.css';

const seats: { x: number; y: number; facing: Facing }[] = [
  { x: .30, y: .79, facing: 'ne' }, { x: .40, y: .57, facing: 'se' },
  { x: .60, y: .57, facing: 'sw' }, { x: .71, y: .79, facing: 'nw' },
];
export function CampScreen({ battle, revision, locked, onGear, onUpdate, onDepart, onSideQuest }: { battle: Battle; revision: number; locked: boolean; onGear: () => void; onUpdate: () => void; onDepart: () => void; onSideQuest: () => void }) {
  const camp = battle.camp!, content = CAMPS[battle.stage], next = STAGES[battle.stage + 1];
  const lines = camp.topic ? content.talks[camp.topic] : null, line = lines?.[camp.line];
  const heard = battle.roster.filter(u=>['arin','theo','ria','noah'].includes(u.id)).filter(u => camp.heard.includes(u.id as CampTopic)).length;
  const canvas = useRef<HTMLCanvasElement>(null), advance = useRef<HTMLButtonElement>(null), roster = useRef<HTMLElement>(null);
  useEffect(() => {
    const c = canvas.current?.getContext('2d'); if (!c) return;
    let active = true;
    const background = new Image();
    const loaded = new Promise<void>(resolve => { background.onload = () => resolve(); background.onerror = () => resolve(); });
    background.src = '/art/fantasy-tactics/camp.png';
    c.fillStyle = '#18253b'; c.fillRect(0,0,1120,747);
    void Promise.all([artReady, loaded]).then(() => {
      if (!active) return;
      if (battle.stage<2&&background.naturalWidth) c.drawImage(background,0,0,1120,747);
      else {
        c.fillStyle='#142a41';c.fillRect(0,0,1120,747);c.fillStyle='#dbe4c3';c.beginPath();c.arc(915,105,35,0,Math.PI*2);c.fill();
        for(let i=0;i<65;i++){c.fillStyle='#6ca3bb66';c.fillRect((i*137)%1120,210+(i*47)%380,40+i%25,2);}
        c.fillStyle=battle.stage===2?'#637565':'#705947';c.beginPath();c.moveTo(30,510);c.lineTo(580,270);c.lineTo(1090,525);c.lineTo(780,740);c.lineTo(300,740);c.closePath();c.fill();
        c.strokeStyle='#ad9771';c.lineWidth=3;for(let i=0;i<9;i++){c.beginPath();c.moveTo(95+i*70,540-i*20);c.lineTo(350+i*65,720-i*14);c.stroke();}
        c.fillStyle='#b0e7de';c.fillRect(553,510,14,45);c.fillStyle='#d6eec9';c.beginPath();c.arc(560,500,16,0,Math.PI*2);c.fill();
        c.strokeStyle='#92dcd7';c.beginPath();c.ellipse(560,550,45,16,0,0,Math.PI*2);c.stroke();
      }
      battle.roster.filter(u=>['arin','theo','ria','noah'].includes(u.id)).forEach((u,i) => { const p=seats[i]; sprite(c,u.role,p.x*1120,p.y*747,1.3,p.facing,'idle',0,!!u.promoted); });
    });
    return () => { active = false; };
  }, [battle, revision]);
  const talk = (topic: CampTopic) => { if (battle.talkCamp(topic)) { onUpdate(); requestAnimationFrame(() => advance.current?.focus({ preventScroll: true })); } };
  const nextLine = () => {
    const topic=camp.topic; battle.advanceCamp(); onUpdate();
    if (!camp.topic) requestAnimationFrame(() => (roster.current?.querySelector<HTMLButtonElement>(`button[data-topic="${topic}"]`) ?? roster.current?.querySelector<HTMLButtonElement>('button'))?.focus({ preventScroll: true }));
  };
  return <section className="ft-camp" aria-label={`${content.location} 캠프`} data-revision={revision} inert={locked}>
    <div className="ft-camp-heading"><div><span>제{battle.stage + 1}장 이후 · {content.location}</span><h1>{content.title}</h1></div><span>동료 대화 {heard} / 4</span></div>
    <div className="ft-camp-layout">
      <div className="ft-camp-scene">
        <div className="ft-camp-picture">
        <canvas ref={canvas} width={1120} height={747} aria-label={`${content.location}에서 휴식하는 아린, 테오, 리아와 노아`} role="img" />
        {battle.roster.filter(u=>['arin','theo','ria','noah'].includes(u.id)).map((u,i) => <button key={u.id} className="ft-camp-name" style={{ left: `${seats[i].x*100}%`, top: `${seats[i].y*100+1}%` }} onClick={() => talk(u.id as CampTopic)} aria-label={`${u.name} 대화하기`} aria-pressed={camp.topic===u.id}>{u.name}<small>{camp.heard.includes(u.id as CampTopic)?'대화 완료':'대화하기'}</small></button>)}
        </div>
        <div className="ft-camp-rest">휴식 완료 · 동료 모두 HP·MP 회복 · 회복약 {battle.potions}개</div>
      </div>
      <aside className="ft-camp-window">
        <h2>모닥불 옆 이야기</h2><button className="ft-secondary ft-camp-tools" onClick={onGear}>장비 정비 · 보유 {battle.inventory.length} / 24</button>
        <nav ref={roster} className="ft-camp-portraits" aria-label="대화할 동료">{battle.roster.filter(u=>['arin','theo','ria','noah'].includes(u.id)).map(u => <button key={u.id} data-topic={u.id} onClick={() => talk(u.id as CampTopic)} aria-label={`${u.name} 초상으로 대화`} aria-pressed={camp.topic===u.id}><Portrait promoted={u.promoted} role={u.role} /><span>{u.name}{camp.heard.includes(u.id as CampTopic)&&<small>✓</small>}</span></button>)}</nav>
        <div className="ft-camp-conversation" aria-live="polite" aria-atomic="true">
          {line ? <><div className="ft-camp-speaker"><Portrait role={line.role} promoted={battle.roster.filter(u=>['arin','theo','ria','noah'].includes(u.id)).find(u=>u.name===line.speaker)?.promoted}/><b>{line.speaker}</b></div><p>{line.text}</p><div className="ft-camp-next"><small>{camp.line+1} / {lines!.length}</small><button ref={advance} className="ft-primary" onClick={nextLine}>{camp.line===lines!.length-1?'대화 마치기':'다음 대화'}</button></div></> : <><p>불이 잦아들기 전에 동료와 이야기해 보세요.</p><span>대화를 다시 듣거나 바로 출발할 수 있습니다.</span></>}
        </div>
        <button className="ft-secondary" aria-expanded={camp.mapSeen} onClick={() => talk('route')}>다음 목적지 지도 펼치기</button>
        {camp.mapSeen && <section className="ft-camp-route" aria-label="다음 목적지 지도">
          <svg viewBox="0 0 300 72" role="img" aria-label={content.route}><path d="M25 45 Q75 4 145 40 T275 27" fill="none" stroke="#c5b783" strokeWidth="2" strokeDasharray="5 4"/><path d="m22 42 9-16 10 16zm112 6 12-22 14 22zm132-10v-19h13v19m-16-19 9-8 10 8" fill="#64766e" stroke="#e6d9a7"/><circle cx="31" cy="49" r="4" fill="#d5e5b3"/><circle cx="148" cy="51" r="4" fill="#f0ca73"/><circle cx="273" cy="43" r="4" fill="#a6b6d4"/></svg>
          <span>{content.route}</span><h3>제{battle.stage+2}장 · {next.name}</h3><p>{next.objective}</p><p className="ft-camp-advice">{content.advice}</p>
        </section>}
        <PartyPanel battle={battle} onUpdate={onUpdate}/><GrowthPanel battle={battle} onUpdate={onUpdate}/>{battle.stage<2&&<section className="ft-sidequest"><h3>외전 · 숲길의 작은 영웅들</h3><p>8턴 안에 주민 3명을 구출하세요. 보상: 동료 모두 EXP +{battle.stage===0?120:160}. 장비·성장 유지, 실패하면 재도전할 수 있어요.</p><button className="ft-secondary" disabled={battle.sideCompleted.includes(battle.stage)} onClick={onSideQuest}>{battle.sideCompleted.includes(battle.stage)?'주민 구출 완료':'주민 구출 작전 출발'}</button></section>}<button className="ft-primary ft-camp-depart" onClick={onDepart}>휴식을 마치고 제{battle.stage+2}장으로 출발</button>
        <small className="ft-camp-save">야영지와 대화 진행은 자동 저장됩니다.</small>
      </aside>
    </div>
  </section>;
}
