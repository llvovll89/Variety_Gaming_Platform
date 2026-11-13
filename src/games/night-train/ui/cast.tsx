import type { ReactElement } from 'react';
import { M, Sprite } from './pixel';

/**
 * The cast of 별빛 야간열차 as pixel JRPG sprites. Each character is composed from shapes and
 * shaded by the Sprite builder, so all of them share one light direction, outline and pixel size.
 * Every sprite is original artwork for this game.
 */
type Pt = [number, number];
const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

function hero() {
  const s = new Sprite(36, 52, M).ground(18, 49, 11, 2).glow(30, 27, 10, '#ffd98a');
  // head (behind the body)
  s.ellipse(18, 16, 10, 10, 'hair')
    .ellipse(9, 17, 1, 2, 'skin').ellipse(27, 17, 1, 2, 'skin')
    .ellipse(18, 17, 8, 8, 'skin')
    .poly([[10, 10], [26, 10], [27, 14], [24, 13], [22, 15], [19, 12], [16, 15], [13, 12], [10, 15]], 'hair')
    .rect(9, 7, 19, 4, 'navy').ellipse(18, 7, 9, 3, 'navy')
    .rect(9, 10, 19, 2, 'navyDark')
    .poly([[9, 12], [27, 12], [25, 14], [11, 14]], 'visor');
  // body
  s.rect(12, 39, 5, 7, 'trouser').rect(19, 39, 5, 7, 'trouser')
    .rect(11, 45, 7, 3, 'boot').rect(18, 45, 7, 3, 'boot')
    .poly([[11, 25], [25, 25], [28, 41], [8, 41]], 'navy')
    .rect(9, 34, 18, 2, 'boot').rect(16, 34, 4, 2, 'gold')
    .poly([[14, 25], [22, 25], [18, 31]], 'cloth').rect(17, 26, 2, 4, 'red')
    .rect(9, 25, 4, 2, 'gold').rect(23, 25, 4, 2, 'gold')
    // left arm with the ticket punch
    .poly([[9, 26], [13, 27], [11, 37], [7, 37]], 'navy').rect(7, 36, 5, 1, 'cloth').ellipse(9, 38, 2, 2, 'skin')
    .line(8, 41, 6, 45, 'steel').line(10, 41, 10, 45, 'steel')
    // right arm raising the lantern
    .poly([[23, 26], [27, 26], [31, 21], [28, 19]], 'navy').ellipse(30, 19, 2, 2, 'skin')
    .line(30, 21, 30, 22, 'steel').rect(28, 23, 5, 1, 'gold').rect(28, 24, 5, 6, 'glass').rect(28, 30, 5, 1, 'gold');
  s.px(range(35, 40).map(y => [18, y] as Pt), '#1d2858')
    .px([[14, 29], [14, 32], [22, 29], [22, 32]], '#f2c25a')
    .px([[30, 26], [30, 27]], '#fffbe6')
    .px([[18, 4], [17, 5], [18, 5], [19, 5], [16, 6], [18, 6], [20, 6], [18, 7]], '#ffe9a0')
    .px([[13, 14], [14, 14], [22, 14], [23, 14]], '#3c2214');
  for (const x of [13, 21]) {
    s.px([[x, 16], [x + 1, 16], [x, 17], [x + 1, 17], [x, 18], [x + 1, 18]], '#24183c').px([[x + 1, 16]], '#ffffff').px([[x, 18]], '#6a58a8');
  }
  s.px([[12, 20], [13, 20], [23, 20], [24, 20]], '#ff9e8a').px([[17, 21], [18, 21]], '#9a3a32');
  return s;
}

function rat() {
  const s = new Sprite(46, 34, M).ground(24, 31, 15, 2);
  s.line(36, 26, 42, 23, 'pink', 2).line(42, 23, 43, 17, 'pink', 2).line(43, 17, 40, 14, 'pink', 2)
    .ellipse(25, 22, 13, 8, 'fur')
    .poly([[18, 16], [20, 11], [23, 15], [26, 10], [29, 15], [32, 12], [33, 17]], 'fur')
    .ellipse(21, 26, 7, 3, 'furLight')
    .ellipse(9, 12, 4, 4, 'fur').ellipse(9, 12, 2, 2, 'pink')
    .ellipse(17, 11, 4, 4, 'fur').ellipse(17, 11, 2, 2, 'pink')
    .ellipse(12, 20, 8, 7, 'fur').ellipse(5, 22, 3, 2, 'fur')
    .ellipse(17, 30, 3, 1, 'furLight').ellipse(31, 30, 3, 1, 'furLight');
  for (const x of [8, 13]) s.px([[x, 18]], '#fff2a0').px([[x + 1, 18], [x, 19]], '#ffd23d').px([[x + 1, 19]], '#1b1626');
  s.px([[7, 16], [8, 17], [14, 17], [15, 16]], '#1b1626')
    .px([[2, 21], [2, 22]], '#e88a98')
    .px([[0, 19], [1, 20], [0, 25], [1, 24]], '#d8d4e6')
    .px([[5, 25]], '#fffbe8')
    .px([[36, 9], [40, 7], [31, 6], [44, 11]], '#ffb14a')
    .px([[24, 21], [28, 24], [33, 20]], '#3a3548');
  return s;
}

