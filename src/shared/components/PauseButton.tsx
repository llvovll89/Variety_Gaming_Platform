import { PauseIcon, PlayIcon } from "@phosphor-icons/react";

interface PauseButtonProps {
  paused: boolean;
  onClick: () => void;
}

export default function PauseButton({ paused, onClick }: PauseButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label={paused ? "계속하기" : "일시정지"}
      className="absolute left-1/2 top-3 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full bg-black/45 text-white shadow-lg backdrop-blur-sm transition hover:bg-black/60 active:scale-90 sm:top-4"
    >
      {paused ? <PlayIcon size={18} weight="fill" /> : <PauseIcon size={18} weight="fill" />}
    </button>
  );
}
