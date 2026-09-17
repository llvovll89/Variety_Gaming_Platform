import { useEffect, useRef, useState } from "react";
import { PALETTE } from "../game/constants";
import type { LogEntry } from "../game/types";

interface Props {
  log: LogEntry[];
  onFocus: (entry: LogEntry) => void;
}

const KIND_COLOR: Record<LogEntry["kind"], string> = {
  info: PALETTE.ink,
  battle: "#7a2020",
  capture: "#1f4e79",
  alert: PALETTE.seal,
};

/**
 * Collapsed to the single newest line, because that is all a player needs mid-turn. Tapping
 * it opens the history; tapping an entry pans the camera to where it happened.
 */
export function LogStrip({ log, onFocus }: Props) {
  const [open, setOpen] = useState(false);
  const endRef = useRef<HTMLLIElement | null>(null);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ block: "end" });
  }, [open, log.length]);

  const latest = log[log.length - 1];

  return (
    <div
      className="pointer-events-auto border-t text-xs"
      style={{ background: "rgba(240,230,210,0.9)", borderColor: PALETTE.inkFaint, color: PALETTE.ink }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-3 py-1.5 text-left transition-colors hover:bg-black/5"
      >
        <span className="shrink-0 opacity-45">기록</span>
        <span className="min-w-0 flex-1 truncate" style={{ color: latest ? KIND_COLOR[latest.kind] : undefined }}>
          {latest?.text ?? "—"}
        </span>
        <span className="shrink-0 opacity-45">{open ? "닫기" : "펼치기"}</span>
      </button>

      {open && (
        <ul className="max-h-40 overflow-y-auto border-t px-3 py-1" style={{ borderColor: PALETTE.inkFaint }}>
          {log.map((entry, i) => (
            <li key={i} ref={i === log.length - 1 ? endRef : undefined} className="py-0.5">
              <button
                type="button"
                onClick={() => onFocus(entry)}
                disabled={!entry.focus}
                className="w-full text-left disabled:cursor-default"
                style={{ color: KIND_COLOR[entry.kind] }}
              >
                <span className="mr-1.5 tabular-nums opacity-40">{entry.turn}</span>
                {entry.text}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
