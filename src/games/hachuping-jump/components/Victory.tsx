export default function Victory({ score, onRestart, onMenu }: { score: number; onRestart: () => void; onMenu: () => void }) {
  return <div className="absolute inset-0 flex items-center justify-center bg-[#30233a]/65 p-5 backdrop-blur-sm">
    <div className="w-full max-w-sm rounded-3xl border-2 border-white bg-[#fff6e5] p-8 text-center text-[#684a65]">
      <div className="text-5xl text-[#e9ac36]">★</div><h1 className="mt-4 text-2xl font-black">별빛 여행 완료!</h1>
      <p className="mt-2 text-sm">네 개의 세계를 모두 통과했어요.</p><p className="mt-5 text-4xl font-black tabular-nums">{score.toLocaleString()}<span className="text-base"> 점</span></p>
      <p className="mt-2 text-xs">스테이지 클리어 보너스 포함</p>
      <button onClick={onRestart} className="mt-6 w-full rounded-full bg-[#efb7d0] py-3 font-bold">처음부터 다시 모험</button>
      <button onClick={onMenu} className="mt-3 w-full rounded-full border border-[#dfc5d2] py-3 font-bold">메인 메뉴</button>
    </div>
  </div>;
}
