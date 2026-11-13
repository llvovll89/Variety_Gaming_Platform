import type { ReactElement } from 'react';

/**
 * The cast of 별빛 야간열차, drawn as storybook illustrations: one ink outline (#1b1626),
 * warm lamp key light from the upper left, cool shade on the right, and a rim light on the lit edge.
 * Every piece is original artwork for this game. Gradient ids are static and identical per
 * character, so several copies on one screen share the same definitions safely.
 */
const INK = '#1b1626';

export function Conductor({ photo }: { photo?: string | null }) {
  return (
    <svg viewBox="0 0 160 190" className="nt-art" aria-hidden="true">
      <defs>
        <linearGradient id="cd-coat" x1="0" x2="1"><stop offset="0" stopColor="#5068b8" /><stop offset=".5" stopColor="#2f4182" /><stop offset="1" stopColor="#1c2655" /></linearGradient>
        <radialGradient id="cd-skin" cx=".38" cy=".35" r=".75"><stop offset="0" stopColor="#fff2e2" /><stop offset=".6" stopColor="#ffd9b8" /><stop offset="1" stopColor="#eab28e" /></radialGradient>
        <linearGradient id="cd-hair" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#8a5434" /><stop offset="1" stopColor="#4a2a1a" /></linearGradient>
        <linearGradient id="cd-cap" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3f54a0" /><stop offset="1" stopColor="#1b2455" /></linearGradient>
        <linearGradient id="cd-visor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3a3a4c" /><stop offset="1" stopColor="#0c0c14" /></linearGradient>
        <linearGradient id="cd-brass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff0b0" /><stop offset=".45" stopColor="#e2b04e" /><stop offset="1" stopColor="#9a6a22" /></linearGradient>
        <radialGradient id="cd-glow"><stop offset="0" stopColor="#ffe2a0" stopOpacity=".85" /><stop offset="1" stopColor="#ffe2a0" stopOpacity="0" /></radialGradient>
        <radialGradient id="cd-lamp" cx=".5" cy=".55"><stop offset="0" stopColor="#fffbe6" /><stop offset=".5" stopColor="#ffd06a" /><stop offset="1" stopColor="#e48a2a" /></radialGradient>
        <radialGradient id="cd-iris" cx=".45" cy=".35"><stop offset="0" stopColor="#7a5cb4" /><stop offset="1" stopColor="#24183c" /></radialGradient>
        <clipPath id="cd-face"><ellipse cx="80" cy="66" rx="26" ry="24" /></clipPath>
      </defs>
      <ellipse cx="80" cy="182" rx="44" ry="6" fill="#000" opacity=".35" />
      <circle cx="125" cy="110" r="44" fill="url(#cd-glow)" />
      {/* legs + shoes */}
      <path d="M62 150 L60 175 L75 175 L76 150Z M84 150 L86 175 L100 175 L96 150Z" fill="#1d2140" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      <path d="M55 180 Q55 172 64 172 L76 173 L76 180Z M84 180 L84 173 L96 172 Q105 172 105 180Z" fill="#2c1d15" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      <path d="M59 175 l6 -1 M89 174 l6 0" stroke="#7a5a48" strokeWidth="1.4" strokeLinecap="round" />
      {/* coat */}
      <path d="M50 104 Q80 90 110 104 L118 162 Q100 170 80 168 Q60 170 42 162 Z" fill="url(#cd-coat)" stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M80 98 Q102 99 110 104 L118 162 Q100 170 80 168Z" fill="#0b1236" opacity=".22" />
      <path d="M80 112 L80 150 M80 150 L74 168 M80 150 L86 168" stroke={INK} strokeWidth="1.6" opacity=".7" strokeLinecap="round" />
      <path d="M50 110 Q45 136 44 158" stroke="#a8bcff" strokeWidth="2" opacity=".55" fill="none" strokeLinecap="round" />
      <rect x="50" y="132" width="60" height="7" rx="2" fill="#5a3420" stroke={INK} strokeWidth="1.6" />
      <rect x="75" y="130.5" width="10" height="10" rx="1.6" fill="url(#cd-brass)" stroke={INK} strokeWidth="1.4" />
      {[[70, 118], [90, 118], [70, 148], [90, 148]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="2.6" fill="url(#cd-brass)" stroke={INK} strokeWidth="1" />)}
      {/* collar, lapels, tie, epaulettes */}
      <path d="M66 100 L74 120 L61 113Z M94 100 L86 120 L99 113Z" fill="#26346e" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M66 100 L80 116 L94 100 L88 96 L80 104 L72 96Z" fill="#f6ecd8" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M78 106 L82 106 L83.5 117 L80 121 L76.5 117Z" fill="#c24a3c" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M49 106 Q55 97 65 100 L63 106 Q55 105 50 110Z M111 106 Q105 97 95 100 L97 106 Q105 105 110 110Z" fill="url(#cd-brass)" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
      {/* left arm with ticket punch */}
      <path d="M51 106 Q35 122 37 144 L48 146 Q48 128 58 114Z" fill="url(#cd-coat)" stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M36.5 140 L49 142 L48.5 149 L36 147Z" fill="#f6ecd8" stroke={INK} strokeWidth="1.3" />
      <path d="M38 152 L46 152 L44 146 L40 146Z" fill="#c4c9d6" stroke={INK} strokeWidth="1.2" />
      <path d="M40 156 L35 171 M46 156 L45 172" stroke={INK} strokeWidth="4.4" strokeLinecap="round" />
      <path d="M40 156 L35 171 M46 156 L45 172" stroke="#9aa0b2" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="43" cy="153" r="5.5" fill="url(#cd-skin)" stroke={INK} strokeWidth="1.6" />
      {/* right arm raising the lantern */}
      <path d="M107 106 Q123 110 127 96 L119 91 Q116 101 103 100Z" fill="url(#cd-coat)" stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M117 92 L127 96 L129 90 L120 86Z" fill="#f6ecd8" stroke={INK} strokeWidth="1.3" />
      <path d="M125 88 L125 93" stroke={INK} strokeWidth="1.8" />
      <path d="M119 98 L131 98 L129 93 L121 93Z" fill="url(#cd-brass)" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
      <rect x="117.5" y="98" width="15" height="21" rx="3" fill="url(#cd-lamp)" stroke={INK} strokeWidth="1.8" />
      <path d="M121.5 99 V118 M128.5 99 V118" stroke="#7a5320" strokeWidth="1.2" opacity=".75" />
      <path d="M125 103 Q120.5 109 125 115 Q129.5 109 125 103Z" fill="#fff6d2" />
      <path d="M116 119 L134 119 L131 125 L119 125Z" fill="url(#cd-brass)" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
      <circle cx="124" cy="84" r="5.5" fill="url(#cd-skin)" stroke={INK} strokeWidth="1.6" />
      {/* head */}
      <path d="M50 64 Q50 36 80 34 Q110 36 110 64 Q110 80 102 88 L58 88 Q50 80 50 64Z" fill="url(#cd-hair)" stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
      <ellipse cx="54" cy="70" rx="4.5" ry="5.5" fill="url(#cd-skin)" stroke={INK} strokeWidth="1.6" />
      <ellipse cx="106" cy="70" rx="4.5" ry="5.5" fill="url(#cd-skin)" stroke={INK} strokeWidth="1.6" />
      {photo ? (
        <>
          <image href={photo} x="54" y="42" width="52" height="48" preserveAspectRatio="xMidYMid slice" clipPath="url(#cd-face)" />
          <ellipse cx="80" cy="66" rx="26" ry="24" fill="none" stroke={INK} strokeWidth="2.2" />
        </>
      ) : (
        <>
          <ellipse cx="80" cy="66" rx="26" ry="24" fill="url(#cd-skin)" stroke={INK} strokeWidth="2.2" />
          <path d="M55 58 Q80 50 105 58 L105 63 Q80 55 55 63Z" fill="#b97c5c" opacity=".28" />
          <path d="M54 58 Q59 45 72 46 Q70 52 76 55 Q80 46 90 48 Q88 54 96 55 Q102 50 106 58 Q104 44 90 40 Q70 36 58 46Z" fill="url(#cd-hair)" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M65 61 Q70 58.5 74.5 60.5 M85.5 60.5 Q90 58.5 95 61" stroke="#4a2a1a" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          {[70, 90].map(x => (
            <g key={x}>
              <ellipse cx={x} cy="69" rx="4.3" ry="5.4" fill="url(#cd-iris)" stroke={INK} strokeWidth="1.2" />
              <circle cx={x + 1.6} cy="67" r="1.7" fill="#fff" />
              <circle cx={x - 1.3} cy="71.4" r=".8" fill="#fff" opacity=".9" />
            </g>
          ))}
          <ellipse cx="63" cy="76" rx="4.6" ry="2.6" fill="#ff9e8a" opacity=".55" />
          <ellipse cx="97" cy="76" rx="4.6" ry="2.6" fill="#ff9e8a" opacity=".55" />
          <path d="M80 72 l-1 3" stroke="#d08a66" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M75.5 78 Q80 82 84.5 78" stroke="#6a2a2a" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        </>
      )}
      {/* cap */}
      <path d="M50 52 Q52 29 80 27 Q108 29 110 52 Q80 46 50 52Z" fill="url(#cd-cap)" stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M50 52 Q80 46 110 52 L110 57 Q80 51 50 57Z" fill="#131a3e" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M52 57 Q80 50 108 57 Q104 65 80 62 Q56 65 52 57Z" fill="url(#cd-visor)" stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M62 58 Q78 55 96 58" stroke="#fff" strokeWidth="1.4" opacity=".35" fill="none" strokeLinecap="round" />
      <path d="M60 38 Q70 31 82 30" stroke="#fff" strokeWidth="3" opacity=".22" fill="none" strokeLinecap="round" />
      <path d="M80 32 l2.4 4.9 5.4 .8 -3.9 3.8 .9 5.4 -4.8 -2.5 -4.8 2.5 .9 -5.4 -3.9 -3.8 5.4 -.8z" fill="url(#cd-brass)" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

