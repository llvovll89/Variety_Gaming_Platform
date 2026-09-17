import { useMemo, useState } from "react";
import { HANJA_FONT, PALETTE, UNIT_TYPES } from "../game/constants";
import { dispatchCost, validateDispatch } from "../game/commands";
import { officersInCity } from "../game/state";
import type { GameEngine } from "../game/engine";
import type { City, GameState, OfficerId, UnitType } from "../game/types";

interface Props {
  engine: GameEngine;
  state: GameState;
  city: City;
  onClose: () => void;
}

const TYPES: UnitType[] = ["spear", "cavalry", "archer"];

/** 출진 editor. Shows the bill before it is paid, so nothing is a surprise. */
export function DispatchDialog({ engine, state, city, onClose }: Props) {
  const roster = officersInCity(state, city.id).filter((o) => o.duty === "idle");
  const [picked, setPicked] = useState<OfficerId[]>(() => roster.slice(0, 1).map((o) => o.id));
  const [type, setType] = useState<UnitType>("spear");
  const [troops, setTroops] = useState(() => Math.min(5000, Math.max(1000, Math.round(city.troops / 2))));
  const [problem, setProblem] = useState<string | null>(null);

  const cost = useMemo(() => dispatchCost(troops), [troops]);
  const check = useMemo(
    () => validateDispatch(state, { cityId: city.id, officerIds: picked, type, troops }),
    [state, city.id, picked, type, troops],
  );

  const maxTroops = Math.max(1000, city.troops);

  const toggle = (id: OfficerId): void => {
    setProblem(null);
    setPicked((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= 3 ? prev : [...prev, id],
    );
  };

  const send = (): void => {
    const result = engine.sendOut({ cityId: city.id, officerIds: picked, type, troops });
    if (result.ok) onClose();
    else setProblem(result.reason ?? "출진할 수 없습니다.");
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="출진 편성"
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      style={{ background: "rgba(58,50,38,0.45)" }}
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border p-4 sm:rounded-2xl"
        style={{ background: PALETTE.paper, borderColor: PALETTE.inkSoft, color: PALETTE.ink }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-1 text-base font-bold" style={{ fontFamily: HANJA_FONT }}>
          {city.name} 출진
        </h2>
        <p className="mb-3 text-[11px] opacity-60">
          출진한 부대는 이동력 절반으로 나갑니다. 병량 {dispatchCost(1000).food}씩 1,000명당 들고 갑니다.
        </p>

        <p className="mb-1 text-[11px] opacity-60">대장과 부장 (최대 3명, 첫 번째가 대장)</p>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {roster.map((o) => {
            const on = picked.includes(o.id);
            const rank = picked.indexOf(o.id);
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => toggle(o.id)}
                aria-pressed={on}
                className="flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs"
                style={{
                  borderColor: on ? PALETTE.seal : PALETTE.inkSoft,
                  background: on ? "rgba(163,50,38,0.12)" : "transparent",
                }}
              >
                <span className="font-semibold">{o.name}</span>
                {rank === 0 && <span className="text-[10px]" style={{ color: PALETTE.seal }}>대장</span>}
                <span className="text-[10px] tabular-nums opacity-60">
                  통{o.lead} 무{o.war} 지{o.int}
                </span>
              </button>
            );
          })}
          {roster.length === 0 && <span className="text-xs opacity-60">출진할 무장이 없습니다.</span>}
        </div>

        <p className="mb-1 text-[11px] opacity-60">병종</p>
        <div className="mb-3 grid grid-cols-3 gap-1.5">
          {TYPES.map((t) => {
            const spec = UNIT_TYPES[t];
            const on = type === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                aria-pressed={on}
                className="flex flex-col items-center rounded-lg border px-2 py-1.5 text-xs"
                style={{
                  borderColor: on ? PALETTE.seal : PALETTE.inkSoft,
                  background: on ? "rgba(163,50,38,0.12)" : "transparent",
                }}
              >
                <span className="text-base font-bold" style={{ fontFamily: HANJA_FONT }}>{spec.hanja}</span>
                <span className="font-semibold">{spec.label}</span>
                <span className="text-[10px] opacity-60">
                  이동 {spec.moves} · 사거리 {spec.range}
                </span>
              </button>
            );
          })}
        </div>

        <label className="mb-1 flex items-center justify-between text-[11px] opacity-60">
          <span>병력</span>
          <span className="tabular-nums" style={{ transition: "none" }}>
            {troops.toLocaleString()} / {city.troops.toLocaleString()}
          </span>
        </label>
        <input
          type="range"
          min={1000}
          max={maxTroops}
          step={500}
          value={Math.min(troops, maxTroops)}
          onChange={(e) => setTroops(Number(e.target.value))}
          className="mb-3 w-full"
          aria-label="출진 병력"
        />

        <p className="mb-3 text-xs tabular-nums" style={{ transition: "none" }}>
          비용 <span className="font-semibold">{cost.gold.toLocaleString()}금</span>
          {" · "}
          <span className="font-semibold">병량 {cost.food.toLocaleString()}</span>
          <span className="opacity-55">
            {" "}(보유 {city.gold.toLocaleString()}금 / {city.food.toLocaleString()})
          </span>
        </p>

        {(problem || !check.ok) && (
          <p className="mb-2 text-xs" style={{ color: PALETTE.seal }}>{problem ?? check.reason}</p>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={send}
            disabled={!check.ok}
            className="flex-1 rounded-lg px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
            style={{ background: PALETTE.seal }}
          >
            출진
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border px-4 py-2 text-sm"
            style={{ borderColor: PALETTE.inkSoft }}
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
