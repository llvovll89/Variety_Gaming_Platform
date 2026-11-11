import { UIStore } from "./uiStore";
import type { GameState, MemoryCard, AnimalType } from "./types";
import { GAME_CONFIG, ANIMALS } from "./constants";
type Task = { run: () => void; remaining: number; startedAt: number; timer: ReturnType<typeof setTimeout> | null };

export class MemoryGameEngine {
  uiStore: UIStore;
  private state: GameState;
  private tasks = new Set<Task>();
  private destroyed = false;

  constructor(bestScore = 0) {
    this.state = {
      stage: 1,
      sequence: [],
      playerSequence: [],
      cards: this.generateCards(GAME_CONFIG.cardCounts[0]),
      isPlayingSequence: false,
      isPlayerTurn: false,
      gameOver: false,
      score: 0,
      highScore: Number.isFinite(bestScore) && bestScore >= 0 ? Math.floor(bestScore) : 0,
      message: "시작하세요!",
      status: "idle",
    };
    this.uiStore = new UIStore(this.state);
  }

  private generateCards(count: number): MemoryCard[] {
    const cards: MemoryCard[] = [];
    const animalCount = Math.ceil(count / 2);
    const animals: AnimalType[] = [];

    for (let i = 0; i < animalCount; i++) {
      animals.push(ANIMALS[i % ANIMALS.length]);
    }

    let cardId = 0;
    for (const animal of animals) {
      cards.push({ id: cardId++, animal, isRevealed: false });
      if (cards.length < count) {
        cards.push({ id: cardId++, animal, isRevealed: false });
      }
    }

    return this.shuffle(cards);
  }

  private shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  startGame(): void {
    if (this.destroyed) return;
    this.cancelTasks();
    this.state.status = "playing";
    this.state.isPlayingSequence = true;
    this.state.isPlayerTurn = false;
    this.state.playerSequence = [];
    this.state.score = 0;
    this.state.gameOver = false;
    this.state.stage = 1;
    this.state.sequence = [];
    this.state.cards = this.generateCards(GAME_CONFIG.cardCounts[0]);
    this.uiStore.publish(this.state);
    this.startNewRound();
  }

  private startNewRound(): void {
    this.state.isPlayingSequence = true;
    this.state.isPlayerTurn = false;
    // 모든 카드 숨기기
    this.state.cards.forEach((card) => {
      card.isRevealed = false;
    });
    
    this.addToSequence();
    const messages = [
      "🐱 패턴을 잘 봐요...",
      "🐰 집중해봐요!",
      "🐻 준비됐어?",
      "🦊 다음이 뭘까?",
      "🐼 눈을 떠 봐요!",
    ];
    this.state.message = messages[Math.floor(Math.random() * messages.length)];
    this.uiStore.publish(this.state);
    
    this.schedule(() => this.playSequence(), 500);
  }

  private addToSequence(): void {
    const randomIndex = Math.floor(Math.random() * this.state.cards.length);
    this.state.sequence.push(randomIndex);
  }

  private playSequence(index = 0): void {
    this.state.isPlayingSequence = true;
    this.state.isPlayerTurn = false;
    this.uiStore.publish(this.state);

    const cardIndex = this.state.sequence[index];
    this.schedule(() => {
      this.state.cards[cardIndex].isRevealed = true;
      this.uiStore.publish(this.state);
      this.schedule(() => {
        this.state.cards[cardIndex].isRevealed = false;
        this.uiStore.publish(this.state);
        if (index + 1 < this.state.sequence.length) this.playSequence(index + 1);
        else this.beginPlayerTurn();
      }, GAME_CONFIG.cardAnimationDuration);
    }, GAME_CONFIG.sequenceDelay);
  }

  private beginPlayerTurn(): void {
    this.state.isPlayingSequence = false;
    this.state.isPlayerTurn = true;
    this.state.playerSequence = [];
    const turnMessages = [
      "👉 너의 차례! 따라해봐 🎵",
      "✋ 클릭해봐! 🎮",
      "🎯 정확하게 따라해!",
      "⚡ 빠르게 따라해!",
    ];
    this.state.message = turnMessages[Math.floor(Math.random() * turnMessages.length)];
    this.uiStore.publish(this.state);
  }

