import type { ReactElement } from 'react';

/** Hand-drawn SVG cast. Every piece is original artwork for this game. */

export function Conductor({ photo }: { photo?: string | null }) {
  return (
    <svg viewBox="0 0 160 180" className="nt-art" aria-hidden="true">
      <defs>
        <radialGradient id="nt-lantern-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#ffd98a" stopOpacity=".9" />
          <stop offset="1" stopColor="#ffd98a" stopOpacity="0" />
        </radialGradient>
        <clipPath id="nt-face-clip"><circle cx="78" cy="62" r="27" /></clipPath>
      </defs>
      <ellipse cx="80" cy="172" rx="46" ry="7" fill="#000" opacity=".28" />
      <circle cx="128" cy="112" r="30" fill="url(#nt-lantern-glow)" />
      {/* coat */}
      <path d="M44 168 L50 104 Q78 88 106 104 L114 168 Z" fill="#2c3d74" />
      <path d="M78 96 L78 168" stroke="#1b2550" strokeWidth="3" />
      <circle cx="70" cy="118" r="3" fill="#f2c56b" /><circle cx="70" cy="136" r="3" fill="#f2c56b" /><circle cx="70" cy="154" r="3" fill="#f2c56b" />
      <path d="M62 98 L78 112 L94 98" fill="#f6eedc" />
      <path d="M50 108 Q34 132 42 150" stroke="#2c3d74" strokeWidth="13" strokeLinecap="round" fill="none" />
      <path d="M106 108 Q124 118 126 104" stroke="#2c3d74" strokeWidth="13" strokeLinecap="round" fill="none" />
      {/* lantern */}
      <path d="M126 96 L126 104" stroke="#8a6a3a" strokeWidth="3" />
      <rect x="116" y="104" width="20" height="24" rx="5" fill="#ffcf6e" stroke="#8a6a3a" strokeWidth="3" />
      <path d="M121 128 L131 128 L129 133 L123 133 Z" fill="#8a6a3a" />
      {/* face */}
      {photo ? (
        <>
          <circle cx="78" cy="62" r="29" fill="#f6eedc" />
          <image href={photo} x="51" y="35" width="54" height="54" preserveAspectRatio="xMidYMid slice" clipPath="url(#nt-face-clip)" />
        </>
      ) : (
        <>
          <circle cx="78" cy="64" r="27" fill="#ffe0c2" />
          <circle cx="69" cy="66" r="3.2" fill="#2a2238" /><circle cx="88" cy="66" r="3.2" fill="#2a2238" />
          <path d="M71 76 Q78 81 85 76" stroke="#2a2238" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <circle cx="62" cy="73" r="4" fill="#ffb3a0" opacity=".7" /><circle cx="95" cy="73" r="4" fill="#ffb3a0" opacity=".7" />
        </>
      )}
      {/* cap */}
      <path d="M48 46 Q78 22 108 46 L104 52 L52 52 Z" fill="#22305e" />
      <rect x="46" y="50" width="64" height="7" rx="3" fill="#1b2550" />
      <path d="M78 33 l3 6 6.5 .8 -4.8 4.4 1.3 6.4 -6 -3.2 -6 3.2 1.3 -6.4 -4.8 -4.4 6.5 -.8 z" fill="#f2c56b" />
    </svg>
  );
}

const SootRat = () => (
  <svg viewBox="0 0 160 160" className="nt-art" aria-hidden="true">
    <ellipse cx="80" cy="150" rx="46" ry="6" fill="#000" opacity=".3" />
    <path d="M118 128 Q150 120 146 92" stroke="#3a3a46" strokeWidth="6" fill="none" strokeLinecap="round" />
    <ellipse cx="82" cy="118" rx="44" ry="30" fill="#34343f" />
    <circle cx="52" cy="92" r="26" fill="#3d3d4a" />
    <circle cx="38" cy="70" r="12" fill="#3d3d4a" /><circle cx="38" cy="70" r="6" fill="#c9888c" />
    <circle cx="64" cy="68" r="12" fill="#3d3d4a" /><circle cx="64" cy="68" r="6" fill="#c9888c" />
    <circle cx="44" cy="92" r="5" fill="#ffd45e" /><circle cx="61" cy="92" r="5" fill="#ffd45e" />
    <circle cx="45" cy="91" r="1.6" fill="#201d24" /><circle cx="62" cy="91" r="1.6" fill="#201d24" />
    <circle cx="30" cy="104" r="4" fill="#d58b92" />
    <path d="M42 110 L46 116 L50 110" fill="#f6eedc" />
    <circle cx="96" cy="108" r="3" fill="#55555f" /><circle cx="108" cy="120" r="2.5" fill="#55555f" /><circle cx="88" cy="128" r="2" fill="#55555f" />
  </svg>
);

