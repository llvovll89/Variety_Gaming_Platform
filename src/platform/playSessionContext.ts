import { createContext } from 'react';
import type { GameDefinition } from './types';
import type { RecordsApi } from './meta/api';

/** What the shell offers a running game: the catalogue, switching games and leaving. */
export interface PlaySessionValue {
  games: readonly GameDefinition[];
  gameId: string;
  selectGame: (id: string) => void;
  exit: () => void;
  /** Arcade-wide records for this game. Read it with useRecords(). */
  records?: RecordsApi;
}

export const PlaySession = createContext<PlaySessionValue | null>(null);
