import { Suspense, useState } from "react";
import Hub from "./platform/Hub";
import { GAMES, getGameById } from "./platform/gameRegistry";
import { useProfile } from "./shared/profile/useProfile";
import { DEFAULT_CHARACTER_ID, GAME_CHARACTER_IMAGES } from "./shared/profile/characters";

export default function App() {
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const activeGame = activeGameId ? getGameById(activeGameId) : undefined;
  const profile = useProfile();

  if (activeGame) {
    const { Component } = activeGame;
    const defaultCharacterImage = GAME_CHARACTER_IMAGES[activeGame.id] ?? profile.defaultCharacterImage;
    const gameProfile = { ...profile, defaultCharacterImage, characterImage: profile.characterId === DEFAULT_CHARACTER_ID ? defaultCharacterImage : profile.characterImage };
    return (
      <div className="relative h-full w-full">
        <Suspense fallback={<div className="flex h-full items-center justify-center text-sm" role="status">전장을 준비하고 있습니다…</div>}>
          <Component onExit={() => setActiveGameId(null)} profile={gameProfile} />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <Hub games={GAMES} onSelect={setActiveGameId} />
    </div>
  );
}
