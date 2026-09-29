import { troopSlots, type DemoAction, type DemoState } from "../../lib/demoGame";

export const number = (n: number) => Math.floor(n).toLocaleString("ko-KR");

export const menus = [
  { name: "모집관", symbol: "招", caption: "새로운 인연" },
  { name: "장수 명부", symbol: "將", caption: "나의 인재들" },
  { name: "부대 편성", symbol: "軍", caption: "출정 준비" },
  { name: "영지", symbol: "城", caption: "기반을 다지다" },
  { name: "출정", symbol: "戰", caption: "천하로 나아가다" },
] as const;
export type Tab = typeof menus[number]["name"];

/** 모든 탭이 받는 공통 값: 현재 상태와 행동 실행기. */
export type TabProps = { state: DemoState; act: (action: DemoAction) => DemoState | undefined };

export function TroopTabs({ state, act }: TabProps) {
  const slots = troopSlots(state);
  return <div className="troop-tabs" role="tablist" aria-label="부대 선택">
    {state.troops.map((t, i) => (
      <button key={t.id} role="tab" aria-selected={i === state.activeTroop} className={i === state.activeTroop ? "is-active" : ""}
        disabled={i >= slots} onClick={() => act({ type: "selectTroop", index: i })}>
        {t.name}
        <small>{i >= slots ? `정방 Lv.${i * 10} 해금` : `${number(t.currentTroops)}명`}</small>
      </button>
    ))}
  </div>;
}
