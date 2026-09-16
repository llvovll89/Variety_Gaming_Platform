import { ITEMS } from "./items";
import { GROUND_Y, ITEM_OFFSET, ITEM_RADIUS, MAGNET_DURATION, MAGNET_RADIUS, PIPE_WIDTH, PLAYER_HITBOX_RADIUS, PLAYER_X, SHIELD_DURATION, STAR_BONUS_SCORE } from "./constants";
import { hitsGroundOrCeiling, hitsObstacle } from "./collision";
import { hitsStar } from "./star";
import type { Obstacle, PickupFx, PlayerState } from "./types";

export function createRewards() {
  return { score: 0, stars: 0, shieldTime: 0, magnetTime: 0, doubleTime: 0, slowTime: 0, hearts: 0, gates: 0, effects: [] as PickupFx[] };
}
export type Rewards = ReturnType<typeof createRewards>;

export function advanceRewards(rewards: Rewards, dt: number) {
  rewards.shieldTime = Math.max(0, rewards.shieldTime - dt);
  rewards.magnetTime = Math.max(0, rewards.magnetTime - dt);
  rewards.doubleTime = Math.max(0, rewards.doubleTime - dt);
  rewards.slowTime = Math.max(0, rewards.slowTime - dt);
  for (const fx of rewards.effects) { fx.life -= dt; fx.y -= dt * 24; }
  rewards.effects = rewards.effects.filter(fx => fx.life > 0);
}

export function resolveRewards(player: PlayerState, obstacles: Obstacle[], rewards: Rewards) {
  if (!player.alive) return;
  const burst = (x: number, y: number, text: string, color: string) => rewards.effects.push({ x, y, text, color, life: 1 });
  // Pickups resolve before damage so a collected shield protects on the same frame.
  for (const o of obstacles) {
    const itemX = o.x - ITEM_OFFSET;
    if (o.item && !o.item.collected && Math.hypot(itemX - PLAYER_X, o.gapCenterY - player.y) < ITEM_RADIUS + PLAYER_HITBOX_RADIUS) {
      o.item.collected = true;
      if (o.item.kind === "shield") rewards.shieldTime = SHIELD_DURATION;
      else if (o.item.kind === "magnet") rewards.magnetTime = MAGNET_DURATION;
      else if (o.item.kind === "double") rewards.doubleTime = 8;
      else if (o.item.kind === "slow") rewards.slowTime = 6;
      else if (o.item.kind === "heart") rewards.hearts = 1;
      else rewards.score += 50;
      burst(PLAYER_X, player.y - 35, ITEMS[o.item.kind].name, ITEMS[o.item.kind].color);
    }
    const starX = o.x + PIPE_WIDTH / 2;
    const attracted = o.star && !o.star.collected && rewards.magnetTime > 0 && Math.hypot(starX - PLAYER_X, o.star.y - player.y) < MAGNET_RADIUS;
    if (hitsStar(player.y, o) || attracted) {
      o.star!.collected = true;
      rewards.stars++;
      const points = STAR_BONUS_SCORE * (rewards.doubleTime > 0 ? 2 : 1);
      rewards.score += points;
      burst(starX, o.star!.y, `+${points}`, "#a66200");
    }
  }
  const collision = hitsGroundOrCeiling(player.y) || obstacles.some(o => hitsObstacle(player.y, o));
  if (collision && rewards.shieldTime <= 0 && rewards.hearts > 0) {
    rewards.hearts--;
    rewards.shieldTime = 2;
    burst(PLAYER_X, player.y - 35, ITEMS.heart.name, ITEMS.heart.color);
  }
  if (rewards.shieldTime > 0) {
    if (hitsGroundOrCeiling(player.y)) {
      player.y = Math.max(PLAYER_HITBOX_RADIUS, Math.min(GROUND_Y - PLAYER_HITBOX_RADIUS, player.y));
      player.vy = player.y > GROUND_Y / 2 ? -340 : 100;
    }
  } else if (collision) {
    player.alive = false;
    return;
  }
  for (const o of obstacles) {
    if (!o.passed && o.x + PIPE_WIDTH < PLAYER_X - PLAYER_HITBOX_RADIUS) {
      o.passed = true;
      rewards.score += rewards.doubleTime > 0 ? 2 : 1;
      rewards.gates++;
    }
  }
}
