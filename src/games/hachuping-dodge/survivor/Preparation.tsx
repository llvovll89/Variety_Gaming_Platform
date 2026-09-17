import { useEffect, useRef, useState } from 'react';
import { drawUnit } from './render';
import { DIFFICULTIES, HEROES, TINTS, WEAPONS, type Difficulty, type Hero, type Loadout, type Tint, type Weapon } from './world';
import { ADVANCE_LEVELS, MAX_LEVEL, HERO_STATS, PATHS, type Promotion } from './classes';
import './preparation.css';

export function Portrait({loadout,appearance}: {loadout:Loadout;appearance?:Promotion}) {
  const ref=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{const c=ref.current?.getContext('2d');if(!c)return;c.clearRect(0,0,360,300);drawUnit(c,'hero',160,205,2.7,0,-.3,2,loadout,appearance);},[loadout.hero,loadout.weapon,loadout.tint,appearance?.id]);
  return <canvas ref={ref} width={360} height={300} className="survivor-portrait" role="img" aria-label={`${appearance?.name??HEROES[loadout.hero]} · ${WEAPONS[loadout.weapon].name} 외형 미리보기`}/>;
}
interface Props { loadout:Loadout; difficulty:Difficulty; best:number; onSelect:(change:Partial<Loadout>)=>void; onDifficulty:(difficulty:Difficulty)=>void; onStart:()=>void; onExit:()=>void }
export default function Preparation({loadout,difficulty,best,onSelect,onDifficulty,onStart,onExit}:Props) {
  const [tab,setTab]=useState<'hero'|'weapon'>('hero');
  const hero=HERO_STATS[loadout.hero];
  const paths=Object.values(PATHS).filter(path=>path.hero===loadout.hero);
  return <div className="survivor-preparation">
    <nav className="survivor-nav"><button onClick={onExit}>← 게임 허브</button><span>RUNE RANGER · 원정 준비</span></nav>
    <header className="prep-heading"><h1>어떤 영웅으로 싸울까요?</h1><p>최대 {MAX_LEVEL}레벨 · 세 번의 전직 · 단계마다 진화하는 외형</p></header>
    <div className="prep-workbench">
      <section className="prep-picker" aria-label="캐릭터와 무기 선택">
        <div className="prep-tabs" role="tablist" aria-label="선택 종류">
          <button id="hero-tab" role="tab" aria-selected={tab==='hero'} aria-controls="hero-panel" onClick={()=>setTab('hero')}>01 캐릭터</button>
          <button id="weapon-tab" role="tab" aria-selected={tab==='weapon'} aria-controls="weapon-panel" onClick={()=>setTab('weapon')}>02 무기 · {WEAPONS[loadout.weapon].name}</button>
        </div>
        <div id="hero-panel" role="tabpanel" aria-labelledby="hero-tab" hidden={tab!=='hero'}>
          <div className="prep-heroes">{(Object.keys(HEROES) as Hero[]).map(key=><button key={key} aria-pressed={loadout.hero===key} onClick={()=>onSelect({hero:key})}><Portrait loadout={{...loadout,hero:key}}/><strong>{HEROES[key]}</strong><small>{key==='ranger'?'기동 · 정밀 사격':key==='knight'?'방어 · 근접 전투':key==='witch'?'마력 · 광역 제어':'연사 · 기계 지원'}</small></button>)}</div>
          <fieldset className="prep-tints"><legend>의상 색상</legend>{(Object.keys(TINTS) as Tint[]).map((tint,i)=><button key={tint} aria-label={['민트','골드','바이올렛','코랄'][i]} aria-pressed={loadout.tint===tint} style={{background:TINTS[tint]}} onClick={()=>onSelect({tint})}>{loadout.tint===tint?'✓':''}</button>)}<small>색상은 능력치에 영향을 주지 않습니다.</small></fieldset>
        </div>
        <div id="weapon-panel" role="tabpanel" aria-labelledby="weapon-tab" hidden={tab!=='weapon'}>
          <div className="prep-weapons">{(Object.keys(WEAPONS) as Weapon[]).map(weapon=><button key={weapon} aria-pressed={loadout.weapon===weapon} onClick={()=>onSelect({weapon})}><strong>{WEAPONS[weapon].name}{hero.weapon===weapon&&<em>숙련 무기</em>}</strong><p>{WEAPONS[weapon].description}</p><small>사거리 {WEAPONS[weapon].range} · 피해 ×{WEAPONS[weapon].damage} · 공격 간격 ×{WEAPONS[weapon].interval}</small></button>)}</div>
          <p className="prep-note">모든 캐릭터가 모든 무기를 사용할 수 있습니다. 숙련 무기는 고유 보너스를 받습니다.</p>
        </div>
      </section>
      <aside className="prep-detail" aria-label="선택한 캐릭터 특성과 전직">
        <div className="prep-identity"><Portrait loadout={loadout}/><div><span>YOUR HERO</span><h2>{HEROES[loadout.hero]}</h2><p>{WEAPONS[loadout.weapon].name}</p></div></div>
        <div className="prep-stats"><span>체력 <b>{hero.hp}</b></span><span>공격 <b>{hero.damage}</b></span><span>이동 <b>{hero.speed}</b></span></div>
        <p className="prep-trait">{hero.trait}</p><p className={`prep-synergy ${hero.weapon===loadout.weapon?'active':''}`}>{hero.weapon===loadout.weapon?'적용 중':'숙련 조합'} · {hero.synergy}</p>
        <div className="prep-careers"><h3>전직 로드맵 <span>LV {ADVANCE_LEVELS.join(' → ')}</span></h3>{paths.map(path=><div key={path.names[0]}><strong>{path.names.join(' → ')}</strong><small>{path.skill} · {path.description}</small></div>)}<p>1차에서 계열 선택 · 2·3차에서 강습 / 수호 선택<br/>직업 스킬 자동 발동 · 기본 무기와 함께 사용</p></div>
      </aside>
    </div>
    <footer className="prep-launch"><div><fieldset className="prep-difficulty"><legend>난이도</legend>{(Object.keys(DIFFICULTIES) as Difficulty[]).map(key=><button key={key} aria-pressed={difficulty===key} onClick={()=>onDifficulty(key)}>{DIFFICULTIES[key].name}</button>)}</fieldset><small>{DIFFICULTIES[difficulty].description} · 최고 {best} 처치</small></div><button className="survivor-primary" onClick={onStart}>원정 시작 <span>→</span></button><p>WASD / 방향키 / 터치 이동 · 자동 공격 · P 일시정지</p></footer>
  </div>;
}
