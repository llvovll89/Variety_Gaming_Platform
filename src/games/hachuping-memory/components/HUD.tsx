import { useState } from "react";
import type { UISnapshot } from "../game/uiStore";

interface HUDProps {
  snapshot: UISnapshot;
  onPause: () => void;
}

export default function HUD({ snapshot, onPause }: HUDProps) {
  const [hovered, setHovered] = useState(false);

  if (snapshot.status !== "playing") {
    return null;
  }

  return (
    <div style={{ position: "absolute", top: "16px", right: "16px", zIndex: 50 }}>
      <button
        onClick={onPause}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "16px",
          backgroundColor: "#ff6fa5",
          border: "none",
          color: "white",
          fontSize: "28px",
          cursor: "pointer",
          fontWeight: "700",
          boxShadow: hovered ? "0 8px 20px rgba(255, 111, 165, 0.5)" : "0 6px 16px rgba(255, 111, 165, 0.4)",
          transform: hovered ? "scale(1.1)" : "scale(1)",
          transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        ⏸️
      </button>
    </div>
  );
}
