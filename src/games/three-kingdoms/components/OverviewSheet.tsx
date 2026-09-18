import { useState } from "react";
import { HANJA_FONT, PALETTE, UNIT_TYPES } from "../game/constants";
import { citiesOf, idleOfficers, officersInCity, unitsOf } from "../game/state";
import { suggestOrder } from "../game/advice";
import { isSupplied } from "../game/supply";
import { OfficerPortrait } from "./OfficerPortrait";
import type { GameState, UISnapshot } from "../game/types";
import type { HexCoord } from "../game/hex";

interface Props {
  state: GameState;
  snapshot: UISnapshot;
  onJump: (hex: HexCoord) => void;
  onClose: () => void;
}

type Tab = "cities" | "armies" | "officers" | "powers";

const TABS: [Tab, string][] = [
  ["cities", "도시"],
  ["armies", "부대"],
  ["officers", "무장"],
  ["powers", "세력"],
];

/**
 * The whole realm on one screen. Without it the only way to find out what you own is to pan
 * the map and click twelve hexes, which is the complaint that "the layout feels cramped"
 * actually comes from.
 */
export function OverviewSheet({ state, snapshot, onJump, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("cities");
  const me = state.playerFactionId;
  const cities = citiesOf(state, me);
  const armies = unitsOf(state, me);

  const jump = (hex: HexCoord): void => {
    onJump(hex);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="전체 현황"
      className="tk-overview fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      style={{ background: "rgba(24,24,24,0.45)" }}
      onClick={onClose}
    >
      <div
        className="flex max-h-[88vh] w-full max-w-3xl flex-col rounded-t-2xl border sm:rounded-2xl"
        style={{ background: PALETTE.paper, borderColor: PALETTE.inkSoft, color: PALETTE.ink }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b px-3 py-2" style={{ borderColor: PALETTE.inkFaint }}>
          <h2 className="text-sm font-bold" style={{ fontFamily: HANJA_FONT }}>전체 현황</h2>
          <span className="text-[11px] tabular-nums opacity-60" style={{ transition: "none" }}>
            {snapshot.year}년 {snapshot.month}월 · 성 {cities.length} · 부대 {armies.length}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-lg border px-3 py-1 text-xs"
            style={{ borderColor: PALETTE.inkSoft }}
          >
            닫기
          </button>
        </div>

        <div className="flex gap-1 px-3 pt-2">
          {TABS.map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              aria-pressed={tab === id}
              className="rounded-t-lg border-b-2 px-3 py-1 text-xs font-semibold"
              style={{
                borderColor: tab === id ? PALETTE.seal : "transparent",
                color: tab === id ? PALETTE.seal : PALETTE.ink,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
          {tab === "cities" && (
            <ul className="flex flex-col gap-1.5">
              {cities.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => jump(c.coord)}
                    className="flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-left text-xs transition-colors hover:bg-black/5"
                    style={{ borderColor: PALETTE.inkSoft }}
                  >
                    <span className="w-12 shrink-0 font-bold" style={{ fontFamily: HANJA_FONT }}>{c.name}</span>
                    <span className="grid flex-1 grid-cols-2 gap-x-3 gap-y-0.5 tabular-nums sm:grid-cols-4" style={{ transition: "none" }}>
                      <Field label="병사" value={c.troops.toLocaleString()} />
                      <Field label="금" value={c.gold.toLocaleString()} />
                      <Field label="병량" value={c.food.toLocaleString()} />
                      <Field label="치안" value={String(c.order)} warn={c.order < 50} />
                    </span>
                    <span className="hidden w-48 shrink-0 text-[11px] opacity-60 sm:block">
                      {idleOfficers(state, c.id).length > 0
                        ? suggestOrder(state, c.id)
                        : `무장 ${officersInCity(state, c.id).length}명 모두 배정됨`}
                    </span>
                  </button>
                </li>
              ))}
              {cities.length === 0 && <Empty>남은 성이 없습니다.</Empty>}
            </ul>
          )}

          {tab === "armies" && (
            <ul className="flex flex-col gap-1.5">
              {armies.map((u) => {
                const spec = UNIT_TYPES[u.type];
                const fed = isSupplied(state, u);
                return (
                  <li key={u.id}>
                    <button
                      type="button"
                      onClick={() => jump(u.coord)}
                      className="flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-left text-xs transition-colors hover:bg-black/5"
                      style={{ borderColor: PALETTE.inkSoft }}
                    >
                      <span className="w-20 shrink-0 font-bold">
                        {state.officers[u.officerIds[0]]?.name ?? "부대"}
                      </span>
                      <span className="w-10 shrink-0 opacity-70">{spec.label}</span>
                      <span className="grid flex-1 grid-cols-2 gap-x-3 tabular-nums sm:grid-cols-4" style={{ transition: "none" }}>
                        <Field label="병력" value={u.troops.toLocaleString()} />
                        <Field label="사기" value={String(Math.round(u.morale))} warn={u.morale < 35} />
                        <Field label="기력" value={String(Math.round(u.energy))} />
                        <Field label="이동" value={String(u.movesLeft)} />
                      </span>
                      {!fed && <span className="shrink-0 text-[11px] font-semibold" style={{ color: PALETTE.seal }}>보급 끊김</span>}
                    </button>
                  </li>
                );
              })}
              {armies.length === 0 && <Empty>출진한 부대가 없습니다. 도시에서 출진하십시오.</Empty>}
            </ul>
          )}

          {tab === "officers" && (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
              {cities.flatMap((c) => officersInCity(state, c.id)).map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => jump(state.cities[o.cityId]?.coord ?? { q: 0, r: 0 })}
                  className="flex flex-col items-center gap-0.5 rounded-lg border p-1 text-[10px] transition-colors hover:bg-black/5"
                  style={{ borderColor: PALETTE.inkSoft, opacity: o.duty === "idle" ? 1 : 0.5 }}
                >
                  <OfficerPortrait officer={o} state={state} size={48} />
                  <span className="font-semibold">{o.name}</span>
                  <span className="tabular-nums opacity-60" style={{ transition: "none" }}>
                    통{o.lead} 무{o.war}
                  </span>
                  <span className="opacity-50">
                    {o.duty === "idle" ? state.cities[o.cityId]?.name : o.duty === "internal" ? "내정" : "출진"}
                  </span>
                </button>
              ))}
            </div>
          )}

          {tab === "powers" && (
            <ul className="flex flex-col gap-1.5">
              {snapshot.standings.map((f, i) => (
                <li
                  key={f.id}
                  className="flex items-center gap-2 rounded-lg border px-2 py-1.5 text-xs"
                  style={{
                    borderColor: f.id === me ? PALETTE.seal : PALETTE.inkSoft,
                    background: f.id === me ? "rgba(24,24,24,0.08)" : "transparent",
                  }}
                >
                  <span className="w-5 shrink-0 tabular-nums opacity-50">{i + 1}</span>
                  <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: f.color }} />
                  <span className="w-16 shrink-0 font-bold">{f.name}</span>
                  <span className="flex-1 tabular-nums" style={{ transition: "none" }}>
                    성 {f.cities} · 병 {f.troops.toLocaleString()}
                  </span>
                  {f.id === me && <span className="text-[10px] font-semibold" style={{ color: PALETTE.seal }}>나</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <span className="flex gap-1">
      <span className="opacity-45">{label}</span>
      <span className={warn ? "font-bold" : "font-semibold"} style={{ color: warn ? PALETTE.seal : undefined }}>
        {value}
      </span>
    </span>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <li className="py-6 text-center text-xs opacity-55">{children}</li>;
}