function ghost() {
  const s = new Sprite(46, 46, M).ground(18, 43, 10, 2).glow(18, 21, 22, '#dff0ff');
  s.ellipse(18, 19, 13, 13, 'ghost').rect(5, 19, 27, 15, 'ghost');
  for (const [x, r] of [[8, 3], [14, 3], [20, 3], [26, 3], [30, 2]] as Pt[]) s.ellipse(x, 34, r, 3, 'ghost');
  s.clear([[11, 37], [17, 37], [23, 37], [28, 36]])
    .poly([[30, 22], [37, 17], [38, 20], [31, 26]], 'ghost')
    .rect(36, 12, 8, 5, 'ticket')
    .poly([[8, 8], [26, 4], [28, 9], [9, 12]], 'capGrey')
    .poly([[6, 12], [29, 8], [30, 10], [7, 14]], 'visor');
  s.px([[41, 12], [41, 14], [41, 16]], '#b4863a').px([[38, 14], [39, 14]], '#b4863a')
    .px([[17, 6], [18, 6], [17, 7], [18, 7]], '#f0d080')
    .dot(12, 19, 2, 3, '#2a3150').px([[12, 20]], '#a8dcff')
    .dot(24, 19, 2, 3, '#2a3150').px([[24, 20]], '#a8dcff')
    .dot(18, 26, 1.4, 2, '#2a3150')
    .px([[8, 23], [9, 23], [27, 23], [28, 23]], '#b8c8ff')
    .px([[2, 8], [41, 30], [2, 30], [35, 4]], '#ffffff');
  return s;
}

function moth() {
  const s = new Sprite(50, 40, M).ground(25, 37, 10, 2).glow(25, 18, 24, '#fff1b8');
  const mirror = (pts: Pt[]): Pt[] => pts.map(([x, y]) => [50 - x, y]);
  const hind: Pt[] = [[23, 20], [11, 22], [8, 28], [14, 33], [23, 27]];
  const fore: Pt[] = [[23, 14], [9, 4], [2, 8], [2, 17], [9, 23], [23, 20]];
  s.poly(hind, 'wing2').poly(mirror(hind), 'wing2').poly(fore, 'wing').poly(mirror(fore), 'wing')
    .ellipse(25, 24, 3, 11, 'mothBody').ellipse(25, 15, 5, 2, 'fluff').ellipse(25, 11, 4, 4, 'mothBody')
    .line(23, 7, 19, 1, 'mothBody').line(27, 7, 31, 1, 'mothBody');
  for (const x of [11, 39]) s.dot(x, 12, 3, 3, '#6a3e22').dot(x, 12, 1.4, 1.4, '#ffe8a8').px([[x, 12]], '#3a2418');
  s.px([[4, 15], [6, 19], [44, 19], [46, 15], [14, 30], [36, 30]], '#fff6d8')
    .px([[23, 22], [25, 22], [27, 22], [24, 26], [26, 26], [23, 30], [25, 30], [27, 30]], '#4a2e1a')
    .px([[23, 11], [27, 11]], '#1b1626').px([[23, 10], [27, 10]], '#ffffff')
    .px([[20, 2], [18, 3], [30, 2], [32, 3]], '#8a5a3a')
    .px([[6, 30], [44, 30], [25, 38], [2, 22], [48, 24]], '#fff1b8');
  return s;
}

