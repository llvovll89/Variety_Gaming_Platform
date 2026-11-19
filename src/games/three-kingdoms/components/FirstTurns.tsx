import { useEffect, useState } from "react";
import { citiesOf } from "../game/state";
import type { FactionId, GameState } from "../game/types";

interface Props {
  state: GameState;
  factionId: FactionId;
  /** The turn the campaign started on, so the three steps count from there. */
  startTurn: number;
  turn: number;
  onClose: () => void;
  /** Hidden (not unmounted) while 조작 안내 is open, so finished steps stay checked. */
  hidden?: boolean;
}

/**
 * The first three turns of a new campaign, one thing to learn each: a city order, an army in the
 * field, and passing ten days. A step stays checked once done, even after the order has run.
 */
export function FirstTurns({ state, factionId, startTurn, turn, onClose, hidden }: Props) {
  const mine = new Set(citiesOf(state, factionId).map(c => c.id));
  const ordered = state.internalOrders.some(o => mine.has(o.cityId));
  const marching = Object.values(state.units).some(u => u.faction === factionId);
  const passed = turn > startTurn;
  const [done, setDone] = useState({ ordered: false, marching: false, passed: false });
  useEffect(() => {
    setDone(d => (ordered && !d.ordered) || (marching && !d.marching) || (passed && !d.passed)
      ? { ordered: d.ordered || ordered, marching: d.marching || marching, passed: d.passed || passed } : d);
  }, [ordered, marching, passed]);

  const steps = [
    { done: done.ordered, title: "一 · 내정 명령", text: "'내 도시'에서 도시를 고르고, 내정 분류에서 담당 무장과 명령을 정하세요." },
    { done: done.marching, title: "二 · 부대 출진", text: "군사 → 부대 편성·출진으로 부대를 내보내세요. 파란 칸으로 이동하고 붉은 적을 눌러 공격합니다." },
    { done: done.passed, title: "三 · 10일 진행", text: "명령을 마쳤으면 위쪽의 '10일 진행'을 누르세요. 명령은 그때 실행됩니다." },
  ];
  const current = steps.findIndex(s => !s.done);
  return (
    <section className="tk-help-panel tk-first-turns" aria-label="첫 세 순 안내" hidden={hidden}>
      {steps.map((s, i) => (
        <div key={s.title} data-state={s.done ? "done" : i === current ? "current" : "todo"}>
          <b>{s.done ? "✓ " : ""}{s.title}{i === current && <small> 지금 할 일</small>}</b>
          <p>{s.text}</p>
        </div>
      ))}
      <button onClick={onClose}>{current < 0 ? "안내 마치기" : "안내 닫기"}</button>
    </section>
  );
}