const SootRat = () => (
  <svg viewBox="0 0 160 160" className="nt-art" aria-hidden="true">
    <defs>
      <radialGradient id="rt-fur" cx=".35" cy=".3" r=".8"><stop offset="0" stopColor="#77718a" /><stop offset=".55" stopColor="#433e52" /><stop offset="1" stopColor="#24212e" /></radialGradient>
      <radialGradient id="rt-ear" cx=".4" cy=".4"><stop offset="0" stopColor="#ffc0c4" /><stop offset="1" stopColor="#c9677a" /></radialGradient>
      <radialGradient id="rt-eye" cx=".4" cy=".35"><stop offset="0" stopColor="#fffbd0" /><stop offset=".5" stopColor="#ffd23d" /><stop offset="1" stopColor="#d07800" /></radialGradient>
    </defs>
    <ellipse cx="82" cy="150" rx="50" ry="6" fill="#000" opacity=".35" />
    <path d="M118 132 Q152 128 148 100 Q146 86 134 90" stroke={INK} strokeWidth="8" fill="none" strokeLinecap="round" />
    <path d="M118 132 Q152 128 148 100 Q146 86 134 90" stroke="#5f5874" strokeWidth="4.5" fill="none" strokeLinecap="round" />
    <path d="M38 128 Q30 96 56 84 Q84 74 112 92 Q130 106 124 132 Q118 146 80 146 Q44 146 38 128Z" fill="url(#rt-fur)" stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
    <path d="M70 82 l4 -9 3 8 4 -10 3 10 4 -7 2 9" fill="url(#rt-fur)" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M58 87 Q86 79 110 95" stroke="#b6aed6" strokeWidth="2" opacity=".55" fill="none" strokeLinecap="round" />
    <ellipse cx="68" cy="128" rx="19" ry="12" fill="#5d576c" opacity=".75" />
    <path d="M94 104 q4 3 8 1 M100 118 q4 3 8 1 M86 132 q4 3 8 1" stroke="#2a2633" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity=".8" />
    <ellipse cx="40" cy="68" rx="11" ry="12" fill="url(#rt-fur)" stroke={INK} strokeWidth="2" />
    <ellipse cx="40.5" cy="69" rx="6.5" ry="7.5" fill="url(#rt-ear)" />
    <ellipse cx="62" cy="66" rx="11" ry="12" fill="url(#rt-fur)" stroke={INK} strokeWidth="2" />
    <ellipse cx="62.5" cy="67" rx="6.5" ry="7.5" fill="url(#rt-ear)" />
    <path d="M30 104 Q24 84 42 76 Q62 70 70 88 Q74 108 58 116 Q38 120 30 104Z" fill="url(#rt-fur)" stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
    {[[41, 92], [56, 91]].map(([x, y]) => (
      <g key={x}>
        <ellipse cx={x} cy={y} rx="5.2" ry="5.6" fill="url(#rt-eye)" stroke={INK} strokeWidth="1.4" />
        <ellipse cx={x} cy={y + .5} rx="1.3" ry="3.8" fill={INK} />
        <circle cx={x + 1.6} cy={y - 2} r="1.3" fill="#fff" />
      </g>
    ))}
    <path d="M35 84 l6 3 M52 83 l6 -1" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M28 104 L12 98 M28 106 L10 107 M29 108 L14 115" stroke="#d2cde0" strokeWidth="1" opacity=".85" strokeLinecap="round" />
    <circle cx="26" cy="104" r="3.6" fill="#ee8e9a" stroke={INK} strokeWidth="1.4" />
    <circle cx="25" cy="103" r="1" fill="#fff" opacity=".8" />
    <path d="M33 111 h5 v4.5 h-5z" fill="#fffbe8" stroke={INK} strokeWidth="1" />
    <ellipse cx="50" cy="146" rx="9" ry="4.6" fill="#4a4556" stroke={INK} strokeWidth="1.6" />
    <ellipse cx="100" cy="146" rx="9" ry="4.6" fill="#4a4556" stroke={INK} strokeWidth="1.6" />
    {[[104, 66, 1.8], [118, 78, 1.2], [92, 62, 1.1], [128, 110, 1.4]].map(([x, y, r]) => <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill="#ffb14a" opacity=".85" />)}
    {[[110, 72, 2.4], [84, 66, 1.8], [124, 96, 2]].map(([x, y, r]) => <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill="#2a2633" opacity=".7" />)}
  </svg>
);

