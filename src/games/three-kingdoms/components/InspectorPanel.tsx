import { useEffect, useState } from "react";
import { FACILITIES, FACILITY_SLOTS, HANJA_FONT, PALETTE, TACTICS, TERRAIN_LABEL, UNIT_TYPES } from "../game/constants";
import { availableTactics } from "../game/combat";
import { canCapture } from "../game/siege";
import { isSupplied } from "../game/supply";
import { hexNeighbors } from "../game/hex";
import { DispatchDialog } from "./DispatchDialog";
import { OfficerPortrait } from "./OfficerPortrait";
import { officersInCity, officersOfUnit } from "../game/state";
import { barracksBonus, buildableTiles, developmentCap, facilityCount, previewInternal } from "../game/internal";
import { orderLabel } from "../game/events";
import { tileAt } from "../game/map";
import type { GameEngine } from "../game/engine";
import type { FacilityType, GameState, InternalKind, Officer, OfficerId, UISnapshot } from "../game/types";

interface Props {
  engine: GameEngine;
  state: GameState;
  snapshot: UISnapshot;
}

const ORDERS: InternalKind[] = ["commerce", "agriculture", "order", "draft", "train", "repair"];
const BUILDABLE: FacilityType[] = ["farm", "market", "barracks", "fort", "tower"];

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="w-10 shrink-0 text-[11px] opacity-60">{label}</span>
      <span className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: "rgba(58,50,38,0.15)" }}>
        <span className="block h-full rounded-full" style={{ width: `${pct * 100}%`, background: color }} />
      </span>
      <span className="w-24 shrink-0 text-right text-[11px] tabular-nums" style={{ transition: "none" }}>
        {Math.round(value).toLocaleString()}
        <span className="opacity-45"> / {Math.round(max).toLocaleString()}</span>
      </span>
    </div>
  );
}

function OfficerStats({ officer }: { officer: Officer }) {
  const stats: [string, number][] = [
    ["통", officer.lead], ["무", officer.war], ["지", officer.int],
    ["정", officer.pol], ["매", officer.cha],
  ];
  return (
    <span className="flex gap-1.5 text-[11px] tabular-nums">
      {stats.map(([k, v]) => (
        <span key={k} className="flex gap-0.5">
          <span className="opacity-45">{k}</span>
          <span className={v >= 90 ? "font-bold" : v >= 75 ? "font-semibold" : "opacity-75"}>{v}</span>
        </span>
      ))}
    </span>
  );
}

