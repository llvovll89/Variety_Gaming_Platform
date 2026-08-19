import { useRef } from "react";
import { CHARACTERS } from "./characters";
import { CUSTOM_CHARACTER_ID } from "./useProfile";

interface CharacterPickerProps {
  selectedId: string;
  onSelect: (id: string) => void;
  customImage: string | null;
  onUploadFile: (file: File) => void;
}

export default function CharacterPicker({
  selectedId,
  onSelect,
  customImage,
  onUploadFile,
}: CharacterPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;
    onUploadFile(file);
  };

  const tileClass = (active: boolean) =>
    `flex items-center justify-center rounded-xl p-1.5 transition ${
      active
        ? "bg-pink-500/30 ring-2 ring-pink-400"
        : "bg-white/5 ring-1 ring-white/10 hover:bg-white/10"
    }`;

  return (
    <div className="flex w-full flex-wrap items-center justify-center gap-3">
      {CHARACTERS.map((c) => (
        <button key={c.id} type="button" onClick={() => onSelect(c.id)} className={tileClass(selectedId === c.id)}>
          <img src={c.image} alt={c.name} className="h-14 w-14 rounded-full object-cover object-top" />
        </button>
      ))}

      {customImage && (
        <button
          type="button"
          onClick={() => onSelect(CUSTOM_CHARACTER_ID)}
          className={tileClass(selectedId === CUSTOM_CHARACTER_ID)}
        >
          <img src={customImage} alt="내 캐릭터" className="h-14 w-14 rounded-full object-cover object-top" />
        </button>
      )}

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        title="내 사진으로 캐릭터 만들기"
        className="flex h-17 w-17 flex-col items-center justify-center gap-0.5 rounded-xl bg-white/5 p-1.5 text-white/60 ring-1 ring-dashed ring-white/25 transition hover:bg-white/10 hover:text-white/90"
      >
        <span className="text-xl leading-none">+</span>
        <span className="text-[10px] leading-none">내 사진</span>
      </button>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
    </div>
  );
}
