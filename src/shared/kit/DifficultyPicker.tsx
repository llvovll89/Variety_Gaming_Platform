import type { ReactNode } from 'react';

export interface DifficultyOption<T extends string> { id: T; label: string; note?: ReactNode }

/**
 * One-of-N choice with aria-pressed buttons. Pass autoFocusSelected after a change that remounts
 * the menu (e.g. per-difficulty record sessions), so keyboard focus stays on the chosen level.
 */
export function DifficultyPicker<T extends string>({ options, value, onChange, legend = '난이도', autoFocusSelected = false, className }: {
  options: readonly DifficultyOption<T>[];
  value: T;
  onChange: (id: T) => void;
  legend?: string;
  autoFocusSelected?: boolean;
  className?: string;
}) {
  return (
    <fieldset className={className ? `kit-choice ${className}` : 'kit-choice'}>
      <legend className="kit-section-title">{legend}</legend>
      {options.map(option => (
        <button key={option.id} type="button" aria-pressed={option.id === value} autoFocus={autoFocusSelected && option.id === value} onClick={() => onChange(option.id)}>
          {option.label}
          {option.note && <small>{option.note}</small>}
        </button>
      ))}
    </fieldset>
  );
}
