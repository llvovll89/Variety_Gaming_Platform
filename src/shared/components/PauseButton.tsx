import { PauseIcon } from "@phosphor-icons/react/dist/icons/Pause";
import { PlayIcon } from "@phosphor-icons/react/dist/icons/Play";

interface PauseButtonProps {
  paused: boolean;
  onClick: () => void;
}

export default function PauseButton({ paused, onClick }: PauseButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label={paused ? "계속하기" : "일시정지"}
      className="absolute left-1/2 top-4 -translate-x-1/2 flex items-center justify-center transition-all duration-300 active:scale-95 group"
      style={{
        width: "48px",
        height: "48px",
      }}
    >
      {/* Animated background */}
      <div
        className="absolute inset-0 rounded-full bg-gradient-to-br backdrop-blur-md transition-all duration-300"
        style={{
          background: paused
            ? "linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.05))"
            : "linear-gradient(135deg, rgba(255, 144, 32, 0.15), rgba(255, 144, 32, 0.05))",
          border: paused ? "1.5px solid rgba(34, 197, 94, 0.3)" : "1.5px solid rgba(255, 144, 32, 0.3)",
          boxShadow: paused
            ? "0 0 20px rgba(34, 197, 94, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.1)"
            : "0 0 20px rgba(255, 144, 32, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.1)",
        }}
      />
      
      {/* Icon */}
      <div className="relative z-10 flex items-center justify-center text-white transition-transform duration-300">
        {paused ? (
          <PlayIcon 
            size={22} 
            weight="fill" 
            className="group-hover:scale-110 transition-transform"
            style={{ color: "#22c55e" }}
          />
        ) : (
          <PauseIcon 
            size={22} 
            weight="fill" 
            className="group-hover:scale-110 transition-transform"
            style={{ color: "#ff9020" }}
          />
        )}
      </div>
    </button>
  );
}
