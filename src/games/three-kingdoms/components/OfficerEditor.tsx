import { useEffect, useRef, useState } from 'react';
import type { GameEngine } from '../game/engine';
import type { Officer } from '../game/types';
import { OfficerPortrait } from './OfficerPortrait';

const STATS = [['lead', '통솔'], ['war', '무력'], ['int', '지력'], ['pol', '정치'], ['cha', '매력']] as const;

export function OfficerEditor({ engine, onClose }: { engine: GameEngine; onClose: () => void }) {
  const state = engine.getState();
  const officers = Object.values(state.officers);
  const [query, setQuery] = useState('');
  const [faction, setFaction] = useState('all');
  const [draft, setDraft] = useState<Officer>(() => structuredClone(officers.find(o => o.faction === state.playerFactionId) ?? officers[0]));
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');
  const [dirty, setDirty] = useState(false);
  const [discard, setDiscard] = useState<(() => void) | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { dialog.current?.showModal(); }, []);
  const guard = (action: () => void) => { if (dirty) setDiscard(() => action); else action(); };
  const change = (patch: Partial<Officer>) => { setDraft(d => ({ ...d, ...patch })); setDirty(true); setMessage(''); };
  const choose = (o: Officer) => guard(() => { setDraft(structuredClone(o)); setCreating(false); setDirty(false); setMessage(''); });
  const create = () => guard(() => {
    const city = Object.values(state.cities).find(c => c.faction === state.playerFactionId)!;
    setDraft({ id: `custom-${crypto.randomUUID()}`, name: '신장수', hanja: '', lead: 70, war: 70, int: 70, pol: 70, cha: 70, cityId: city.id, faction: city.faction, duty: 'idle', unitId: null, tactics: [] });
    setCreating(true); setDirty(true); setMessage('');
  });
  const save = () => {
    const result = engine.updateOfficer(draft, creating);
    setMessage(result.ok ? '저장했습니다. 현재 국면의 장수 정보에 반영되었습니다.' : result.reason ?? '저장 실패');
    if (result.ok) { setCreating(false); setDirty(false); setDraft(structuredClone(state.officers[draft.id])); }
  };
  return <dialog className="tk-editor" ref={dialog} aria-label="PK 장수 편집" onCancel={e => { e.preventDefault(); guard(onClose); }}>
    <header><div><small>POWER UP KIT</small><h2>장수 편집</h2><p>초상을 확인하고 현재 국면의 능력과 배치를 변경합니다.</p></div><button onClick={() => guard(onClose)} aria-label="장수 편집 닫기">닫기</button></header>
    <div className="tk-editor-body">
      <aside className="tk-officer-list">
        <button className="tk-primary" onClick={create}>＋ 신장수 등록</button>
        <input aria-label="장수 검색" placeholder="장수 이름 검색" value={query} onChange={e => setQuery(e.target.value)} />
        <select aria-label="세력 필터" value={faction} onChange={e => setFaction(e.target.value)}><option value="all">전체 세력</option>{Object.values(state.factions).map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select>
        <p className="tk-roster-count">등록 장수 {officers.length}명</p>
        <div className="tk-roster-scroll">{officers.filter(o => (faction === 'all' || o.faction === faction) && (o.name + o.hanja).includes(query)).map(o => <button key={o.id} aria-pressed={draft.id === o.id} onClick={() => choose(o)}><OfficerPortrait officer={o} state={state} size={36}/><span><strong>{o.name}</strong><small>{state.factions[o.faction ?? '']?.name ?? '재야'} · {state.cities[o.cityId]?.name}</small></span></button>)}</div>
      </aside>
      <section className="tk-portrait-column"><OfficerPortrait officer={draft} state={state} size={240}/><h3>{draft.name} <small>{draft.hanja}</small></h3><p>{state.cities[draft.cityId]?.name} · {creating ? '신장수' : '등록 장수'}</p><div className="tk-portrait-stats">{STATS.map(([key,label])=><span key={key}><small>{label}</small><b>{draft[key]}</b></span>)}</div></section>
      <form className="tk-editor-fields" onSubmit={e => { e.preventDefault(); save(); }}>
        <h3>장수 정보</h3>
        <div className="tk-field-pair"><label>이름<input maxLength={16} value={draft.name} onChange={e => change({ name: e.target.value })} /></label><label>한자<input maxLength={16} value={draft.hanja} onChange={e => change({ hanja: e.target.value })} /></label></div>
        <label>배치 도시 · 소속 세력<select disabled={!creating && draft.duty !== 'idle'} value={draft.cityId} onChange={e => change({ cityId: e.target.value })}>{Object.values(state.cities).filter(c => c.faction).map(c => <option key={c.id} value={c.id}>{c.name} · {state.factions[c.faction!].name}</option>)}</select></label>
        {draft.duty !== 'idle' && <p className="tk-muted">임무 중인 장수는 배치를 변경할 수 없습니다.</p>}
        <div className="tk-stat-inputs">{STATS.map(([key, name]) => <label key={key}>{name}<input type="number" min={1} max={100} required value={draft[key]} onChange={e => change({ [key]: Number(e.target.value) })} /></label>)}</div>
        <p role="status">{message || (dirty ? '변경 사항을 저장하면 적용됩니다.' : '능력치에 따라 사용 가능한 전법도 갱신됩니다.')}</p>
        <button className="tk-primary" type="submit" disabled={!dirty}>변경 사항 저장</button>
      </form>
    </div>
    {discard && <div className="tk-discard" role="alert"><span>저장하지 않은 변경 사항을 버리시겠습니까?</span><button onClick={() => setDiscard(null)}>편집 계속</button><button onClick={() => { discard(); setDiscard(null); }}>변경 버리기</button></div>}
  </dialog>;
}
