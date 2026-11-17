/** Earned stars out of max, read out as one phrase ("별 3개 중 2개"). */
export function Stars({ value, max = 3, size = 16, className }: { value: number; max?: number; size?: number; className?: string }) {
  const earned = Math.max(0, Math.min(max, Math.floor(value)));
  return (
    <span className={className ? `kit-stars ${className}` : 'kit-stars'} role="img" aria-label={`별 ${max}개 중 ${earned}개`}>
      {Array.from({ length: max }, (_, i) => (
        <svg key={i} className={i < earned ? 'on' : 'off'} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
          <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" />
        </svg>
      ))}
    </span>
  );
}