function doll() {
  const s = new Sprite(42, 52, M).ground(20, 49, 11, 2);
  for (const x of [15, 24]) s.line(x, 40, x + 2, 42, 'steel').line(x + 2, 42, x, 44, 'steel').line(x, 44, x + 2, 46, 'steel');
  s.ellipse(16, 47, 4, 1, 'boot').ellipse(25, 47, 4, 1, 'boot')
    .line(30, 31, 34, 31, 'steel', 2).ellipse(36, 27, 2, 2, 'steel').ellipse(36, 35, 2, 2, 'steel')
    .rect(10, 24, 21, 17, 'rust').clear([[10, 24], [30, 24], [10, 40], [30, 40]])
    .rect(10, 27, 21, 2, 'gold').rect(10, 36, 21, 2, 'gold')
    .ellipse(20, 32, 2, 2, 'cloth')
    .poly([[11, 25], [7, 18], [9, 16], [13, 23]], 'rust').ellipse(8, 14, 3, 3, 'cloth')
    .poly([[30, 25], [33, 32], [31, 34], [28, 28]], 'rust').ellipse(32, 35, 2, 2, 'cloth')
    .ellipse(20, 15, 8, 8, 'dollHead')
    .rect(15, 3, 11, 5, 'navy').rect(13, 8, 15, 1, 'navyDark')
    .poly([[21, 3], [25, 0], [27, 1], [23, 4]], 'red');
  s.px([[36, 27], [36, 35]], '#2a2a36')
    .px([12, 16, 20, 24, 28].flatMap(x => [[x, 27], [x, 36]] as Pt[]), '#fff3b0')
    .px([[13, 31], [14, 32], [26, 39], [27, 39], [24, 25]], '#74331c')
    .px([[20, 31], [21, 32]], '#1b1626')
    .px([[20, 5], [21, 5]], '#e2aa3e');
  for (const x of [16, 23]) s.px([[x, 14], [x + 1, 14], [x, 15], [x + 1, 15]], '#2a1d16').px([[x + 1, 14]], '#ffffff');
  s.px([[14, 18], [15, 18], [25, 18], [26, 18]], '#e0604a')
    .px([[17, 20], [18, 21], [19, 20], [20, 21], [21, 20], [22, 21], [23, 20]], '#5a2a1a');
  return s;
}

function inspector() {
  const s = new Sprite(42, 58, M).ground(20, 55, 14, 2).glow(17, 15, 5, '#ff8a6a').glow(24, 15, 5, '#ff8a6a');
  s.ellipse(20, 53, 15, 2, 'mist')
    .poly([[12, 22], [28, 22], [33, 52], [7, 52]], 'coat').clear([[10, 51], [15, 51], [21, 51], [27, 51], [12, 51], [24, 51]])
    .rect(10, 38, 21, 2, 'boot')
    .poly([[12, 24], [7, 30], [9, 33], [13, 28]], 'coat')
    .rect(2, 30, 8, 11, 'paper').rect(4, 29, 4, 2, 'gold')
    .poly([[28, 24], [35, 30], [33, 33], [27, 28]], 'coat').ellipse(35, 33, 2, 2, 'glove')
    .line(36, 35, 39, 40, 'gold').line(34, 36, 36, 41, 'gold')
    .ellipse(20, 15, 8, 9, 'shade')
    .rect(11, 3, 19, 6, 'shade').ellipse(20, 4, 9, 2, 'shade')
    .rect(11, 8, 19, 2, 'red')
    .poly([[9, 10], [31, 10], [29, 12], [11, 12]], 'visor')
    .rect(18, 4, 4, 3, 'gold');
  s.px([[16, 23], [17, 24], [18, 26], [19, 27], [20, 28], [21, 27], [22, 26], [23, 24], [24, 23]], '#15112a')
    .px([[21, 31], [21, 35], [21, 43], [21, 47]], '#e2aa3e')
    .px([[3, 33], [4, 33], [5, 33], [6, 33], [3, 35], [4, 35], [5, 35], [3, 37], [4, 37], [5, 37], [6, 37]], '#6a5e4d')
    .px([[16, 15], [17, 15], [23, 15], [24, 15]], '#ffc4ae').px([[16, 16], [24, 16]], '#ff8a6a')
    .px([[16, 20], [18, 21], [20, 21], [22, 21], [24, 20]], '#ff8a6a');
  return s;
}

