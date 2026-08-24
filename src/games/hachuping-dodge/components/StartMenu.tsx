import CharacterPicker from "../../../shared/profile/CharacterPicker";
import type { Profile } from "../../../shared/profile/useProfile";

interface StartMenuProps {
  profile: Profile;
  bestScore: number;
  onStart: () => void;
}

export default function StartMenu({ profile, bestScore, onStart }: StartMenuProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-linear-to-b from-[#0a0612] to-black px-4">
      <div className="motion-safe:animate-panel-in flex w-full max-w-md flex-col items-center gap-4 rounded-3xl border border-[#c084fc]/20 bg-black/40 p-7 text-center text-white shadow-[0_0_40px_-12px_rgba(192,132,252,0.4)] backdrop-blur-sm">
        <h1 className="text-2xl font-extrabold tracking-tight text-[#c084fc]">오브 피하기</h1>
        <p className="text-sm text-white/70">
          드래그하거나 방향키(WASD)로 움직여서 날아오는 에너지 오브를 피하세요!
        </p>
        {bestScore > 0 && <p className="-mt-2 text-xs text-white/50">최고 기록 {bestScore}</p>}

        <CharacterPicker
          selectedId={profile.characterId}
          onSelect={profile.selectCharacter}
          customImage={profile.customImage}
          onUploadFile={profile.uploadPhoto}
        />

        <input
          value={profile.name}
          onChange={(e) => profile.setName(e.target.value.slice(0, 12))}
          placeholder="이름을 입력하세요"
          className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-center text-white placeholder-white/40 outline-none focus:border-[#c084fc]"
        />
        <button
          onClick={onStart}
          className="w-full rounded-full bg-[#c084fc] px-6 py-3 text-base font-bold text-[#1c1033] transition hover:brightness-105 active:scale-95"
        >
          시작하기
        </button>
      </div>
    </div>
  );
}
