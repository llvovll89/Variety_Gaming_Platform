interface PauseButtonProps {
  paused: boolean;
  onClick: () => void;
}

export default function PauseButton({ paused, onClick }: PauseButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label={paused ? "계속하기" : "일시정지"}
      className="absolute left-1/2 top-3 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60 active:scale-90 sm:top-4"
    >
      {paused ? "▶" : "❚❚"}
    </button>
  );
}
