import { appearanceFor } from './appearance';
import { tacticsFor } from './officers';
import type { GameState, Officer } from './types';
import type { CommandResult } from './internal';

export function editOfficer(state: GameState, draft: Officer, creating = false): CommandResult {
  if (state.phase !== 'player' || state.result !== 'playing') return { ok: false, reason: '플레이어 차례에만 편집할 수 있습니다.' };
  const original = state.officers[draft.id];
  if ((!creating && !original) || (creating && original)) return { ok: false, reason: '장수 식별자가 올바르지 않습니다.' };
  if (!draft.name.trim() || draft.name.length > 16 || draft.hanja.length > 16) return { ok: false, reason: '이름은 1~16자로 입력하십시오.' };
  for (const key of ['lead', 'war', 'int', 'pol', 'cha'] as const) {
    if (!Number.isInteger(draft[key]) || draft[key] < 1 || draft[key] > 100) return { ok: false, reason: '능력치는 1~100의 정수입니다.' };
  }
  const city = state.cities[draft.cityId];
  if (!city?.faction) return { ok: false, reason: '소속 세력이 있는 도시를 선택하십시오.' };
  if (original && original.cityId !== draft.cityId && original.duty !== 'idle') return { ok: false, reason: '임무 중인 장수는 배치 도시를 바꿀 수 없습니다.' };
  const a = appearanceFor(draft);
  if (![a.armor, a.cloth, a.skin].every(c => /^#[0-9a-f]{6}$/i.test(c)) || !['crown', 'helmet', 'scholar', 'plume'].includes(a.helmet) || !['spear', 'blade', 'sword', 'fan', 'bow'].includes(a.weapon) || !Number.isFinite(a.beard) || a.beard < 0 || a.beard > 1 || !Number.isFinite(a.build) || a.build < 0.7 || a.build > 1.5) return { ok: false, reason: '외형 설정을 확인하십시오.' };
  const next: Officer = {
    ...(original ?? draft), name: draft.name.trim(), hanja: draft.hanja.trim(),
    lead: draft.lead, war: draft.war, int: draft.int, pol: draft.pol, cha: draft.cha,
    cityId: city.id, faction: original?.cityId === city.id ? original.faction : city.faction,
    appearance: { ...a }, tactics: tacticsFor(draft.lead, draft.war, draft.int, draft.cha),
    duty: original?.duty ?? 'idle', unitId: original?.unitId ?? null,
  };
  for (const c of Object.values(state.cities)) c.officerIds = c.officerIds.filter(id => id !== next.id);
  city.officerIds.push(next.id);
  state.officers[next.id] = next;
  state.log.push({ turn: state.turn, kind: 'info', text: `PK · ${next.name} ${creating ? '신장수 등록' : '편집 완료'}`, focus: city.coord });
  return { ok: true };
}