const Ticketless = () => (
  <svg viewBox="0 0 160 160" className="nt-art" aria-hidden="true">
    <ellipse cx="80" cy="152" rx="36" ry="5" fill="#000" opacity=".22" />
    <path d="M38 140 Q34 74 80 34 Q126 74 122 140 Q112 130 102 142 Q92 130 80 142 Q68 130 58 142 Q48 130 38 140 Z" fill="#cfe3f2" opacity=".92" />
    <ellipse cx="66" cy="80" rx="7" ry="10" fill="#2b3150" /><ellipse cx="94" cy="80" rx="7" ry="10" fill="#2b3150" />
    <ellipse cx="80" cy="104" rx="8" ry="6" fill="#2b3150" />
    <path d="M118 96 l22 -8 6 16 -22 8 z" fill="#f6d68a" />
    <path d="M124 98 l14 -5" stroke="#b78b3c" strokeWidth="2" strokeDasharray="3 2" />
    <path d="M110 108 Q120 106 122 102" stroke="#cfe3f2" strokeWidth="9" strokeLinecap="round" fill="none" />
  </svg>
);

const Moth = () => (
  <svg viewBox="0 0 160 160" className="nt-art nt-art-flutter" aria-hidden="true">
    <ellipse cx="80" cy="150" rx="30" ry="5" fill="#000" opacity=".2" />
    <ellipse cx="50" cy="66" rx="34" ry="26" fill="#e8c27a" transform="rotate(-20 50 66)" />
    <ellipse cx="110" cy="66" rx="34" ry="26" fill="#e8c27a" transform="rotate(20 110 66)" />
    <ellipse cx="56" cy="104" rx="22" ry="16" fill="#cf9a52" transform="rotate(20 56 104)" />
    <ellipse cx="104" cy="104" rx="22" ry="16" fill="#cf9a52" transform="rotate(-20 104 104)" />
    <circle cx="46" cy="64" r="9" fill="#7a4e2a" /><circle cx="46" cy="64" r="4" fill="#ffe8a8" />
    <circle cx="114" cy="64" r="9" fill="#7a4e2a" /><circle cx="114" cy="64" r="4" fill="#ffe8a8" />
    <ellipse cx="80" cy="88" rx="10" ry="30" fill="#6b4a32" />
    <circle cx="74" cy="66" r="3" fill="#fff4cc" /><circle cx="86" cy="66" r="3" fill="#fff4cc" />
    <path d="M76 60 Q68 40 58 38 M84 60 Q92 40 102 38" stroke="#6b4a32" strokeWidth="2.5" fill="none" />
  </svg>
);

const RustDoll = () => (
  <svg viewBox="0 0 160 160" className="nt-art" aria-hidden="true">
    <ellipse cx="80" cy="152" rx="40" ry="6" fill="#000" opacity=".28" />
    <rect x="66" y="40" width="28" height="8" fill="#8a5a3a" />
    <path d="M60 28 h40 v12 h-40 z" fill="#b8744a" />
    <rect x="44" y="70" width="72" height="62" rx="14" fill="#c27a4e" />
    <rect x="52" y="78" width="56" height="12" rx="4" fill="#a3603a" />
    <circle cx="80" cy="56" r="22" fill="#d48c5c" />
    <circle cx="71" cy="54" r="6" fill="#f6eedc" /><circle cx="89" cy="54" r="6" fill="#f6eedc" />
    <circle cx="71" cy="54" r="2.6" fill="#2a2238" /><circle cx="89" cy="54" r="2.6" fill="#2a2238" />
    <path d="M72 66 h16" stroke="#7a4028" strokeWidth="3" strokeLinecap="round" />
    <path d="M116 100 h18 M134 88 v24" stroke="#8c8c96" strokeWidth="7" strokeLinecap="round" />
    <rect x="26" y="86" width="18" height="30" rx="8" fill="#b8744a" />
    <rect x="54" y="130" width="18" height="18" rx="5" fill="#8a5a3a" /><rect x="88" y="130" width="18" height="18" rx="5" fill="#8a5a3a" />
    <circle cx="64" cy="112" r="3" fill="#7a4028" /><circle cx="96" cy="112" r="3" fill="#7a4028" />
  </svg>
);

