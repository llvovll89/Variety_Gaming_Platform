import type { CSSProperties } from 'react';

/**
 * 리듬단 동물 친구 셋. 큰 머리·큰 눈·볼터치의 애니풍으로 새로 그린 SVG다.
 * 옷 색이 자기 자리(레인) 색이라, 음표 색 → 동물 → 패드가 한 줄로 이어진다.
 * 움직임은 전부 CSS가 맡는다(`rhythm.css`의 .kr-friend). 여기는 생김새만 있다.
 */
export const FRIEND_NAMES = ['토끼', '곰', '개구리'] as const;
export const LANE_COLORS = ['#ff8fab', '#ffd166', '#6fd3c7'] as const;

const INK = '#3a2a40';

function Eyes({ y, gap = 15 }: { y: number; gap?: number }) {
  return (
    <g>
      <g className="kr-eyes-open">
        {[60 - gap, 60 + gap].map(x => (
          <g key={x}>
            <ellipse cx={x} cy={y} rx="7.5" ry="9.5" fill={INK} />
            <circle cx={x + 2.6} cy={y - 3.6} r="3.1" fill="#fff" />
            <circle cx={x - 2.4} cy={y + 3.4} r="1.4" fill="#fff" />
          </g>
        ))}
      </g>
      {/* 신나면(콤보) 눈이 웃는 모양으로 바뀐다. */}
      <g className="kr-eyes-happy" fill="none" stroke={INK} strokeWidth="3.4" strokeLinecap="round">
        {[60 - gap, 60 + gap].map(x => <path key={x} d={`M${x - 7} ${y + 2} Q${x} ${y - 8} ${x + 7} ${y + 2}`} />)}
      </g>
      {[60 - gap - 6, 60 + gap + 6].map(x => <ellipse key={x} cx={x} cy={y + 12} rx="6.5" ry="3.6" fill="#ff8fa8" opacity="0.65" />)}
    </g>
  );
}

const mouth = (y: number) => <path d={`M53 ${y} Q56.5 ${y + 4.5} 60 ${y} Q63.5 ${y + 4.5} 67 ${y}`} fill="none" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />;

function Body({ color }: { color: string }) {
  return (
    <g className="kr-friend-body">
      <g className="kr-arm kr-arm-l"><ellipse cx="33" cy="112" rx="8" ry="13" fill={color} stroke={INK} strokeWidth="3" /></g>
      <g className="kr-arm kr-arm-r"><ellipse cx="87" cy="112" rx="8" ry="13" fill={color} stroke={INK} strokeWidth="3" /></g>
      <path d="M34 138 Q33 104 60 100 Q87 104 86 138 Z" fill={color} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      {/* 단원 배지: 작은 음표 */}
      <circle cx="60" cy="120" r="7" fill="#fff" opacity="0.85" />
      <path d="M58 123.5 V114 L63.5 113" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" />
      <circle cx="56.6" cy="123.6" r="2.2" fill={INK} />
    </g>
  );
}

function Rabbit() {
  return (
    <g stroke={INK} strokeWidth="3">
      <g className="kr-ears">
        <ellipse cx="44" cy="28" rx="10" ry="26" fill="#fffaf6" transform="rotate(-12 44 28)" />
        <ellipse cx="76" cy="28" rx="10" ry="26" fill="#fffaf6" transform="rotate(12 76 28)" />
        <ellipse cx="44" cy="30" rx="4.6" ry="17" fill="#ffc0cf" stroke="none" transform="rotate(-12 44 30)" />
        <ellipse cx="76" cy="30" rx="4.6" ry="17" fill="#ffc0cf" stroke="none" transform="rotate(12 76 30)" />
      </g>
      <ellipse cx="60" cy="68" rx="38" ry="33" fill="#fffaf6" />
      <g stroke="none">
        <Eyes y={66} />
        <ellipse cx="60" cy="78" rx="3" ry="2.2" fill="#ff7f9c" />
      </g>
      <g stroke="none">{mouth(81)}</g>
    </g>
  );
}

function Bear() {
  return (
    <g stroke={INK} strokeWidth="3">
      <circle cx="29" cy="40" r="13" fill="#c48a5a" />
      <circle cx="91" cy="40" r="13" fill="#c48a5a" />
      <circle cx="29" cy="40" r="6.5" fill="#efb68e" stroke="none" />
      <circle cx="91" cy="40" r="6.5" fill="#efb68e" stroke="none" />
      <ellipse cx="60" cy="68" rx="40" ry="34" fill="#c48a5a" />
      <ellipse cx="60" cy="83" rx="15" ry="11" fill="#f4d9b8" stroke="none" />
      <g stroke="none">
        <Eyes y={64} gap={16} />
        <ellipse cx="60" cy="78.5" rx="5" ry="3.6" fill={INK} />
        {mouth(84)}
      </g>
    </g>
  );
}

function Frog() {
  return (
    <g stroke={INK} strokeWidth="3">
      <circle cx="40" cy="44" r="17" fill="#79d39a" />
      <circle cx="80" cy="44" r="17" fill="#79d39a" />
      <ellipse cx="60" cy="74" rx="44" ry="29" fill="#79d39a" />
      <ellipse cx="60" cy="86" rx="26" ry="12" fill="#e6f7c4" stroke="none" />
      <g stroke="none">
        <Eyes y={45} gap={20} />
        <path d="M46 82 Q60 92 74 82" fill="none" stroke={INK} strokeWidth="2.8" strokeLinecap="round" />
      </g>
    </g>
  );
}

const HEADS = [Rabbit, Bear, Frog];

/** 동물 친구 하나. `head`면 패드에 넣을 얼굴만 그린다. */
export function ForestFriend({ lane, head = false, className, style }: { lane: number; head?: boolean; className?: string; style?: CSSProperties }) {
  const Head = HEADS[lane] ?? Rabbit;
  return (
    <svg className={className} style={style} viewBox={head ? '8 0 104 106' : '0 0 120 142'} aria-hidden="true" focusable="false">
      {!head && <Body color={LANE_COLORS[lane]} />}
      <g className="kr-friend-head"><Head /></g>
    </svg>
  );
}
