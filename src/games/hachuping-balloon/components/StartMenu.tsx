import { useState } from "react";
import CharacterPicker from "../../../shared/profile/CharacterPicker";
import type { Profile } from "../../../shared/profile/useProfile";
interface Props { profile: Profile; bestScore: number; onStart: () => void }
export default function StartMenu({ profile, bestScore, onStart }: Props) {
 const [customize, setCustomize] = useState(false);
 return <div className="balloon-menu">
 <div className="balloon-art"><img src="/art/hub/hachuping-balloon-large.jpg" alt="파란 하늘에 떠오르는 알록달록 풍선과 색종이" /></div>
 <section className="balloon-intro"><p className="balloon-round-note">작은 손으로 즐기는 60초</p>
 <h1>풍선<br />터뜨리기<span>톡, 톡, 팡!</span></h1>
 <p className="balloon-description">하늘 가득 떠오르는 풍선을 눌러보세요.<br />놓쳐도 괜찮아요. 또 올라오니까!</p>
 <button className="balloon-primary" onClick={onStart}>풍선 터뜨리러 가기</button>
 <div className="balloon-player"><img src={profile.characterImage} alt="" /><span>{profile.name}의 풍선 축제</span><button onClick={() => setCustomize(!customize)} aria-expanded={customize}>바꾸기</button></div>
 {customize && <div className="balloon-customize"><label>플레이어 이름<input value={profile.name} maxLength={12} onChange={e => profile.setName(e.target.value)} /></label>
 <CharacterPicker defaultImage={profile.defaultCharacterImage} selectedId={profile.characterId} onSelect={profile.selectCharacter} customImage={profile.customImage} onUploadFile={profile.uploadPhoto} tone="light" /></div>}
 <p className="balloon-best">내 최고 기록 <strong>{bestScore}</strong>개</p></section></div>;
}
