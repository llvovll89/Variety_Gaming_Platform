// Local QA entry point: the production registry continues to disable both games.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Memory from '../../../src/games/hachuping-memory/HachupingMemoryApp';
import Color from '../../../src/games/hachuping-color-match/HachupingColorMatchApp';
import { useProfile } from '../../../src/shared/profile/useProfile';
import '../../../src/index.css';
function Harness() {
  const profile = useProfile();
  const Game = new URLSearchParams(location.search).get('game') === 'color' ? Color : Memory;
  return <Game profile={profile} onExit={() => { document.body.dataset.exited = 'true'; }} />;
}
createRoot(document.getElementById('root')!).render(<StrictMode><Harness/></StrictMode>);
