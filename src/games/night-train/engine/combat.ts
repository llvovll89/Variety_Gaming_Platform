import { cardName, cardStats, needsTarget } from './cards';
import { ENEMIES } from './enemies';
import { random, randInt, shuffle } from './rng';
import { SNACKS } from './snacks';
import type { CombatState, Effect, EnemyState, Fx, FxTarget, RunState, StatusId, Statuses } from './types';

export const HAND_LIMIT = 10;
export const BASE_DRAW = 5;
export const BASE_ENERGY = 3;

const DECAYING = ['weak', 'vulnerable'] as const;

/** Final per-hit attack damage, shared by the rules and the card text preview. */
export function attackDamage(base: number, attacker: Statuses, defender?: Statuses) {
  let damage = base + (attacker.strength ?? 0);
  if (attacker.weak) damage *= 0.75;
  if (defender?.vulnerable) damage *= 1.5;
  return Math.max(0, Math.floor(damage));
}

export function aliveEnemies(combat: CombatState) {
  return combat.enemies.filter(enemy => enemy.hp > 0);
}

function fx(run: RunState, combat: CombatState, target: FxTarget, kind: Fx['kind'], amount: number, label?: string) {
  run.fxSeq += 1;
  combat.fx.push({ id: run.fxSeq, target, kind, amount, label });
}

function log(combat: CombatState, text: string) {
  combat.log.push(text);
  if (combat.log.length > 30) combat.log.splice(0, combat.log.length - 30);
}

function addStatus(statuses: Statuses, status: StatusId, amount: number) {
  statuses[status] = (statuses[status] ?? 0) + amount;
  if ((statuses[status] ?? 0) <= 0) delete statuses[status];
}

export function enemyName(enemy: EnemyState) {
  return ENEMIES[enemy.defId].name;
}

/** Captures the board after one beat of the enemy turn, together with the effects of that beat. */
function frame(run: RunState, combat: CombatState, actor: 'player' | number, label: string, since: number) {
  combat.frames.push({
    actor, label, fx: combat.fx.slice(since), hp: run.hp, block: combat.player.block,
    playerStatuses: { ...combat.player.statuses },
    enemies: combat.enemies.map(e => ({ uid: e.uid, hp: e.hp, block: e.block, statuses: { ...e.statuses }, intent: e.intent })),
  });
}

function damageEnemy(run: RunState, combat: CombatState, enemy: EnemyState, amount: number, pierce = false) {
  if (enemy.hp <= 0) return;
  let rest = amount;
  if (!pierce && enemy.block > 0) {
    const absorbed = Math.min(enemy.block, rest);
    enemy.block -= absorbed;
    rest -= absorbed;
    if (absorbed > 0 && rest === 0) fx(run, combat, enemy.uid, 'blocked', absorbed);
  }
  if (rest > 0) {
    const dealt = Math.min(enemy.hp, rest);
    enemy.hp -= dealt;
    run.stats.damageDealt += dealt;
    fx(run, combat, enemy.uid, 'damage', rest);
  }
  if (enemy.hp <= 0) {
    enemy.hp = 0;
    enemy.block = 0;
    log(combat, `${enemyName(enemy)}을(를) 물리쳤습니다.`);
    return;
  }
  const def = ENEMIES[enemy.defId];
  if (def.kind === 'boss' && !enemy.enraged && enemy.hp <= enemy.maxHp / 2) {
    enemy.enraged = true;
    enemy.intent = 'rampage';
    log(combat, `${def.name}이(가) 폭주하기 시작합니다!`);
  }
}

function applyToEnemy(run: RunState, combat: CombatState, enemy: EnemyState, status: StatusId, amount: number) {
  if (enemy.hp <= 0) return;
  const bonus = status === 'burn' && run.relics.includes('flint') ? 1 : 0;
  addStatus(enemy.statuses, status, amount + bonus);
  fx(run, combat, enemy.uid, 'status', amount + bonus, status);
}

function damagePlayer(run: RunState, combat: CombatState, amount: number, pierce = false) {
  let rest = amount;
  if (!pierce && combat.player.block > 0) {
    const absorbed = Math.min(combat.player.block, rest);
    combat.player.block -= absorbed;
    rest -= absorbed;
    if (absorbed > 0 && rest === 0) fx(run, combat, 'player', 'blocked', absorbed);
  }
  if (rest > 0) {
    run.hp = Math.max(0, run.hp - rest);
    fx(run, combat, 'player', 'damage', rest);
  }
}

