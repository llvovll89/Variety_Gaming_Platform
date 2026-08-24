import { useCallback, useState } from "react";

interface StartMenuProps {
  highScore: number;
  onStart: () => void;
}

export default function StartMenu({ highScore, onStart }: StartMenuProps) {
  const [buttonHovered, setButtonHovered] = useState(false);

  const handleStart = useCallback(() => {
    onStart();
  }, [onStart]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fff9f5",
        borderRadius: "16px",
        zIndex: 5,
        padding: "40px 20px",
      }}
    >
      {/* 제목 */}
      <h1
        style={{
          fontSize: "2.8rem",
          fontWeight: "900",
          color: "#ff6fa5",
          marginBottom: "8px",
          textAlign: "center",
          letterSpacing: "-0.02em",
        }}
      >
        🐱 동물 친구들 🐰
      </h1>
      
      {/* 부제 */}
      <p
        style={{
          fontSize: "1.2rem",
          color: "#888",
          marginBottom: "48px",
          textAlign: "center",
          fontWeight: "600",
          maxWidth: "320px",
        }}
      >
        패턴을 따라하는 재미있는 게임!
      </p>

      {/* 최고 점수 */}
      {highScore > 0 && (
        <div
          style={{
            marginBottom: "48px",
            textAlign: "center",
          }}
        >
          <p style={{ color: "#999", fontSize: "0.9rem", fontWeight: "600", marginBottom: "6px" }}>
            🏆 최고 점수
          </p>
          <p
            style={{
              fontSize: "2.2rem",
              fontWeight: "900",
              color: "#ff6fa5",
            }}
          >
            {highScore}점
          </p>
        </div>
      )}

      {/* 게임 시작 버튼 */}
      <button
        onClick={handleStart}
        onMouseEnter={() => setButtonHovered(true)}
        onMouseLeave={() => setButtonHovered(false)}
        style={{
          padding: "18px 44px",
          fontSize: "1.4rem",
          fontWeight: "900",
          color: "white",
          backgroundColor: "#ff6fa5",
          border: "none",
          borderRadius: "28px",
          cursor: "pointer",
          boxShadow: buttonHovered
            ? "0 8px 20px rgba(255, 111, 165, 0.4)"
            : "0 4px 12px rgba(255, 111, 165, 0.25)",
          transform: buttonHovered ? "scale(1.06)" : "scale(1)",
          transition: "all 0.2s ease",
          letterSpacing: "0.01em",
        }}
      >
        게임 시작! 🎮
      </button>

      {/* 규칙 설명 */}
      <div
        style={{
          marginTop: "48px",
          fontSize: "0.95rem",
          color: "#666",
          textAlign: "center",
          maxWidth: "340px",
          lineHeight: "1.6",
          fontWeight: "500",
        }}
      >
        <p style={{ marginBottom: "8px" }}>💡 동물 패턴을 보고</p>
        <p style={{ marginBottom: "0" }}>똑같이 따라 클릭하세요!</p>
      </div>
    </div>
  );
}
