import type { UISnapshot } from '../game/types';

export default function HUD({ snapshot: s }: { snapshot: UISnapshot }) {
  return <div className="slither-scoreboard">
    <div>Your length: <strong>{s.score}</strong></div>
    <div>Your rank: <strong>{s.rank || '-'}</strong> of {s.totalAlive}</div>
    <div className="slither-progress-line">LV {s.level} · {Math.floor(s.xp)} / {s.xpNext} XP</div>
    <div className="slither-boost-status">{s.boosting ? '부스트 중' : s.canBoost ? '꾹 눌러 부스트' : '길이 23부터 부스트'}</div>
  </div>;
}
