import { UIStore } from "./uiStore";
import type { GameState, MemoryCard, AnimalType } from "./types";
import { GAME_CONFIG, ANIMALS } from "./constants";

export class MemoryGameEngine {
  uiStore: UIStore;
  private state: GameState;

  constructor() {
    this.state = {
      stage: 1,
      sequence: [],
      playerSequence: [],
      cards: this.generateCards(GAME_CONFIG.cardCounts[0]),
      isPlayingSequence: false,
      isPlayerTurn: false,
      gameOver: false,
      score: 0,
      highScore: this.loadHighScore(),
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
    this.state.status = "playing";
    this.state.isPlayingSequence = true;
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
    
    setTimeout(() => this.playSequence(), 500);
  }

  private addToSequence(): void {
    const randomIndex = Math.floor(Math.random() * this.state.cards.length);
    this.state.sequence.push(randomIndex);
  }

  private async playSequence(): Promise<void> {
    this.state.isPlayingSequence = true;
    this.state.isPlayerTurn = false;
    this.uiStore.publish(this.state);

    for (const cardIndex of this.state.sequence) {
      await this.delay(GAME_CONFIG.sequenceDelay);
      this.state.cards[cardIndex].isRevealed = true;
      this.uiStore.publish(this.state);

      await this.delay(GAME_CONFIG.cardAnimationDuration);
      this.state.cards[cardIndex].isRevealed = false;
      this.uiStore.publish(this.state);
    }

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
    setTimeout(() => {
      this.state.cards[cardIndex].isRevealed = false;
      this.uiStore.publish(this.state);
    }, GAME_CONFIG.cardAnimationDuration);

    // 틀린 경우
    if (cardIndex !== expectedIndex) {
      setTimeout(() => this.endGame(), 500);
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
      setTimeout(() => this.nextRound(), GAME_CONFIG.transitionDelay);
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
    
    setTimeout(() => this.startNewRound(), GAME_CONFIG.transitionDelay);
  }

  private endGame(): void {
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
      this.saveHighScore(this.state.highScore);
    }

    this.uiStore.publish(this.state);
  }

  togglePause(): void {
    if (this.state.status === "playing") {
      this.state.status = "paused";
      this.state.message = "⏸️ 일시정지 중...";
    } else if (this.state.status === "paused") {
      this.state.status = "playing";
      this.state.message = "▶️ 다시 시작!";
    }
    this.uiStore.publish(this.state);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private loadHighScore(): number {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("hachuping-memory-highscore");
      return stored ? parseInt(stored, 10) : 0;
    }
    return 0;
  }

  private saveHighScore(score: number): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("hachuping-memory-highscore", String(score));
    }
  }
}