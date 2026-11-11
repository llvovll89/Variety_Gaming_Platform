import { ArrowRight, X } from '@phosphor-icons/react';
import type { TravelPlan } from './engine';

export default function RoutePreview({plan,onConfirm,onCancel}:{plan:TravelPlan;onConfirm:()=>void;onCancel:()=>void}) {
  const destination=plan.path[plan.path.length-1];
  return <section className="gm-route-preview" aria-label="이동 미리보기">
    <div role="status" aria-live="polite">
      <strong>{plan.command.type==='target'?'짐 앞으로 다가가기':'선택한 칸으로 이동'} · {plan.cost}행동</strong>
      <p>목적지 {destination.x}, {destination.y} · {plan.remaining===null?'여유 모드 · 행동 제한 없음':`이동 후 ${plan.remaining}행동 남음`}</p>
      {plan.command.type==='target'&&<small>짐을 바라보는 데까지의 경로예요. 능력은 도착 후 따로 사용해요.</small>}
      {plan.exhaustsBudget&&<p className="gm-route-warning">이동하면 집주인이 돌아와 의뢰가 끝나요. 도착 전에 멈출 수 있으니 더 짧은 길을 골라 주세요.</p>}
    </div>
    <div className="gm-route-buttons"><button className="gm-secondary" onClick={onCancel}><X size={16}/>취소</button><button className="gm-primary" onClick={onConfirm}>{plan.cost===0&&plan.command.type==='target'?'바라보기':'이동하기'}<ArrowRight size={17}/></button></div>
  </section>;
}
