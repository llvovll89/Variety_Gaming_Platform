import { FACTION_BLURBS, PLAYABLE_FACTIONS } from "../game/scenario";
import { createFactions } from "../game/scenario";
import { HANJA_FONT, PALETTE, SCENARIO_START } from "../game/constants";
import { hasSave } from "../game/save";
import { OFFICER_COUNT } from '../game/officers';
import type { FactionId } from "../game/types";

interface Props {
  onStart: (factionId: FactionId) => void;
  onResume: () => void;
  onExit: () => void;
}

const FACTIONS = createFactions("liubei");

/** Faction choice IS the difficulty setting, so the card says so rather than hiding it. */
export function StartMenu({ onStart, onResume, onExit }: Props) {
  const saved = hasSave();
  return (
    <div
      className="tk-start h-full w-full overflow-y-auto px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]"
      style={{ background: PALETTE.paper, color: PALETTE.ink }}
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: HANJA_FONT }}>
              삼국지 패업 PK
            </h1>
            <p className="mt-1 text-sm opacity-70">
              {SCENARIO_START.year}년 {SCENARIO_START.month}월 · 중원 쟁패 · POWER UP KIT
            </p>
          </div>
          <button
            type="button"
            onClick={onExit}
            className="rounded-lg border px-3 py-1.5 text-sm transition-colors hover:bg-black/5"
            style={{ borderColor: PALETTE.inkSoft }}
          >
            나가기
          </button>
        </header>

        <p className="text-sm leading-relaxed opacity-80">
          동탁이 죽고 천하는 갈라졌다. 여포가 복양을 차지하고 조조는 견성에서 연주를 되찾으려 한다.
          유비는 갓 서주를 물려받았고, 황하 건너에는 원소가 있다. 도시를 키우고 부대를 내보내
          중원을 통일하라.
        </p>
        <div className="border-y py-4 text-sm leading-7" style={{ borderColor: PALETTE.inkSoft }}>
          회전 가능한 3D 전장 · {OFFICER_COUNT}명의 장수 · 개별 3D 외형<br />
          10일 단위 진행 · 창병 돌출과 기병 돌격 · PK 장수 / 신장수 편집
          <p className="mt-2 text-xs opacity-60">194년 지도를 무대로 여러 시대의 영웅이 함께 등장하는 가상 시나리오입니다. 편집은 시작 후 상단의 ‘PK 장수 편집’에서 이용할 수 있습니다.</p>
        </div>

        {saved && (
          <button
            type="button"
            onClick={onResume}
            className="rounded-xl border px-4 py-3 text-left transition-transform hover:-translate-y-0.5"
            style={{ borderColor: PALETTE.seal, background: "rgba(24,24,24,0.08)" }}
          >
            <span className="block text-sm font-semibold">이어하기</span>
            <span className="block text-xs opacity-65">저장된 국면에서 계속합니다.</span>
          </button>
        )}

        <div>
          <h2 className="mb-3 text-sm font-semibold opacity-70">세력을 고르시오. 세력이 곧 난이도다.</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {PLAYABLE_FACTIONS.map((id) => {
              const faction = FACTIONS[id];
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onStart(id)}
                  className="group flex items-start gap-3 rounded-xl border p-3 text-left transition-transform hover:-translate-y-0.5"
                  style={{ borderColor: PALETTE.inkSoft, background: "rgba(255,255,255,0.35)" }}
                >
                  <span
                    className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-lg font-bold text-white"
                    style={{ background: PALETTE.ink, fontFamily: HANJA_FONT }}
                  >
                    {faction.hanja[0]}
                  </span>
                  <span className="flex flex-col gap-0.5">
                    <span className="font-semibold">{faction.name}</span>
                    <span className="text-xs leading-snug opacity-70">{FACTION_BLURBS[id]}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