function golem() {
  const s = new Sprite(58, 62, M).ground(28, 59, 22, 2).glow(28, 41, 16, '#ff9a4a').glow(20, 18, 5, '#ffb347').glow(36, 18, 5, '#ffb347');
  s.rect(12, 49, 11, 9, 'ironDark').rect(33, 49, 11, 9, 'ironDark')
    .rect(23, 3, 10, 10, 'ironDark').rect(21, 2, 14, 2, 'gold')
    .rect(9, 23, 38, 28, 'iron').ellipse(28, 26, 19, 14, 'iron')
    .poly([[10, 26], [3, 32], [4, 40], [10, 37]], 'iron').ellipse(5, 44, 5, 5, 'iron')
    .poly([[46, 26], [53, 32], [52, 40], [46, 37]], 'iron').ellipse(51, 44, 5, 5, 'iron')
    .ellipse(28, 25, 6, 6, 'gold').ellipse(28, 25, 4, 4, 'gauge')
    .rect(18, 17, 5, 2, 'fire').rect(33, 17, 5, 2, 'fire')
    .rect(18, 36, 20, 11, 'furnace').rect(20, 38, 16, 7, 'fire')
    .line(45, 18, 51, 18, 'gold', 2).line(51, 18, 51, 27, 'gold', 2);
  s.px(range(10, 46).filter(x => x < 18 || x > 38).map(x => [x, 34] as Pt), '#2a2733')
    .px([12, 16, 40, 44].map(x => [x, 35] as Pt), '#d2cde0')
    .px([10, 14, 42, 46].map(x => [x, 49] as Pt), '#d2cde0')
    .px([[29, 24], [30, 23]], '#c24a3c').px([[28, 25], [28, 21], [24, 25], [32, 25]], '#1b1626')
    .px(range(38, 44).flatMap(y => [[24, y], [28, y], [32, y]] as Pt[]), '#2a1a14')
    .px([[4, 42], [6, 41], [50, 42], [52, 41]], '#34303e')
    .px([[53, 13], [55, 11], [30, 0], [26, 0]], '#f2f0f8');
  return s;
}

function witch() {
  const s = new Sprite(58, 66, M).glow(49, 11, 11, '#9af2d2').glow(25, 28, 4, '#9af2d2').glow(31, 28, 4, '#9af2d2');
  s.ellipse(28, 62, 26, 2, 'fog')
    .line(46, 14, 43, 63, 'wood', 2).ellipse(49, 11, 3, 3, 'wisp')
    .poly([[28, 24], [12, 59], [18, 61], [24, 59], [30, 62], [36, 59], [42, 61], [46, 59]], 'robe')
    .poly([[20, 26], [17, 42], [20, 42], [22, 30]], 'silver').poly([[36, 26], [39, 42], [36, 42], [34, 30]], 'silver')
    .poly([[36, 34], [44, 29], [46, 31], [38, 38]], 'robe').ellipse(45, 29, 2, 2, 'pale')
    .ellipse(28, 28, 7, 6, 'void')
    .ellipse(28, 21, 17, 3, 'hat')
    .poly([[19, 20], [37, 20], [32, 10], [35, 4], [40, 1], [30, 1], [25, 8]], 'hat')
    .rect(20, 18, 16, 2, 'red');
  s.px([[25, 28], [26, 28], [30, 28], [31, 28]], '#c8fff0')
    .px([[26, 30], [27, 31], [28, 31], [29, 31], [30, 30]], '#6ad6b0')
    .px([[22, 45], [33, 50], [27, 40], [38, 55], [19, 54], [30, 46]], '#e3bf75')
    .px([[26, 18], [29, 18], [26, 19], [29, 19]], '#e3bf75')
    .px([[47, 13], [46, 15], [52, 9]], '#c8fff0');
  return s;
}

function lamp() {
  const s = new Sprite(30, 58, M).ground(14, 55, 8, 2).glow(14, 22, 18, '#ffd98a');
  s.poly([[6, 54], [22, 54], [20, 50], [8, 50]], 'iron')
    .rect(12, 36, 4, 14, 'ironDark')
    .rect(7, 33, 14, 3, 'gold')
    .poly([[5, 10], [23, 10], [21, 33], [7, 33]], 'glass')
    .ellipse(14, 24, 4, 6, 'flame')
    .poly([[5, 10], [23, 10], [19, 5], [9, 5]], 'gold').ellipse(14, 3, 2, 2, 'gold');
  s.px([[10, 40], [9, 39], [9, 38], [10, 37], [18, 40], [19, 39], [19, 38], [18, 37]], '#3c3848')
    .px(range(11, 32).flatMap(y => [[10, y], [18, y]] as Pt[]).filter(([x, y]) => !(x >= 11 && x <= 17 && y >= 18 && y <= 30)), '#b07a32')
    .dot(14, 26, 1.5, 2.5, '#fff3bc')
    .px([[13, 24], [15, 24]], '#3a1a10').px([[14, 27]], '#c0502a')
    .px([[7, 12], [7, 14], [7, 16], [7, 18], [7, 20], [8, 22], [8, 24]], '#ffffff');
  return s;
}

