import CharacterPicker from "../../../shared/profile/CharacterPicker";
import type { Profile } from "../../../shared/profile/useProfile";

interface StartMenuProps {
  profile: Profile;
  bestScore: number;
  onStart: () => void;
}

export default function StartMenu({ profile, bestScore, onStart }: StartMenuProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-linear-to-b from-[#bfe6ff] to-[#eaf7ff] px-4">
      <div className="motion-safe:animate-panel-in flex w-full max-w-md flex-col items-center gap-4 rounded-3xl bg-white/85 p-7 text-center shadow-[0_24px_60px_-12px_rgba(217,119,6,0.25)] backdrop-blur-sm">
        <h1 className="text-2xl font-extrabold tracking-tight text-[#d97706]">풍선 터뜨리기</h1>
        <p className="text-sm text-[#5b4630]">떠오르는 풍선을 톡톡 터치해서 터뜨려보아요!</p>
        {bestScore > 0 && <p className="-mt-2 text-xs text-[#8a7256]">최고 기록 {bestScore}</p>}

        <CharacterPicker
          selectedId={profile.characterId}
          onSelect={profile.selectCharacter}
          customImage={profile.customImage}
          onUploadFile={profile.uploadPhoto}
          tone="light"
        />

        <input
          value={profile.name}
          onChange={(e) => profile.setName(e.target.value.slice(0, 12))}
          placeholder="이름을 입력하세요"
          className="w-full rounded-xl border border-[#d97706]/30 bg-white px-3 py-2.5 text-center text-[#3a2a10] placeholder-[#b09a7a] outline-none focus:border-[#d97706]"
        />
        <button
          onClick={onStart}
          className="w-full rounded-full bg-[#ffb020] px-6 py-3 text-base font-bold text-[#3a2a10] transition hover:brightness-105 active:scale-95"
        >
          시작하기
        </button>
      </div>
    </div>
  );
}