const Ticketless = () => (
  <svg viewBox="0 0 160 170" className="nt-art" aria-hidden="true">
    <defs>
      <linearGradient id="tk-body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f6fbff" /><stop offset=".55" stopColor="#cfe2f4" /><stop offset="1" stopColor="#86a8d2" /></linearGradient>
      <radialGradient id="tk-aura"><stop offset="0" stopColor="#dff0ff" stopOpacity=".45" /><stop offset="1" stopColor="#dff0ff" stopOpacity="0" /></radialGradient>
      <linearGradient id="tk-cap" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#575c7c" /><stop offset="1" stopColor="#2a2d44" /></linearGradient>
      <radialGradient id="tk-hollow" cx=".5" cy=".6"><stop offset="0" stopColor="#3a4878" /><stop offset="1" stopColor="#1e2442" /></radialGradient>
    </defs>
    <circle cx="80" cy="92" r="66" fill="url(#tk-aura)" />
    <ellipse cx="80" cy="160" rx="30" ry="5" fill="#000" opacity=".22" />
    <path d="M36 140 Q30 74 80 42 Q130 74 124 140 Q116 132 108 144 Q98 132 88 146 Q78 134 68 146 Q58 132 48 144 Q42 134 36 140Z" fill="url(#tk-body)" stroke="#2b3150" strokeWidth="2.2" strokeLinejoin="round" opacity=".96" />
    <path d="M97 62 Q124 88 122 138 Q114 130 108 142 L104 120 Q107 84 97 62Z" fill="#6f90c0" opacity=".35" />
    <path d="M51 82 Q55 63 70 54" stroke="#fff" strokeWidth="4" opacity=".75" fill="none" strokeLinecap="round" />
    <path d="M114 92 Q132 90 140 80 L145 89 Q134 102 116 104Z" fill="url(#tk-body)" stroke="#2b3150" strokeWidth="1.8" strokeLinejoin="round" />
    <g transform="rotate(-18 148 82)">
      <rect x="136" y="74" width="26" height="14" rx="2" fill="#f2d58a" stroke={INK} strokeWidth="1.4" />
      <path d="M155 75 V87" stroke="#9a7128" strokeWidth="1.2" strokeDasharray="1.5 1.6" />
      <path d="M140 79 h10 M140 83 h7" stroke="#9a7128" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="158.5" cy="81" r="1.6" fill="#86a8d2" />
    </g>
    <g transform="rotate(-8 80 46)">
      <path d="M55 52 Q60 30 84 30 Q104 32 108 48 Q80 44 55 52Z" fill="url(#tk-cap)" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      <path d="M50 52 Q78 44 112 48 Q107 57 80 55 Q57 58 50 52Z" fill="#191b2b" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
      <rect x="75" y="35" width="11" height="7" rx="1" fill="#f2d58a" stroke={INK} strokeWidth="1" />
      <path d="M62 38 Q72 33 84 33" stroke="#fff" strokeWidth="2" opacity=".25" fill="none" strokeLinecap="round" />
    </g>
    {[66, 94].map(x => (
      <g key={x}>
        <ellipse cx={x} cy="86" rx="7.5" ry="10" fill="url(#tk-hollow)" />
        <ellipse cx={x + 1} cy="88" rx="2.8" ry="3.8" fill="#a8dcff" opacity=".85" />
      </g>
    ))}
    <ellipse cx="80" cy="110" rx="6.5" ry="7.5" fill="url(#tk-hollow)" />
    <ellipse cx="58" cy="100" rx="5" ry="2.6" fill="#9fb6ff" opacity=".35" />
    <ellipse cx="102" cy="100" rx="5" ry="2.6" fill="#9fb6ff" opacity=".35" />
    {[[24, 70, 2.4], [140, 120, 2], [30, 120, 1.6], [128, 50, 1.4]].map(([x, y, r]) => <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill="#e6f3ff" opacity=".7" />)}
  </svg>
);

