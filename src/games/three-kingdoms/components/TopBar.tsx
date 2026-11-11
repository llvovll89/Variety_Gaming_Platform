import { CoinsIcon, GrainsIcon, CastleTurretIcon, FlagBannerIcon, UsersThreeIcon, FastForwardIcon, ArrowRightIcon } from '@phosphor-icons/react';
import type { UISnapshot } from '../game/types';
interface Props { snapshot: UISnapshot; onEndTurn: () => void; onSkip: () => void; onOverview: () => void; onExit: () => void; onSave: () => void }
export function TopBar({ snapshot, onEndTurn, onSkip, onOverview, onExit, onSave }: Props) {
  const player = snapshot.player;
  const resources = [
    { label: '금', value: player?.gold ?? 0, icon: CoinsIcon },
    { label: '병량', value: player?.food ?? 0, icon: GrainsIcon },
    { label: '도시', value: player?.cities ?? 0, icon: CastleTurretIcon },
    { label: '부대', value: player?.units ?? 0, icon: FlagBannerIcon },
    { label: '무장', value: player?.officers ?? 0, icon: UsersThreeIcon },
  ];
  return <><header className="tk-topbar">
    <div className="tk-calendar"><strong>{snapshot.year}<small>년</small> {snapshot.month}<small>월</small></strong><span>{snapshot.day === 21 ? '하순' : snapshot.day === 11 ? '중순' : '상순'} · {snapshot.turn}순</span></div>
    <div className="tk-resource-ledger">{resources.map(({ label, value, icon: Icon }) => <div className="tk-resource" key={label}><Icon size={18} aria-hidden="true"/><span><small>{label}</small><strong>{value.toLocaleString()}</strong></span></div>)}</div>
    <div className="tk-top-actions"><button onClick={onOverview}>세력 현황</button><button onClick={onExit} disabled={snapshot.busy}>저장 후 나가기</button><button className="tk-advance" onClick={snapshot.busy ? onSkip : onEndTurn} disabled={snapshot.result !== 'playing'}><span>{snapshot.busy ? '진행 가속' : '10일 진행'}</span>{snapshot.busy ? <FastForwardIcon size={18} aria-hidden="true"/> : <ArrowRightIcon size={18} aria-hidden="true"/>}</button></div>
  </header><div className={`tk-save-status is-${snapshot.save.status}`}><span role="status" aria-live="polite">{snapshot.save.status==='failed'?'저장하지 못했어요. 최신 진행은 이 화면에만 있어요.':snapshot.busy?'진행이 끝나면 자동 저장합니다.':snapshot.save.status==='saved'?`${snapshot.save.turn}순 저장 완료 · ${new Date(snapshot.save.savedAt!).toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false})}`:'명령 실행 후 자동 저장합니다.'}</span><button onClick={onSave} disabled={snapshot.busy || snapshot.result!=='playing'}>{snapshot.save.status==='failed'?'저장 다시 시도':'지금 저장'}</button></div></>;
}