const Inspector = () => (
  <svg viewBox="0 0 160 160" className="nt-art" aria-hidden="true">
    <ellipse cx="80" cy="154" rx="40" ry="5" fill="#000" opacity=".35" />
    <path d="M44 154 L52 76 Q80 62 108 76 L116 154 Z" fill="#1d1a2e" />
    <circle cx="80" cy="56" r="24" fill="#24203a" />
    <path d="M52 40 Q80 18 108 40 L104 46 L56 46 Z" fill="#141223" />
    <rect x="50" y="44" width="60" height="6" rx="3" fill="#0e0c18" />
    <ellipse cx="70" cy="60" rx="6" ry="3.5" fill="#ff8a6a" /><ellipse cx="90" cy="60" rx="6" ry="3.5" fill="#ff8a6a" />
    <path d="M112 90 Q130 96 128 112" stroke="#1d1a2e" strokeWidth="12" strokeLinecap="round" fill="none" />
    <path d="M120 112 l18 -6 4 10 -18 6 z" fill="#9aa0b8" />
    <path d="M60 92 l20 12 20 -12" stroke="#3a3458" strokeWidth="3" fill="none" />
  </svg>
);

const BoilerGolem = () => (
  <svg viewBox="0 0 200 200" className="nt-art" aria-hidden="true">
    <ellipse cx="100" cy="190" rx="70" ry="8" fill="#000" opacity=".35" />
    <rect x="80" y="18" width="18" height="30" rx="4" fill="#4a4652" />
    <circle cx="96" cy="16" r="8" fill="#bfc3cf" opacity=".5" /><circle cx="108" cy="8" r="6" fill="#bfc3cf" opacity=".35" />
    <rect x="48" y="40" width="104" height="128" rx="40" fill="#5c5866" />
    <rect x="56" y="52" width="88" height="10" rx="5" fill="#77727f" />
    <circle cx="100" cy="88" r="20" fill="#e9e3d2" stroke="#3a3640" strokeWidth="5" />
    <path d="M100 88 L112 78" stroke="#c4473a" strokeWidth="4" strokeLinecap="round" />
    <rect x="74" y="118" width="52" height="30" rx="10" fill="#2a1a18" />
    <rect x="80" y="124" width="40" height="18" rx="6" fill="#ff8a3d" />
    <rect x="86" y="128" width="28" height="10" rx="4" fill="#ffd36e" />
    <rect x="14" y="80" width="36" height="22" rx="10" fill="#4a4652" /><circle cx="18" cy="112" r="16" fill="#4a4652" />
    <rect x="150" y="80" width="36" height="22" rx="10" fill="#4a4652" /><circle cx="182" cy="112" r="16" fill="#4a4652" />
    <rect x="62" y="164" width="28" height="22" rx="6" fill="#3a3640" /><rect x="110" y="164" width="28" height="22" rx="6" fill="#3a3640" />
    {[60, 140].map(x => <circle key={x} cx={x} cy="60" r="4" fill="#8f8a96" />)}
  </svg>
);

