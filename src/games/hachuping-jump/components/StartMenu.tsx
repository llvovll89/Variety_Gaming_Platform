import CharacterPicker from "../../../shared/profile/CharacterPicker";
import type { Profile } from "../../../shared/profile/useProfile";

interface StartMenuProps {
  profile: Profile;
  bestScore: number;
  onStart: () => void;
}

export default function StartMenu({ profile, bestScore, onStart }: StartMenuProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-y-auto bg-linear-to-b from-[#0e1a33] to-[#0b0e1a] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="motion-safe:animate-panel-in flex w-full max-w-md flex-col items-center gap-4 rounded-3xl border border-[#4fd8ff]/20 bg-black/40 p-7 text-center text-white shadow-[0_0_40px_-12px_rgba(79,216,255,0.4)] backdrop-blur-sm">
        <h1 className="text-2xl font-extrabold tracking-tight text-[#4fd8ff]">점프</h1>
        <p className="text-sm text-white/70">
          탭하거나 스페이스바를 눌러 날아올라요. 장애물에 부딪히지 않게 조심!
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
          className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-center text-white placeholder-white/40 outline-none focus:border-[#4fd8ff]"
        />
        <button
          onClick={onStart}
          className="w-full rounded-full bg-[#4fd8ff] px-6 py-3 text-base font-bold text-[#082033] transition hover:brightness-105 active:scale-95"
        >
          시작하기
        </button>
      </div>
    </div>
  );
}
