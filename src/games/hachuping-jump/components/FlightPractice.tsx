import type { UISnapshot } from '../game/types';

const hints = {
  ready: '먼저 한 번 눌러 날아올라요.',
  wait: '좋아요! 바로 연타하지 말고 조금 기다려요.',
  tap: '지금, 한 번 더 톡!',
  quick: '조금 빨랐어요. 새가 내려올 때까지 기다려요.',
  late: '조금 늦었어요. 다음에는 조금 더 일찍 눌러요.',
  good: '좋은 간격이에요! 이 리듬으로 이어가요.',
  complete: '리듬을 익혔어요! 이제 모험을 시작해볼까요?',
};
export default function FlightPractice({ practice, onFlap, onStart, onMenu }: {
  practice: NonNullable<UISnapshot['practice']>; onFlap:()=>void; onStart:()=>void; onMenu:()=>void;
}) {
  return <section className="jump-practice" aria-label="첫 비행 연습">
    <div className="jump-practice-guide"><h2>톡, 기다렸다가, 톡!</h2><p>화면 탭·Space로 날갯짓해요. 약 0.6초 간격으로 눌러 보세요.</p><p>장애물과 점수 없이 연습해요. 위아래에 닿으면 가운데에서 다시 시작해요.</p></div>
    <div className="jump-practice-controls">
      <p role="status">{hints[practice.feedback]}</p><p>좋은 간격 {Math.min(3,practice.streak)} / 3</p>
      <button autoFocus className="jump-button jump-button-primary" onClick={onFlap}>날갯짓</button>
      <button className="jump-button" onClick={onStart}>{practice.feedback==='complete'?'모험 시작':'연습 건너뛰고 시작'}</button>
      <button className="jump-button" onClick={onMenu}>메인 메뉴</button>
    </div>
  </section>;
}
