import { useCallback, useRef, useState } from "react";
import { CHARACTERS, DEFAULT_CHARACTER_ID, getCharacterById } from "./characters";
import { gameStorageKey, safeGetItem, safeSetItem } from "../storage";

const NAME_KEY = gameStorageKey("profile", "name");
const CHARACTER_ID_KEY = gameStorageKey("profile", "characterId");
export const CUSTOM_CHARACTER_ID = "custom";

export interface Profile {
  name: string;
  setName: (name: string) => void;
  /** A built-in CHARACTERS id, or CUSTOM_CHARACTER_ID when a photo was uploaded this session. */
  characterId: string;
  selectCharacter: (id: string) => void;
  /** Session-only blob URL for an uploaded photo; never persisted (see uploadPhoto). */
  customImage: string | null;
  uploadPhoto: (file: File) => void;
  /** The image URL to actually render for the current selection. */
  characterImage: string;
}

/**
 * Cross-game player identity: name + built-in character choice persist in localStorage so a
 * pick carries over between games. An uploaded photo is a `blob:` URL, which only exists for
 * the tab's lifetime, so it is intentionally never written to storage and its id is never
 * persisted — only its in-memory URL, owned exclusively by this hook. Revoking happens only
 * when superseded by a new upload; a screen's own unmount must never revoke it (that bug bit
 * us once already: a StartMenu that owned the blob revoked it right as gameplay started).
 */
export function useProfile(): Profile {
  const [name, setNameState] = useState(() => safeGetItem(NAME_KEY) ?? "하츄핑");
  const [characterId, setCharacterIdState] = useState(() => {
    const stored = safeGetItem(CHARACTER_ID_KEY);
    return stored && stored !== CUSTOM_CHARACTER_ID ? stored : DEFAULT_CHARACTER_ID;
  });
  const [customImage, setCustomImage] = useState<string | null>(null);
  const customImageRef = useRef<string | null>(null);

  const setName = useCallback((next: string) => {
    setNameState(next);
    safeSetItem(NAME_KEY, next);
  }, []);

  const selectCharacter = useCallback((id: string) => {
    setCharacterIdState(id);
    if (id !== CUSTOM_CHARACTER_ID) safeSetItem(CHARACTER_ID_KEY, id);
  }, []);

  const uploadPhoto = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    if (customImageRef.current) URL.revokeObjectURL(customImageRef.current);
    customImageRef.current = url;
    setCustomImage(url);
    setCharacterIdState(CUSTOM_CHARACTER_ID);
  }, []);

  const characterImage =
    characterId === CUSTOM_CHARACTER_ID && customImage
      ? customImage
      : getCharacterById(characterId).image;

  return { name, setName, characterId, selectCharacter, customImage, uploadPhoto, characterImage };
}

export { CHARACTERS };
