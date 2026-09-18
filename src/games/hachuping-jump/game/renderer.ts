import { ITEMS } from "./items";
import type { ItemKind } from "./items";
import { STAGES, type Journey } from "./stages";
﻿import { GROUND_Y, ITEM_OFFSET, ITEM_RADIUS, LOGICAL_HEIGHT, LOGICAL_WIDTH, PIPE_WIDTH, PLAYER_RADIUS, PLAYER_X, STAR_RADIUS } from "./constants";
import type { Obstacle, ObstacleKind, PlayerState } from "./types";
import type { Rewards } from "./rewards";
import { drawImageTopCrop } from "../../../shared/canvasImage";

export interface LetterboxTransform { scale: number; offsetX: number; offsetY: number; viewportWidth: number; viewportHeight: number }
export function computeLetterboxTransform(viewportWidth: number, viewportHeight: number): LetterboxTransform {
  const scale = Math.min(viewportWidth / LOGICAL_WIDTH, viewportHeight / LOGICAL_HEIGHT);
  return { scale, offsetX: (viewportWidth - LOGICAL_WIDTH * scale) / 2, offsetY: (viewportHeight - LOGICAL_HEIGHT * scale) / 2, viewportWidth, viewportHeight };
}
function oval(c: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, color: string) {
  c.fillStyle = color; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fill();
}
function star(c: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  c.beginPath();
  for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2; const d = i % 2 ? r * .48 : r; const px = x + Math.cos(a) * d, py = y + Math.sin(a) * d; if (!i) c.moveTo(px, py); else c.lineTo(px, py); }
  c.closePath(); c.fillStyle = color; c.fill();
}
function face(c: CanvasRenderingContext2D, x: number, y: number) {
  oval(c, x - 9, y, 2.3, 3.4, '#674b68'); oval(c, x + 9, y, 2.3, 3.4, '#674b68');
  oval(c, x - 16, y + 6, 5, 2.8, '#f89ea8'); oval(c, x + 16, y + 6, 5, 2.8, '#f89ea8');
  c.strokeStyle = '#674b68'; c.lineWidth = 1.5; c.beginPath(); c.arc(x, y + 4, 4, .15, Math.PI - .15); c.stroke();
}
function cloud(c: CanvasRenderingContext2D, x: number, y: number, size: number) {
  c.save(); c.translate(x, y); c.scale(size, size);
  oval(c, 0, 9, 42, 15, '#ffffffcc'); oval(c, -18, 0, 21, 20, '#ffffffcc'); oval(c, 12, -6, 25, 25, '#ffffffed'); c.restore();
}
function landscape(c: CanvasRenderingContext2D, distance: number, stageIndex: number) {
  const stage = STAGES[stageIndex];
  const sky = c.createLinearGradient(0, 0, 0, LOGICAL_HEIGHT); sky.addColorStop(0, stage.sky[0]); sky.addColorStop(.6, stage.sky[1]); sky.addColorStop(1, stage.sky[2]);
  c.fillStyle = sky; c.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
  oval(c, 320, 115, 42, 42, '#fff1b5'); oval(c, 320, 115, 33, 33, '#fff9d9'); face(c, 320, 116);
  c.save(); c.globalAlpha = stage.theme === 'garden' ? .26 : stage.theme === 'rainbow' ? .2 : .08; const rainbow = ['#ee8fa7', '#ffc775', '#fff8ac', '#92d6bb', '#97cde5'];
  rainbow.forEach((color, i) => { c.strokeStyle = color; c.lineWidth = 9; c.beginPath(); c.arc(195, 405, 190 - i * 9, Math.PI, 0); c.stroke(); }); c.restore();
  for (let i = 0; i < 6; i++) { const x = ((i * 113 - distance * .12) % 560 + 560) % 560 - 70; cloud(c, x, 180 + (i % 3) * 95, .6 + (i % 2) * .3); }
  for (let layer = 0; layer < 2; layer++) for (let i = -1; i < 5; i++) {
    const x = i * 170 - (distance * (.15 + layer * .13)) % 170;
    oval(c, x, GROUND_Y + 25, 125, 110 - layer * 38, stage.hills[layer]);
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
    for (let i = 0; i < 3; i++) { c.strokeStyle = ['#9cf6c9','#c9adff','#a4eff5'][i]; c.lineWidth = 22; c.beginPath(); c.moveTo(-30, 150 + i * 30); c.bezierCurveTo(130, 20 + i * 40, 260, 320 - i * 40, 430, 100 + i * 40); c.stroke(); } c.restore();
    for (let i = 0; i < 6; i++) { const x = i * 90 - distance * .18 % 90; c.fillStyle = '#d9f7f1aa'; c.beginPath(); c.moveTo(x, 630); c.lineTo(x + 22, 505 - i % 2 * 45); c.lineTo(x + 44, 630); c.fill(); }
  }
  if (stage.theme === 'toy') {
    for (let i = 0; i < 7; i++) {
      const x = i * 78 - distance * .18 % 78;
      c.fillStyle = i % 2 ? '#f8d27eaa' : '#dc8c88aa'; c.fillRect(x, 530, 40, 110);
      c.fillStyle = '#fff0c9cc'; c.beginPath(); c.moveTo(x - 4, 530); c.lineTo(x + 20, 498 - i % 3 * 8); c.lineTo(x + 44, 530); c.fill();
      oval(c, x + 20, 555, 7, 7, '#77566f');
    }
  }
  if (stage.theme === 'palace') {
    for (let i = 0; i < 35; i++) star(c, (i * 67 + 13) % 400, 100 + (i * 43) % 470, i % 3 + 1, '#ffebbfaa');
    for (let i = 0; i < 6; i++) { const x = i * 95 - distance * .15 % 95; c.fillStyle = '#af98bdaa'; c.fillRect(x, 525, 32, 115); c.beginPath(); c.moveTo(x - 5,525); c.lineTo(x+16,490); c.lineTo(x+37,525); c.fill(); star(c,x+16,485,6,'#ffe5a5'); }
  }
  if (stage.theme === 'rainbow') {
    c.save(); c.globalAlpha = .42;
    for (let i = 0; i < 5; i++) { c.strokeStyle = ['#f399ad','#ffcf83','#fff3a5','#9be0c1','#9dcff2'][i]; c.lineWidth = 10; c.beginPath(); c.arc(205, 440, 210 - i * 10, Math.PI, 0); c.stroke(); }
    c.restore();
    for (let i = 0; i < 30; i++) star(c, (i * 83 + 29) % 420, 90 + (i * 47) % 470, i % 3 + 1, '#fff4cfbb');
  }

}
function pillar(c: CanvasRenderingContext2D, x: number, y: number, h: number, hue: number, top: boolean, kind: ObstacleKind) {
  if (h <= 0) return;
  if (kind === 'mushroom') {
    c.fillStyle = '#fff0d0'; c.fillRect(x + 22, y + 35, 26, h - 35);
    c.fillStyle = '#ebcfa8'; c.fillRect(x + 40, y + 45, 8, h - 45);
    oval(c, x + 35, y + 35, 35, 35, '#d9779a');
    oval(c, x + 22, y + 17, 8, 6, '#fff4e0'); oval(c, x + 49, y + 26, 7, 5, '#fff4e0');
    face(c, x + 35, y + 43); return;
  }
  if (kind === 'cloud') hue = 195;
  if (kind === 'crystal') hue = 240;
  c.save(); const path = new Path2D(); path.roundRect(x, y, PIPE_WIDTH, h, PIPE_WIDTH / 2);
  const g = c.createLinearGradient(x, 0, x + PIPE_WIDTH, 0); g.addColorStop(0, `hsl(${hue} 55% 66%)`); g.addColorStop(.32, `hsl(${hue} 85% 89%)`); g.addColorStop(1, `hsl(${hue} 58% 72%)`);
  c.fillStyle = g; c.fill(path); c.strokeStyle = `hsl(${hue} 40% 56%)`; c.lineWidth = 2; c.stroke(path);
  c.clip(path); c.strokeStyle = '#ffffff66'; c.lineWidth = 13;
  if (kind === "candy") for (let sy = y - 70; sy < y + h + 70; sy += 43) { c.beginPath(); c.moveTo(x - 10, sy + 38); c.lineTo(x + PIPE_WIDTH + 10, sy); c.stroke(); }
  if (kind === 'cloud') for (let sy = y + 20; sy < y + h; sy += 36) { oval(c, x + 20, sy, 27, 23, '#ffffffbb'); oval(c, x + 53, sy + 13, 25, 22, '#e4faff'); }
  if (kind === 'crystal') { c.fillStyle = '#ffffff88'; c.beginPath(); c.moveTo(x + 35,y); c.lineTo(x + 58,y + h / 2); c.lineTo(x + 35,y + h); c.lineTo(x + 15,y + h / 2); c.closePath(); c.fill(); c.strokeStyle = '#eeeaff'; c.lineWidth = 1; c.stroke(); }
  const tip = top ? y + h - 33 : y + 33;
  oval(c, x + 35, tip, 29, 25, `hsl(${hue} 85% 91%)`); face(c, x + 35, tip - 2);
  c.fillStyle = '#ffffff80'; c.beginPath(); c.roundRect(x + 9, y + 25, 5, Math.max(1, h - 65), 3); c.fill(); c.restore();
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
export function renderJump(c: CanvasRenderingContext2D, t: LetterboxTransform, obstacles: Obstacle[], player: PlayerState, image: HTMLImageElement | null, distance: number, flapFx: number, rewards: Rewards, journey: Journey): void {
  c.fillStyle = STAGES[journey.stage].sky[0]; c.fillRect(0, 0, t.viewportWidth, t.viewportHeight);
  c.save(); c.translate(t.offsetX, t.offsetY); c.scale(t.scale, t.scale); c.beginPath(); c.rect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT); c.clip();
  landscape(c, distance, journey.stage);
  for (const o of obstacles) {
    if (o.kind !== "mushroom") pillar(c, o.x, -35, o.gapCenterY - o.gapHeight / 2 + 35, o.hue, true, o.kind);
    const bottom = o.gapCenterY + o.gapHeight / 2; pillar(c, o.x, bottom, GROUND_Y - bottom + 35, o.hue, false, o.kind);
    const pulse = Math.sin(distance * .025 + o.id);
    if (o.star && !o.star.collected) { const x = o.x + PIPE_WIDTH / 2; oval(c, x, o.star.y, 23 + pulse * 2, 23 + pulse * 2, '#fff8bd88'); star(c, x, o.star.y, STAR_RADIUS + 3, '#dc962e'); star(c, x, o.star.y - 1, STAR_RADIUS + 1, '#ffdc65'); star(c, x - 2, o.star.y - 4, 3, '#fff9dc'); }
    if (o.item && !o.item.collected) item(c, o.x - ITEM_OFFSET, o.gapCenterY, o.item.kind, pulse);
  }
  c.fillStyle = STAGES[journey.stage].ground; c.fillRect(0, GROUND_Y, 400, 60); c.fillStyle = STAGES[journey.stage].frosting; c.fillRect(0, GROUND_Y, 400, 13);
  for (let i = -1; i < 15; i++) { const x = i * 32 - distance % 32; oval(c, x, GROUND_Y + 12, 17, 9, STAGES[journey.stage].frosting); oval(c, x + 8, GROUND_Y + 40, 3, 2, '#d3a480'); }
  const x = PLAYER_X, y = player.y;
  for (let i = 1; i <= 4; i++) star(c, x - 18 - i * 11, y + Math.sin(distance * .04 - i) * 5, (5 - i) * 1.4, '#ffffffaa');
  if (rewards.magnetTime > 0) { c.save(); c.setLineDash([4, 7]); c.strokeStyle = '#d86eaa77'; c.lineWidth = 1.5; c.beginPath(); c.arc(x, y, 44, 0, Math.PI * 2); c.stroke(); c.restore(); }
  if (rewards.shieldTime > 0) { c.save(); c.globalAlpha = rewards.shieldTime < 1.5 ? .55 + Math.sin(distance * .14) * .25 : 1; oval(c, x, y, 29, 29, '#bdf8ff88'); c.strokeStyle = '#fff'; c.lineWidth = 2.5; c.stroke(); oval(c, x - 12, y - 16, 7, 3, '#fff'); c.restore(); }
  if (flapFx > .01) { c.strokeStyle = `rgba(255,255,255,${flapFx * .6})`; c.lineWidth = 2; c.beginPath(); c.arc(x, y, 20 + (1 - flapFx) * 16, 0, Math.PI * 2); c.stroke(); }
  c.save(); c.translate(x, y); c.rotate(player.rotation); oval(c, 0, 0, PLAYER_RADIUS + 2, PLAYER_RADIUS + 2, '#fffaf6');
  c.beginPath(); c.arc(0, 0, PLAYER_RADIUS, 0, Math.PI * 2); c.clip();
  if (image && image.complete && image.naturalWidth > 0) drawImageTopCrop(c, image, -PLAYER_RADIUS, -PLAYER_RADIUS, PLAYER_RADIUS * 2);
  else { oval(c, 0, 0, PLAYER_RADIUS, PLAYER_RADIUS, '#ffc4db'); face(c, 0, -3); } c.restore();
  for (const fx of rewards.effects) { c.save(); c.globalAlpha = Math.min(1, fx.life * 2); c.font = 'bold 17px Pretendard, sans-serif'; c.textAlign = 'center'; c.strokeStyle = '#fff'; c.lineWidth = 4; c.strokeText(fx.text, fx.x, fx.y - 18); c.fillStyle = fx.color; c.fillText(fx.text, fx.x, fx.y - 18); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; star(c, fx.x + Math.cos(a) * (1 - fx.life) * 45, fx.y + Math.sin(a) * (1 - fx.life) * 35, fx.life * 4, '#ffd060'); } c.restore(); }
  c.restore();
}
