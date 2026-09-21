import { GAME_TOTAL_TIME, MOLE_GRID_COLS, MOLE_GRID_ROWS, POINTS_PER_HIT, HIT_FLASH_DURATION, DIFFICULTY_CONFIGS, DEFAULT_DIFFICULTY, type DifficultyLevel } from './constants';
import { UIStore } from './uiStore';
import type { GameState } from './types';
import { playHitSound, playGameOverSound } from './sound';

export class WhackAMoleEngine {
  readonly uiStore = new UIStore();
  private gameState: GameState;
  private hitTimers = new Map<number, number>();
  private rafId: number | null = null;
  private lastTime: number | null = null;
  private resumeStatus: 'ready' | 'playing' = 'playing';
  private uiTimer = 0;
  private muted = false;
  constructor(private bestScore: number, private onGameOver: (score: number) => void, private difficulty: DifficultyLevel = DEFAULT_DIFFICULTY) {
    this.gameState = this.initialState(); this.publish();
  }
  private duration(active: boolean): number {
    const c = DIFFICULTY_CONFIGS[this.difficulty];
    const min = active ? c.moleActiveDurationMin : c.moleInactiveDurationMin;
    const max = active ? c.moleActiveDurationMax : c.moleInactiveDurationMax;
    return min + Math.random() * (max - min);
  }
  private initialState(): GameState {
    return { status: 'idle', score: 0, timeRemaining: GAME_TOTAL_TIME, countdown: 3, round: 1,
      totalMolesHit: 0, attempts: 0, combo: 0, bestCombo: 0, gameOver: false, finalScore: null, difficulty: this.difficulty,
      moles: Array.from({length: MOLE_GRID_COLS * MOLE_GRID_ROWS}, (_, id) => ({id, gridX: id % MOLE_GRID_COLS, gridY: Math.floor(id / MOLE_GRID_COLS), isActive: false, activeSince: 0, duration: this.duration(false)})) };
  }
  setMuted = (muted: boolean) => { this.muted = muted; };
  startGame = () => {
    this.destroy(); this.gameState = this.initialState(); this.gameState.status = 'ready';
    this.hitTimers.clear(); this.lastTime = null; this.publish(); this.rafId = requestAnimationFrame(this.loop);
  };
  pauseGame = () => {
    if (this.gameState.status !== 'playing' && this.gameState.status !== 'ready') return;
    this.resumeStatus = this.gameState.status; this.gameState.status = 'paused'; this.destroy(); this.publish();
  };
  resumeGame = () => {
    if (this.gameState.status !== 'paused') return;
    this.gameState.status = this.resumeStatus; this.lastTime = null; this.publish(); this.rafId = requestAnimationFrame(this.loop);
  };
  endGame = () => {
    if (this.gameState.gameOver) return;
    this.destroy(); this.gameState.status = 'game-over'; this.gameState.gameOver = true;
    this.gameState.finalScore = this.gameState.score;
    if (!this.muted) playGameOverSound(); this.publish(); this.onGameOver(this.gameState.score);
  };
  hitMole = (id: number): boolean => {
    const s = this.gameState;
    if (s.status !== 'playing') return false;
    const mole = s.moles.find(m => m.id === id);
    if (!mole) return false;
    s.attempts++;
    if (!mole.isActive) { s.combo = 0; this.publish(); return false; }
    s.score += POINTS_PER_HIT; s.totalMolesHit++; s.combo++; s.bestCombo = Math.max(s.bestCombo, s.combo);
    mole.isActive = false; mole.activeSince = 0; mole.duration = this.duration(false);
    this.hitTimers.set(id, HIT_FLASH_DURATION);
    if (!this.muted) playHitSound(); this.publish(); return true;
  };
  private loop = (now: number) => {
    this.rafId = null;
    const dt = this.lastTime === null ? 0 : Math.min((now - this.lastTime) / 1000, .05);
    this.lastTime = now; this.update(dt);
    if (this.gameState.status === 'playing' || this.gameState.status === 'ready') this.rafId = requestAnimationFrame(this.loop);
  };
  private update(dt: number) {
    const s = this.gameState;
    if (s.status === 'ready') {
      s.countdown = Math.max(0, s.countdown - dt);
      if (!s.countdown) s.status = 'playing';
      this.publish(); return;
    }
    if (s.status !== 'playing') return;
    s.timeRemaining = Math.max(0, s.timeRemaining - dt);
    if (!s.timeRemaining) { this.endGame(); return; }
    s.round = s.timeRemaining > 20 ? 1 : s.timeRemaining > 10 ? 2 : 3;
    for (const [id, timer] of this.hitTimers) {
      if (timer <= dt) this.hitTimers.delete(id); else this.hitTimers.set(id, timer - dt);
    }
    let active = s.moles.filter(m => m.isActive).length;
    // Rotate the traversal so low-index holes do not monopolize spawns.
    const first = Math.floor(Math.random() * s.moles.length);
    for (let i = 0; i < s.moles.length; i++) {
      const mole = s.moles[(first + i) % s.moles.length];
      mole.activeSince += dt;
      if (mole.activeSince < mole.duration) continue;
      if (mole.isActive) {
        mole.isActive = false; active--; s.combo = 0;
      } else {
        if (active >= DIFFICULTY_CONFIGS[this.difficulty].activeMoleCount || this.hitTimers.has(mole.id)) continue;
        mole.isActive = true; active++;
      }
      mole.activeSince = 0; mole.duration = this.duration(mole.isActive);
    }
    this.uiTimer += dt;
    if (this.uiTimer >= .06) { this.uiTimer = 0; this.publish(); }
  }
  private publish() {
    const {moles, gameOver: _gameOver, ...state} = this.gameState;
    this.uiStore.publish({...state, bestScore: this.bestScore, activeMoles: moles.filter(m => m.isActive).map(m => m.id)});
  }
  getMoleHitFlashAlpha = (id: number) => (this.hitTimers.get(id) ?? 0) / HIT_FLASH_DURATION;
  getGameState = () => this.gameState;
  destroy = () => { if (this.rafId !== null) cancelAnimationFrame(this.rafId); this.rafId = null; };
}