  playerClickCard(cardIndex: number): void {
    if (
      this.destroyed || !Number.isInteger(cardIndex) || !this.state.cards[cardIndex] ||
      !this.state.isPlayerTurn ||
      this.state.isPlayingSequence ||
      this.state.gameOver ||
      this.state.status !== "playing"
    ) {
      return;
    }

    const expectedIndex = this.state.sequence[this.state.playerSequence.length];
    this.state.playerSequence.push(cardIndex);
    this.state.cards[cardIndex].isRevealed = true;
    this.uiStore.publish(this.state);

    // 카드를 잠깐 보여줬다가 숨기기
    this.schedule(() => {
      this.state.cards[cardIndex].isRevealed = false;
      this.uiStore.publish(this.state);
    }, GAME_CONFIG.cardAnimationDuration);

    // 틀린 경우
    if (cardIndex !== expectedIndex) {
      this.state.isPlayerTurn = false;
      this.uiStore.publish(this.state);
      this.schedule(() => this.endGame(), 500);
      return;
    }

    // 이 라운드의 시퀀스를 모두 맞힌 경우
    if (this.state.playerSequence.length === this.state.sequence.length) {
      this.state.isPlayerTurn = false;
      const winMessages = [
        "🎉 완벽해! 다음 라운드!",
        "⭐ 정답! 잘했어!",
        "🌟 우와! 다시 해봐!",
        "🏆 대단해! 계속해봐!",
      ];
      this.state.message = winMessages[Math.floor(Math.random() * winMessages.length)];
      this.uiStore.publish(this.state);
      
      // 다음 라운드로
      this.schedule(() => this.nextRound(), GAME_CONFIG.transitionDelay);
      return;
    }
  }

  private nextRound(): void {
    this.state.score++;
    
    // 난이도 올리기 (5라운드마다)
    if (this.state.score > 0 && this.state.score % 5 === 0 && this.state.stage < 5) {
      this.state.stage++;
      this.state.cards = this.generateCards(GAME_CONFIG.cardCounts[this.state.stage - 1]);
      this.state.sequence = [];
      this.state.message = `🎉 레벨 ${this.state.stage} 시작!`;
    } else {
      this.state.message = "다음 패턴...";
    }

    this.uiStore.publish(this.state);
    
    this.schedule(() => this.startNewRound(), GAME_CONFIG.transitionDelay);
  }

  private endGame(): void {
    this.cancelTasks();
    this.state.gameOver = true;
    this.state.isPlayerTurn = false;
    this.state.isPlayingSequence = false;
    let endMessage = `게임 끝! ${this.state.score}점을 얻었어! 🎮`;
    if (this.state.score >= 10) {
      endMessage = `대단해! ${this.state.score}점! 🏆🌟`;
    } else if (this.state.score >= 5) {
      endMessage = `좋아! ${this.state.score}점! 👏`;
    }
    this.state.message = endMessage;
    this.state.status = "game-over";

    if (this.state.score > this.state.highScore) {
      this.state.highScore = this.state.score;
    }

    this.uiStore.publish(this.state);
  }

  togglePause(): void {
    if (this.destroyed) return;
    if (this.state.status === "playing") {
      for (const task of this.tasks) {
        if (task.timer !== null) clearTimeout(task.timer);
        task.timer = null;
        task.remaining = Math.max(0, task.remaining - (Date.now() - task.startedAt));
      }
      this.state.status = "paused";
      this.state.message = "⏸️ 일시정지 중...";
    } else if (this.state.status === "paused") {
      this.state.status = "playing";
      this.state.message = "▶️ 다시 시작!";
      for (const task of this.tasks) this.arm(task);
    } else return;
    this.uiStore.publish(this.state);
  }

  private schedule(run: () => void, remaining: number): void {
    if (this.destroyed) return;
    const task: Task = { run, remaining, startedAt: Date.now(), timer: null };
    this.tasks.add(task);
    if (this.state.status === 'playing') this.arm(task);
  }

  private arm(task: Task): void {
    task.startedAt = Date.now();
    task.timer = setTimeout(() => {
      if (!this.tasks.delete(task) || this.destroyed || this.state.status !== 'playing') return;
      task.timer = null; task.run();
    }, task.remaining);
  }

  private cancelTasks(): void {
    for (const task of this.tasks) if (task.timer !== null) clearTimeout(task.timer);
    this.tasks.clear();
  }

  destroy(): void { this.destroyed = true; this.cancelTasks(); }
}
