import type { UISnapshot } from '../game/types';

/** m:ss, rounded up so the clock reads 0:00 only when the time is really over. */
const clock = (seconds: number) => { const s = Math.ceil(seconds); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

export default function HUD({ snapshot: s }: { snapshot: UISnapshot }) {
  return <div className="slither-scoreboard">
    {s.timeLeft !== null && <div className="slither-time-left">남은 시간 <strong>{clock(s.timeLeft)}</strong></div>}
    <div>Your length: <strong>{s.score}</strong></div>
    <div>Your rank: <strong>{s.rank || '-'}</strong> of {s.totalAlive}</div>
    <div className="slither-progress-line">처치 {s.kills} · LV {s.level} · {Math.floor(s.xp)} / {s.xpNext} XP</div>
    <div className="slither-boost-status">{s.boosting ? '부스트 중' : s.canBoost ? '꾹 눌러 부스트' : '길이 23부터 부스트'}</div>
  </div>;
}