function engine() {
  const s = new Sprite(74, 64, M).ground(36, 61, 32, 2).glow(36, 36, 22, '#ffe7a1');
  s.ellipse(15, 9, 6, 5, 'smoke').ellipse(23, 5, 5, 4, 'smoke').ellipse(9, 4, 4, 3, 'smoke')
    .ellipse(11, 55, 6, 6, 'ironDark').ellipse(61, 55, 6, 6, 'ironDark')
    .poly([[16, 19], [15, 9], [13, 7], [27, 7], [25, 9], [24, 19]], 'engine').rect(13, 6, 14, 2, 'gold')
    .ellipse(51, 17, 6, 4, 'gold').rect(50, 10, 2, 3, 'gold')
    .rect(6, 19, 62, 32, 'engine').clear([[6, 19], [67, 19], [6, 50], [67, 50]])
    .rect(6, 19, 62, 4, 'engineTop').rect(6, 29, 62, 2, 'gold')
    .ellipse(10, 45, 3, 3, 'ironDark').ellipse(62, 45, 3, 3, 'ironDark')
    .ellipse(36, 37, 14, 13, 'face')
    .ellipse(36, 36, 8, 8, 'gold').ellipse(36, 36, 6, 6, 'glass')
    .line(22, 27, 31, 31, 'brow', 2).line(50, 27, 41, 31, 'brow', 2)
    .rect(31, 47, 10, 3, 'cow')
    .poly([[6, 51], [66, 51], [72, 60], [0, 60]], 'cow');
  const rivets: Pt[] = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    return [Math.round(36 + Math.cos(a) * 12), Math.round(37 + Math.sin(a) * 11)];
  });
  s.px(rivets.filter(([, y]) => y > 30 || y < 26), '#9a94ac')
    .px([[33, 33], [34, 32], [32, 34]], '#ffffff')
    .px([[33, 48], [35, 48], [37, 48], [39, 48]], '#f0e5cd')
    .px([0, 1, 2, 3, 4, 5].flatMap(k => range(0, 6).map(t => [11 + k * 10 + Math.round(t / 3), 53 + t] as Pt)), '#4e1410')
    .px([[11, 55], [61, 55]], '#e2aa3e')
    .px([[1, 46], [2, 44], [70, 46], [71, 44], [3, 42]], '#f2f0f8');
  return s;
}

const memo = <T,>(make: () => T) => { let v: T | undefined; return () => (v ??= make()); };
const SPRITES = {
  hero: memo(hero), rat: memo(rat), ghost: memo(ghost), moth: memo(moth), doll: memo(doll),
  inspector: memo(inspector), golem: memo(golem), witch: memo(witch), lamp: memo(lamp), engine: memo(engine),
};

export function Conductor({ photo }: { photo?: string | null }) {
  const face = photo ? (
    <g>
      <clipPath id="nt-hero-face"><circle cx="18" cy="17" r="7.6" /></clipPath>
      <image href={photo} x="10" y="9" width="16" height="16" preserveAspectRatio="xMidYMid slice" clipPath="url(#nt-hero-face)" />
      <circle cx="18" cy="17" r="7.6" fill="none" stroke="#1b1626" strokeWidth="1" />
    </g>
  ) : undefined;
  return SPRITES.hero().render('nt-pixel-hero', face, 1.2);
}

export const ENEMY_ART: Record<string, () => ReactElement> = {
  // World scale: a rat is knee-high to the conductor, the engine towers over everything.
  'soot-rat': () => SPRITES.rat().render('', undefined, 0.72),
  ticketless: () => SPRITES.ghost().render('', undefined, 1),
  moth: () => SPRITES.moth().render('nt-art-flutter', undefined, 0.8),
  'rust-doll': () => SPRITES.doll().render('', undefined, 0.95),
  inspector: () => SPRITES.inspector().render('', undefined, 1.15),
  'boiler-golem': () => SPRITES.golem().render('', undefined, 1.15),
  'fog-witch': () => SPRITES.witch().render('', undefined, 1.1),
  'twin-lamp': () => SPRITES.lamp().render('', undefined, 1.05),
  'black-engine': () => SPRITES.engine().render('', undefined, 1.35),
};
