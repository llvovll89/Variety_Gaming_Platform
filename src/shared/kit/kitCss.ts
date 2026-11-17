/**
 * Structure, focus and motion for the shared game kit. Every visible value reads a --kit-* custom
 * property, so each game keeps its own look by setting those on its root, for example
 * `.mole-game{--kit-surface:#f0f5ed;--kit-accent:#264f3c;--kit-radius:24px}`.
 *
 * `@layer kit` + `:where()` give these rules zero specificity: any rule a game writes wins.
 * It is a TS string (rendered by <KitStyles/>) so it also works inside a shadow root and in tests.
 * It must never name a game's own classes.
 * Inside a shadow root `:root` does not match, so a shadow-DOM game puts `kit-motion-reduce` on its
 * own root when useReducedMotion() is true.
 */
const surface = 'var(--kit-surface,#fff)';
const ink = 'var(--kit-ink,#1b1b1f)';
const muted = `var(--kit-muted,color-mix(in srgb,${ink} 68%,transparent))`;
const accent = 'var(--kit-accent,#4b4bd1)';
const onAccent = 'var(--kit-on-accent,#fff)';
const line = `var(--kit-line,color-mix(in srgb,${ink} 18%,transparent))`;
const tint = `var(--kit-tint,color-mix(in srgb,${ink} 6%,transparent))`;
const radius = 'var(--kit-radius,16px)';
const font = 'var(--kit-font,Pretendard,system-ui,sans-serif)';