function gainBlock(run: RunState, combat: CombatState, amount: number) {
  if (amount <= 0) return;
  combat.player.block += amount;
  fx(run, combat, 'player', 'block', amount);
}

function drawCards(run: RunState, combat: CombatState, count: number) {
  for (let i = 0; i < count; i++) {
    if (combat.hand.length >= HAND_LIMIT) return;
    if (combat.draw.length === 0) {
      if (combat.discard.length === 0) return;
      combat.draw = shuffle(run, combat.discard);
      combat.discard = [];
    }
    combat.hand.push(combat.draw.pop()!);
  }
}

function rollIntent(run: RunState, enemy: EnemyState) {
  enemy.intent = ENEMIES[enemy.defId].next(enemy, random(run));
}

export function startCombat(run: RunState, enemyIds: readonly string[], kind: CombatState['kind']) {
  const enemies: EnemyState[] = enemyIds.map((defId, uid) => {
    const def = ENEMIES[defId];
    let maxHp = randInt(run, def.hp[0], def.hp[1]);
    if (run.mode === 'easy') maxHp = Math.max(1, Math.round(maxHp * 0.75));
    return { uid, defId, hp: maxHp, maxHp, block: 0, statuses: {}, intent: '', history: [] };
  });
  const combat: CombatState = {
    kind, turn: 0, enemies,
    player: { block: 0, energy: 0, maxEnergy: BASE_ENERGY, statuses: {} },
    draw: shuffle(run, run.deck.map(card => ({ ...card }))), hand: [], discard: [], exhausted: [],
    fx: [], log: [], attacksPlayed: 0, frames: [], lastPlayed: null,
  };
  run.combat = combat;
  run.phase = 'combat';
  for (const enemy of enemies) rollIntent(run, enemy);
  if (run.relics.includes('gloves')) addStatus(combat.player.statuses, 'strength', 1);
  if (run.relics.includes('scarf')) for (const enemy of enemies) applyToEnemy(run, combat, enemy, 'vulnerable', 1);
  log(combat, kind === 'boss' ? '종착역을 가로막은 기관차가 나타났습니다!' : `${enemies.map(enemyName).join(', ')}이(가) 길을 막습니다.`);
  startPlayerTurn(run, combat);
}

function startPlayerTurn(run: RunState, combat: CombatState) {
  combat.turn += 1;
  const { player } = combat;
  player.block = 0;
  player.energy = player.maxEnergy + (combat.turn === 1 && run.relics.includes('coal') ? 1 : 0);
  const burn = player.statuses.burn ?? 0;
  if (burn > 0) {
    damagePlayer(run, combat, burn, true);
    addStatus(player.statuses, 'burn', -1);
    log(combat, `화상으로 체력 ${burn}을 잃었습니다.`);
    if (run.hp <= 0) return lose(run);
  }
  const kindle = player.statuses.kindle ?? 0;
  if (kindle > 0) for (const enemy of aliveEnemies(combat)) applyToEnemy(run, combat, enemy, 'burn', kindle);
  if (combat.turn === 1 && run.relics.includes('candy')) gainBlock(run, combat, 10);
  let draw = BASE_DRAW + (player.statuses.drawUp ?? 0);
  if (combat.turn === 1 && run.relics.includes('lantern')) draw += 1;
  if (combat.turn % 3 === 0 && run.relics.includes('watch')) draw += 2;
  drawCards(run, combat, draw);
}

function lose(run: RunState) {
  run.phase = 'defeat';
}

