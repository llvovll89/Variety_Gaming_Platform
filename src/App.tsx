import { useState } from "react";
import Hub from "./platform/Hub";
import { GAMES, getGameById } from "./platform/gameRegistry";
import { useProfile } from "./shared/profile/useProfile";

export default function App() {
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const activeGame = activeGameId ? getGameById(activeGameId) : undefined;
  const profile = useProfile();

  if (activeGame) {
    const { Component } = activeGame;
    return (
      <div className="relative h-full w-full">
        <Component onExit={() => setActiveGameId(null)} profile={profile} />
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <Hub games={GAMES} onSelect={setActiveGameId} />
    </div>
  );
}
