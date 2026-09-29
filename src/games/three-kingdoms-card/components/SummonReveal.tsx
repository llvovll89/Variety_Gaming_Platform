
import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { DemoHero } from "../lib/demoGame";
import { RARITIES, catalogHero } from "../lib/heroCatalog";
import { HeroCard, rarityStyle } from "./HeroVisual";

export default function SummonReveal({ heroes, onClose, onRoster }: { heroes: DemoHero[]; onClose: () => void; onRoster: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [phase, setPhase] = useState<"sealed" | "opening" | "revealed">("sealed");
  const highest = Math.max(...heroes.map(h => h.stars));
  useEffect(() => {
    dialog.current?.showModal();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPhase("revealed");
  }, []);
  useEffect(() => {
    if (phase !== "opening") return;
    const timer = setTimeout(() => setPhase("revealed"), 2100);
    return () => clearTimeout(timer);
  }, [phase]);
  return <dialog ref={dialog} className={`summon-dialog summon-${phase}`} style={rarityStyle(highest)} onCancel={onClose} aria-labelledby="summon-heading">
    <div className="summon-particles" aria-hidden="true">{Array.from({ length: 24 }, (_, i) => <i key={i} style={{ "--i": i } as CSSProperties} />)}</div>
    <div className="summon-top"><span>招賢 · 초현</span><button className="quiet-button" onClick={() => phase === "revealed" ? onClose() : setPhase("revealed")}>{phase === "revealed" ? "닫기" : "연출 건너뛰기"}</button></div>
    {phase !== "revealed" ? <div className="seal-stage"><p>천하의 인연이 모이는 곳</p><h2 id="summon-heading">누가 당신의 부름에 응할까요?</h2><div className="summon-ritual"><div className="ritual-ring ring-one" /><div className="ritual-ring ring-two" /><div className="ritual-ring ring-three" /><div className="summon-scroll"><span>招</span><span>賢</span><b>令</b></div></div><button className="seal-button" disabled={phase === "opening"} onClick={() => setPhase("opening")}>{phase === "opening" ? "인연이 깨어납니다…" : "봉인 열기"}</button><p className="ritual-hint">모집 결과는 이미 저장되었습니다. 연출을 건너뛰어도 유지됩니다.</p></div>
    : <div className="revealed-stage"><p className="reveal-tier">{highest >= 4 ? `${RARITIES[highest - 1].name}의 기운이 당신에게` : "새로운 인연을 만났습니다"}</p><h2 id="summon-heading">{heroes.length === 1 ? `${heroes[0].name}, 합류` : `${heroes.length}명의 장수, 합류`}</h2><div className={`reveal-cards ${heroes.length === 1 ? "single-reveal" : ""}`}>{heroes.map((hero, i) => <div className="revealed-card" key={hero.id} style={{ animationDelay: `${i * 110}ms` }}><HeroCard hero={hero} /></div>)}</div>{heroes.length === 1 && <p className="hero-quote">“{catalogHero(heroes[0].templateKey).quote}”</p>}<div className="reveal-actions"><button className="outline-button" onClick={onClose}>다시 모집하기</button><button className="seal-button" onClick={onRoster}>장수 명부에서 확인</button></div></div>}
  </dialog>;
}