/** Shared by cards and snacks so both read the same rules. */
function resolveEffects(run: RunState, combat: CombatState, effects: Effect[], target: EnemyState | undefined) {
  const { player } = combat;
  for (const effect of effects) {
    switch (effect.k) {
      case 'attack':
        for (let hit = 0; hit < (effect.times ?? 1); hit++) {
          if (!target || target.hp <= 0) break;
          damageEnemy(run, combat, target, attackDamage(effect.n, player.statuses, target.statuses));
        }
        break;
      case 'attackAll':
        for (const enemy of aliveEnemies(combat)) damageEnemy(run, combat, enemy, attackDamage(effect.n, player.statuses, enemy.statuses));
        break;
      case 'damageAll':
        for (const enemy of aliveEnemies(combat)) damageEnemy(run, combat, enemy, effect.n);
        break;
      case 'blockAttack':
        if (target && target.hp > 0) damageEnemy(run, combat, target, attackDamage(player.block, player.statuses, target.statuses));
        break;
      case 'block':
        gainBlock(run, combat, effect.n);
        break;
      case 'draw':
        drawCards(run, combat, effect.n);
        break;
      case 'energy':
        player.energy += effect.n;
        break;
      case 'heal': {
        const healed = Math.min(effect.n, run.maxHp - run.hp);
        run.hp += healed;
        if (healed > 0) fx(run, combat, 'player', 'heal', healed);
        break;
      }
      case 'apply':
        if (effect.to === 'self') {
          addStatus(player.statuses, effect.status, effect.n);
          fx(run, combat, 'player', 'status', effect.n, effect.status);
        } else if (effect.to === 'all') {
          for (const enemy of aliveEnemies(combat)) applyToEnemy(run, combat, enemy, effect.status, effect.n);
        } else if (target) {
          applyToEnemy(run, combat, target, effect.status, effect.n);
        }
        break;
    }
  }
}

export type PlayCheck = { ok: true; target: number | undefined } | { ok: false; reason: string };

function resolveTarget(combat: CombatState, wantsTarget: boolean, target?: number): PlayCheck {
  if (!wantsTarget) return { ok: true, target: undefined };
  const alive = aliveEnemies(combat);
  if (target === undefined && alive.length === 1) return { ok: true, target: alive[0].uid };
  if (target === undefined || !alive.some(enemy => enemy.uid === target)) return { ok: false, reason: '대상을 골라 주세요.' };
  return { ok: true, target };
}

export function checkPlay(run: RunState, uid: number, target?: number): PlayCheck {
  const combat = run.combat;
  if (run.phase !== 'combat' || !combat) return { ok: false, reason: '전투 중이 아닙니다.' };
  const card = combat.hand.find(c => c.uid === uid);
  if (!card) return { ok: false, reason: '손에 없는 카드입니다.' };
  if (cardStats(card).cost > combat.player.energy) return { ok: false, reason: '증기가 부족해요. 턴을 마치면 다시 채워집니다.' };
  return resolveTarget(combat, needsTarget(card), target);
}

export function playCard(run: RunState, uid: number, requested?: number) {
  const check = checkPlay(run, uid, requested);
  const combat = run.combat;
  if (!check.ok || !combat) return;
  const index = combat.hand.findIndex(c => c.uid === uid);
  const [card] = combat.hand.splice(index, 1);
  const stats = cardStats(card);
  combat.player.energy -= stats.cost;
  combat.frames = [];
  run.stats.cardsPlayed += 1;
  if (stats.type === 'attack') combat.attacksPlayed += 1;
  combat.lastPlayed = { seq: run.stats.cardsPlayed, card, target: check.target };
  const target = check.target === undefined ? undefined : combat.enemies.find(enemy => enemy.uid === check.target);
  log(combat, `${cardName(card)} 사용`);
  resolveEffects(run, combat, stats.effects, target);
  if (stats.exhaust || stats.type === 'power') combat.exhausted.push(card);
  else combat.discard.push(card);
}

export function checkSnack(run: RunState, index: number, target?: number): PlayCheck {
  const id = run.snacks[index];
  const snack = id ? SNACKS[id] : undefined;
  if (!snack) return { ok: false, reason: '간식이 없습니다.' };
  if (run.phase !== 'combat' || !run.combat) {
    if (!snack.anywhere || run.phase === 'victory' || run.phase === 'defeat') return { ok: false, reason: '전투 중에만 먹을 수 있어요.' };
    return run.hp < run.maxHp ? { ok: true, target: undefined } : { ok: false, reason: '체력이 이미 가득해요.' };
  }
  return resolveTarget(run.combat, snack.target, target);
}

