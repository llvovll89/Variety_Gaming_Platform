import { FACTION_BLURBS, PLAYABLE_FACTIONS } from "../game/scenario";
import { createFactions } from "../game/scenario";
import { HANJA_FONT, PALETTE, SCENARIO_START } from "../game/constants";
import { hasSave } from "../game/save";
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
      className="h-full w-full overflow-y-auto px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]"
      style={{ background: PALETTE.paper, color: PALETTE.ink }}
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: HANJA_FONT }}>
              삼국지 패업
            </h1>
            <p className="mt-1 text-sm opacity-70">
              {SCENARIO_START.year}년 {SCENARIO_START.month}월 · 중원 쟁패
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

        {saved && (
          <button
            type="button"
            onClick={onResume}
            className="rounded-xl border px-4 py-3 text-left transition-transform hover:-translate-y-0.5"
            style={{ borderColor: PALETTE.seal, background: "rgba(163,50,38,0.08)" }}
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
                    style={{ background: faction.color, fontFamily: HANJA_FONT }}
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
