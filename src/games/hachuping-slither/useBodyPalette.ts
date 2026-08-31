import { useCallback, useState } from "react";
import { DEFAULT_BODY_PALETTE_ID, getBodyPaletteById } from "./game/bodyPalettes";
import { gameStorageKey, safeGetItem, safeSetItem } from "../../shared/storage";

const PALETTE_ID_KEY = gameStorageKey("hachuping-slither", "bodyPaletteId");

export interface BodyPaletteSelection {
  paletteId: string;
  setPaletteId: (id: string) => void;
  /** Resolved hex colors for the current selection — empty for the classic single-hue look. */
  colors: string[];
}

export function useBodyPalette(): BodyPaletteSelection {
  const [paletteId, setPaletteIdState] = useState(() => safeGetItem(PALETTE_ID_KEY) ?? DEFAULT_BODY_PALETTE_ID);

  const setPaletteId = useCallback((id: string) => {
    setPaletteIdState(id);
    safeSetItem(PALETTE_ID_KEY, id);
  }, []);

  return { paletteId, setPaletteId, colors: getBodyPaletteById(paletteId).colors };
}