const Moth = () => (
  <svg viewBox="0 0 160 160" className="nt-art nt-art-flutter" aria-hidden="true">
    <defs>
      <radialGradient id="mt-fore" cx=".3" cy=".35" r=".8"><stop offset="0" stopColor="#fff0bf" /><stop offset=".5" stopColor="#ecbd66" /><stop offset="1" stopColor="#b5773a" /></radialGradient>
      <radialGradient id="mt-hind" cx=".4" cy=".3" r=".8"><stop offset="0" stopColor="#e6a75c" /><stop offset="1" stopColor="#7e4a24" /></radialGradient>
      <linearGradient id="mt-body" x1="0" x2="1"><stop offset="0" stopColor="#a8784e" /><stop offset="1" stopColor="#523420" /></linearGradient>
      <radialGradient id="mt-dust"><stop offset="0" stopColor="#fff1b8" stopOpacity=".5" /><stop offset="1" stopColor="#fff1b8" stopOpacity="0" /></radialGradient>
    </defs>
    <circle cx="80" cy="80" r="70" fill="url(#mt-dust)" />
    <ellipse cx="80" cy="152" rx="28" ry="4.5" fill="#000" opacity=".2" />
    <path d="M78 90 Q48 92 36 112 Q40 128 58 124 Q74 114 80 97Z M82 90 Q112 92 124 112 Q120 128 102 124 Q86 114 80 97Z" fill="url(#mt-hind)" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
    <path d="M78 74 Q40 28 17 52 Q7 74 28 89 Q52 95 78 84Z M82 74 Q120 28 143 52 Q153 74 132 89 Q108 95 82 84Z" fill="url(#mt-fore)" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
    <path d="M76 78 Q50 60 30 58 M76 81 Q48 77 25 81 M84 78 Q110 60 130 58 M84 81 Q112 77 135 81" stroke="#9a5e2a" strokeWidth="1.2" opacity=".55" fill="none" strokeLinecap="round" />
    <path d="M22 60 Q30 46 46 44 M138 60 Q130 46 114 44" stroke="#fff6d8" strokeWidth="2.4" opacity=".55" fill="none" strokeLinecap="round" />
    {[40, 120].map(x => (
      <g key={x}>
        <circle cx={x} cy="66" r="9" fill="#6a3e22" stroke={INK} strokeWidth="1.2" />
        <circle cx={x} cy="66" r="5.2" fill="#ffe8a8" />
        <circle cx={x} cy="66" r="2.2" fill="#3a2418" />
        <circle cx={x + 1.6} cy="64.4" r="1" fill="#fff" />
      </g>
    ))}
    {[[20, 76], [27, 85], [133, 85], [140, 76], [44, 118], [116, 118]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.6" fill="#fff3cc" opacity=".8" />)}
    <ellipse cx="80" cy="96" rx="9" ry="30" fill="url(#mt-body)" stroke={INK} strokeWidth="2" />
    <path d="M72.5 92 Q80 96 87.5 92 M72 102 Q80 106 88 102 M73 112 Q80 116 87 112" stroke="#3a2418" strokeWidth="1.2" opacity=".6" fill="none" />
    <path d="M68 73 l4 4 4 -4 4 4 4 -4 4 4 4 -4 l-2 8 h-20z" fill="#f4dcae" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
    <circle cx="80" cy="64" r="11" fill="#c99467" stroke={INK} strokeWidth="2" />
    <path d="M71 60 Q76 55 82 55" stroke="#fff" strokeWidth="1.8" opacity=".4" fill="none" strokeLinecap="round" />
    {[75, 85].map(x => <g key={x}><circle cx={x} cy="65" r="3.8" fill={INK} /><circle cx={x + 1.2} cy="63.8" r="1.3" fill="#fff" /></g>)}
    <path d="M76 54 Q66 36 55 33 M84 54 Q94 36 105 33" stroke={INK} strokeWidth="1.8" fill="none" strokeLinecap="round" />
    <path d="M70 44 l-4 -3 M66 39 l-4 -2 M61 35.5 l-3 -1.5 M90 44 l4 -3 M94 39 l4 -2 M99 35.5 l3 -1.5" stroke={INK} strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

const RustDoll = () => (
  <svg viewBox="0 0 160 170" className="nt-art" aria-hidden="true">
    <defs>
      <linearGradient id="rd-tin" x1="0" x2="1"><stop offset="0" stopColor="#f2a274" /><stop offset=".45" stopColor="#c8693e" /><stop offset="1" stopColor="#77361e" /></linearGradient>
      <radialGradient id="rd-head" cx=".35" cy=".35" r=".8"><stop offset="0" stopColor="#ffe0bc" /><stop offset=".6" stopColor="#efa67a" /><stop offset="1" stopColor="#ab5c3a" /></radialGradient>
      <linearGradient id="rd-brass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff0b0" /><stop offset=".5" stopColor="#d8a446" /><stop offset="1" stopColor="#8a5c1e" /></linearGradient>
      <linearGradient id="rd-steel" x1="0" x2="1"><stop offset="0" stopColor="#e6e8f0" /><stop offset="1" stopColor="#8a8c9c" /></linearGradient>
    </defs>
    <ellipse cx="80" cy="162" rx="42" ry="5.5" fill="#000" opacity=".35" />
    <path d="M64 141 l7 4 -7 4 7 4 -7 4 M96 141 l7 4 -7 4 7 4 -7 4" stroke={INK} strokeWidth="5" fill="none" strokeLinejoin="round" />
    <path d="M64 141 l7 4 -7 4 7 4 -7 4 M96 141 l7 4 -7 4 7 4 -7 4" stroke="url(#rd-steel)" strokeWidth="2.6" fill="none" strokeLinejoin="round" />
    <ellipse cx="67" cy="160" rx="11" ry="5" fill="#5a3020" stroke={INK} strokeWidth="1.8" />
    <ellipse cx="99" cy="160" rx="11" ry="5" fill="#5a3020" stroke={INK} strokeWidth="1.8" />
    <path d="M114 106 H128" stroke={INK} strokeWidth="7" strokeLinecap="round" />
    <path d="M114 106 H128" stroke="url(#rd-steel)" strokeWidth="4" strokeLinecap="round" />
    {[96, 116].map(y => <g key={y}><circle cx="134" cy={y} r="8" fill="url(#rd-steel)" stroke={INK} strokeWidth="1.8" /><circle cx="134" cy={y} r="3.2" fill="#2a2a36" /></g>)}
    <path d="M46 86 Q46 76 56 74 L104 74 Q114 76 114 86 L112 132 Q112 142 100 142 L60 142 Q48 142 48 132Z" fill="url(#rd-tin)" stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
    <path d="M52 84 Q52 78 58 77" stroke="#ffd2b0" strokeWidth="3" opacity=".6" fill="none" strokeLinecap="round" />
    <rect x="47" y="91" width="66" height="7" fill="url(#rd-brass)" stroke={INK} strokeWidth="1.4" />
    <rect x="47.5" y="120" width="65" height="7" fill="url(#rd-brass)" stroke={INK} strokeWidth="1.4" />
    {[54, 66, 94, 106].flatMap(x => [94.5, 123.5].map(y => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.5" fill="#fff4cc" stroke={INK} strokeWidth=".7" />))}
    <path d="M58 104 q5 -4 9 0 q3 5 -3 6 q-6 1 -6 -6z M96 131 q4 -3 8 0 q2 4 -3 5 q-5 0 -5 -5z" fill="#5c2612" opacity=".55" />
    <circle cx="80" cy="109" r="8.5" fill="#f6ecd8" stroke={INK} strokeWidth="1.6" />
    <path d="M80 109 L80 103.5 M80 109 L84 111" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
    <path d="M50 86 Q36 78 36 62 L44 60 Q46 72 55 78Z" fill="url(#rd-tin)" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
    <circle cx="40" cy="56" r="8" fill="#f6ecd8" stroke={INK} strokeWidth="1.8" />
    <path d="M36 54 h8 M36 58 h8" stroke="#b3a68e" strokeWidth="1" />
    <path d="M110 90 Q123 100 121 118 L113 118 Q113 104 106 98Z" fill="url(#rd-tin)" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
    <circle cx="117" cy="122" r="7" fill="#f6ecd8" stroke={INK} strokeWidth="1.8" />
    <circle cx="80" cy="52" r="22" fill="url(#rd-head)" stroke={INK} strokeWidth="2.4" />
    <path d="M64 44 Q68 35 78 33" stroke="#fff" strokeWidth="3" opacity=".45" fill="none" strokeLinecap="round" />
    <circle cx="66" cy="59" r="4" fill="#e0604a" opacity=".6" />
    <circle cx="94" cy="59" r="4" fill="#e0604a" opacity=".6" />
    {[71, 89].map(x => (
      <g key={x}>
        <circle cx={x} cy="50" r="5.6" fill="#2a1d16" stroke={INK} strokeWidth="1" />
        {[[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]].map(([dx, dy]) => <circle key={`${dx}${dy}`} cx={x + dx} cy={50 + dy} r=".8" fill="#6a5040" />)}
        <circle cx={x + 2.2} cy="47.6" r="1.4" fill="#fff" opacity=".85" />
      </g>
    ))}
    <path d="M72 64 Q80 68.5 88 64" stroke="#5a2a1a" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    <path d="M74.5 63.5 v3 M78 65 v3 M82 65 v3 M85.5 63.5 v3" stroke="#5a2a1a" strokeWidth="1.1" strokeLinecap="round" />
    <path d="M67 32 L93 32 L91 17 Q80 13 69 17Z" fill="#2c3d74" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
    <rect x="64" y="30" width="32" height="5" rx="1.5" fill="#1b2550" stroke={INK} strokeWidth="1.4" />
    <path d="M80 16 Q86 3 97 7 Q89 10 84 18Z" fill="#e07a63" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
    <circle cx="80" cy="24" r="2.6" fill="url(#rd-brass)" stroke={INK} strokeWidth=".9" />
  </svg>
);

const Inspector = () => (
  <svg viewBox="0 0 160 170" className="nt-art" aria-hidden="true">
    <defs>
      <linearGradient id="in-coat" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#4a4270" /><stop offset=".5" stopColor="#25203c" /><stop offset="1" stopColor="#100e1e" /></linearGradient>
      <radialGradient id="in-eye"><stop offset="0" stopColor="#ff9a7a" stopOpacity=".9" /><stop offset="1" stopColor="#ff9a7a" stopOpacity="0" /></radialGradient>
      <linearGradient id="in-brass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f2d48a" /><stop offset="1" stopColor="#8a6424" /></linearGradient>
      <radialGradient id="in-mist" cx=".5" cy=".6" r=".5"><stop offset="0" stopColor="#4a4270" stopOpacity=".85" /><stop offset="1" stopColor="#4a4270" stopOpacity="0" /></radialGradient>
    </defs>
    <ellipse cx="80" cy="162" rx="44" ry="5" fill="#000" opacity=".4" />
    <path d="M42 160 L50 84 Q80 66 110 84 L118 160 Q100 154 90 163 Q80 152 70 163 Q60 154 42 160Z" fill="url(#in-coat)" stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
    <path d="M50 92 Q46 120 44 152" stroke="#8a80c8" strokeWidth="2" opacity=".5" fill="none" strokeLinecap="round" />
    <path d="M64 86 L80 108 L96 86" stroke={INK} strokeWidth="1.8" fill="none" strokeLinejoin="round" />
    <path d="M80 108 V150" stroke={INK} strokeWidth="1.4" opacity=".7" />
    {[116, 132].map(y => <circle key={y} cx="86" cy={y} r="2.4" fill="url(#in-brass)" stroke={INK} strokeWidth=".9" />)}
    <rect x="50" y="122" width="60" height="6" rx="2" fill="#2a1d18" stroke={INK} strokeWidth="1.4" />
    <path d="M52 92 Q36 104 40 124 L48 124 Q48 108 58 100Z" fill="url(#in-coat)" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
    <g transform="rotate(-10 41 132)">
      <rect x="28" y="118" width="24" height="30" rx="2" fill="#d6c29b" stroke={INK} strokeWidth="1.6" />
      <rect x="35" y="115" width="10" height="5" rx="1" fill="url(#in-brass)" stroke={INK} strokeWidth="1" />
      <path d="M32 126 h16 M32 131 h16 M32 136 h11 M32 141 h14" stroke="#6a5e4d" strokeWidth="1.1" strokeLinecap="round" />
    </g>
    <path d="M108 90 Q130 96 134 112 L126 116 Q122 104 104 100Z" fill="url(#in-coat)" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
    <circle cx="130" cy="117" r="6" fill="#2a2540" stroke={INK} strokeWidth="1.6" />
    <path d="M128 122 L140 137 M134 120 L145 132" stroke={INK} strokeWidth="5" strokeLinecap="round" />
    <path d="M128 122 L140 137 M134 120 L145 132" stroke="url(#in-brass)" strokeWidth="2.8" strokeLinecap="round" />
    <ellipse cx="80" cy="158" rx="58" ry="12" fill="url(#in-mist)" />
    <ellipse cx="80" cy="62" rx="22" ry="24" fill="#241e36" stroke={INK} strokeWidth="2.2" />
    <path d="M60 58 Q62 46 72 42" stroke="#8a80c8" strokeWidth="2" opacity=".45" fill="none" strokeLinecap="round" />
    {[71, 89].map(x => (
      <g key={x}>
        <circle cx={x} cy="63" r="11" fill="url(#in-eye)" />
        <path d={`M${x - 5.5} 63 Q${x} 59 ${x + 5.5} 63 Q${x} 65.5 ${x - 5.5} 63Z`} fill="#ffb49a" />
      </g>
    ))}
    <path d="M70 75 Q80 81 90 75" stroke="#ff8a6a" strokeWidth="1.6" opacity=".6" fill="none" strokeLinecap="round" />
    <path d="M54 44 Q56 21 80 19 Q104 21 106 44Z" fill="#1a1628" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
    <path d="M54 44 H106 V50 H54Z" fill="#b9473a" stroke={INK} strokeWidth="1.6" />
    <path d="M50 50 Q80 44 110 50 Q104 58 80 56 Q56 58 50 50Z" fill="#0d0b16" stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
    <rect x="74" y="28" width="12" height="8" rx="1.2" fill="url(#in-brass)" stroke={INK} strokeWidth="1" />
    <path d="M62 30 Q70 24 80 23" stroke="#fff" strokeWidth="2" opacity=".18" fill="none" strokeLinecap="round" />
  </svg>
);

const BoilerGolem = () => (
  <svg viewBox="0 0 200 200" className="nt-art" aria-hidden="true">
    <defs>
      <linearGradient id="bg-iron" x1="0" x2="1"><stop offset="0" stopColor="#9a95a8" /><stop offset=".45" stopColor="#5e5a6c" /><stop offset="1" stopColor="#2e2b38" /></linearGradient>
      <radialGradient id="bg-fire" cx=".5" cy=".6"><stop offset="0" stopColor="#fff6cc" /><stop offset=".4" stopColor="#ffb347" /><stop offset=".8" stopColor="#de5426" /><stop offset="1" stopColor="#6a1c10" /></radialGradient>
      <radialGradient id="bg-gauge" cx=".4" cy=".35"><stop offset="0" stopColor="#fffdf2" /><stop offset="1" stopColor="#ddd0ae" /></radialGradient>
      <linearGradient id="bg-brass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff0b0" /><stop offset=".5" stopColor="#d8a446" /><stop offset="1" stopColor="#8a5c1e" /></linearGradient>
      <radialGradient id="bg-heat"><stop offset="0" stopColor="#ff9a4a" stopOpacity=".55" /><stop offset="1" stopColor="#ff9a4a" stopOpacity="0" /></radialGradient>
    </defs>
    <ellipse cx="100" cy="192" rx="72" ry="7" fill="#000" opacity=".4" />
    <circle cx="96" cy="8" r="9" fill="#cfc8e0" opacity=".45" /><circle cx="112" cy="2" r="7" fill="#cfc8e0" opacity=".3" />
    <rect x="62" y="162" width="28" height="26" rx="6" fill="url(#bg-iron)" stroke={INK} strokeWidth="2.4" />
    <rect x="110" y="162" width="28" height="26" rx="6" fill="url(#bg-iron)" stroke={INK} strokeWidth="2.4" />
    <rect x="86" y="16" width="26" height="30" fill="#3a3644" stroke={INK} strokeWidth="2.4" />
    <rect x="82" y="11" width="34" height="8" rx="2" fill="url(#bg-brass)" stroke={INK} strokeWidth="1.8" />
    <path d="M44 78 Q44 46 76 42 L124 42 Q156 46 156 78 L154 152 Q154 170 132 170 L68 170 Q46 170 46 152Z" fill="url(#bg-iron)" stroke={INK} strokeWidth="2.8" strokeLinejoin="round" />
    <path d="M52 80 Q52 58 74 51" stroke="#fff" strokeWidth="4" opacity=".28" fill="none" strokeLinecap="round" />
    <path d="M46 72 H154 M46 142 H154" stroke={INK} strokeWidth="1.6" opacity=".7" />
    {[58, 76, 94, 112, 130, 146].flatMap(x => [72, 142].map(y => <circle key={`${x}-${y}`} cx={x} cy={y} r="2.2" fill="#d2cde0" stroke={INK} strokeWidth=".8" />))}
    {[84, 116].map(x => <g key={x}><circle cx={x} cy="62" r="9" fill="url(#bg-heat)" /><rect x={x - 6} y="60" width="12" height="4.5" rx="2" fill="#ffc24a" stroke={INK} strokeWidth="1.2" /></g>)}
    <circle cx="100" cy="98" r="22" fill="url(#bg-brass)" stroke={INK} strokeWidth="2.2" />
    <circle cx="100" cy="98" r="17" fill="url(#bg-gauge)" stroke={INK} strokeWidth="1.6" />
    {[-60, -30, 0, 30, 60].map(a => <line key={a} x1="100" y1="84" x2="100" y2="87" stroke={INK} strokeWidth="1.4" transform={`rotate(${a} 100 98)`} />)}
    <path d="M100 98 L111 88" stroke="#b9473a" strokeWidth="2.8" strokeLinecap="round" />
    <circle cx="100" cy="98" r="2.6" fill={INK} />
    <ellipse cx="100" cy="138" rx="44" ry="22" fill="url(#bg-heat)" />
    <rect x="72" y="120" width="56" height="34" rx="8" fill="#1d1414" stroke={INK} strokeWidth="2.4" />
    <rect x="78" y="126" width="44" height="22" rx="5" fill="url(#bg-fire)" />
    <path d="M89 126 V148 M100 126 V148 M111 126 V148" stroke="#2a1a14" strokeWidth="3" />
    <path d="M47 90 Q22 96 20 124 L34 128 Q36 108 51 106Z M153 90 Q178 96 180 124 L166 128 Q164 108 149 106Z" fill="url(#bg-iron)" stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
    {[26, 174].map(x => (
      <g key={x}>
        <circle cx={x} cy="138" r="16" fill="url(#bg-iron)" stroke={INK} strokeWidth="2.4" />
        <path d={`M${x - 8} 132 h16 M${x - 9} 139 h18`} stroke={INK} strokeWidth="1.4" opacity=".6" />
      </g>
    ))}
    <path d="M150 64 Q170 64 170 84 V98" stroke={INK} strokeWidth="9" fill="none" strokeLinecap="round" />
    <path d="M150 64 Q170 64 170 84 V98" stroke="url(#bg-brass)" strokeWidth="5.5" fill="none" strokeLinecap="round" />
    <circle cx="176" cy="102" r="6" fill="#f2f0f8" opacity=".55" /><circle cx="184" cy="94" r="4.5" fill="#f2f0f8" opacity=".4" />
  </svg>
);

const FogWitch = () => (
  <svg viewBox="0 0 200 200" className="nt-art" aria-hidden="true">
    <defs>
      <linearGradient id="fw-robe" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#8a80b4" /><stop offset=".5" stopColor="#4c4374" /><stop offset="1" stopColor="#272143" /></linearGradient>
      <linearGradient id="fw-hat" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#625896" /><stop offset="1" stopColor="#241f40" /></linearGradient>
      <radialGradient id="fw-wisp"><stop offset="0" stopColor="#f2fff8" /><stop offset=".5" stopColor="#9af2d2" /><stop offset="1" stopColor="#9af2d2" stopOpacity="0" /></radialGradient>
      <radialGradient id="fw-fog" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#d6d0ec" stopOpacity=".55" /><stop offset="1" stopColor="#d6d0ec" stopOpacity="0" /></radialGradient>
      <linearGradient id="fw-brass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f2d48a" /><stop offset="1" stopColor="#8a6424" /></linearGradient>
    </defs>
    <ellipse cx="100" cy="188" rx="92" ry="12" fill="url(#fw-fog)" />
    <path d="M150 40 L142 192" stroke={INK} strokeWidth="8" strokeLinecap="round" />
    <path d="M150 40 L142 192" stroke="#6a4630" strokeWidth="4.5" strokeLinecap="round" />
    <path d="M150 40 Q166 28 158 18" stroke={INK} strokeWidth="5" fill="none" strokeLinecap="round" />
    <circle cx="162" cy="40" r="26" fill="url(#fw-wisp)" opacity=".7" />
    <circle cx="162" cy="40" r="7" fill="#f2fff8" />
    <path d="M44 188 Q52 120 100 82 Q148 120 156 188 Q136 176 118 188 Q100 174 82 188 Q64 176 44 188Z" fill="url(#fw-robe)" stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
    <path d="M78 120 Q72 150 70 182 M122 120 Q128 150 130 182 M100 112 V176" stroke="#231d3c" strokeWidth="1.6" opacity=".6" fill="none" strokeLinecap="round" />
    <path d="M58 140 Q62 112 84 96" stroke="#c4bce8" strokeWidth="2.4" opacity=".45" fill="none" strokeLinecap="round" />
    {[[80, 140], [112, 156], [96, 130], [126, 136], [70, 166]].map(([x, y]) => <path key={`${x}-${y}`} d={`M${x} ${y - 4} l1.2 2.8 2.8 1.2 -2.8 1.2 -1.2 2.8 -1.2 -2.8 -2.8 -1.2 2.8 -1.2z`} fill="#e3bf75" opacity=".85" />)}
    <path d="M136 120 Q152 116 148 100 L140 98 Q140 110 130 110Z" fill="url(#fw-robe)" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
    <circle cx="146" cy="96" r="6" fill="#b8b0d6" stroke={INK} strokeWidth="1.6" />
    <path d="M70 100 Q64 126 70 140 M130 100 Q136 126 130 140" stroke="#d6cfec" strokeWidth="5" fill="none" strokeLinecap="round" />
    <path d="M70 100 Q64 126 70 140 M130 100 Q136 126 130 140" stroke={INK} strokeWidth="1.2" fill="none" strokeLinecap="round" opacity=".5" />
    <ellipse cx="100" cy="104" rx="26" ry="24" fill="#1a1630" stroke={INK} strokeWidth="2.2" />
    {[90, 110].map(x => <g key={x}><circle cx={x} cy="104" r="9" fill="url(#fw-wisp)" opacity=".7" /><ellipse cx={x} cy="104" rx="4.8" ry="3.4" fill="#eafff6" /></g>)}
    <path d="M92 116 Q100 120 108 116" stroke="#9af2d2" strokeWidth="1.6" opacity=".55" fill="none" strokeLinecap="round" />
    <ellipse cx="100" cy="82" rx="62" ry="12" fill="url(#fw-hat)" stroke={INK} strokeWidth="2.4" />
    <path d="M66 82 Q80 40 96 20 Q104 14 118 22 Q112 28 108 40 Q120 60 134 82Z" fill="url(#fw-hat)" stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
    <path d="M68 76 Q100 68 132 76 L134 82 Q100 74 66 82Z" fill="#b9473a" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
    <rect x="94" y="70" width="12" height="9" rx="1.5" fill="none" stroke="url(#fw-brass)" strokeWidth="2.4" />
    <path d="M80 60 Q88 40 98 26" stroke="#fff" strokeWidth="2.4" opacity=".2" fill="none" strokeLinecap="round" />
    <path d="M22 150 Q50 140 70 152 M128 160 Q160 146 186 158 M30 120 Q44 112 58 118" stroke="#e2dcf4" strokeWidth="5" strokeLinecap="round" fill="none" opacity=".4" />
  </svg>
);

const TwinLamp = () => (
  <svg viewBox="0 0 160 170" className="nt-art" aria-hidden="true">
    <defs>
      <radialGradient id="tl-glass" cx=".5" cy=".55"><stop offset="0" stopColor="#fffbe2" /><stop offset=".5" stopColor="#ffe08a" /><stop offset="1" stopColor="#ef9f45" /></radialGradient>
      <radialGradient id="tl-halo"><stop offset="0" stopColor="#ffd98a" stopOpacity=".55" /><stop offset="1" stopColor="#ffd98a" stopOpacity="0" /></radialGradient>
      <linearGradient id="tl-iron" x1="0" x2="1"><stop offset="0" stopColor="#6a667c" /><stop offset="1" stopColor="#25232f" /></linearGradient>
      <linearGradient id="tl-brass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff0b0" /><stop offset=".5" stopColor="#d8a446" /><stop offset="1" stopColor="#8a5c1e" /></linearGradient>
    </defs>
    <circle cx="80" cy="72" r="64" fill="url(#tl-halo)" />
    <ellipse cx="80" cy="160" rx="34" ry="5" fill="#000" opacity=".3" />
    <path d="M58 158 L102 158 L96 146 L64 146Z" fill="url(#tl-iron)" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
    <rect x="74" y="114" width="12" height="34" fill="url(#tl-iron)" stroke={INK} strokeWidth="2" />
    <path d="M74 128 Q60 126 60 116 Q60 108 68 110 M86 128 Q100 126 100 116 Q100 108 92 110" stroke={INK} strokeWidth="2.2" fill="none" strokeLinecap="round" />
    <path d="M60 104 L100 104 L96 116 L64 116Z" fill="url(#tl-brass)" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
    <path d="M56 38 L104 38 L98 104 L62 104Z" fill="url(#tl-glass)" stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
    <path d="M68 38 L70 104 M92 38 L90 104" stroke="#7a5320" strokeWidth="1.6" opacity=".7" />
    <path d="M80 54 Q63 72 69 90 Q73 99 80 99 Q87 99 91 90 Q97 72 80 54Z" fill="#ff9a4a" opacity=".9" />
    <path d="M80 66 Q72 78 75.5 88 Q80 93 84.5 88 Q88 78 80 66Z" fill="#fff3bc" />
    <circle cx="75.5" cy="81" r="2.3" fill="#3a1a10" /><circle cx="84.5" cy="81" r="2.3" fill="#3a1a10" />
    <circle cx="76.2" cy="80.2" r=".8" fill="#fff" /><circle cx="85.2" cy="80.2" r=".8" fill="#fff" />
    <path d="M77.5 86 Q80 88 82.5 86" stroke="#3a1a10" strokeWidth="1.2" fill="none" strokeLinecap="round" />
    <path d="M61 44 L65 96" stroke="#fff" strokeWidth="3" opacity=".55" strokeLinecap="round" />
    <path d="M56 38 L104 38 L95 23 Q80 12 65 23Z" fill="url(#tl-brass)" stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
    <path d="M66 30 Q74 22 84 21" stroke="#fff" strokeWidth="2" opacity=".45" fill="none" strokeLinecap="round" />
    <circle cx="80" cy="13" r="4.5" fill="url(#tl-brass)" stroke={INK} strokeWidth="1.6" />
  </svg>
);

const BlackEngine = () => (
  <svg viewBox="0 0 240 210" className="nt-art" aria-hidden="true">
    <defs>
      <linearGradient id="be-body" x1="0" x2="1"><stop offset="0" stopColor="#56506a" /><stop offset=".45" stopColor="#26232f" /><stop offset="1" stopColor="#100e17" /></linearGradient>
      <radialGradient id="be-face" cx=".4" cy=".35"><stop offset="0" stopColor="#3e3a4c" /><stop offset="1" stopColor="#13111a" /></radialGradient>
      <radialGradient id="be-lamp" cx=".45" cy=".45"><stop offset="0" stopColor="#ffffff" /><stop offset=".3" stopColor="#fff2b8" /><stop offset=".7" stopColor="#ffc04a" /><stop offset="1" stopColor="#c06a1a" /></radialGradient>
      <radialGradient id="be-halo"><stop offset="0" stopColor="#ffe7a1" stopOpacity=".5" /><stop offset="1" stopColor="#ffe7a1" stopOpacity="0" /></radialGradient>
      <linearGradient id="be-red" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#e0584a" /><stop offset="1" stopColor="#7e1e18" /></linearGradient>
      <linearGradient id="be-brass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff0b0" /><stop offset=".5" stopColor="#d8a446" /><stop offset="1" stopColor="#8a5c1e" /></linearGradient>
    </defs>
    {[[58, 30, 20], [86, 16, 16], [38, 14, 12], [70, 4, 9]].map(([x, y, r]) => <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill="#3b3646" stroke={INK} strokeWidth="1.6" opacity=".9" />)}
    {[[48, 24, 6], [80, 10, 5]].map(([x, y, r]) => <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill="#6a6480" opacity=".6" />)}
    <ellipse cx="120" cy="202" rx="104" ry="7" fill="#000" opacity=".45" />
    {[40, 200].map(x => (
      <g key={x}>
        <circle cx={x} cy="186" r="16" fill="#2a2733" stroke={INK} strokeWidth="2.4" />
        <circle cx={x} cy="186" r="5" fill="url(#be-brass)" stroke={INK} strokeWidth="1.2" />
        <path d={`M${x - 14} 186 H${x + 14} M${x} 172 V200`} stroke="#4a4558" strokeWidth="2" />
      </g>
    ))}
    <path d="M68 66 L66 30 L60 24 L104 24 L98 30 L96 66Z" fill="url(#be-body)" stroke={INK} strokeWidth="2.6" strokeLinejoin="round" />
    <rect x="58" y="22" width="48" height="7" rx="2" fill="url(#be-brass)" stroke={INK} strokeWidth="1.6" />
    <path d="M150 66 Q150 46 166 46 Q182 46 182 66Z" fill="url(#be-brass)" stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
    <rect x="163" y="36" width="6" height="11" rx="1.5" fill="url(#be-brass)" stroke={INK} strokeWidth="1.4" />
    <rect x="26" y="66" width="188" height="104" rx="30" fill="url(#be-body)" stroke={INK} strokeWidth="3" />
    <rect x="26" y="66" width="188" height="16" rx="8" fill="#3a3646" stroke={INK} strokeWidth="2" />
    <path d="M36 92 Q40 76 58 72" stroke="#fff" strokeWidth="4" opacity=".18" fill="none" strokeLinecap="round" />
    <rect x="26" y="98" width="188" height="6" fill="url(#be-brass)" stroke={INK} strokeWidth="1.4" />
    {[40, 200].map(x => <circle key={x} cx={x} cy="150" r="9" fill="#4a4558" stroke={INK} strokeWidth="2" />)}
    <circle cx="120" cy="124" r="44" fill="url(#be-face)" stroke={INK} strokeWidth="3" />
    {Array.from({ length: 12 }, (_, i) => {
      const a = (i / 12) * Math.PI * 2;
      return <circle key={i} cx={120 + Math.cos(a) * 38} cy={124 + Math.sin(a) * 38} r="2.2" fill="#8a8498" stroke={INK} strokeWidth=".7" />;
    })}
    <circle cx="120" cy="120" r="48" fill="url(#be-halo)" />
    <circle cx="120" cy="120" r="22" fill="url(#be-lamp)" stroke="#2a2620" strokeWidth="4" />
    <path d="M108 110 Q114 104 122 104" stroke="#fff" strokeWidth="3" opacity=".7" fill="none" strokeLinecap="round" />
    <path d="M74 94 L104 108 M166 94 L136 108" stroke={INK} strokeWidth="11" strokeLinecap="round" />
    <path d="M74 94 L104 108 M166 94 L136 108" stroke="#ff6a4a" strokeWidth="6" strokeLinecap="round" />
    <rect x="104" y="152" width="32" height="10" rx="2" fill="#b9473a" stroke={INK} strokeWidth="1.4" />
    <path d="M110 157 h20" stroke="#f0e5cd" strokeWidth="1.4" strokeDasharray="3 2" />
    <path d="M30 168 L210 168 L228 196 L12 196Z" fill="url(#be-red)" stroke={INK} strokeWidth="2.6" strokeLinejoin="round" />
    {[46, 78, 110, 142, 174].map(x => <path key={x} d={`M${x + 6} 170 L${x + 14} 194`} stroke="#4e1410" strokeWidth="4" />)}
    {[[16, 150, 7], [8, 140, 5], [224, 150, 7], [232, 140, 5]].map(([x, y, r]) => <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill="#f2f0f8" opacity=".45" />)}
  </svg>
);

export const ENEMY_ART: Record<string, () => ReactElement> = {
  'soot-rat': SootRat,
  ticketless: Ticketless,
  moth: Moth,
  'rust-doll': RustDoll,
  inspector: Inspector,
  'boiler-golem': BoilerGolem,
  'fog-witch': FogWitch,
  'twin-lamp': TwinLamp,
  'black-engine': BlackEngine,
};
