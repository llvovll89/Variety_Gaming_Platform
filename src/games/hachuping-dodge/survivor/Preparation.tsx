import { useEffect, useRef, useState } from 'react';
import { drawUnit } from './render';
import { DIFFICULTIES, HEROES, TINTS, WEAPONS, type Difficulty, type Hero, type Loadout, type Tint, type Weapon } from './world';
import { ADVANCE_LEVELS, MAX_LEVEL, HERO_STATS, PATHS, type Promotion } from './classes';
import { HERO_VISUALS, heroWeaponName } from './heroVisuals';
import './preparation.css';
import { ArrowLeftIcon, CheckIcon, SwordIcon, CrosshairIcon, ArrowRightIcon } from '@phosphor-icons/react';

export function Portrait({loadout,appearance}: {loadout:Loadout;appearance?:Promotion}) {
  const ref=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{const c=ref.current?.getContext('2d');if(!c)return;c.clearRect(0,0,720,600);drawUnit(c,'hero',310,395,5.2,0,-.22,2,loadout,appearance);},[loadout.hero,loadout.weapon,loadout.tint,appearance?.id]);
  return <canvas ref={ref} width={720} height={600} className="survivor-portrait" role="img" aria-label={`${appearance?.name??HEROES[loadout.hero]} · ${heroWeaponName(loadout)} 외형 미리보기`}/>;
}
interface Props { loadout:Loadout; difficulty:Difficulty; best:number; onSelect:(change:Partial<Loadout>)=>void; onDifficulty:(difficulty:Difficulty)=>void; onStart:()=>void; onExit:()=>void }
export default function Preparation({loadout,difficulty,best,onSelect,onDifficulty,onStart,onExit}:Props) {
  const [tab,setTab]=useState<'hero'|'weapon'>('hero');
  const hero=HERO_STATS[loadout.hero],visual=HERO_VISUALS[loadout.hero];
  const paths=Object.values(PATHS).filter(path=>path.hero===loadout.hero);
  return <div className="survivor-preparation" style={{'--hero-color':visual.color} as React.CSSProperties}>
    <nav className="survivor-nav"><button onClick={onExit}><ArrowLeftIcon size={16}/> 게임 허브</button><span>룬 레인저</span><small>원정 준비</small></nav>
    <header className="prep-heading"><h1>유적의 문이 열렸다.</h1><p>영웅과 무기를 골라, 여섯 지역을 되찾으세요.</p></header>
    <div className="prep-workbench">
      <section className="prep-picker" aria-label="캐릭터와 무기 선택">
        <div className="prep-tabs" role="tablist" aria-label="선택 종류" onKeyDown={e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const next=e.key==='Home'?'hero':e.key==='End'?'weapon':tab==='hero'?'weapon':'hero';setTab(next);document.getElementById(`${next}-tab`)?.focus();}}>
          <button id="hero-tab" role="tab" tabIndex={tab==='hero'?0:-1} aria-selected={tab==='hero'} aria-controls="hero-panel" onClick={()=>setTab('hero')}><CrosshairIcon size={17}/> 영웅</button>
          <button id="weapon-tab" role="tab" tabIndex={tab==='weapon'?0:-1} aria-selected={tab==='weapon'} aria-controls="weapon-panel" onClick={()=>setTab('weapon')}><SwordIcon size={17}/> 무기</button>
        </div>
        <div id="hero-panel" role="tabpanel" aria-labelledby="hero-tab" hidden={tab!=='hero'}>
          <div className="prep-heroes">{(Object.keys(HEROES) as Hero[]).map(key=><button key={key} aria-pressed={loadout.hero===key} onClick={()=>onSelect({hero:key,weapon:HERO_STATS[key].weapon})}><Portrait loadout={{...loadout,hero:key,weapon:HERO_STATS[key].weapon}}/><strong>{HEROES[key]}</strong><small>{HERO_VISUALS[key].role}</small></button>)}</div>
          <fieldset className="prep-tints"><legend>장비 장식색</legend>{(Object.keys(TINTS) as Tint[]).map((tint,i)=><button key={tint} aria-label={['영웅 고유색','금색 장식','자주색 장식','적갈색 장식'][i]} aria-pressed={loadout.tint===tint} style={{background:[visual.cloth,'#9b8050','#72617f','#926554'][i]}} onClick={()=>onSelect({tint})}>{loadout.tint===tint?<CheckIcon size={15} weight="bold"/>:null}</button>)}<small>영웅을 선택하면 숙련 무기를 장착합니다.</small></fieldset>
        </div>
        <div id="weapon-panel" role="tabpanel" aria-labelledby="weapon-tab" hidden={tab!=='weapon'}>
          <div className="prep-weapons">{(Object.keys(WEAPONS) as Weapon[]).map(weapon=><button key={weapon} aria-pressed={loadout.weapon===weapon} onClick={()=>onSelect({weapon})}><strong>{heroWeaponName({...loadout,weapon})}{hero.weapon===weapon&&<em>숙련 무기</em>}</strong><p>{WEAPONS[weapon].description}</p><small>{WEAPONS[weapon].name} 계열<br/>사거리 {WEAPONS[weapon].range} · 피해 ×{WEAPONS[weapon].damage} · 공격 간격 ×{WEAPONS[weapon].interval}</small></button>)}</div>
          <p className="prep-note">모든 캐릭터가 모든 무기를 사용할 수 있습니다. 숙련 무기는 고유 보너스를 받습니다.</p>
        </div>
      </section>
      <section className="prep-showcase" aria-label="선택한 영웅 외형">
        <div className="prep-showcase-model"><Portrait loadout={loadout}/></div>
        <div className="prep-model-caption"><h2>{HEROES[loadout.hero]}</h2><p>{heroWeaponName(loadout)}</p><span className="prep-hero-effect">{visual.effect}</span></div>
      </section>
      <aside className="prep-detail" aria-label="선택한 캐릭터 특성과 전직">
        <h2 className="prep-detail-title">원정 장비</h2>
        <div className="prep-stats"><span>체력 <b>{hero.hp}</b></span><span>공격 <b>{hero.damage}</b></span><span>이동 <b>{hero.speed}</b></span></div>
        <p className="prep-trait">{hero.trait}</p><p className={`prep-synergy ${hero.weapon===loadout.weapon?'active':''}`}>{hero.weapon===loadout.weapon?'적용 중':'숙련 조합'} · {hero.synergy}</p>
        <div className="prep-careers"><h3>전직 계열 <span>레벨 {ADVANCE_LEVELS.join(' / ')}</span></h3>{paths.map(path=><div key={path.names[0]}><strong>{path.names[0]}</strong><small>{path.skill} · {path.description}</small><span>{path.names.slice(1).join(' → ')}</span></div>)}<p>첫 전직에서 계열을 선택합니다. 이후 강습 또는 수호로 성장하며, 최대 {MAX_LEVEL}레벨까지 강화할 수 있습니다.</p></div>
      </aside>
    </div>
    <footer className="prep-launch"><div><fieldset className="prep-difficulty"><legend>난이도</legend>{(Object.keys(DIFFICULTIES) as Difficulty[]).map(key=><button key={key} aria-pressed={difficulty===key} onClick={()=>onDifficulty(key)}>{DIFFICULTIES[key].name}</button>)}</fieldset><small>{DIFFICULTIES[difficulty].description} · 최고 {best} 처치</small></div><button className="survivor-primary" onClick={onStart}>원정 시작 <ArrowRightIcon size={20}/></button><p><kbd>WASD</kbd> / 방향키 / 터치로 이동<span>자동 공격</span><kbd>P</kbd> 일시정지</p></footer>
  </div>;
}
