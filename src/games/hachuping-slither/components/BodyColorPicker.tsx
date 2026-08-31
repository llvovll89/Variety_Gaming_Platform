import { BODY_PALETTES } from "../game/bodyPalettes";

interface BodyColorPickerProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

function swatchBackground(colors: string[]): string {
  if (colors.length === 0) return "linear-gradient(135deg, #ec4899, #db2777)";
  if (colors.length === 1) return colors[0];
  const step = 100 / colors.length;
  const stops = colors.map((c, i) => `${c} ${i * step}%, ${c} ${(i + 1) * step}%`).join(", ");
  return `linear-gradient(135deg, ${stops})`;
}

export default function BodyColorPicker({ selectedId, onSelect }: BodyColorPickerProps) {
  return (
    <div className="flex w-full flex-col items-center gap-2">
      <p className="text-xs font-semibold text-white/60">몸통 색상</p>
      <div className="flex w-full flex-wrap items-center justify-center gap-2.5">
        {BODY_PALETTES.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect(p.id)}
            title={p.name}
            className={`flex h-11 w-11 items-center justify-center rounded-full transition ${
              selectedId === p.id ? "scale-110 ring-2 ring-pink-400 ring-offset-2 ring-offset-black/40" : "hover:scale-105"
            }`}
            style={{ background: swatchBackground(p.colors) }}
          />
        ))}
      </div>
    </div>
  );
}
