import CharacterPicker from "../../../shared/profile/CharacterPicker";
import type { Profile } from "../../../shared/profile/useProfile";
import BodyColorPicker from "./BodyColorPicker";
import WormPreview from './WormPreview';
import { ArrowRightIcon } from '@phosphor-icons/react/dist/icons/ArrowRight';
import { ArrowLeftIcon } from '@phosphor-icons/react/dist/icons/ArrowLeft';
import { getBodyPaletteById } from '../game/bodyPalettes';

interface StartMenuProps {
  profile: Profile;
  bodyPaletteId: string;
  onSelectBodyPalette: (id: string) => void;
  onStart: () => void;
  onExit: () => void;
}
export default function StartMenu({ profile, bodyPaletteId, onSelectBodyPalette, onStart, onExit }: StartMenuProps) {
  return <div className="slither-menu">
    <nav className="slither-nav"><button onClick={onExit}><ArrowLeftIcon size={15} /> 게임 허브</button><span>별 수집 서바이벌 RPG</span></nav>
    <main className="slither-intro">
      <div className="slither-copy">
        <span className="slither-kicker">SLITHER</span>
        <h1>슬리더<span>작은 별 하나,<br />더 커다란 나.</span></h1>
        <p>별을 모아 자라고, 나만의 능력을 키우세요.<br />빛나는 정원에서 가장 긴 생존자가 되어보세요.</p>
        <label className="slither-name" htmlFor="slither-name">플레이어 이름</label>
        <input id="slither-name" value={profile.name} onChange={e => profile.setName(e.target.value.slice(0, 12))} placeholder="이름을 입력하세요" maxLength={12} />
        <button className="slither-primary slither-start" onClick={onStart}>정원으로 출발 <ArrowRightIcon size={21} /></button>
        <div className="slither-controls"><span>마우스 / 터치로 방향 조절</span><span>마우스 꾹 누르기 / 번개 버튼으로 부스트</span></div>
      </div>
      <section className="slither-showcase" aria-label="캐릭터 꾸미기">
        <WormPreview paletteId={bodyPaletteId} imageUrl={profile.characterImage} />
        <div className="slither-preview-caption"><strong>{getBodyPaletteById(bodyPaletteId).name}</strong><span>나만의 별 수집가</span></div>
        <BodyColorPicker selectedId={bodyPaletteId} onSelect={onSelectBodyPalette} />
        <details className="slither-character-picker"><summary>얼굴 꾸미기 <span>캐릭터 또는 내 사진</span></summary>
          <CharacterPicker defaultImage={profile.defaultCharacterImage} selectedId={profile.characterId} onSelect={profile.selectCharacter} customImage={profile.customImage} onUploadFile={profile.uploadPhoto} />
        </details>
      </section>
    </main>
    <div className="slither-guide" role="region" aria-label="게임 방법"><div><strong>별을 모으세요</strong><p>황금 별과 민트 별이 길이와 경험치가 됩니다.</p></div><div><strong>능력을 선택하세요</strong><p>레벨업마다 기동력, 수집 범위, 부스트 효율 강화.</p></div><div><strong>끝까지 살아남으세요</strong><p>몸통과 경계에 부딪히지 않도록 조심하세요.</p></div></div>
    <footer className="slither-footer"><span>별 수집 → 레벨업 → 능력 강화</span><span>매 게임 LV.1부터 시작 · 최대 LV.20</span></footer>
  </div>;
}