export const kitCss = `@layer kit{
:where(.kit-dialog){box-sizing:border-box;width:min(calc(100% - 32px),var(--kit-dialog-width,440px));max-width:none;max-height:calc(100dvh - 32px);overflow:auto;overscroll-behavior:contain;margin:auto;padding:var(--kit-pad,24px);border:1px solid ${line};border-radius:${radius};background:${surface};color:${ink};font-family:${font};line-height:1.5;box-shadow:var(--kit-shadow,0 24px 80px #0004)}
:where(.kit-dialog)::backdrop{background:var(--kit-backdrop,#0009)}
:where(.kit-dialog[open]){animation:kit-in .18s ease-out}
@keyframes kit-in{from{opacity:0;transform:translateY(8px) scale(.98)}}
:where(.kit-eyebrow){margin:0;font-size:.8125rem;font-weight:700;color:${muted}}
:where(.kit-title){margin:2px 0 0;font-size:1.375rem;line-height:1.3}
:where(.kit-summary){margin:6px 0 0;color:${muted}}
:where(.kit-actions){display:grid;gap:10px;margin-top:20px}
:where(.kit-btn){box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:44px;padding:10px 16px;border-radius:calc(${radius} * .65);font:inherit;font-weight:700;cursor:pointer;text-decoration:none}
:where(.kit-btn-primary){border:0;background:${accent};color:${onAccent}}
:where(.kit-btn-secondary){border:1px solid ${line};background:transparent;color:inherit}
:where(.kit-btn):focus-visible,:where(.kit-dialog) :where(button,a,input,select,[tabindex]):focus-visible{outline:3px solid ${accent};outline-offset:2px}
:where(.kit-btn):disabled{opacity:.5;cursor:not-allowed}
:where(.kit-score){margin:4px 0 0;font-size:3rem;font-weight:800;line-height:1.1;font-variant-numeric:tabular-nums}
:where(.kit-score small){margin-left:4px;font-size:1.25rem}
:where(.kit-stats){display:grid;grid-template-columns:repeat(auto-fit,minmax(88px,1fr));gap:8px;margin:16px 0 0;padding:0}
:where(.kit-stats>div){padding:10px 8px;border-radius:calc(${radius} * .6);background:${tint};text-align:center}
:where(.kit-stats dt){font-size:.75rem;font-weight:700;color:${muted}}
:where(.kit-stats dd){margin:2px 0 0;font-size:1.25rem;font-weight:800;font-variant-numeric:tabular-nums}
:where(.kit-split){display:grid;gap:20px}
@media (min-width:720px){:where(.kit-dialog.kit-wide){--kit-dialog-width:760px}:where(.kit-split){grid-template-columns:1fr 1fr}}
:where(.kit-section){margin-top:16px}
:where(.kit-section-title){margin:0 0 8px;font-size:.875rem;font-weight:800}
:where(.kit-stars){display:inline-flex;gap:2px;color:var(--kit-star,#f2b100)}
:where(.kit-stars .off){color:${line}}
:where(.kit-choice){display:grid;grid-template-columns:repeat(auto-fit,minmax(96px,1fr));gap:8px;margin:0;padding:0;border:0}
:where(.kit-choice button){min-height:44px;padding:8px;border:1px solid ${line};border-radius:calc(${radius} * .6);background:transparent;color:inherit;font:inherit;font-weight:700;cursor:pointer}
:where(.kit-choice button[aria-pressed=true]){border-color:${accent};background:${accent};color:${onAccent}}
:where(.kit-choice small){display:block;font-weight:500;opacity:.85}
:where(.kit-levels){display:grid;grid-template-columns:repeat(auto-fill,minmax(var(--kit-level-min,120px),1fr));gap:8px;margin:0;padding:0;list-style:none}
:where(.kit-levels button){box-sizing:border-box;display:flex;flex-direction:column;align-items:flex-start;gap:4px;width:100%;min-height:72px;padding:10px 12px;border:1px solid ${line};border-radius:calc(${radius} * .6);background:${tint};color:inherit;font:inherit;text-align:left;cursor:pointer}
:where(.kit-levels button:disabled){opacity:.5;cursor:not-allowed}
:where(.kit-levels button[aria-current=true]){border-color:${accent};box-shadow:inset 0 0 0 1px ${accent}}
:where(.kit-help-art){margin:12px 0}
:where(.kit-pager){display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:20px}
:where(.kit-pager-dots){display:flex;gap:6px}
:where(.kit-pager-dots i){width:8px;height:8px;border-radius:50%;background:${line}}
:where(.kit-pager-dots i[aria-current=true]){background:${accent}}
:where(.kit-settings){display:grid;gap:14px;margin:12px 0 0}
:where(.kit-setting){display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:44px}
:where(.kit-setting>span){display:flex;flex-direction:column}
:where(.kit-setting small){color:${muted}}
:where(.kit-setting input[type=range]){width:min(50%,180px);accent-color:${accent}}
:where(.kit-setting input[type=checkbox]){width:22px;height:22px;accent-color:${accent}}
:where(.kit-setting select){min-height:36px;padding:4px 8px;border:1px solid ${line};border-radius:8px;background:${surface};color:inherit;font:inherit}
:where(.kit-next){display:flex;flex-direction:column;gap:8px;align-self:stretch;width:100%;min-width:0;margin-top:16px;padding-top:14px;border-top:1px solid #8885;text-align:left;font-family:${font};color:inherit}
:where(.kit-next)>p{font-size:12px;line-height:1.6;margin:0;color:inherit;opacity:.85}
:where(.kit-next) button{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;min-height:44px;padding:10px 12px;margin:0;border:1px solid #8885;border-radius:6px;background:#8881;color:inherit;text-align:left;font:inherit;font-size:12px;line-height:1.5;cursor:pointer;box-shadow:none;white-space:normal}
:where(.kit-next) button:hover{background:#8883}
:where(.kit-next) button:active{transform:translateY(1px)}
:where(.kit-next) button:focus-visible{outline:3px solid currentColor;outline-offset:2px}
:where(.kit-next) button span{display:flex;flex-direction:column;gap:2px;min-width:0}
:where(.kit-next) button b{font-size:12px;font-weight:700}
:where(.kit-next) button small{font-size:11px;opacity:.8}
:where(.kit-next) .kit-next-hub{justify-content:center;border:0;background:transparent;text-decoration:underline;text-underline-offset:3px}
:where(.kit-score-feedback){font:600 13px/1.6 ${font};color:inherit;margin:8px 0;overflow-wrap:anywhere}
:root[data-kit-motion=reduce] :where(.kit-dialog,.kit-dialog *){animation:none!important;transition:none!important}
:where(.kit-motion-reduce) :where(.kit-dialog,.kit-dialog *){animation:none!important;transition:none!important}
@media (prefers-reduced-motion:reduce){:where(.kit-dialog,.kit-dialog *){animation:none!important;transition:none!important}}
}`;
