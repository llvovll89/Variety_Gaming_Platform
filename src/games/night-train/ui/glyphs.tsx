import type { ReactNode } from 'react';

/**
 * House icon set for 별빛 야간열차. One 24px grid, 1.75 ink stroke, round joins and a single
 * tinted fill per glyph so cards, statuses, relics and stations read as one printed family.
 */
const T = { fill: 'currentColor', fillOpacity: 0.2, stroke: 'none' } as const;

const G: Record<string, ReactNode> = {
  // ── cards ──
  punch: <><path d="M9 13h5l5-6a3 3 0 0 0-4.6-3.6L9 9z" {...T} /><path d="M9 13h5l5-6a3 3 0 0 0-4.6-3.6L9 9zM9 13l-5 8M14 13l-3 8" /><circle cx="15.6" cy="6.2" r="1.2" fill="currentColor" /><path d="M3 9.5h3M4 6l2 1.5" /></>,
  ticket: <><path d="M3 7h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4z" {...T} /><path d="M3 7h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4zM6 11h6M6 14h4" /><path d="M15.5 8v8" strokeDasharray="1.2 2" /></>,
  tickets: <><path d="M7 4h14v2.5a1.8 1.8 0 0 0 0 3.5V13h-3" /><path d="M3 9h15v2.5a1.8 1.8 0 0 0 0 3.5V18H3v-3a1.8 1.8 0 0 0 0-3.5z" {...T} /><path d="M3 9h15v2.5a1.8 1.8 0 0 0 0 3.5V18H3v-3a1.8 1.8 0 0 0 0-3.5zM6 12.5h5" /><path d="M13.5 10v7" strokeDasharray="1.2 2" /></>,
  coat: <><path d="M8 3l4 3 4-3 4 4-2 3v11H6V10L4 7z" {...T} /><path d="M8 3l4 3 4-3 4 4-2 3v11H6V10L4 7zM12 6v15M8 3l4 6 4-6" /><circle cx="10" cy="14" r=".8" fill="currentColor" /><circle cx="10" cy="17.5" r=".8" fill="currentColor" /></>,
  lantern: <><path d="M8 8h8l-1 10H9z" {...T} /><path d="M10 3h4M12 3v2M9 5h6l1 3H8zM8 8h8l-1 10H9zM8 21h8M12 11c-1.5 1.5-1.5 3 0 4.5 1.5-1.5 1.5-3 0-4.5z" /><path d="M3 10l2 .5M21 10l-2 .5M4 15h2M20 15h-2" /></>,
  whistle: <><path d="M4 11h10a5 5 0 1 1-5 5" {...T} /><path d="M4 11h10a5 5 0 1 1-5 5H6M4 11v3h2M16 6l2-3M19 8l3-1M14 5l-.5-3" /></>,
  brake: <><circle cx="12" cy="12" r="8" {...T} /><path d="M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 8v5M12 16v.5" strokeWidth="2.2" /></>,
  spark: <><path d="M12 3l1.8 6.2L20 11l-6.2 1.8L12 19l-1.8-6.2L4 11l6.2-1.8z" {...T} /><path d="M12 3l1.8 6.2L20 11l-6.2 1.8L12 19l-1.8-6.2L4 11l6.2-1.8zM19 3v3M17.5 4.5h3M5 18v3M3.5 19.5h3" /></>,
  wind: <><path d="M3 9h11a3 3 0 1 0-3-3M3 13h15a3 3 0 1 1-3 3M3 17h7" /></>,
  flame: <><path d="M12 3c1 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-4 2-7 2 1 3 3 3 5 1-2 1-6 1-9z" {...T} /><path d="M12 3c1 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-4 2-7 2 1 3 3 3 5 1-2 1-6 1-9zM12 21a2.5 2.5 0 0 1-2.5-2.5c0-1.5 1.5-2 2.5-4 1 2 2.5 2.5 2.5 4A2.5 2.5 0 0 1 12 21z" /></>,
  suitcase: <><rect x="3" y="8" width="18" height="12" rx="2" {...T} /><rect x="3" y="8" width="18" height="12" rx="2" /><path d="M9 8V5h6v3M3 13h18M8 8v12M16 8v12" /></>,
  umbrella: <><path d="M3 12a9 8 0 0 1 18 0c-1.5-1-3-1-4.5 0-1.5-1-3-1-4.5 0-1.5-1-3-1-4.5 0-1.5-1-3-1-4.5 0z" {...T} /><path d="M3 12a9 8 0 0 1 18 0c-1.5-1-3-1-4.5 0-1.5-1-3-1-4.5 0-1.5-1-3-1-4.5 0-1.5-1-3-1-4.5 0zM12 4V3M12 12v6.5a2 2 0 0 1-4 0" /></>,
  blanket: <><path d="M4 7h14a2 2 0 0 1 2 2v8H6a2 2 0 0 1-2-2z" {...T} /><path d="M4 7h14a2 2 0 0 1 2 2v8H6a2 2 0 0 1-2-2zM4 11h16M4 7v8a2 2 0 0 0 2 2M9 7v4M14 7v4" /></>,
  timetable: <><rect x="4" y="3" width="16" height="18" rx="2" {...T} /><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h3M14 12h2M8 16h3M14 16h2" /></>,
  cup: <><path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z" {...T} /><path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5zM16 10h1.5a2.5 2.5 0 0 1 0 5H16M4 21h14M8 3c-1 1.2 1 1.8 0 3M12 3c-1 1.2 1 1.8 0 3" /></>,
  window: <><rect x="4" y="3" width="16" height="18" rx="5" {...T} /><rect x="4" y="3" width="16" height="18" rx="5" /><path d="M7 15c2-1 3 1 5 0s3 1 5 0M7 11c2-1 3 1 5 0s3 1 5 0" /></>,
  steam: <><path d="M6 17a3 3 0 0 1 .5-6 4 4 0 0 1 7.5-2 3.5 3.5 0 0 1 4 6 2.5 2.5 0 0 1-2 2z" {...T} /><path d="M6 17a3 3 0 0 1 .5-6 4 4 0 0 1 7.5-2 3.5 3.5 0 0 1 4 6 2.5 2.5 0 0 1-2 2zM8 20h3M13 20h4" /></>,
  crates: <><rect x="3" y="12" width="9" height="8" {...T} /><path d="M3 12h9v8H3zM12 14h9v6h-9zM6 4h9v8H6zM3 12l9 8M6 4l9 8M12 14l9 6" /></>,
  star: <><path d="M14 4l1.5 4.5H20l-3.7 2.8 1.4 4.7-3.7-2.9-3.8 2.9 1.5-4.7L8 8.5h4.6z" {...T} /><path d="M14 4l1.5 4.5H20l-3.7 2.8 1.4 4.7-3.7-2.9-3.8 2.9 1.5-4.7L8 8.5h4.6zM9 15l-6 6M6 13l-3 3M11 18l-3 3" /></>,
  lever: <><path d="M5 20h14M8 20v-3h8v3" /><rect x="8" y="17" width="8" height="3" {...T} /><path d="M12 17L17 5" strokeWidth="2.2" /><circle cx="17.5" cy="4.5" r="2" {...T} /><circle cx="17.5" cy="4.5" r="2" /></>,
  aid: <><rect x="3" y="7" width="18" height="13" rx="2" {...T} /><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V4h6v3M12 10.5v6M9 13.5h6" /></>,
  wall: <><path d="M3 7h18v13H3z" {...T} /><path d="M3 7h18v13H3zM3 11.5h18M3 16h18M9 7v4.5M15 7v4.5M6 11.5V16M12 11.5V16M18 11.5V16M9 16v4M15 16v4" /></>,
  breath: <><circle cx="12" cy="12" r="3" {...T} /><circle cx="12" cy="12" r="3" /><path d="M12 3a9 9 0 0 1 9 9M12 21a9 9 0 0 1-9-9M5.5 5.5L7 7M18.5 18.5L17 17" /></>,
  plates: <><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" {...T} /><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6zM5 10h14M5.5 14.5h13M12 3v18" /></>,
  wire: <><path d="M2 12h20" /><path d="M5 9l2 6M7 9l-2 6M12 9l2 6M14 9l-2 6M18 9l2 6M20 9l-2 6" /></>,
  metronome: <><path d="M8 3h8l3 18H5z" {...T} /><path d="M8 3h8l3 18H5zM7 16h10M12 16l4-10" /><circle cx="14.5" cy="9.5" r="1.3" fill="currentColor" /></>,
  engine: <><rect x="4" y="7" width="16" height="11" rx="3" {...T} /><path d="M4 10a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v8H4zM9 3h3v4H9zM3 21l2-3h14l2 3" /><circle cx="12" cy="12.5" r="2.5" /></>,
  coal: <><path d="M4 16l3-5 4 1 3-4 5 3 1 6-5 3H8z" {...T} /><path d="M4 16l3-5 4 1 3-4 5 3 1 6-5 3H8zM11 12l1 4 4 1M7 11l1 5" /></>,
  gauge: <><circle cx="12" cy="13" r="8" {...T} /><circle cx="12" cy="13" r="8" /><path d="M12 13l4-4M8 17h8M6.5 9.5l1 .8M12 6v1M17.5 9.5l-1 .8" strokeWidth="1.9" /></>,
  gear: <><circle cx="12" cy="12" r="4" {...T} /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" /><circle cx="12" cy="12" r="4" /><path d="M12 10c-.8.8-.8 1.8 0 3 .8-1.2.8-2.2 0-3z" fill="currentColor" /></>,
  sparkles: <><path d="M10 4l1.5 5 5 1.5-5 1.5L10 17l-1.5-5-5-1.5 5-1.5z" {...T} /><path d="M10 4l1.5 5 5 1.5-5 1.5L10 17l-1.5-5-5-1.5 5-1.5zM18 14l.8 2.2 2.2.8-2.2.8L18 20l-.8-2.2-2.2-.8 2.2-.8zM18 3v3M16.5 4.5h3" /></>,
  carriage: <><rect x="3" y="6" width="18" height="11" rx="2" {...T} /><rect x="3" y="6" width="18" height="11" rx="2" /><path d="M6 9h3v3H6zM11 9h3v3h-3zM16 9h2v3h-2zM3 14h18" /><circle cx="7" cy="19" r="1.5" /><circle cx="17" cy="19" r="1.5" /></>,

  // ── statuses & intents ──
  fist: <><path d="M7 11V7a1.5 1.5 0 0 1 3 0v3-4a1.5 1.5 0 0 1 3 0v4-3a1.5 1.5 0 0 1 3 0v4a1.5 1.5 0 0 1 3 0v3a7 7 0 0 1-7 7h-1a6 6 0 0 1-6-6v-2a2 2 0 0 1 2-2z" {...T} /><path d="M7 11V7a1.5 1.5 0 0 1 3 0v3-4a1.5 1.5 0 0 1 3 0v4-3a1.5 1.5 0 0 1 3 0v4a1.5 1.5 0 0 1 3 0v3a7 7 0 0 1-7 7h-1a6 6 0 0 1-6-6v-2a2 2 0 0 1 2-2z" /></>,
  drop: <><path d="M12 3c3 4 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 3-7 6-11z" {...T} /><path d="M12 3c3 4 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 3-7 6-11zM9.5 14.5a2.5 2.5 0 0 0 2.5 2.5" /></>,
  cracked: <><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" {...T} /><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6zM12 3l-1 5 3 2-3 4 2 3" /></>,
  thorns: <><path d="M4 20c4-2 6-6 6-12M10 13c3 0 6-1 8-4" /><path d="M7 15l-3-1M9 10L6 8M13 12l1-3M16 10.5l3 1" /></>,
  shield: <><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" {...T} /><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /></>,
  cards: <><rect x="8" y="3" width="11" height="15" rx="1.5" {...T} /><path d="M5 6.5l-1 .3 3.3 13.2 9.4-2.4M8 3h11v15H8z" /><path d="M11 8h5M11 11h3" /></>,
  sword: <><path d="M19 3l-9 9 2 2 9-9V3z" {...T} /><path d="M19 3h2v2l-9 9-2-2zM6 14l4 4M8 16l-4 4M4 18l2 2" /></>,
  up: <><path d="M6 12l6-6 6 6M6 19l6-6 6 6" strokeWidth="2.2" /></>,
  spiral: <><path d="M12 12a1.5 1.5 0 1 1 1.5 1.5A3 3 0 1 1 15 9a4.5 4.5 0 1 1-6.4 6.4A6 6 0 1 1 18 6" /></>,

  // ── relics ──
  thermos: <><rect x="8" y="5" width="8" height="16" rx="2" {...T} /><path d="M9 2h6v3H9zM8 5h8v16H8zM8 9h8M8 17h8" /></>,
  glove: <><path d="M7 21v-6l-2-4 2-1 2 3V5a1.3 1.3 0 0 1 2.6 0v5-6a1.3 1.3 0 0 1 2.6 0v6-4.5a1.3 1.3 0 0 1 2.6 0V14l-1 7z" {...T} /><path d="M7 21v-6l-2-4 2-1 2 3V5a1.3 1.3 0 0 1 2.6 0v5-6a1.3 1.3 0 0 1 2.6 0v6-4.5a1.3 1.3 0 0 1 2.6 0V14l-1 7z" /></>,
  jar: <><path d="M7 7h10v12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2z" {...T} /><path d="M8 3h8v4H8zM7 7h10v12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2z" /><path d="M10 12l.6 1.4 1.4.6-1.4.6L10 16l-.6-1.4L8 14l1.4-.6zM14 15l.5 1 1 .5-1 .5-.5 1-.5-1-1-.5 1-.5z" fill="currentColor" stroke="none" /></>,
  scarf: <><path d="M5 5c4 2 10 2 14 0v4c-4 2-10 2-14 0z" {...T} /><path d="M5 5c4 2 10 2 14 0v4c-4 2-10 2-14 0zM14 9.5V21l3-2 0-9.5M14 13h3M14 16h3" /></>,
  cap: <><path d="M4 13a8 6 0 0 1 16 0z" {...T} /><path d="M4 13a8 6 0 0 1 16 0zM2 13h20l-2 3H4zM12 7v2M10.5 8.5h3" /></>,
  bell: <><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z" {...T} /><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4M12 3v2" /></>,
  flint: <><path d="M4 18l6-12 8 4-4 10z" {...T} /><path d="M4 18l6-12 8 4-4 10zM19 4l1-2M21 7l2-.5M17 3l-.5-2" /></>,
  compass: <><circle cx="12" cy="12" r="9" {...T} /><circle cx="12" cy="12" r="9" /><path d="M15.5 8.5l-2 5-5 2 2-5z" fill="currentColor" /></>,
  watch: <><circle cx="12" cy="14" r="7" {...T} /><circle cx="12" cy="14" r="7" /><path d="M10 3h4M12 3v4M12 14V10.5M12 14l2.5 1.5" /></>,

  // ── stations ──
  shadow: <><path d="M5 21v-7a7 7 0 0 1 14 0v7l-2.3-1.5L14.3 21 12 19.5 9.7 21l-2.4-1.5z" {...T} /><path d="M5 21v-7a7 7 0 0 1 14 0v7l-2.3-1.5L14.3 21 12 19.5 9.7 21l-2.4-1.5z" /><circle cx="9.5" cy="12" r="1.2" fill="currentColor" /><circle cx="14.5" cy="12" r="1.2" fill="currentColor" /></>,
  mask: <><path d="M4 5l4 3h8l4-3-1 9c-1 4-4 6-7 6s-6-2-7-6z" {...T} /><path d="M4 5l4 3h8l4-3-1 9c-1 4-4 6-7 6s-6-2-7-6zM8 12l2.5 1.5M16 12l-2.5 1.5M10 17h4" /></>,
  bed: <><path d="M3 13h18v4H3z" {...T} /><path d="M3 7v12M21 13v6M3 13h18v4H3M7 13v-2.5A1.5 1.5 0 0 1 8.5 9h3A1.5 1.5 0 0 1 13 10.5V13M16 5.5a2.5 2.5 0 0 0 2.8 2.8A3 3 0 1 1 16 5.5z" /></>,
  awning: <><path d="M3 9l2-5h14l2 5c0 1.5-1.5 2.5-3 2.5S15 10.5 15 9c0 1.5-1.5 2.5-3 2.5S9 10.5 9 9c0 1.5-1.5 2.5-3 2.5S3 10.5 3 9z" {...T} /><path d="M3 9l2-5h14l2 5c0 1.5-1.5 2.5-3 2.5S15 10.5 15 9c0 1.5-1.5 2.5-3 2.5S9 10.5 9 9c0 1.5-1.5 2.5-3 2.5S3 10.5 3 9zM5 11v9h14v-9M10 20v-5h4v5" /></>,
  question: <><path d="M12 2l10 10-10 10L2 12z" {...T} /><path d="M12 2l10 10-10 10L2 12zM9.8 10a2.3 2.3 0 1 1 3.2 2.1c-.6.3-1 .8-1 1.4V14M12 16.5v.3" /></>,
  crate: <><path d="M3 8l9-4 9 4v9l-9 4-9-4z" {...T} /><path d="M3 8l9-4 9 4v9l-9 4-9-4zM3 8l9 4 9-4M12 12v9M7.5 6l9 4" /></>,
  locomotive: <><path d="M3 18V9h5V5h4v4h5l4 5v4z" {...T} /><path d="M3 18V9h5V5h4v4h5l4 5v4zM6 5h8M3 13h18M13 9v4" /><circle cx="7" cy="19.5" r="1.5" /><circle cx="17" cy="19.5" r="1.5" /></>,

  // ── interface ──
  heart: <><path d="M12 20s-8-4.7-8-10.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 2.5C20 15.3 12 20 12 20z" {...T} /><path d="M12 20s-8-4.7-8-10.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 2.5C20 15.3 12 20 12 20z" /></>,
  coin: <><circle cx="12" cy="12" r="8" {...T} /><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="5" /><path d="M12 9.5v5" /></>,
  bolt: <><path d="M13 2L5 13.5h6L10 22l9-12.5h-6z" {...T} /><path d="M13 2L5 13.5h6L10 22l9-12.5h-6z" /></>,
  bag: <><path d="M5 8h14l-1 13H6z" {...T} /><path d="M5 8h14l-1 13H6zM9 8V6a3 3 0 0 1 6 0v2M9 12h6" /></>,
  deck: <><rect x="4" y="7" width="12" height="15" rx="1.5" {...T} /><rect x="4" y="7" width="12" height="15" rx="1.5" /><path d="M8 4h10.5A1.5 1.5 0 0 1 20 5.5V18" /><path d="M7.5 12h5M7.5 15h3" /></>,
  discard: <><path d="M6 7h12l-1 14H7z" {...T} /><path d="M6 7h12l-1 14H7zM4 7h16M10 4h4M10 11v6M14 11v6" /></>,
  ember: <><path d="M12 4c2.5 3 5 5 5 9a5 5 0 0 1-10 0c0-2 1-3 1.5-4.5C10 10 11 11 11 13c1-1.5 1-5 1-9z" {...T} /><path d="M12 4c2.5 3 5 5 5 9a5 5 0 0 1-10 0c0-2 1-3 1.5-4.5C10 10 11 11 11 13c1-1.5 1-5 1-9z" strokeDasharray="2 1.6" /></>,
  route: <><circle cx="6" cy="18" r="2.5" {...T} /><circle cx="6" cy="18" r="2.5" /><circle cx="18" cy="6" r="2.5" /><path d="M8.5 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5" /></>,
  menu: <><path d="M4 7h16M4 12h16M4 17h10" /></>,
  close: <><path d="M6 6l12 12M18 6L6 18" strokeWidth="2" /></>,
  play: <><path d="M7 4l13 8-13 8z" {...T} /><path d="M7 4l13 8-13 8z" /></>,
  arrow: <><path d="M4 12h15M13 6l6 6-6 6" /></>,
  retry: <><path d="M4 12a8 8 0 1 0 2.5-5.8M4 4v4.5h4.5" /></>,
  book: <><path d="M3 5c3-1 6-1 9 1 3-2 6-2 9-1v14c-3-1-6-1-9 1-3-2-6-2-9-1z" {...T} /><path d="M3 5c3-1 6-1 9 1 3-2 6-2 9-1v14c-3-1-6-1-9 1-3-2-6-2-9-1zM12 6v14" /></>,
  home: <><path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z" {...T} /><path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z" /></>,
  hourglass: <><path d="M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9s8 4 8 9" /><path d="M9.5 19h5l-2.5-3z" fill="currentColor" stroke="none" /></>,
  hammer: <><path d="M14 4l6 6-3 3-6-6z" {...T} /><path d="M14 4l6 6-3 3-6-6zM12.5 8.5L3 18l3 3 9.5-9.5M14 4l-2-1" /></>,
  scissors: <><circle cx="6" cy="17" r="3" /><circle cx="18" cy="17" r="3" /><path d="M8 15L18 3M16 15L6 3" /></>,
  exit: <><path d="M10 4H5v16h5M14 8l4 4-4 4M18 12H9" /></>,
};

