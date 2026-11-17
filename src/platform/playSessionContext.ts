import { createContext } from 'react';
import type { GameDefinition } from './types';

/** What the shell offers a running game: the catalogue, switching games and leaving. */
export interface PlaySessionValue {
  games: readonly GameDefinition[];
  gameId: string;
  selectGame: (id: string) => void;
  exit: () => void;
}

export const PlaySession = createContext<PlaySessionValue | null>(null);
