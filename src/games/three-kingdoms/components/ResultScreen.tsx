import { HANJA_FONT, PALETTE } from "../game/constants";
import type { UISnapshot } from "../game/types";

interface Props {
  snapshot: UISnapshot;
  onRestart: () => void;
  onExit: () => void;
}

/** 통일 or 멸망. Shown over the board so the final map stays visible behind it. */
export function ResultScreen({ snapshot, onRestart, onExit }: Props) {
  const won = snapshot.result === "victory";
  const seal = won ? "統" : "終";
  const months = Math.floor((snapshot.turn - 1) / 3);

  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center p-4"
      style={{ background: "rgba(24,24,24,0.55)" }}
    >
      <div
        className="w-full max-w-md rounded-2xl border p-6 text-center motion-safe:animate-panel-in"
        style={{ background: PALETTE.paper, borderColor: PALETTE.ink, color: PALETTE.ink }}
      >
        <span
          className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded text-3xl font-bold text-white"
          style={{ background: won ? PALETTE.seal : "#4a4a42", fontFamily: HANJA_FONT }}
        >
          {seal}
        </span>
        <h2 className="text-2xl font-bold" style={{ fontFamily: HANJA_FONT }}>
          {won ? "천하통일" : "멸망"}
        </h2>
        <p className="mt-2 text-sm leading-relaxed opacity-75">
          {won
            ? `${snapshot.year}년 ${snapshot.month}월, ${months}개월 만에 중원의 모든 성이 ${snapshot.player?.name ?? ""}의 깃발 아래 들어왔다.`
            : `${snapshot.year}년 ${snapshot.month}월, ${snapshot.player?.name ?? ""}는 마지막 성과 마지막 병사를 잃었다.`}
        </p>

        <dl className="mx-auto mt-4 grid max-w-xs grid-cols-3 gap-2 text-xs">
          {[
            ["경과", `${months}개월`],
            ["도시", String(snapshot.player?.cities ?? 0)],
            ["무장", String(snapshot.player?.officers ?? 0)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border py-2" style={{ borderColor: PALETTE.inkSoft }}>
              <dt className="opacity-55">{label}</dt>
              <dd className="font-bold tabular-nums" style={{ transition: "none" }}>{value}</dd>
            </div>
          ))}
        </dl>

        {snapshot.standings.length > 0 && (
          <ul className="mt-4 flex flex-col gap-1 text-left text-xs">
            {snapshot.standings.slice(0, 5).map((f) => (
              <li key={f.id} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: f.color }} />
                <span className="font-semibold">{f.name}</span>
                <span className="ml-auto tabular-nums opacity-60" style={{ transition: "none" }}>
                  성 {f.cities} · 병 {f.troops.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onRestart}
            className="flex-1 rounded-lg px-3 py-2 text-sm font-semibold text-white"
            style={{ background: PALETTE.seal }}
          >
            다시 시작
          </button>
          <button
            type="button"
            onClick={onExit}
            className="rounded-lg border px-4 py-2 text-sm"
            style={{ borderColor: PALETTE.inkSoft }}
          >
            나가기
          </button>
        </div>
      </div>
    </div>
  );
}
