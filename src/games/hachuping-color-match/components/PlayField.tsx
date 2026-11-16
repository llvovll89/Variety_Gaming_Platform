import { useEffect, useRef, useState } from "react";
import { PauseIcon } from "@phosphor-icons/react/dist/icons/Pause";
import { SpeakerHighIcon } from "@phosphor-icons/react/dist/icons/SpeakerHigh";
import { SpeakerSlashIcon } from "@phosphor-icons/react/dist/icons/SpeakerSlash";
import { PaintBlob, PaintPot, PatternDefs, colorOf } from "./Paint";
import type { PlayEvent, UISnapshot } from "../game/types";

interface PlayFieldProps {
  snapshot: UISnapshot;
  patterns: boolean;
  muted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  onSelect: (optionId: number) => void;
}

const RING_R = 47;
const RING_C = 2 * Math.PI * RING_R;

/** Events newer than the last one shown, so each cheer or penalty plays exactly once. */
function useFreshEvents(events: PlayEvent[]) {
  const seen = useRef(events.length ? events[events.length - 1].id : 0);
  const [shown, setShown] = useState<PlayEvent[]>([]);
  useEffect(() => {
    const fresh = events.filter((e) => e.id > seen.current);
    if (!fresh.length) return;
    seen.current = fresh[fresh.length - 1].id;
    setShown((old) => [...old, ...fresh].slice(-8));
    const ids = new Set(fresh.map((e) => e.id));
    const timer = window.setTimeout(() => setShown((old) => old.filter((e) => !ids.has(e.id))), 1250);
    return () => window.clearTimeout(timer);
  }, [events]);
  return shown;
}

export default function PlayField({ snapshot, patterns, muted, onToggleMute, onPause, onSelect }: PlayFieldProps) {
  const fresh = useFreshEvents(snapshot.events);
  const seconds = Math.ceil(snapshot.timeRemaining);
  const low = seconds <= 5;
  const target = colorOf(snapshot.targetColorId);
  const cols = snapshot.options.length <= 4 ? snapshot.options.length : 3;
  const banner = [...fresh].reverse().find((e) => e.kind === "level-up" || e.kind === "streak");
  const lastPoints = [...fresh].reverse().find((e) => e.kind === "correct" || e.kind === "wrong");

  return (
    <div className="cm-play">
      <PatternDefs />
      <div className="cm-topbar">
        <button className="cm-icon" onClick={onPause} aria-label="일시정지">
          <PauseIcon size={20} weight="fill" />
        </button>
        <div className={`cm-clock ${low ? "low" : ""}`} role="timer" aria-label={`남은 시간 ${seconds}초`}>
          <div className="cm-clock-track"><i style={{ transform: `scaleX(${snapshot.timeRemaining / snapshot.duration})` }} /></div>
          <b className="cm-num">{seconds}초</b>
        </div>
        <button className="cm-icon" onClick={onToggleMute} aria-label={muted ? "소리 켜기" : "소리 끄기"} aria-pressed={muted}>
          {muted ? <SpeakerSlashIcon size={20} /> : <SpeakerHighIcon size={20} />}
        </button>
      </div>

      <div className="cm-stats">
        <div className="cm-stat">
          <span>점수</span>
          <b className="cm-num">
            {snapshot.score}
            {lastPoints && (
              <em key={lastPoints.id} aria-hidden="true" className={`cm-float ${lastPoints.kind === "correct" ? "plus" : "minus"}`}>
                {lastPoints.kind === "correct" ? `+${lastPoints.points}` : `-${lastPoints.value}초`}
              </em>
            )}
          </b>
        </div>
        <div className="cm-stat cm-stat-right">
          <span>레벨</span>
          <b className="cm-num">{snapshot.level}</b>
        </div>
      </div>

      <div className="cm-stage">
        {banner ? (
          <p key={banner.id} className="cm-ask cm-cheer" role="status">
            {banner.kind === "level-up" ? `레벨 ${banner.value}! 조금 더 빨라져요` : `${banner.value}연속 정답!`}
          </p>
        ) : (
          <p className="cm-ask">이 색을 찾아요</p>
        )}
        <div className="cm-target" role="img" aria-label={`찾을 색: ${target.name}`}>
          <svg viewBox="0 0 100 100" className={`cm-ring ${snapshot.answerProgress < 0.3 ? "low" : ""}`} aria-hidden="true">
            <circle className="track" cx="50" cy="50" r={RING_R} />
            <circle className="left" cx="50" cy="50" r={RING_R} strokeDasharray={RING_C} strokeDashoffset={RING_C * (1 - snapshot.answerProgress)} />
          </svg>
          <PaintBlob key={snapshot.round} colorId={snapshot.targetColorId} patterns={patterns} className="cm-blob cm-pop" />
        </div>
      </div>

      <div className="cm-pots" role="group" aria-label="물감 고르기" style={{ ["--cols" as string]: cols }}>
        {snapshot.options.map((option, i) => {
          const color = colorOf(option.colorId);
          const wrong = snapshot.wrongOptionIds.includes(option.id);
          return (
            <button key={`${snapshot.round}-${option.id}`} className={`cm-pot ${wrong ? "wrong" : ""}`} onClick={() => onSelect(option.id)} aria-label={`${i + 1}번 ${color.name}`}>
              <kbd aria-hidden="true">{i + 1}</kbd>
              <PaintPot colorId={option.colorId} patterns={patterns} />
              <span>{color.name}</span>
            </button>
          );
        })}
      </div>

      <div className="cm-footer" aria-live="polite">
        <span>연속 <b className="cm-num">{snapshot.streak}</b></span>
        <span>맞힌 개수 <b className="cm-num">{snapshot.totalCorrect}</b></span>
      </div>

    </div>
  );
}
