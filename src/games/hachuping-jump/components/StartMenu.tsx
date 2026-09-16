import CharacterPicker from "../../../shared/profile/CharacterPicker";
import type { Profile } from "../../../shared/profile/useProfile";
import { ITEMS, ITEM_ORDER } from "../game/items";
import { STAGES } from "../game/stages";

interface StartMenuProps {
  profile: Profile;
  bestScore: number;
  onStart: () => void;
}

export default function StartMenu({ profile, bestScore, onStart }: StartMenuProps) {
  return (
    <div className="absolute inset-0 flex flex-col items-center overflow-y-auto bg-linear-to-b from-[#bce4ee] via-[#f7e4ef] to-[#fff0d6] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-[max(3.5rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="motion-safe:animate-panel-in my-auto flex w-full shrink-0 max-w-md flex-col items-center gap-4 rounded-3xl border border-white bg-[#fffaf6]/95 p-6 text-center text-[#58415c] shadow-xl backdrop-blur-sm">
        <h1 className="text-2xl font-extrabold tracking-tight text-[#ad547e]">구름 위 별빛 점프</h1>
        <p className="text-sm text-[#857087]">
          탭하거나 스페이스바를 눌러 날아올라요. 사탕 구름 사이로 별을 모아볼까요?
        </p>
        {bestScore > 0 && <p className="-mt-2 text-xs text-[#857087]">최고 기록 {bestScore}</p>}

        <div className="w-full rounded-2xl bg-[#f8edf2] px-4 py-3 text-left text-xs leading-6 text-[#755d73]">
          <div>★ 황금별 <b>+10점</b> · 장애물 통과 <b>+1점</b></div>
          <div>장애물 8개마다 다음 세계로 · 클리어 <b>+100점</b></div>
          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 leading-4">
            {ITEM_ORDER.map(kind => <div key={kind}><b style={{ color: ITEMS[kind].color }}>{ITEMS[kind].symbol} {ITEMS[kind].name}</b><div className="text-[10px]">{ITEMS[kind].description}</div></div>)}
          </div>
        </div>
        <p className="text-xs leading-5 text-[#857087]">{STAGES.map(s => s.name).join(' → ')}</p>

        <CharacterPicker
          tone="light"
          defaultImage={profile.defaultCharacterImage}
          selectedId={profile.characterId}
          onSelect={profile.selectCharacter}
          customImage={profile.customImage}
          onUploadFile={profile.uploadPhoto}
        />

        <input
          value={profile.name}
          onChange={(e) => profile.setName(e.target.value.slice(0, 12))}
          placeholder="이름을 입력하세요"
          className="w-full rounded-xl border border-[#dfc8d4] bg-white px-3 py-2.5 text-center text-[#58415c] placeholder-[#a08b9a] outline-none focus:border-[#d779a6]"
        />
        <button
          onClick={onStart}
          className="w-full rounded-full bg-[#f4b8d1] px-6 py-3 text-base font-bold text-[#65394f] transition hover:brightness-105 active:scale-95"
        >
          시작하기
        </button>
      </div>
    </div>
  );
}
