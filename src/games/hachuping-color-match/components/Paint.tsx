import { COLOR_PALETTE, type ColorDef, type PatternId } from "../game/constants";

export const colorOf = (id: string): ColorDef => COLOR_PALETTE.find((c) => c.id === id) ?? COLOR_PALETTE[0];

const patternId = (p: PatternId) => `cm-pat-${p}`;

/** Textures drawn in each color's own ink, so a pot and its target share the same mark. Rendered once per screen. */
export function PatternDefs() {
  const line = { stroke: "currentColor", strokeWidth: 2.2, fill: "none" } as const;
  return (
    <svg width="0" height="0" aria-hidden="true" style={{ position: "absolute" }}>
      <defs>
        <pattern id={patternId("dots")} width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="6" cy="6" r="2.4" fill="currentColor" /></pattern>
        <pattern id={patternId("stripes")} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="10" {...line} strokeWidth={3} /></pattern>
        <pattern id={patternId("grid")} width="12" height="12" patternUnits="userSpaceOnUse"><path d="M12 0H0V12" {...line} /></pattern>
        <pattern id={patternId("waves")} width="20" height="10" patternUnits="userSpaceOnUse"><path d="M0 5Q5 0 10 5T20 5" {...line} /></pattern>
        <pattern id={patternId("rings")} width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="8" cy="8" r="4.5" {...line} /></pattern>
        <pattern id={patternId("zigzag")} width="14" height="10" patternUnits="userSpaceOnUse"><path d="M0 8L7 2L14 8" {...line} /></pattern>
        <pattern id={patternId("diamonds")} width="14" height="14" patternUnits="userSpaceOnUse"><path d="M7 2L12 7L7 12L2 7Z" fill="currentColor" /></pattern>
        <pattern id={patternId("cross")} width="14" height="14" patternUnits="userSpaceOnUse"><path d="M7 3V11M3 7H11" {...line} /></pattern>
      </defs>
    </svg>
  );
}

function Texture({ color, d, show }: { color: ColorDef; d: string; show: boolean }) {
  if (!show || color.pattern === "plain") return null;
  return <path d={d} fill={`url(#${patternId(color.pattern)})`} style={{ color: color.ink }} opacity={0.45} />;
}

// A soft, slightly uneven paint drop.
const BLOB = "M50 4C66 4 79 11 88 24C97 37 98 53 93 67C88 82 76 93 59 96C42 99 25 95 14 83C3 71 0 55 4 40C8 25 18 12 31 7C37 5 43 4 50 4Z";

export function PaintBlob({ colorId, patterns, className }: { colorId: string; patterns: boolean; className?: string }) {
  const color = colorOf(colorId);
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <path d={BLOB} fill={color.hex} />
      <Texture color={color} d={BLOB} show={patterns} />
      <ellipse cx="34" cy="28" rx="12" ry="7" fill="#fff" opacity=".35" transform="rotate(-28 34 28)" />
    </svg>
  );
}

// A round paint tub seen from slightly above: rim, paint surface, body.
const TUB_BODY = "M14 40H86V78C86 88 70 94 50 94C30 94 14 88 14 78Z";
const TUB_PAINT = "M17 40A33 12 0 1 0 83 40A33 12 0 1 0 17 40Z";

export function PaintPot({ colorId, patterns }: { colorId: string; patterns: boolean }) {
  const color = colorOf(colorId);
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <path d={TUB_BODY} fill="#ffffff" stroke="#c9cfe0" strokeWidth="2" />
      <path d="M14 58H86" stroke="#e3e7f1" strokeWidth="2" />
      <ellipse cx="50" cy="40" rx="36" ry="14" fill="#ffffff" stroke="#c9cfe0" strokeWidth="2" />
      <path d={TUB_PAINT} fill={color.hex} />
      <Texture color={color} d={TUB_PAINT} show={patterns} />
      <path d="M58 44C62 52 60 60 64 66C66 70 70 70 70 64C70 58 66 52 68 45" fill={color.hex} />
    </svg>
  );
}

/** A small drop used as decoration on the start screen. */
export function Drop({ hex }: { hex: string }) {
  return (
    <svg viewBox="0 0 30 38" aria-hidden="true">
      <path d="M15 2C15 2 3 17 3 25A12 12 0 0 0 27 25C27 17 15 2 15 2Z" fill={hex} />
      <ellipse cx="10" cy="24" rx="3" ry="5" fill="#fff" opacity=".35" />
    </svg>
  );
}
