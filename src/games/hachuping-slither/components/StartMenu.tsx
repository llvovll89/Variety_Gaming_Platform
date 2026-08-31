import CharacterPicker from "../../../shared/profile/CharacterPicker";
import type { Profile } from "../../../shared/profile/useProfile";
import BodyColorPicker from "./BodyColorPicker";

interface StartMenuProps {
  profile: Profile;
  bodyPaletteId: string;
  onSelectBodyPalette: (id: string) => void;
  onStart: () => void;
}

export default function StartMenu({ profile, bodyPaletteId, onSelectBodyPalette, onStart }: StartMenuProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-y-auto bg-linear-to-b from-[#1a1030] to-[#0b0e1a] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="motion-safe:animate-panel-in flex w-full max-w-md flex-col items-center gap-4 rounded-3xl border border-pink-400/20 bg-black/40 p-7 text-center text-white shadow-[0_0_40px_-12px_rgba(236,72,153,0.4)] backdrop-blur-sm">
        <h1 className="text-2xl font-extrabold tracking-tight text-pink-300">슬리더</h1>
        <p className="text-sm text-white/70">
          별을 먹고 커지자! 마우스는 꾹 누르면 부스트, 모바일은 번개 버튼으로 부스트
        </p>

        <CharacterPicker
          selectedId={profile.characterId}
          onSelect={profile.selectCharacter}
          customImage={profile.customImage}
          onUploadFile={profile.uploadPhoto}
        />

        <BodyColorPicker selectedId={bodyPaletteId} onSelect={onSelectBodyPalette} />

        <input
          value={profile.name}
          onChange={(e) => profile.setName(e.target.value.slice(0, 12))}
          placeholder="이름을 입력하세요"
          className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-center text-white placeholder-white/40 outline-none focus:border-pink-400"
        />
        <button
          onClick={onStart}
          className="w-full rounded-full bg-pink-400 px-6 py-3 text-base font-bold text-[#1a1a1a] transition hover:brightness-105 active:scale-95"
        >
          시작하기
        </button>
      </div>
    </div>
  );
}
