import type { Input } from './engine';

/** Arrows belong to player one in solo mode, and player two in local mode. */
export function movementInput(pressed: (code: string) => boolean, mode: 'cpu' | 'local', player: 0 | 1): Input {
  const arrows = player === 1 || mode === 'cpu';
  const wasd = player === 0;
  const left = (wasd && pressed('KeyA')) || (arrows && pressed('ArrowLeft'));
  const right = (wasd && pressed('KeyD')) || (arrows && pressed('ArrowRight'));
  return {
    x: Number(right) - Number(left),
    z: player === 0 ? Number(pressed('KeyE')) - Number(pressed('KeyQ')) : Number(pressed('End')) - Number(pressed('Home')),
    guard: player === 0 ? pressed('ShiftLeft') || pressed('ShiftRight') || pressed('Space') || pressed('KeyO') : pressed('Digit0') || pressed('Numpad0'),
    crouch: (wasd && (pressed('KeyS') || pressed('KeyC'))) || (arrows && pressed('ArrowDown')) || (player === 1 && (pressed('Period') || pressed('NumpadDecimal'))),
    jump: (wasd && pressed('KeyW')) || (arrows && pressed('ArrowUp')),
  };
}
