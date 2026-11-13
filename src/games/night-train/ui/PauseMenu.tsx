import { BOSS_FLOOR, SNACK_SLOTS, currentFloor, regionOf, type RunState } from '../engine';
import { Glyph } from './glyphs';
import { Modal } from './parts';
import type { SoundSettings } from './sound';

/** Print-styled on/off switch. The whole row is the control, so the touch target stays large. */
function SwitchRow({ glyph, label, note, checked, onChange }: { glyph: string; label: string; note: string; checked: boolean; onChange: () => void }) {
  return (
    <button type="button" role="switch" aria-checked={checked} className="nt-switch-row" onClick={onChange}>
      <Glyph name={glyph} size={20} />
      <span className="nt-switch-text"><b>{label}</b><small>{note}</small></span>
      <span className="nt-switch" aria-hidden="true"><span /></span>
    </button>
  );
}

/** Thirteen stops from the first station to 새벽역; filled for passed, ringed for the current one. */
function ProgressRail({ run }: { run: RunState }) {
  const stops = BOSS_FLOOR + 1;
  const passed = run.path.length;
  return (
    <div className="nt-rail" role="img" aria-label={`전체 ${stops}개 역 중 ${passed}번째 역`}>
      {Array.from({ length: stops }, (_, i) => {
        const state = i < passed - 1 ? 'passed' : i === passed - 1 ? 'here' : 'ahead';
        return <span key={i} className={`nt-rail-stop is-${state}${i === stops - 1 ? ' is-terminal' : ''}`} />;
      })}
    </div>
  );
}

export default function PauseMenu({ run, sound, onResume, onToggleSfx, onToggleAmbient, onHelp, onMap, onTitle, onExit }: {
  run: RunState;
  sound: SoundSettings;
  onResume: () => void;
  onToggleSfx: () => void;
  onToggleAmbient: () => void;
  onHelp: () => void;
  onMap: () => void;
  onTitle: () => void;
  onExit: () => void;
}) {
  const floor = Math.min(currentFloor(run), BOSS_FLOOR + 1);
  const region = regionOf(Math.min(floor, BOSS_FLOOR));
  return (
    <Modal label="정차 중" onClose={onResume} hideClose className="nt-pause">
      <header className="nt-pause-head">
        <span className="nt-pause-stamp" aria-hidden="true">정차<br />중</span>
        <p className="nt-pause-where">{floor === 0 ? '출발 전' : `${floor}번째 역`} · {region.name}</p>
        <h2>열차가 잠시 멈췄어요</h2>
        <ProgressRail run={run} />
        <dl className="nt-pause-stats">
          <div><dt><Glyph name="heart" size={15} /><span>체력</span></dt><dd>{run.hp}<small>/{run.maxHp}</small></dd></div>
          <div><dt><Glyph name="coin" size={15} /><span>골드</span></dt><dd>{run.gold}</dd></div>
          <div><dt><Glyph name="deck" size={15} /><span>덱</span></dt><dd>{run.deck.length}<small>장</small></dd></div>
          <div><dt><Glyph name="bag" size={15} /><span>간식</span></dt><dd>{run.snacks.length}<small>/{SNACK_SLOTS}</small></dd></div>
        </dl>
      </header>

      <div className="nt-pause-body">
        <button type="button" className="nt-resume" onClick={onResume} autoFocus>
          <Glyph name="play" size={18} /><span>계속 달리기</span><kbd>Esc</kbd>
        </button>

        <section className="nt-pause-section" aria-labelledby="nt-pause-sound">
          <h3 id="nt-pause-sound">소리</h3>
          <SwitchRow glyph={sound.sfx ? 'sound' : 'mute'} label="효과음" note="카드·전투·보상 소리" checked={sound.sfx} onChange={onToggleSfx} />
          <SwitchRow glyph="locomotive" label="주행음" note="레일 위 덜컹 소리" checked={sound.ambient} onChange={onToggleAmbient} />
        </section>

        <nav className="nt-pause-section" aria-label="더 보기">
          <button type="button" className="nt-pause-link" onClick={onHelp}><Glyph name="book" size={20} /><span>게임 방법</span><Glyph name="arrow" size={16} /></button>
          {run.phase !== 'map' && <button type="button" className="nt-pause-link" onClick={onMap}><Glyph name="route" size={20} /><span>노선도 보기</span><Glyph name="arrow" size={16} /></button>}
        </nav>
      </div>

      <footer className="nt-pause-foot">
        <p><Glyph name="check" size={14} />진행은 자동으로 저장돼요. 나가도 이어서 탈 수 있어요.</p>
        <div>
          <button type="button" className="nt-pause-leave" onClick={onTitle}>시작 화면으로</button>
          <button type="button" className="nt-pause-leave" onClick={onExit}><Glyph name="exit" size={15} />게임 목록으로</button>
        </div>
      </footer>
    </Modal>
  );
}