export function InspectorPanel({ engine, state, snapshot }: Props) {
  const selected = snapshot.selected;
  const cityId = selected.kind === "city" ? selected.cityId : null;
  const [picked, setPicked] = useState<OfficerId[]>([]);
  const [problem, setProblem] = useState<string | null>(null);
  const [dispatching, setDispatching] = useState(false);

  // Switching cities must not carry an assignment across; officers are city-local.
  useEffect(() => {
    setPicked([]);
    setProblem(null);
    setDispatching(false);
  }, [cityId]);

  if (selected.kind === "unit") {
    const unit = state.units[selected.unitId];
    if (unit) {
      const spec = UNIT_TYPES[unit.type];
      const faction = state.factions[unit.faction];
      const ours = unit.faction === state.playerFactionId;
      const supplied = ours ? isSupplied(state, unit) : true;
      return (
        <Shell>
          <div className="flex flex-col gap-3 px-3 py-3">
            <Header
              badge={spec.hanja}
              color={faction.color}
              title={`${officersOfUnit(state, unit)[0]?.name ?? "부대"} · ${spec.label}`}
              subtitle={`${faction.name} · 이동 ${unit.movesLeft}${unit.hasActed ? " · 행동 완료" : ""}${
                ours && !supplied ? ` · 보급 끊김 ${unit.unsuppliedTurns}달` : ""
              }`}
            />
            <div className="flex flex-col gap-1.5">
              <Bar label="병력" value={unit.troops} max={unit.maxTroops} color="#7a2020" />
              <Bar label="사기" value={unit.morale} max={100} color="#c0562f" />
              <Bar label="기력" value={unit.energy} max={100} color="#3f6f8a" />
              <Bar label="병량" value={unit.food} max={Math.max(1, (unit.maxTroops / 100) * 6)} color="#8a6d2f" />
            </div>
            {ours && <UnitActions engine={engine} state={state} unit={unit} snapshot={snapshot} />}
            <ul className="border-t pt-1" style={{ borderColor: PALETTE.inkFaint }}>
              {officersOfUnit(state, unit).map((o) => (
                <li key={o.id} className="flex items-center gap-2 py-1">
                  <OfficerPortrait officer={o} state={state} size={30} />
                  <span className="w-14 shrink-0 text-xs font-semibold">{o.name}</span>
                  <OfficerStats officer={o} />
                </li>
              ))}
            </ul>
          </div>
        </Shell>
      );
    }
  }

  if (!cityId) {
    return (
      <Shell>
        <p className="px-3 py-4 text-center text-xs opacity-55">
          도시나 부대를 눌러 살펴보십시오. 끌어서 지도를 옮기고, 두 손가락으로 확대합니다.
        </p>
      </Shell>
    );
  }

  const city = state.cities[cityId];
  if (!city) return <Shell><span /></Shell>;

  const faction = city.faction ? state.factions[city.faction] : null;
  const mine = city.faction === state.playerFactionId;
  const tile = tileAt(state.map, city.coord);
  const roster = officersInCity(state, cityId);
  const troopCap = city.maxTroops + barracksBonus(state, city);
  const queued = state.internalOrders
    .map((order, index) => ({ order, index }))
    .filter((o) => o.order.cityId === cityId);

  const toggle = (id: OfficerId): void => {
    setProblem(null);
    setPicked((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= 3 ? prev : [...prev, id],
    );
  };

  const build = (type: FacilityType): void => {
    const result = engine.startPlacement(cityId, type, picked);
    setProblem(result.ok ? null : result.reason ?? "지을 수 없습니다.");
  };

  const issue = (kind: InternalKind): void => {
    const result = engine.issueOrder(cityId, kind, picked);
    if (result.ok) {
      setPicked([]);
      setProblem(null);
    } else {
      setProblem(result.reason ?? "지시할 수 없습니다.");
    }
  };

  return (
    <Shell>
      <div className="flex flex-col gap-3 px-3 py-3">
        <Header
          badge={city.hanja[0]}
          color={faction?.color ?? PALETTE.neutral}
          title={`${city.name} ${city.hanja}`}
          subtitle={`${faction?.name ?? "무소속"} · ${tile ? TERRAIN_LABEL[tile.terrain] : ""} · 금 ${city.gold.toLocaleString()} · 병량 ${city.food.toLocaleString()}`}
        />

        <div className="flex flex-col gap-1.5">
          <Bar label="병사" value={city.troops} max={troopCap} color="#7a2020" />
          <Bar label="내구" value={city.defense} max={city.maxDefense} color="#4a4a42" />
          <Bar label="상업" value={city.commerce} max={developmentCap(state, city, "commerce")} color="#8a6d2f" />
          <Bar label="농업" value={city.agriculture} max={developmentCap(state, city, "agriculture")} color="#1f5c3a" />
          <Bar label="치안" value={city.order} max={100} color="#1f4e79" />
        </div>

        {mine && (
          <>
            <button
              type="button"
              onClick={() => setDispatching(true)}
              className="self-start rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
              style={{ background: PALETTE.seal }}
            >
              출진
            </button>
            {dispatching && (
              <DispatchDialog
                engine={engine}
                state={state}
                city={city}
                onClose={() => setDispatching(false)}
              />
            )}
            <div>
              <p className="mb-1 text-[11px] opacity-60">
                무장을 고르고 지시하십시오. 배정된 무장은 이번 달 내내 그 일을 맡습니다.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {roster.map((o) => {
                  const busy = o.duty !== "idle";
                  const on = picked.includes(o.id);
                  return (
                    <button
                      key={o.id}
                      type="button"
                      disabled={busy}
                      onClick={() => toggle(o.id)}
                      aria-pressed={on}
                      className="flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs transition-colors disabled:opacity-35"
                      style={{
                        borderColor: on ? PALETTE.seal : PALETTE.inkSoft,
                        background: on ? "rgba(163,50,38,0.12)" : "transparent",
                      }}
                    >
                      <OfficerPortrait officer={o} state={state} size={26} />
                      <span className="font-semibold">{o.name}</span>
                      <OfficerStats officer={o} />
                    </button>
                  );
                })}
                {roster.length === 0 && <span className="text-xs opacity-55">주둔한 무장이 없습니다.</span>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
              {ORDERS.map((kind) => {
                const preview = picked.length > 0 ? previewInternal(state, cityId, kind, picked) : null;
                const blocked = !preview || Boolean(preview.problem);
                return (
                  <button
                    key={kind}
                    type="button"
                    disabled={blocked}
                    onClick={() => issue(kind)}
                    title={preview?.problem ?? undefined}
                    className="flex flex-col items-center gap-0.5 rounded-lg border px-2 py-1.5 text-xs transition-colors disabled:opacity-35 enabled:hover:bg-black/5"
                    style={{ borderColor: PALETTE.inkSoft }}
                  >
                    <span className="font-semibold">{orderLabel(kind)}</span>
                    <span className="text-[10px] tabular-nums opacity-60" style={{ transition: "none" }}>
                      {preview
                        ? preview.problem
                          ? "—"
                          : `${kind === "draft" || kind === "repair" ? "" : "+"}${preview.delta.toLocaleString()}${preview.gold ? ` · ${preview.gold}금` : ""}`
                        : "무장 선택"}
                    </span>
                  </button>
                );
              })}
            </div>

            <div>
              <p className="mb-1 flex items-center gap-2 text-[11px] opacity-60">
                <span>
                  건설 ({facilityCount(state, cityId)}/{FACILITY_SLOTS}) — 개발 상한을 영구히 올립니다.
                </span>
                {snapshot.placement?.cityId === cityId && (
                  <button
                    type="button"
                    onClick={() => engine.cancelPlacement()}
                    className="rounded border px-1.5 py-0.5"
                    style={{ borderColor: PALETTE.seal, color: PALETTE.seal }}
                  >
                    자리 고르기 취소
                  </button>
                )}
              </p>
              <div className="grid grid-cols-5 gap-1.5">
                {BUILDABLE.map((type) => {
                  const spec = FACILITIES[type];
                  const spots = picked.length ? buildableTiles(state, cityId, type).length : 0;
                  const active = snapshot.placement?.cityId === cityId && snapshot.placement.type === type;
                  const blocked = picked.length === 0 || spots === 0 || city.gold < spec.gold;
                  return (
                    <button
                      key={type}
                      type="button"
                      disabled={blocked}
                      onClick={() => build(type)}
                      title={spec.desc}
                      aria-pressed={active}
                      className="flex flex-col items-center gap-0.5 rounded-lg border px-1 py-1.5 text-xs transition-colors disabled:opacity-35 enabled:hover:bg-black/5"
                      style={{
                        borderColor: active ? PALETTE.seal : PALETTE.inkSoft,
                        background: active ? "rgba(163,50,38,0.12)" : "transparent",
                      }}
                    >
                      <span className="font-semibold" style={{ fontFamily: HANJA_FONT }}>{spec.hanja}</span>
                      <span className="text-[10px] opacity-60">{spec.label}</span>
                      <span className="text-[10px] tabular-nums opacity-50" style={{ transition: "none" }}>
                        {spec.gold}금
                      </span>
                    </button>
                  );
                })}
              </div>
              {snapshot.placement?.cityId === cityId && (
                <p className="mt-1 text-xs font-semibold" style={{ color: PALETTE.seal }}>
                  지도에서 점선으로 표시된 자리를 누르십시오.
                </p>
              )}
            </div>

            {problem && <p className="text-xs" style={{ color: PALETTE.seal }}>{problem}</p>}

            {queued.length > 0 && (
              <ul className="flex flex-col gap-1 border-t pt-2" style={{ borderColor: PALETTE.inkFaint }}>
                {queued.map(({ order, index }) => (
                  <li key={index} className="flex items-center gap-2 text-xs">
                    <span className="font-semibold">{orderLabel(order.kind)}</span>
                    <span className="opacity-60">
                      {order.officerIds.map((id) => state.officers[id]?.name).join("·")}
                    </span>
                    <button
                      type="button"
                      onClick={() => engine.cancelOrder(index)}
                      className="ml-auto rounded border px-2 py-0.5 transition-colors hover:bg-black/5"
                      style={{ borderColor: PALETTE.inkSoft }}
                    >
                      취소
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {!mine && roster.length > 0 && (
          <ul className="max-h-32 overflow-y-auto border-t pt-1" style={{ borderColor: PALETTE.inkFaint }}>
            {roster.map((o) => (
              <li key={o.id} className="flex items-center gap-2 py-1">
                <OfficerPortrait officer={o} state={state} size={30} />
                <span className="w-14 shrink-0 text-xs font-semibold">{o.name}</span>
                <OfficerStats officer={o} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </Shell>
  );
}

function Header({ badge, color, title, subtitle }: { badge: string; color: string; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded text-base font-bold text-white"
        style={{ background: color, fontFamily: HANJA_FONT }}
      >
        {badge}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-bold" style={{ fontFamily: HANJA_FONT }}>{title}</span>
        <span className="truncate text-[11px] opacity-60" style={{ transition: "none" }}>{subtitle}</span>
      </span>
    </div>
  );
}

/**
 * One bottom sheet whose body switches on what is selected. City, unit and empty states
 * share a container on purpose: six separate panels is where a strategy game's UI budget
 * quietly disappears.
 */
function Shell({ title, children }: { title?: string; children: React.ReactNode }) {
  // Collapsible, because on a laptop the open panel eats close to half the board and there
  // is no way to just look at the map.
  const [open, setOpen] = useState(true);
  return (
    <div
      className="pointer-events-auto border-t pb-[max(0.25rem,env(safe-area-inset-bottom))]"
      style={{ background: "rgba(240,230,210,0.96)", borderColor: PALETTE.inkSoft, color: PALETTE.ink }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-3 py-1 text-[11px] transition-colors hover:bg-black/5"
      >
        <span className="opacity-45">{title ?? "선택"}</span>
        <span className="ml-auto opacity-45">{open ? "패널 접기" : "패널 펼치기"}</span>
      </button>
      {open && <div className="max-h-[44vh] overflow-y-auto">{children}</div>}
    </div>
  );
}

/**
 * Everything the player can do with a selected army that is not a tap on the map. Movement
 * and attacks stay on the board itself; this is for 전법, 입성 and 귀환.
 */
function UnitActions({
  engine, state, unit, snapshot,
}: {
  engine: GameEngine;
  state: GameState;
  unit: NonNullable<GameState["units"][number]>;
  snapshot: UISnapshot;
}) {
  const tactics = availableTactics(state, unit);
  const homeTile = tileAt(state.map, unit.coord);
  const onFriendlyCity = Boolean(
    homeTile?.cityId && state.cities[homeTile.cityId]?.faction === unit.faction,
  );
  const breached = hexNeighbors(unit.coord)
    .map((h) => tileAt(state.map, h))
    .map((t) => (t?.cityId ? state.cities[t.cityId] : null))
    .find((c) => c && canCapture(state, unit, c).ok);

  return (
    <>
      <p className="text-[11px] opacity-60">
        흰 칸을 눌러 이동하고, 붉게 표시된 적을 눌러 공격합니다.
      </p>
      {tactics.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tactics.map((id) => {
            const t = TACTICS[id];
            const armed = snapshot.pendingTactic === id;
            return (
              <button
                key={id}
                type="button"
                disabled={unit.hasActed}
                onClick={() => engine.setTactic(armed ? null : id)}
                aria-pressed={armed}
                title={t.desc}
                className="rounded-lg border px-2 py-1 text-xs disabled:opacity-35"
                style={{
                  borderColor: armed ? PALETTE.seal : PALETTE.inkSoft,
                  background: armed ? "rgba(163,50,38,0.12)" : "transparent",
                }}
              >
                <span className="font-semibold" style={{ fontFamily: HANJA_FONT }}>{t.hanja}</span>
                <span className="ml-1">{t.label}</span>
                <span className="ml-1 text-[10px] opacity-55">기력 {t.energy}</span>
              </button>
            );
          })}
        </div>
      )}
      {snapshot.pendingTactic && (
        <p className="text-xs font-semibold" style={{ color: PALETTE.seal }}>
          전법 준비됨. 목표를 누르십시오.
        </p>
      )}
      {(breached || onFriendlyCity) && (
        <div className="flex gap-2">
          {breached && (
            <button
              type="button"
              onClick={() => engine.enterCity(unit.id, breached.id)}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
              style={{ background: PALETTE.seal }}
            >
              {breached.name} 입성
            </button>
          )}
          {onFriendlyCity && (
            <button
              type="button"
              onClick={() => engine.bringHome(unit.id)}
              className="rounded-lg border px-3 py-1.5 text-xs"
              style={{ borderColor: PALETTE.inkSoft }}
            >
              귀환
            </button>
          )}
        </div>
      )}
    </>
  );
}
