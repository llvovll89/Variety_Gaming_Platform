import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { GameProps } from "../../platform/types";
import GameDemo from "./components/GameDemo";
import styles from "./three-kingdoms-card.css?inline";
// Font faces belong to the document; they are available inside the game's shadow root.
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";

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
            <GameDemo onExit={onExit} />
          </div>
        </>,
        shadowRoot,
      )}
    </div>
  );
}
