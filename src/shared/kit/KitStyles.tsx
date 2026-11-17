import { kitCss } from './kitCss';

/**
 * Renders the kit stylesheet. Render once per document (App) and once inside each shadow root that
 * uses kit components. A plain <style>, never React's hoisted <style precedence>, so it stays put.
 */
export function KitStyles() {
  return <style data-kit="">{kitCss}</style>;
}
