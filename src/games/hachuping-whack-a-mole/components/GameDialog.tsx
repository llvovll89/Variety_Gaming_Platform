import { useEffect, useRef, type ReactNode } from 'react';
export default function GameDialog({children,onClose,label}:{children:ReactNode;onClose:()=>void;label:string}) {
  const ref=useRef<HTMLDialogElement>(null);
  useEffect(()=> {const d=ref.current;d?.showModal();return()=>d?.close();},[]);
  return <dialog ref={ref} className="mole-dialog" aria-label={label} onCancel={e=>{e.preventDefault();onClose();}}>{children}</dialog>;
}
