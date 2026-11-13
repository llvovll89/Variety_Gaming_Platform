import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { PlaySession } from "./platform/PlaySession";
import Hub from "./platform/Hub";
import { GAMES, getGameById } from "./platform/gameRegistry";
import { useProfile } from "./shared/profile/useProfile";
import { DEFAULT_CHARACTER_ID, GAME_CHARACTER_IMAGES } from "./shared/profile/characters";
import { recordRecentGame } from "./platform/hubCatalog";
import GameErrorBoundary from "./platform/GameErrorBoundary";
import { ExitGuardSlot } from "./platform/exitGuard";
import { documentTitle, gameIdFromPath, gamePath, isPlayable } from "./platform/route";

type Intent = "start" | "resume";
const GAME_STATE = (id: string) => ({ arcade: "game", id });

export default function App() {
  // A shared or refreshed /play/<id> link opens that game and continues its saved run, if any.
  const [initialId] = useState(() => gameIdFromPath(window.location.pathname, GAMES));
  const [activeGameId, setActiveGameId] = useState<string | null>(initialId);
  const [launchIntent, setLaunchIntent] = useState<Intent>(initialId ? "resume" : "start");
  const activeRef = useRef(activeGameId);
  activeRef.current = activeGameId;
  const exitGuard = useRef<(() => void) | null>(null);
  const registerExitGuard = useCallback((guard: (() => void) | null) => { exitGuard.current = guard; }, []);
  const activeGame = activeGameId ? getGameById(activeGameId) : undefined;
  const profile = useProfile();

  // Keep one hub entry directly under every game entry, so "back" from a game always lands on the hub.
  useEffect(() => {
    if (initialId) {
      // Idempotent: StrictMode runs this twice in development.
      if ((window.history.state as { id?: string } | null)?.id === initialId) return;
      window.history.replaceState(null, "", "/");
      window.history.pushState(GAME_STATE(initialId), "", gamePath(initialId));
      recordRecentGame(initialId, GAMES);
    } else if (window.location.pathname !== "/") {
      window.history.replaceState(null, "", "/");
    }
  }, [initialId]);

  useEffect(() => {
    const onPop = () => {
      const target = gameIdFromPath(window.location.pathname, GAMES);
      const current = activeRef.current;
      if (target === current) return;
      if (current && exitGuard.current) {
        // Put the game back in the address bar and let it leave the way its own exit button does
        // (save first, stay on failure). It calls onExit, which steps back to the hub.
        window.history.pushState(GAME_STATE(current), "", gamePath(current));
        exitGuard.current();
        return;
      }
      exitGuard.current = null;
      if (target) { setLaunchIntent("resume"); recordRecentGame(target, GAMES); }
      setActiveGameId(target);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => { document.title = documentTitle(activeGame); }, [activeGame]);

  const selectGame = useCallback((gameId: string, intent: Intent = "start") => {
    const game = getGameById(gameId);
    if (!game || !isPlayable(game)) return;
    setLaunchIntent(intent);
    recordRecentGame(gameId, GAMES);
    exitGuard.current = null;
    // From the hub this adds a history entry; switching games from a result screen replaces it.
    if (activeRef.current) window.history.replaceState(GAME_STATE(gameId), "", gamePath(gameId));
    else window.history.pushState(GAME_STATE(gameId), "", gamePath(gameId));
    setActiveGameId(gameId);
  }, []);

  const exitGame = useCallback(() => {
    exitGuard.current = null;
    setActiveGameId(null);
    if ((window.history.state as { arcade?: string } | null)?.arcade === "game") window.history.back();
    else window.history.replaceState(null, "", "/");
  }, []);

  if (activeGame) {
    const { Component } = activeGame;
    const defaultCharacterImage = GAME_CHARACTER_IMAGES[activeGame.id] ?? profile.defaultCharacterImage;
    const gameProfile = { ...profile, defaultCharacterImage, characterImage: profile.characterId === DEFAULT_CHARACTER_ID ? defaultCharacterImage : profile.characterImage };
    return (
      <div className="relative h-full w-full">
        <GameErrorBoundary key={activeGame.id} title={activeGame.title} onExit={exitGame}>
          <Suspense fallback={<div className="flex h-full items-center justify-center text-sm" role="status">게임을 준비하고 있습니다…</div>}>
            <PlaySession.Provider value={{ games: GAMES, gameId: activeGame.id, selectGame, exit: exitGame }}>
              <ExitGuardSlot.Provider value={registerExitGuard}>
                <Component key={activeGame.id} onExit={exitGame} profile={gameProfile} launchIntent={launchIntent} />
              </ExitGuardSlot.Provider>
            </PlaySession.Provider>
          </Suspense>
        </GameErrorBoundary>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <Hub games={GAMES} onSelect={selectGame} profile={{ name: profile.name, characterImage: profile.characterImage }} />
    </div>
  );
}
