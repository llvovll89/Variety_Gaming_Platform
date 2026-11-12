import type { DeathSummary } from '../game/types';
import { WORLD_HALF, WORLD_SIZE } from '../game/constants';

export default function DeathReport({ death }: { death: DeathSummary }) {
  const opponent = death.opponentName ?? '다른 뱀';
  const message = death.reason === 'wall' ? '정원 경계에 부딪혔어요.'
    : death.reason === 'self' ? '내 몸통에 부딪혔어요.'
    : death.reason === 'body' ? `${opponent}의 몸통에 부딪혔어요.`
    : death.mutual ? `${opponent}와 정면충돌해 함께 탈락했어요.`
    : `${opponent}와 머리가 부딪혀 탈락했어요.`;
  const tip = death.reason === 'wall' ? '경계에 닿기 전에 안쪽으로 방향을 바꿔보세요.'
    : death.reason === 'self' ? '크게 돌아 내 몸통과 거리를 벌려보세요.'
    : death.reason === 'body' ? '상대 몸통을 가로지르지 않도록 여유 있게 돌아가세요.'
    : '상대 머리가 가까워지면 옆으로 피해보세요.';
  const map = (value: number) => Math.max(4, Math.min(96, (value + WORLD_HALF) / WORLD_SIZE * 100));
  return <section className="slither-death-report" aria-label="사망 원인">
    <h3>{message}</h3>
    <p>{tip}</p>
    <figure>
      <svg viewBox="0 0 100 100" role="img" aria-label="정원 전체 지도에서 충돌 위치">
        <rect x="1" y="1" width="98" height="98" rx="3" />
        <path d="M50 1V99M1 50H99" />
        <circle cx={map(death.position.x)} cy={map(death.position.y)} r="4" />
      </svg>
      <figcaption>충돌 위치 · 정원 전체 지도<br/>가로 {Math.round(death.position.x).toLocaleString()} · 세로 {Math.round(death.position.y).toLocaleString()}<br/><small>가운데가 (0, 0), 오른쪽·아래쪽이 +</small></figcaption>
    </figure>
  </section>;
}
