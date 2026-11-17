import test from 'node:test';
import assert from 'node:assert/strict';
import { loadBundle } from './bundle.mjs';

const M = await loadBundle(`
  export {createElement} from 'react';
  export {renderToStaticMarkup} from 'react-dom/server';
  export {RewardStrip} from './src/platform/meta/RewardStrip.tsx';
`);
const h = M.createElement, render = M.renderToStaticMarkup;
const rewards = {
  newBest: true, previousBest: 10, best: 20,
  unlocked: [{ gameId: 'mole', id: 'first', title: '첫 두더지', description: '한 판을 끝까지 해요', tier: 1, kids: { title: '뿅망치 스티커', sticker: '🔨' } }],
  daily: { id: 'd', label: '200점 넘기', completed: true, justCompleted: true },
  streak: { days: 3, extendedToday: true },
};

test('kids see stickers and stamps, everyone else sees badges, from the same rewards', () => {
  const kids = render(h(M.RewardStrip, { rewards, audience: 'kids' }));
  assert.match(kids, /🔨/);
  assert.match(kids, /새 스티커를 받았어요!.*뿅망치 스티커/);
  const many = render(h(M.RewardStrip, { rewards: { ...rewards, unlocked: [rewards.unlocked[0], { ...rewards.unlocked[0], id: 'b' }] }, audience: 'kids' }));
  assert.match(many, /새 스티커 2개를 받았어요!/);
  assert.equal((many.match(/새 스티커/g) ?? []).length, 1, 'one heading for several stickers');
  assert.match(kids, /오늘의 도전 성공!/);
  assert.match(kids, /도장 3개째/);
  assert.ok(!/업적|브론즈/.test(kids), 'no tiers or jargon for kids');
  const general = render(h(M.RewardStrip, { rewards, audience: 'general' }));
  assert.match(general, /업적 달성 · 첫 두더지/);
  assert.match(general, /data-tier="1"/);
  assert.match(general, /3일 연속 플레이/);
});

test('nothing earned shows nothing, and a first day is not called a streak', () => {
  const none = { ...rewards, unlocked: [], daily: { ...rewards.daily, justCompleted: false }, streak: { days: 1, extendedToday: true } };
  assert.equal(render(h(M.RewardStrip, { rewards: none, audience: 'kids' })), '');
  assert.equal(render(h(M.RewardStrip, { rewards: null, audience: 'general' })), '');
});
