import { useEffect, useRef, type ReactNode } from 'react';

export default function SessionDialog({ children, onCancel }: { children: ReactNode; onCancel?: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const el = ref.current!; el.showModal(); return () => el.close(); }, []);
  return <dialog ref={ref} className="slither-result slither-session-dialog" aria-labelledby="slither-result-title" onCancel={e => { e.preventDefault(); onCancel?.(); }}>{children}</dialog>;
}
