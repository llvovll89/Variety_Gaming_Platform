import type { GameState, MemoryCard } from "./types";
import { ANIMAL_EMOJIS } from "./constants";

export class MemoryGameRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private cardSize: number = 80;
  private cardSpacing: number = 12;
  private gridCols: number = 3;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.calculateLayout();
  }

  private calculateLayout(): void {
    const canvasWidth = this.canvas.width;
    
    const padding = 20;
    const availableWidth = canvasWidth - padding * 2;
    
    // 화면 크기에 따라 그리드 칼럼 수 결정
    if (availableWidth > 400) {
      this.gridCols = 3;
    } else {
      this.gridCols = 2;
    }
    
    // 카드 크기 자동 계산
    this.cardSize = (availableWidth - this.cardSpacing * (this.gridCols - 1)) / this.gridCols;
  }

  render(state: GameState): void {
    // 배경
    this.ctx.fillStyle = "#fff9f0";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 제목
    this.drawTitle(state);

    // 카드들 그리기
    this.drawCards(state);

    // 메시지
    this.drawMessage(state);
  }

  private drawTitle(state: GameState): void {
    const padding = 16;
    const headerHeight = 120;
    
    // 밝은 배경 (그라디언트 제거 - 심플하게)
    this.ctx.fillStyle = "#fff5eb";
    this.ctx.fillRect(0, 0, this.canvas.width, headerHeight);
    
    // 하단 라인 (경계 표시)
    this.ctx.strokeStyle = "rgba(255, 111, 165, 0.2)";
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(0, headerHeight);
    this.ctx.lineTo(this.canvas.width, headerHeight);
    this.ctx.stroke();

    // 레벨 (상단)
    this.ctx.fillStyle = "#ff6fa5";
    this.ctx.font = "bold 52px sans-serif";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "top";
    this.ctx.fillText(`레벨 ${state.stage}`, this.canvas.width / 2, padding + 8);

    // 점수 (하단)
    this.ctx.font = "bold 16px sans-serif";
    this.ctx.fillStyle = "#888";
    this.ctx.textBaseline = "top";
    this.ctx.fillText(
      `점수: ${state.score} ⭐  |  최고: ${state.highScore} 🏆`,
      this.canvas.width / 2,
      padding + 68
    );
  }

  private drawCards(state: GameState): void {
    const startY = 120;
    
    
    const startX = (this.canvas.width - (this.gridCols * (this.cardSize + this.cardSpacing) - this.cardSpacing)) / 2;

    state.cards.forEach((card, index) => {
      const col = index % this.gridCols;
      const row = Math.floor(index / this.gridCols);
      const x = startX + col * (this.cardSize + this.cardSpacing);
      const y = startY + row * (this.cardSize + this.cardSpacing);

      this.drawCard(x, y, card);
    });
  }

  private drawCard(x: number, y: number, card: MemoryCard): void {
    const radius = 12;
    const borderWidth = 3;

    // 카드 배경색 (심플하게)
    if (card.isRevealed) {
      this.ctx.fillStyle = "#fff5f0"; // 매우 연한 핑크
    } else {
      this.ctx.fillStyle = "#ffffff"; // 흰색
    }

    // 카드 배경 (라운드 사각형)
    this.drawRoundRect(x, y, this.cardSize, this.cardSize, radius);
    this.ctx.fill();

    // 카드 테두리 (깔끔하게)
    this.ctx.strokeStyle = card.isRevealed ? "#ff9fb5" : "#d0d0d0";
    this.ctx.lineWidth = borderWidth;
    this.drawRoundRect(x, y, this.cardSize, this.cardSize, radius);
    this.ctx.stroke();

    // 카드 내용
    if (card.isRevealed) {
      // 동물 이모지
      this.ctx.font = `${this.cardSize * 0.52}px Arial`;
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.fillText(
        ANIMAL_EMOJIS[card.animal],
        x + this.cardSize / 2,
        y + this.cardSize / 2
      );
    } else {
      // 물음표
      this.ctx.fillStyle = "#ccc";
      this.ctx.font = `bold ${this.cardSize * 0.38}px sans-serif`;
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.fillText("?", x + this.cardSize / 2, y + this.cardSize / 2);
    }
  }

  private drawRoundRect(
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + width - radius, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.ctx.lineTo(x + width, y + height - radius);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.ctx.lineTo(x + radius, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.quadraticCurveTo(x, y, x + radius, y);
    this.ctx.closePath();
  }

  private drawMessage(state: GameState): void {
    const y = this.canvas.height - 45;
    
    // 메시지 텍스트만 (배경 제거)
    this.ctx.fillStyle = "#ff6fa5";
    this.ctx.font = "bold 18px sans-serif";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(state.message, this.canvas.width / 2, y);
  }

  getCardAt(x: number, y: number): number | null {
    const startY = 120;
    const gridRows = 4; // 최대 12개 카드 = 4행
    const startX = (this.canvas.width - (this.gridCols * (this.cardSize + this.cardSpacing) - this.cardSpacing)) / 2;

    for (let i = 0; i < this.gridCols * gridRows; i++) {
      const col = i % this.gridCols;
      const row = Math.floor(i / this.gridCols);
      const cardX = startX + col * (this.cardSize + this.cardSpacing);
      const cardY = startY + row * (this.cardSize + this.cardSpacing);

      if (
        x >= cardX &&
        x <= cardX + this.cardSize &&
        y >= cardY &&
        y <= cardY + this.cardSize
      ) {
        return i;
      }
    }

    return null;
  }
}