export type GlyphName = keyof typeof G;

export function Glyph({ name, size = 24, className, strokeWidth = 1.75, title }: { name: string; size?: number; className?: string; strokeWidth?: number; title?: string }) {
  return (
    <svg className={`nt-glyph${className ? ` ${className}` : ''}`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden={title ? undefined : true} role={title ? 'img' : undefined}>
      {title && <title>{title}</title>}
      {G[name] ?? G.spark}
    </svg>
  );
}

/** Card id → illustration glyph. */
export const CARD_GLYPH: Record<string, string> = {
  punch: 'punch', coat: 'coat', 'lantern-flash': 'lantern', 'double-punch': 'tickets', whistle: 'whistle', 'sudden-stop': 'brake',
  spark: 'spark', gust: 'wind', 'ember-toss': 'flame', 'trunk-swing': 'suitcase', umbrella: 'umbrella', blanket: 'blanket',
  timetable: 'timetable', coffee: 'cup', 'fog-window': 'window', 'steam-blast': 'steam', 'luggage-slam': 'crates', 'shooting-star': 'star',
  'brake-lever': 'lever', 'first-aid': 'aid', 'luggage-wall': 'wall', focus: 'breath', 'iron-coat': 'plates', 'barbed-wire': 'wire',
  rhythm: 'metronome', 'last-train': 'engine', 'coal-burst': 'coal', boiler: 'gauge', 'fire-engine': 'gear', starlight: 'sparkles', fortress: 'carriage',
};

export const STATUS_GLYPH: Record<string, string> = {
  strength: 'fist', weak: 'drop', vulnerable: 'cracked', burn: 'flame', thorns: 'thorns', plating: 'plates', drawUp: 'cards', kindle: 'gear',
};

export const RELIC_GLYPH: Record<string, string> = {
  lantern: 'lantern', thermos: 'thermos', glove: 'glove', candy: 'jar', scarf: 'scarf', cap: 'cap', bell: 'bell', coal: 'coal',
  flint: 'flint', compass: 'compass', ticket: 'ticket', watch: 'watch',
};

export const NODE_GLYPH: Record<string, string> = {
  battle: 'shadow', elite: 'mask', rest: 'bed', shop: 'awning', event: 'question', treasure: 'crate', boss: 'locomotive',
};

export const SNACK_GLYPH: Record<string, string> = {
  'star-candy': 'jar', cocoa: 'cup', 'spicy-skewer': 'flame', 'emergency-whistle': 'whistle', mint: 'spark', 'lemon-drop': 'drop', gimbap: 'bolt',
};
