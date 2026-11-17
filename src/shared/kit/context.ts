import { createContext, useContext } from 'react';

export type Audience = 'kids' | 'general';
/** The running game, for kit pieces that need it (per-game sound and settings). Set by the shell. */
export interface KitGame { gameId: string; audience: Audience }
export const KitGameContext = createContext<KitGame | null>(null);
export function useKitGame() { return useContext(KitGameContext); }
