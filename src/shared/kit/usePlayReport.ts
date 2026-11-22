import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { RecordsApi } from '../../platform/meta/api';

/** 이 시간보다 짧은 조각은 보고를 미뤘다가 다음에 함께 보고한다(StrictMode 재마운트 등). */
const MIN_PLAY_REPORT_MS = 1000;

/**
 * 끝나지 않은 run의 플레이 시간을 reportPlay로 보고한다. 저장하고 나가거나 판을 버린 날도
 * 플레이 시간과 연속 플레이 도장에 들어가게 하려는 것이다.
 * - 탭 숨김·창 닫기·unmount 때는 자동으로 보고한다.
 * - 새 판을 시작할 때는 clock.reset() 대신 reset()을 부른다(버린 판의 시간을 먼저 보고).
 * - run이 끝나 reportRun할 때는 reportedMs()를 함께 넘겨 이미 보고한 시간을 다시 세지 않게 한다.
 * - onReport는 실제로 보고한 뒤에만 불린다. 세션을 넘겨 이어지는 판이 누적 시간을 따로 저장할 때 쓴다.
 */
export function usePlayReport(
  clock: { elapsed: () => number; reset: () => void },
  records: Pick<RecordsApi, 'reportPlay'>,
  unfinished: boolean,
  onReport?: () => void,
) {
  const reported = useRef(0);
  const latest = useRef({ clock, records, unfinished, onReport });
  useEffect(() => { latest.current = { clock, records, unfinished, onReport }; });

  const flush = useCallback(() => {
    const { clock: c, records: r, unfinished: open, onReport: after } = latest.current;
    if (!open) return;
    const ms = c.elapsed() - reported.current;
    if (ms < MIN_PLAY_REPORT_MS) return;
    r.reportPlay(ms);
    reported.current += ms;
    after?.();
  }, []);

  const reset = useCallback(() => {
    flush();
    reported.current = 0;
    latest.current.clock.reset();
  }, [flush]);

  const reportedMs = useCallback(() => reported.current, []);

  useEffect(() => {
    const onHide = () => { if (document.hidden) flush(); };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', flush);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, [flush]);

  return useMemo(() => ({ flush, reset, reportedMs }), [flush, reset, reportedMs]);
}
