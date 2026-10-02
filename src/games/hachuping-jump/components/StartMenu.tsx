import { StarIcon } from '@phosphor-icons/react/dist/icons/Star';
import { PlayIcon } from '@phosphor-icons/react/dist/icons/Play';
import { CloudIcon } from '@phosphor-icons/react/dist/icons/Cloud';
import { TrophyIcon } from '@phosphor-icons/react/dist/icons/Trophy';
import CharacterPicker from '../../../shared/profile/CharacterPicker';
import type { Profile } from '../../../shared/profile/useProfile';
import { ITEMS, ITEM_ORDER } from '../game/items';
import { GATES_PER_STAGE, STAGES } from '../game/stages';
export default function StartMenu({ profile, bestScore, onStart }: { profile: Profile; bestScore: number; onStart: () => void }) {
  return <div className="jump-menu"><div className="jump-menu-layout">
    <section className="jump-world" aria-label="별빛 점프의 구름 세계">
      <div className="jump-world-copy"><h1>구름 위<br/>별빛 점프</h1><p>폭신한 구름 사이로, 별을 모으는 작은 모험.</p></div>
      <div className="jump-toy" key={profile.characterId}><span className="jump-toy-wing jump-toy-wing-left"/><span className="jump-toy-wing jump-toy-wing-right"/><div className="jump-toy-body"><img src={profile.characterImage} alt="선택한 모험 친구"/></div><span className="jump-toy-shadow"/></div>
      <div className="jump-world-caption"><CloudIcon weight="fill" size={20}/>6개의 세계에서 만나는 작은 행복</div>
    </section>
    <section className="jump-preparation" aria-labelledby="jump-ready-title">
      <div className="jump-preparation-heading"><div><h2 id="jump-ready-title">함께 날아볼까요?</h2><p>오늘의 모험 친구를 골라주세요.</p></div><StarIcon size={32} weight="duotone"/></div>
      <div className="jump-character-picker"><CharacterPicker tone="light" defaultImage={profile.defaultCharacterImage} selectedId={profile.characterId} onSelect={profile.selectCharacter} customImage={profile.customImage} onUploadFile={profile.uploadPhoto}/></div>
      <label className="jump-name-label" htmlFor="jump-name">친구 이름</label><input id="jump-name" value={profile.name} onChange={e => profile.setName(e.target.value.slice(0,12))} maxLength={12} placeholder="이름을 입력하세요" className="jump-name"/>
      <div className="jump-how"><span><kbd>Space</kbd> 또는 화면 탭</span><b>누를 때마다 폴짝!</b><p>사탕 문을 피하고 황금별을 모아요.</p></div>
      <button onClick={onStart} className="jump-button jump-button-primary"><PlayIcon size={19} weight="fill"/>시작하기</button>
      <div className="jump-record"><TrophyIcon size={18} weight="duotone"/><span>최고 기록</span><b>{bestScore.toLocaleString()}점</b></div>
      <details className="jump-guide"><summary>모험 안내와 아이템</summary><div className="jump-guide-content"><p>황금별 +10점 / 관문 통과 +1점<br/>관문 {GATES_PER_STAGE}개마다 다음 세계로, 클리어 +100점</p><div className="jump-items">{ITEM_ORDER.map(kind => <div key={kind}><b>{ITEMS[kind].symbol} {ITEMS[kind].name}</b><p>{ITEMS[kind].description}</p></div>)}</div><p>약 4~5분의 여행</p><ol>{STAGES.map(s => <li key={s.name}>{s.name}</li>)}</ol></div></details>
    </section>
  </div></div>;
}