export function useSnack(run: RunState, index: number, requested?: number) {
  const check = checkSnack(run, index, requested);
  if (!check.ok) return;
  const snack = SNACKS[run.snacks[index]];
  run.snacks.splice(index, 1);
  if (!run.combat) {
    for (const effect of snack.effects) if (effect.k === 'heal') run.hp = Math.min(run.maxHp, run.hp + effect.n);
    return;
  }
  const combat = run.combat;
  combat.frames = [];
  combat.lastPlayed = null;
  log(combat, `${snack.name} 사용`);
  const target = check.target === undefined ? undefined : combat.enemies.find(enemy => enemy.uid === check.target);
  resolveEffects(run, combat, snack.effects, target);
}

function enemyAct(run: RunState, combat: CombatState, enemy: EnemyState) {
  const def = ENEMIES[enemy.defId];
  enemy.block = 0;
  const burn = enemy.statuses.burn ?? 0;
  if (burn > 0) {
    damageEnemy(run, combat, enemy, burn, true);
    addStatus(enemy.statuses, 'burn', -1);
    if (enemy.hp <= 0) return '화상';
  }
  const move = def.moves[enemy.intent];
  enemy.history.push(move.id);
  log(combat, `${def.name}: ${move.name}`);
  for (const effect of move.effects) {
    switch (effect.k) {
      case 'attack':
        for (let hit = 0; hit < (effect.times ?? 1); hit++) {
          if (enemy.hp <= 0 || run.hp <= 0) break;
          damagePlayer(run, combat, attackDamage(effect.n, enemy.statuses, combat.player.statuses));
          const thorns = combat.player.statuses.thorns ?? 0;
          if (thorns > 0) damageEnemy(run, combat, enemy, thorns, true);
        }
        break;
      case 'block':
        enemy.block += effect.n;
        fx(run, combat, enemy.uid, 'block', effect.n);
        break;
      case 'blockAll':
        for (const ally of aliveEnemies(combat)) {
          ally.block += effect.n;
          fx(run, combat, ally.uid, 'block', effect.n);
        }
        break;
      case 'buff':
        addStatus(enemy.statuses, effect.status, effect.n);
        fx(run, combat, enemy.uid, 'status', effect.n, effect.status);
        break;
      case 'buffAll':
        for (const ally of aliveEnemies(combat)) {
          addStatus(ally.statuses, effect.status, effect.n);
          fx(run, combat, ally.uid, 'status', effect.n, effect.status);
        }
        break;
      case 'debuff':
        addStatus(combat.player.statuses, effect.status, effect.n);
        fx(run, combat, 'player', 'status', effect.n, effect.status);
        break;
    }
    if (run.hp <= 0) return move.name;
  }
  for (const status of DECAYING) if (enemy.statuses[status]) addStatus(enemy.statuses, status, -1);
  if (enemy.hp > 0) rollIntent(run, enemy);
  return move.name;
}

export function endTurn(run: RunState) {
  const combat = run.combat;
  if (run.phase !== 'combat' || !combat) return;
  const { player } = combat;
  combat.frames = [];
  combat.lastPlayed = null;
  combat.discard.push(...combat.hand);
  combat.hand = [];
  let since = combat.fx.length;
  if (player.statuses.plating) {
    gainBlock(run, combat, player.statuses.plating);
    frame(run, combat, 'player', '철갑 외투', since);
  }
  const before = { weak: player.statuses.weak ?? 0, vulnerable: player.statuses.vulnerable ?? 0 };

  for (const enemy of combat.enemies) {
    if (enemy.hp <= 0) continue;
    since = combat.fx.length;
    const label = enemyAct(run, combat, enemy);
    frame(run, combat, enemy.uid, label, since);
    if (run.hp <= 0) return lose(run);
  }
  // A cleared board is settled by the run module (rewards live there, not in combat rules).
  if (aliveEnemies(combat).length === 0) return;
  // Debuffs the enemies applied this round last a full round before they start to wear off.
  for (const status of DECAYING) if (before[status] > 0) addStatus(player.statuses, status, -1);
  since = combat.fx.length;
  startPlayerTurn(run, combat);
  if (combat.fx.length > since) frame(run, combat, 'player', `${combat.turn}번째 턴`, since);
}
