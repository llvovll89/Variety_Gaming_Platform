import type { UISnapshot } from "../game/types";
export default function HUD({ snapshot }: { snapshot: UISnapshot }) {
 const seconds = Math.ceil(snapshot.timeRemaining);
 return <div className="balloon-hud" aria-label="게임 현황"><div className="balloon-score"><span>터뜨린 풍선</span><strong>{snapshot.score}<small>개</small></strong></div><div className={seconds <= 10 ? "balloon-clock balloon-clock-low" : "balloon-clock"}><span>남은 시간</span><strong>{seconds}<small>초</small></strong></div><p className="balloon-record">최고 {snapshot.bestScore}개</p></div>;
}
