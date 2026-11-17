import { useId } from 'react';
import { settingsStore, useSettings, type HintLevel } from './settings';

const HINTS: { id: HintLevel; label: string }[] = [
  { id: 'off', label: '끄기' },
  { id: 'gentle', label: '조금' },
  { id: 'full', label: '자세히' },
];

const percent = (value: number) => `${Math.round(value * 100)}%`;

/**
 * Arcade settings. With a gameId it also shows that game's own sound; `compact` keeps only sound,
 * for a pause screen.
 */
export function SettingsPanel({ gameId, gameTitle, compact = false }: { gameId?: string; gameTitle?: string; compact?: boolean }) {
  const settings = useSettings();
  const id = useId();
  const game = gameId ? settings.games[gameId] ?? {} : null;
  const gameVolume = game?.volume ?? 1;
  return (
    <div className="kit-settings" role="group" aria-label="설정">
      <label className="kit-setting" htmlFor={`${id}-sound`}>
        <span>소리<small>모든 게임에 적용돼요</small></span>
        <input id={`${id}-sound`} type="checkbox" checked={!settings.muted} onChange={event => settingsStore.set({ muted: !event.target.checked })} />
      </label>
      <label className="kit-setting" htmlFor={`${id}-volume`}>
        <span>전체 음량<small>{percent(settings.volume)}</small></span>
        <input id={`${id}-volume`} type="range" min={0} max={1} step={0.05} value={settings.volume} disabled={settings.muted} onChange={event => settingsStore.set({ volume: Number(event.target.value) })} />
      </label>
      {gameId && game && <>
        <label className="kit-setting" htmlFor={`${id}-game-sound`}>
          <span>{gameTitle ?? '이 게임'} 소리</span>
          <input id={`${id}-game-sound`} type="checkbox" checked={!game.muted} disabled={settings.muted} onChange={event => settingsStore.setGame(gameId, { muted: !event.target.checked })} />
        </label>
        <label className="kit-setting" htmlFor={`${id}-game-volume`}>
          <span>{gameTitle ?? '이 게임'} 음량<small>{percent(gameVolume)}</small></span>
          <input id={`${id}-game-volume`} type="range" min={0} max={1} step={0.05} value={gameVolume} disabled={settings.muted || game.muted} onChange={event => settingsStore.setGame(gameId, { volume: Number(event.target.value) })} />
        </label>
      </>}
      {!compact && <>
        <label className="kit-setting" htmlFor={`${id}-motion`}>
          <span>움직임 줄이기<small>화면 흔들림과 큰 애니메이션을 줄여요</small></span>
          <input id={`${id}-motion`} type="checkbox" checked={settings.motion === 'reduce'} onChange={event => settingsStore.set({ motion: event.target.checked ? 'reduce' : 'system' })} />
        </label>
        <label className="kit-setting" htmlFor={`${id}-haptics`}>
          <span>진동<small>지원하는 휴대폰에서만 울려요</small></span>
          <input id={`${id}-haptics`} type="checkbox" checked={settings.haptics} onChange={event => settingsStore.set({ haptics: event.target.checked })} />
        </label>
        <label className="kit-setting" htmlFor={`${id}-hints`}>
          <span>힌트<small>힌트를 주는 게임에 적용돼요</small></span>
          <select id={`${id}-hints`} value={settings.hints} onChange={event => settingsStore.set({ hints: event.target.value as HintLevel })}>
            {HINTS.map(hint => <option key={hint.id} value={hint.id}>{hint.label}</option>)}
          </select>
        </label>
      </>}
    </div>
  );
}
