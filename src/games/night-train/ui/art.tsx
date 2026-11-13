/** Scene art: night sky, passing scenery and the carriage. Characters live in ./cast. */
export { Conductor, ENEMY_ART } from './cast';

/** Fixed night sky behind every screen. */
export function NightSky() {
  return (
    <div className="nt-sky" aria-hidden="true">
      <svg className="nt-sky-hills" viewBox="0 0 2400 140" preserveAspectRatio="none">
        <path d="M0 140V80Q150 40 300 70T600 60T900 76T1200 56T1500 70T1800 58T2100 74T2400 60V140Z" fill="#141831" />
        <path d="M0 140V106Q200 90 400 104T800 100T1200 108T1600 98T2000 106T2400 100V140Z" fill="#0e1120" />
      </svg>
    </div>
  );
}

/** Repeating landscape; each layer is drawn twice across a 200% strip so the pan loops seamlessly. */
export function Scenery({ dusk = false }: { dusk?: boolean }) {
  const twice = (d: string) => <><path d={d} /><path d={d} transform="translate(600 0)" /></>;
  const poles = Array.from({ length: 8 }, (_, i) => i * 150);
  return (
    <div className="nt-scenery" aria-hidden="true">
      <svg className="far" viewBox="0 0 1200 200" preserveAspectRatio="xMidYMax slice">
        <g fill={dusk ? '#5a2f3a' : '#2b2d5a'}>{twice('M0 200V120L60 90L120 112L190 70L260 105L330 80L400 118L470 86L540 108L600 96V200Z')}</g>
        <g fill="#ffd98a" opacity=".55">{[40, 160, 290, 420, 520, 640, 760, 890, 1020, 1120].map(x => <rect key={x} x={x} y={150 + (x % 3) * 6} width="3" height="3" />)}</g>
      </svg>
      <svg className="mid" viewBox="0 0 1200 200" preserveAspectRatio="xMidYMax slice">
        <g fill={dusk ? '#3a1d27' : '#1a1c3a'}>{twice('M0 200V150Q80 128 160 146T320 140T480 150T600 144V200Z')}</g>
        <g fill={dusk ? '#2a141c' : '#121430'}>{[60, 210, 330, 470, 660, 810, 930, 1070].map(x => <path key={x} d={`M${x} 160l14-40 14 40z`} />)}</g>
      </svg>
      <svg className="near" viewBox="0 0 1200 200" preserveAspectRatio="xMidYMax slice">
        <g stroke="#0b0c1c" strokeWidth="5">{poles.map(x => <line key={x} x1={x + 40} y1="40" x2={x + 40} y2="200" />)}</g>
        <g stroke="#0b0c1c" strokeWidth="1.5" fill="none">{poles.map(x => <path key={x} d={`M${x + 40} 56Q${x + 115} 74 ${x + 190} 56`} />)}</g>
        <rect y="186" width="1200" height="14" fill="#0b0c1c" />
      </svg>
    </div>
  );
}

/** The carriage interior behind the fight: windows with passing scenery, luggage rack, panelled wall and carpet. */
export function Carriage({ boss = false }: { boss?: boolean }) {
  return (
    <>
      <div className="nt-windows" aria-hidden="true">
        {[0, 1, 2].map(i => <div key={i} className="nt-window-pane"><Scenery dusk={boss} /></div>)}
      </div>
      <div className="nt-rack" aria-hidden="true" />
      <div className="nt-wainscot" aria-hidden="true" />
      <div className="nt-lamp" style={{ left: '22%' }} aria-hidden="true" />
      <div className="nt-lamp" style={{ left: '72%' }} aria-hidden="true" />
      <div className="nt-floor" aria-hidden="true" />
    </>
  );
}
