import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { GameProps } from "../../platform/types";
import GameDemo from "./components/GameDemo";
import styles from "./three-kingdoms-card.css?inline";

export default function ThreeKingdomsCardApp({ onExit }: GameProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [shadowRoot, setShadowRoot] = useState<ShadowRoot | null>(null);

  useEffect(() => {
    if (!hostRef.current) return;
    setShadowRoot(hostRef.current.shadowRoot ?? hostRef.current.attachShadow({ mode: "open" }));
  }, []);

  return (
    <div ref={hostRef} className="absolute inset-0 overflow-hidden">
      {shadowRoot && createPortal(
        <>
          <style>{styles}</style>
          <div className="tkw-root">
            <button className="hub-exit-button" type="button" onClick={onExit} aria-label="게임 허브로 돌아가기">
              ← 게임 허브
            </button>
            <GameDemo />
          </div>
        </>,
        shadowRoot,
      )}
    </div>
  );
}
