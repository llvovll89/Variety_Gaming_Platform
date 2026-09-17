import { HANJA_FONT, PALETTE } from "../game/constants";
import type { UISnapshot } from "../game/types";

interface Props {
  snapshot: UISnapshot;
  onEndTurn: () => void;
  onExit: () => void;
}

const MONTH_HANJA = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二"];

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex items-baseline gap-1">
      <span className="text-[11px] opacity-60">{label}</span>
      {/* The global `* { transition }` rule cross-fades every changing number; turn it off
          here so monthly figures snap instead of smearing. */}
      <span className="text-sm font-semibold tabular-nums" style={{ transition: "none" }}>
        {value}
      </span>
    </span>
  );
}

export function TopBar({ snapshot, onEndTurn, onExit }: Props) {
  const p = snapshot.player;
  return (
    <div
      className="pointer-events-auto flex flex-wrap items-center gap-x-4 gap-y-1 border-b px-3 py-2 pt-[max(0.5rem,env(safe-area-inset-top))]"
      style={{ background: "rgba(240,230,210,0.94)", borderColor: PALETTE.inkSoft, color: PALETTE.ink }}
    >
      <span className="flex items-center gap-2">
        <span
          className="flex h-7 w-7 items-center justify-center rounded text-xs font-bold text-white"
          style={{ background: p?.color ?? PALETTE.neutral, fontFamily: HANJA_FONT }}
        >
          {p?.name.slice(0, 1) ?? "—"}
        </span>
        <span className="text-sm font-semibold">{p?.name ?? ""}</span>
      </span>

      <span className="text-sm font-semibold tabular-nums" style={{ fontFamily: HANJA_FONT, transition: "none" }}>
        {snapshot.year}년 {MONTH_HANJA[snapshot.month]}월
      </span>

      <Stat label="금" value={(p?.gold ?? 0).toLocaleString()} />
      <Stat label="병량" value={(p?.food ?? 0).toLocaleString()} />
      <Stat label="도시" value={String(p?.cities ?? 0)} />
      <Stat label="부대" value={String(p?.units ?? 0)} />
      <Stat label="무장" value={String(p?.officers ?? 0)} />

      <span className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={onEndTurn}
          disabled={snapshot.busy}
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-transform disabled:opacity-40 enabled:hover:-translate-y-px"
          style={{ background: PALETTE.seal }}
        >
          턴 종료
        </button>
        <button
          type="button"
          onClick={onExit}
          className="rounded-lg border px-3 py-1 text-xs transition-colors hover:bg-black/5"
          style={{ borderColor: PALETTE.inkSoft }}
        >
          나가기
        </button>
      </span>
    </div>
  );
}
