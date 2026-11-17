/** Classes a game adds to kit buttons, so they keep the game's own button look. */
export interface ButtonClasses { primary?: string; secondary?: string }
export const primaryClass = (classes?: ButtonClasses) => `kit-btn kit-btn-primary${classes?.primary ? ` ${classes.primary}` : ''}`;
export const secondaryClass = (classes?: ButtonClasses) => `kit-btn kit-btn-secondary${classes?.secondary ? ` ${classes.secondary}` : ''}`;
