import { MOVES, WEAPONS, type Fighter, type Move } from './engine';
export type Point = [number, number, number];
export const WEAPON_LENGTH = { spatula: 86, swatter: 100, golf: 149 };
export const BODY = { upperArm: 44, forearm: 42, thigh: 60, shin: 58, shoulder: 72 };
export function photoSize(width: number, height: number, zoom = 1) {
  const factor = Math.min(180 / Math.max(1, width), 280 / Math.max(1, height)) * zoom;
  return { width: width * factor, height: height * factor };
}
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => t * t * (3 - 2 * t);
const clamp = (t: number) => Math.max(0, Math.min(1, t));
/**
 * Weapon angle is the rotation of a weapon pointing up: 0 is straight up, -PI/2 points at the opponent.
 * Each move swings through its own arc: wind-up angle -> contact angle -> follow-through angle.
 */
type Arc = { wind: number; contact: number; follow: number; windHand: [number, number]; contactY: number; lunge: number; lean: number };
const ARCS: Record<Move, Arc> = {
  jab: { wind: .55, contact: -Math.PI / 2, follow: -2.05, windHand: [18, 214], contactY: 192, lunge: 6, lean: .1 },
  heavy: { wind: 1.75, contact: -1.32, follow: -2.55, windHand: [-6, 236], contactY: 206, lunge: 16, lean: .22 },
  low: { wind: .35, contact: -2.02, follow: -2.6, windHand: [10, 150], contactY: 72, lunge: 10, lean: .32 },
  skill: { wind: -2.65, contact: -1.18, follow: .1, windHand: [24, 92], contactY: 168, lunge: 12, lean: .05 },
  ultimate: { wind: 2.3, contact: -Math.PI / 2, follow: -2.7, windHand: [-14, 248], contactY: 196, lunge: 26, lean: .28 },
};
/** Two-bone IK in the side plane; bend > 0 pushes the middle joint forward (knees), < 0 backward (elbows). */
function joint(start: Point, end: Point, upper: number, lower: number, bend: number): Point {
  const dx = end[0] - start[0], dy = end[1] - start[1], d = Math.min(Math.hypot(dx, dy), upper + lower - .01);
  const along = (upper * upper - lower * lower + d * d) / (2 * d || 1), height = Math.sqrt(Math.max(0, upper * upper - along * along));
  const ux = dx / (Math.hypot(dx, dy) || 1), uy = dy / (Math.hypot(dx, dy) || 1);
  return [start[0] + ux * along - uy * height * bend, start[1] + uy * along + ux * height * bend, (start[2] + end[2]) / 2];
}
export function fighterPose(f: Fighter, time = 0) {
  const action = f.action, spec = action ? MOVES[action.move] : null, speed = WEAPONS[f.weapon].speed;
  const arc = action ? ARCS[action.move] : null, length = WEAPON_LENGTH[f.weapon];
  const startup = spec ? spec.startup * speed : 1, duration = spec ? spec.duration * speed : 1;
  const progress = action ? action.elapsed / startup : 0;
  const recover = action && progress >= 1 ? clamp((action.elapsed - startup) / Math.max(.01, duration - startup)) : 0;
  // Anticipation takes the first half of startup, then the swing accelerates into contact.
  const wind = action ? progress < 1 ? ease(clamp(progress / .5)) : 0 : 0;
  const swing = action ? progress < 1 ? clamp((progress - .5) / .5) ** 2 : 1 : 0;
  const follow = action && progress >= 1 ? ease(clamp(recover / .35)) : 0;
  const back = action && progress >= 1 ? ease(clamp((recover - .35) / .65)) : 0;
  const strike = action ? progress < 1 ? swing : 1 - back : 0;

  const moving = Math.min(1, Math.abs(f.vx) / 170), stride = Math.sin(f.gait) * moving;
  const breathe = action || f.stun ? 0 : Math.sin(time * 3.4) * 2.2;
  const guard = !action && !f.stun && (f.input.guard || f.input.x * f.facing < 0);
  const crouch = action?.move === 'low' ? lerp(wind * 20, 50, swing) * (1 - back) : f.input.crouch && !action ? 46 : 0;
  const hurt = f.stun ? Math.min(1, f.stun / .2) : 0;
  const lunge = arc ? lerp(-wind * 7, arc.lunge, swing) * (1 - back) : 0;
  const lean = (arc ? lerp(-wind * .12, arc.lean, swing) * (1 - back) : 0) + moving * .05 * Math.sign(f.vx * f.facing) + (guard ? .08 : 0) + crouch * .004 - hurt * .28;

  const hip: Point = [lunge - hurt * 14, 116 - crouch + Math.abs(stride) * 3 + breathe * .5, 0];
  const shoulderCenter: [number, number] = [hip[0] + Math.sin(lean) * BODY.shoulder, hip[1] + Math.cos(lean) * BODY.shoulder];
  const shoulder: Point = [shoulderCenter[0] + 3, shoulderCenter[1] - 4, 21];
  const rearShoulder: Point = [shoulderCenter[0] - 3, shoulderCenter[1] - 4, -21];
  const head: Point = [shoulderCenter[0] + Math.sin(lean) * 36, shoulderCenter[1] + Math.cos(lean) * 36, 0];
  const headTilt = hurt * .35 - (arc ? swing * .08 * (1 - back) : 0);

  // Feet stay planted; heavy moves step in with the front foot instead of sliding the whole body.
  const step = arc ? Math.max(0, lunge) * 1.35 : 0;
  const frontFoot: Point = [36 + stride * 26 + step, Math.max(0, -stride) * 10 + 6, 18];
  const backFoot: Point = [-32 - stride * 26 - hurt * 10, Math.max(0, stride) * 10 + 6, -18];
  const frontKnee = joint([hip[0] + 5, hip[1] - 6, 12], frontFoot, BODY.thigh, BODY.shin, 1);
  const backKnee = joint([hip[0] - 5, hip[1] - 6, -12], backFoot, BODY.thigh, BODY.shin, 1);

  const guardHand: [number, number] = guard ? [40, 214 - crouch] : [42, 186 - crouch + breathe];
  const guardAngle = guard ? -.55 : .28;
  let weaponAngle = guardAngle, hand: [number, number] = [guardHand[0] + hip[0], guardHand[1]];
  if (arc && spec) {
    // At contact the weapon tip lands exactly on the move's reach, so visuals match the hitbox.
    const target = WEAPONS[f.weapon].range + spec.reach - 24;
    const contactHand: [number, number] = [target + Math.sin(arc.contact) * length, arc.contactY];
    const windHand: [number, number] = [arc.windHand[0] + hip[0], arc.windHand[1] - (action?.move === 'low' ? 0 : crouch)];
    if (progress < 1) {
      const start: [number, number] = [lerp(hand[0], windHand[0], wind), lerp(hand[1], windHand[1], wind)];
      weaponAngle = lerp(lerp(guardAngle, arc.wind, wind), arc.contact, swing);
      hand = [lerp(start[0], contactHand[0], swing), lerp(start[1], contactHand[1], swing)];
    } else {
      const through: [number, number] = [contactHand[0] + 10, contactHand[1] + (arc.follow > arc.contact ? 24 : -22)];
      const followAngle = lerp(arc.contact, arc.follow, follow), followHand: [number, number] = [lerp(contactHand[0], through[0], follow), lerp(contactHand[1], through[1], follow)];
      weaponAngle = lerp(followAngle, guardAngle, back);
      hand = [lerp(followHand[0], guardHand[0] + hip[0], back), lerp(followHand[1], guardHand[1], back)];
    }
  }
  if (hurt && !action) { weaponAngle += hurt * .9; hand = [hand[0] - hurt * 18, hand[1] + hurt * 12]; }
  const handPoint: Point = [hand[0], hand[1], 30];
  const elbow = joint(shoulder, handPoint, BODY.upperArm, BODY.forearm, -1);
  // The free hand counter-rotates: it pulls back while the weapon hand swings through.
  const rearHand: Point = guard ? [shoulderCenter[0] + 32, shoulderCenter[1] + 6, -10] : [shoulderCenter[0] + 22 - strike * 34, shoulderCenter[1] - 8 - strike * 26, -14];
  const rearElbow = joint(rearShoulder, rearHand, BODY.upperArm, BODY.forearm, -1);
  return { hip, lean, head, headTilt, frontFoot, backFoot, frontKnee, backKnee, shoulder, elbow, hand: handPoint, rearShoulder, rearElbow, rearHand, weaponAngle, strike, moving, swing: action && progress < 1 ? swing : action ? 1 - follow : 0 };
}
