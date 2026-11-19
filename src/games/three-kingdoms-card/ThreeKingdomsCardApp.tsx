import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { GameProps } from "../../platform/types";
import GameDemo from "./components/GameDemo";
import { KitStyles } from "../../shared/kit/KitStyles";
import { useReducedMotion } from "../../shared/kit/settings";
import styles from "./three-kingdoms-card.css?inline";
// Font faces belong to the document; they are available inside the game's shadow root.
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";

export default function ThreeKingdomsCardApp({ onExit }: GameProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [shadowRoot, setShadowRoot] = useState<ShadowRoot | null>(null);
  // `:root` does not reach into a shadow root, so the kit's reduced-motion switch goes on our own root.
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!hostRef.current) return;
    setShadowRoot(hostRef.current.shadowRoot ?? hostRef.current.attachShadow({ mode: "open" }));
  }, []);

  return (
    <div ref={hostRef} className="absolute inset-0 overflow-hidden">
      {shadowRoot && createPortal(
        <>
          <KitStyles />
          <style>{styles}</style>
          <div className={reduceMotion ? "tkw-root kit-motion-reduce" : "tkw-root"}>
            <GameDemo onExit={onExit} />
          </div>
        </>,
        shadowRoot,
      )}
    </div>
  );
}
