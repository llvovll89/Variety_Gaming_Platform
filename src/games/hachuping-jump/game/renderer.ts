import { ITEMS } from "./items";
import { drawObstacleModel } from "./obstacleModels";
import type { ItemKind } from "./items";
import { STAGES, type Journey } from "./stages";
﻿import { GROUND_Y, ITEM_OFFSET, ITEM_RADIUS, LOGICAL_HEIGHT, LOGICAL_WIDTH, PIPE_WIDTH, PLAYER_RADIUS, PLAYER_X, STAR_RADIUS } from "./constants";
import type { Obstacle, PlayerState } from "./types";
import type { Rewards } from "./rewards";
import { drawImageTopCrop } from "../../../shared/canvasImage";

export interface LetterboxTransform { scale: number; offsetX: number; offsetY: number; viewportWidth: number; viewportHeight: number }
export function computeLetterboxTransform(viewportWidth: number, viewportHeight: number): LetterboxTransform {
  const scale = Math.min(viewportWidth / LOGICAL_WIDTH, viewportHeight / LOGICAL_HEIGHT);
  return { scale, offsetX: (viewportWidth - LOGICAL_WIDTH * scale) / 2, offsetY: (viewportHeight - LOGICAL_HEIGHT * scale) / 2, viewportWidth, viewportHeight };
}
function oval(c: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, color: string | CanvasGradient) {
  c.fillStyle = color; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fill();
}
function star(c: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  c.beginPath();
  for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2; const d = i % 2 ? r * .48 : r; const px = x + Math.cos(a) * d, py = y + Math.sin(a) * d; if (!i) c.moveTo(px, py); else c.lineTo(px, py); }
  c.closePath(); c.fillStyle = color; c.fill();
}
function face(c: CanvasRenderingContext2D, x: number, y: number) {
  oval(c, x - 9, y, 2.3, 3.4, '#586268'); oval(c, x + 9, y, 2.3, 3.4, '#586268');
  oval(c, x - 16, y + 6, 5, 2.8, '#f89ea8'); oval(c, x + 16, y + 6, 5, 2.8, '#f89ea8');
  c.strokeStyle = '#586268'; c.lineWidth = 1.5; c.beginPath(); c.arc(x, y + 4, 4, .15, Math.PI - .15); c.stroke();
}
function cloud(c: CanvasRenderingContext2D, x: number, y: number, size: number) {
  c.save(); c.translate(x, y); c.scale(size, size);
  oval(c, 4, 18, 43, 14, '#b0b9d344');
  oval(c, 0, 9, 42, 15, '#ffffffcc'); oval(c, -18, 0, 21, 20, '#ffffffcc'); oval(c, 12, -6, 25, 25, '#ffffffed'); c.restore();
}
function landscape(c: CanvasRenderingContext2D, distance: number, stageIndex: number, backdrop: HTMLImageElement | null = null) {
  const stage = STAGES[stageIndex];
  const sky = c.createLinearGradient(0, 0, 0, LOGICAL_HEIGHT); sky.addColorStop(0, stage.sky[0]); sky.addColorStop(.6, stage.sky[1]); sky.addColorStop(1, stage.sky[2]);
  c.fillStyle = sky; c.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
  if (stage.theme === 'garden' && backdrop?.complete && backdrop.naturalWidth > 0) {
    c.save(); c.globalAlpha = .78;
    const sourceWidth = backdrop.naturalHeight * LOGICAL_WIDTH / LOGICAL_HEIGHT;
    c.drawImage(backdrop, (backdrop.naturalWidth - sourceWidth) / 2, 0, sourceWidth, backdrop.naturalHeight, 0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    c.restore();
  }
  oval(c, 320, 115, 42, 42, '#fff1b5'); oval(c, 320, 115, 33, 33, '#fff9d9'); face(c, 320, 116);
  c.save(); c.globalAlpha = stage.theme === 'garden' ? .26 : stage.theme === 'rainbow' ? .2 : .08; const rainbow = ['#ee8fa7', '#ffc775', '#fff8ac', '#92d6bb', '#97cde5'];
  rainbow.forEach((color, i) => { c.strokeStyle = color; c.lineWidth = 9; c.beginPath(); c.arc(195, 405, 190 - i * 9, Math.PI, 0); c.stroke(); }); c.restore();
  for (let i = 0; i < 6; i++) { const x = ((i * 113 - distance * .12) % 560 + 560) % 560 - 70; cloud(c, x, 180 + (i % 3) * 95, .6 + (i % 2) * .3); }
  for (let layer = 0; layer < 2; layer++) for (let i = -1; i < 5; i++) {
    const x = i * 170 - (distance * (.15 + layer * .13)) % 170;
    const hill = c.createLinearGradient(0, GROUND_Y - 100, 0, GROUND_Y + 35);
    hill.addColorStop(0, stage.hills[layer]); hill.addColorStop(1, stage.ground);
    oval(c, x, GROUND_Y + 25, 125, 110 - layer * 38, hill);
    if (layer && stage.theme === 'garden') { c.fillStyle = '#93c3ab'; c.fillRect(x + 30, 565, 7, 62); oval(c, x + 34, 565, 24, 35, '#b6dfb2'); oval(c, x + 25, 556, 13, 19, '#d1eabf'); }
  }
  if (stage.theme === 'forest') {
    for (let i = 0; i < 7; i++) {
      const x = i * 85 - distance * .2 % 85;
      c.fillStyle = '#e4d9b4'; c.fillRect(x - 5, 545, 10, 85);
      oval(c, x, 545, 29, 20, i % 2 ? '#dfabc6' : '#d8cc9b');
      oval(c, x - 10, 539, 5, 4, '#fff2da'); oval(c, x + 8, 548, 4, 3, '#fff2da');
    }
    for (let i = 0; i < 26; i++) oval(c, (i * 71 + Math.sin(distance * .006 + i) * 12) % 400, 220 + (i * 53) % 380, 2, 2, '#fff5a9bb');
  }
  if (stage.theme === 'ice') {
    c.save(); c.globalAlpha = .25;
    for (let i = 0; i < 3; i++) { c.strokeStyle = ['#9cf6c9','#ffe3bc','#a4eff5'][i]; c.lineWidth = 22; c.beginPath(); c.moveTo(-30, 150 + i * 30); c.bezierCurveTo(130, 20 + i * 40, 260, 320 - i * 40, 430, 100 + i * 40); c.stroke(); } c.restore();
    for (let i = 0; i < 6; i++) { const x = i * 90 - distance * .18 % 90; c.fillStyle = '#d9f7f1aa'; c.beginPath(); c.moveTo(x, 630); c.lineTo(x + 22, 505 - i % 2 * 45); c.lineTo(x + 44, 630); c.fill(); }
  }
  if (stage.theme === 'toy') {
    for (let i = 0; i < 7; i++) {
      const x = i * 78 - distance * .18 % 78;
      c.fillStyle = i % 2 ? '#f8d27eaa' : '#dc8c88aa'; c.fillRect(x, 530, 40, 110);
      c.fillStyle = '#fff0c9cc'; c.beginPath(); c.moveTo(x - 4, 530); c.lineTo(x + 20, 498 - i % 3 * 8); c.lineTo(x + 44, 530); c.fill();
      oval(c, x + 20, 555, 7, 7, '#718d96');
    }
  }
  if (stage.theme === 'palace') {
    for (let i = 0; i < 35; i++) star(c, (i * 67 + 13) % 400, 100 + (i * 43) % 470, i % 3 + 1, '#ffebbfaa');
    for (let i = 0; i < 6; i++) { const x = i * 95 - distance * .15 % 95; c.fillStyle = '#b4d5dfaa'; c.fillRect(x, 525, 32, 115); c.beginPath(); c.moveTo(x - 5,525); c.lineTo(x+16,490); c.lineTo(x+37,525); c.fill(); star(c,x+16,485,6,'#ffe5a5'); }
  }
  if (stage.theme === 'rainbow') {
    c.save(); c.globalAlpha = .42;
    for (let i = 0; i < 5; i++) { c.strokeStyle = ['#f399ad','#ffcf83','#fff3a5','#9be0c1','#9dcff2'][i]; c.lineWidth = 10; c.beginPath(); c.arc(205, 440, 210 - i * 10, Math.PI, 0); c.stroke(); }
    c.restore();
    for (let i = 0; i < 30; i++) star(c, (i * 83 + 29) % 420, 90 + (i * 47) % 470, i % 3 + 1, '#fff4cfbb');
  }

}
function item(c: CanvasRenderingContext2D, x: number, y: number, kind: ItemKind, pulse: number) {
  const color = ITEMS[kind].color;
  oval(c, x, y, ITEM_RADIUS + 7 + pulse * 2, ITEM_RADIUS + 7 + pulse * 2, kind === 'shield' ? '#d7faff88' : '#ffe0edaa');
  oval(c, x, y, ITEM_RADIUS, ITEM_RADIUS, '#fffdf9'); c.strokeStyle = color; c.lineWidth = 2; c.stroke();
  c.strokeStyle = color; c.lineWidth = 4; c.beginPath();
  if (kind === 'shield') { c.moveTo(x, y - 9); c.lineTo(x + 8, y - 5); c.quadraticCurveTo(x + 8, y + 6, x, y + 10); c.quadraticCurveTo(x - 8, y + 6, x - 8, y - 5); c.closePath(); }
  else if (kind === 'magnet') { c.moveTo(x - 7, y - 8); c.lineTo(x - 7, y + 2); c.arc(x, y + 2, 7, Math.PI, 0, true); c.lineTo(x + 7, y - 8); } c.stroke();
  if (kind !== "shield" && kind !== "magnet") { c.fillStyle = color; c.font = "bold 18px sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(ITEMS[kind].symbol, x, y + 1); c.textBaseline = "alphabetic"; }
}
export function renderJump(c: CanvasRenderingContext2D, t: LetterboxTransform, obstacles: Obstacle[], player: PlayerState, image: HTMLImageElement | null, distance: number, flapFx: number, rewards: Rewards, journey: Journey, backdrop: HTMLImageElement | null = null, reducedMotion = false): void {
  // Extend the same world behind the portrait playfield instead of flat letterbox bars.
  c.save();
  const backdropScale = Math.max(t.viewportWidth / LOGICAL_WIDTH, t.viewportHeight / LOGICAL_HEIGHT);
  c.translate((t.viewportWidth - LOGICAL_WIDTH * backdropScale) / 2, (t.viewportHeight - LOGICAL_HEIGHT * backdropScale) / 2);
  c.scale(backdropScale, backdropScale); landscape(c, reducedMotion ? 0 : distance * .4, journey.stage, backdrop); c.restore();
  c.fillStyle = '#fff0f433'; c.fillRect(0, 0, t.viewportWidth, t.viewportHeight);
  c.save(); c.shadowColor = '#86a9b633'; c.shadowBlur = 26; c.fillStyle = STAGES[journey.stage].sky[0];
  c.fillRect(t.offsetX, t.offsetY, LOGICAL_WIDTH * t.scale, LOGICAL_HEIGHT * t.scale); c.restore();
  c.save(); c.translate(t.offsetX, t.offsetY); c.scale(t.scale, t.scale); c.beginPath(); c.rect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT); c.clip();
  landscape(c, reducedMotion ? 0 : distance, journey.stage, backdrop);
  for (const o of obstacles) {
    if (o.kind !== "mushroom" && o.kind !== "flower") drawObstacleModel(c, o.x, 0, o.gapCenterY - o.gapHeight / 2, o.hue, true, o.kind);
    const bottom = o.gapCenterY + o.gapHeight / 2; drawObstacleModel(c, o.x, bottom, GROUND_Y - bottom, o.hue, false, o.kind);
    const pulse = reducedMotion ? 0 : Math.sin(distance * .025 + o.id);
    if (o.star && !o.star.collected) { const x = o.x + PIPE_WIDTH / 2; oval(c, x, o.star.y, 23 + pulse * 2, 23 + pulse * 2, '#fff8bd88'); star(c, x, o.star.y, STAR_RADIUS + 3, '#dc962e'); star(c, x, o.star.y - 1, STAR_RADIUS + 1, '#ffdc65'); star(c, x - 2, o.star.y - 4, 3, '#fff9dc'); }
    if (o.item && !o.item.collected) item(c, o.x - ITEM_OFFSET, o.gapCenterY, o.item.kind, pulse);
  }
  c.fillStyle = STAGES[journey.stage].ground; c.fillRect(0, GROUND_Y, 400, 60); c.fillStyle = STAGES[journey.stage].frosting; c.fillRect(0, GROUND_Y, 400, 13);
  for (let i = -1; i < 15; i++) { const x = i * 32 - distance % 32; oval(c, x, GROUND_Y + 12, 17, 9, STAGES[journey.stage].frosting); oval(c, x + 8, GROUND_Y + 40, 3, 2, '#d3a480'); }
  const x = PLAYER_X, y = player.y;
  // Contact shadow and a little winged toy shell add depth without changing physics.
  oval(c, x + 6, GROUND_Y + 10, 16 + (y / GROUND_Y) * 5, 4, '#80577422');
  for (let i = 1; i <= 4; i++) star(c, x - 18 - i * 11, y + Math.sin(distance * .04 - i) * 5, (5 - i) * 1.4, '#ffffffaa');
  if (rewards.magnetTime > 0) { c.save(); c.setLineDash([4, 7]); c.strokeStyle = '#d86eaa77'; c.lineWidth = 1.5; c.beginPath(); c.arc(x, y, 44, 0, Math.PI * 2); c.stroke(); c.restore(); }
  if (rewards.shieldTime > 0) { c.save(); c.globalAlpha = rewards.shieldTime < 1.5 ? .55 + Math.sin(distance * .14) * .25 : 1; oval(c, x, y, 29, 29, '#bdf8ff88'); c.strokeStyle = '#fff'; c.lineWidth = 2.5; c.stroke(); oval(c, x - 12, y - 16, 7, 3, '#fff'); c.restore(); }
  if (!reducedMotion && flapFx > .01) { c.strokeStyle = `rgba(255,255,255,${flapFx * .6})`; c.lineWidth = 2; c.beginPath(); c.arc(x, y, 20 + (1 - flapFx) * 16, 0, Math.PI * 2); c.stroke(); }
  c.save(); c.translate(x, y); c.rotate(player.rotation);
  oval(c, -20, 4 - flapFx * 6, 11, 5, '#c7b9d5'); oval(c, -21, 1 - flapFx * 6, 11, 5, '#fff9fc');
  oval(c, 17, 5 - flapFx * 5, 8, 4, '#c7b9d5'); oval(c, 18, 2 - flapFx * 5, 8, 4, '#fff9fc');
  oval(c, 2, 4, PLAYER_RADIUS + 2, PLAYER_RADIUS + 2, '#c482a5');
  const shell = c.createRadialGradient(-7, -9, 2, 0, 0, PLAYER_RADIUS + 2);
  shell.addColorStop(0, '#fff9fc'); shell.addColorStop(.7, '#ffe5ee'); shell.addColorStop(1, '#dda0bc');
  oval(c, 0, 0, PLAYER_RADIUS + 2, PLAYER_RADIUS + 2, shell);
  c.beginPath(); c.arc(0, 0, PLAYER_RADIUS, 0, Math.PI * 2); c.clip();
  if (image && image.complete && image.naturalWidth > 0) drawImageTopCrop(c, image, -PLAYER_RADIUS, -PLAYER_RADIUS, PLAYER_RADIUS * 2);
  else { oval(c, 0, 0, PLAYER_RADIUS, PLAYER_RADIUS, '#ffc4db'); face(c, 0, -3); } c.restore();
  for (const fx of rewards.effects) { c.save(); c.globalAlpha = Math.min(1, fx.life * 2); c.font = 'bold 17px Pretendard, sans-serif'; c.textAlign = 'center'; c.strokeStyle = '#fff'; c.lineWidth = 4; c.strokeText(fx.text, fx.x, fx.y - 18); c.fillStyle = fx.color; c.fillText(fx.text, fx.x, fx.y - 18); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; star(c, fx.x + Math.cos(a) * (1 - fx.life) * 45, fx.y + Math.sin(a) * (1 - fx.life) * 35, fx.life * 4, '#ffd060'); } c.restore(); }
  c.restore();
}