const FogWitch = () => (
  <svg viewBox="0 0 200 200" className="nt-art" aria-hidden="true">
    <ellipse cx="100" cy="190" rx="60" ry="7" fill="#000" opacity=".3" />
    <path d="M40 186 Q48 110 100 76 Q152 110 160 186 Q140 172 120 186 Q100 172 80 186 Q60 172 40 186 Z" fill="#5d5677" />
    <path d="M60 80 L100 6 L140 80 Z" fill="#433d5c" />
    <ellipse cx="100" cy="80" rx="54" ry="10" fill="#38324e" />
    <ellipse cx="100" cy="104" rx="28" ry="24" fill="#2a2540" />
    <circle cx="90" cy="104" r="5" fill="#b8f0d8" /><circle cx="110" cy="104" r="5" fill="#b8f0d8" />
    <path d="M152 120 Q170 112 172 96" stroke="#5d5677" strokeWidth="10" strokeLinecap="round" fill="none" />
    <circle cx="174" cy="88" r="10" fill="#b8f0d8" opacity=".85" />
    <path d="M22 150 Q50 140 70 152 M130 160 Q160 146 186 158" stroke="#c9c3dd" strokeWidth="6" strokeLinecap="round" fill="none" opacity=".45" />
  </svg>
);

const TwinLamp = () => (
  <svg viewBox="0 0 160 160" className="nt-art" aria-hidden="true">
    <ellipse cx="80" cy="152" rx="32" ry="5" fill="#000" opacity=".25" />
    <circle cx="80" cy="76" r="44" fill="#ffd98a" opacity=".18" />
    <path d="M70 20 h20 l6 12 h-32 z" fill="#4c4a5c" />
    <path d="M58 36 h44 l-6 74 h-32 z" fill="#ffe6a6" stroke="#4c4a5c" strokeWidth="5" />
    <path d="M80 98 Q66 82 80 58 Q94 82 80 98 Z" fill="#ff9a4a" />
    <path d="M80 96 Q73 86 80 72 Q87 86 80 96 Z" fill="#ffe08a" />
    <circle cx="72" cy="74" r="3" fill="#3a2a20" /><circle cx="88" cy="74" r="3" fill="#3a2a20" />
    <rect x="62" y="108" width="36" height="10" rx="3" fill="#4c4a5c" />
    <rect x="72" y="118" width="16" height="30" rx="4" fill="#4c4a5c" />
  </svg>
);

const BlackEngine = () => (
  <svg viewBox="0 0 240 200" className="nt-art" aria-hidden="true">
    <ellipse cx="120" cy="192" rx="100" ry="8" fill="#000" opacity=".4" />
    <circle cx="70" cy="22" r="16" fill="#3b3646" opacity=".7" /><circle cx="92" cy="12" r="12" fill="#3b3646" opacity=".55" /><circle cx="52" cy="10" r="10" fill="#3b3646" opacity=".45" />
    <rect x="60" y="30" width="26" height="34" rx="4" fill="#1a1720" />
    <rect x="54" y="26" width="38" height="10" rx="3" fill="#262230" />
    <rect x="28" y="56" width="184" height="104" rx="26" fill="#1c1a24" />
    <rect x="28" y="56" width="184" height="18" rx="9" fill="#2c2836" />
    <circle cx="120" cy="104" r="36" fill="#2c2836" stroke="#46405a" strokeWidth="5" />
    <circle cx="120" cy="104" r="24" fill="#ffe7a1" />
    <circle cx="120" cy="104" r="40" fill="#ffe7a1" opacity=".15" />
    <path d="M62 96 L92 106 M178 96 L148 106" stroke="#e05a4a" strokeWidth="7" strokeLinecap="round" />
    <path d="M34 160 L206 160 L224 186 L16 186 Z" fill="#9c2f2a" />
    {[48, 80, 112, 144, 176].map(x => <path key={x} d={`M${x} 162 L${x + 8} 186`} stroke="#6e1f1c" strokeWidth="5" />)}
    <circle cx="44" cy="132" r="6" fill="#46405a" /><circle cx="196" cy="132" r="6" fill="#46405a" />
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

/** Train window scenery used as the backdrop of every screen. */
export function NightSky() {
  return (
    <div className="nt-sky" aria-hidden="true">
      <div className="nt-stars nt-stars-far" />
      <div className="nt-stars nt-stars-near" />
      <div className="nt-moon" />
      <svg className="nt-hills" viewBox="0 0 1200 120" preserveAspectRatio="none">
        <path d="M0 120 L0 70 Q120 30 240 64 T480 58 T720 70 T960 50 T1200 66 L1200 120 Z" fill="#101530" />
        <path d="M0 120 L0 92 Q160 70 320 90 T640 86 T960 94 T1200 84 L1200 120 Z" fill="#0b0f24" />
      </svg>
    </div>
  );
}
