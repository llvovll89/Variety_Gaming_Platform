import { PlayIcon } from "@phosphor-icons/react/dist/icons/Play";
import { COLOR_PALETTE, DIFFICULTY_CONFIGS, type DifficultyLevel } from "../game/constants";
import { Drop } from "./Paint";

interface StartMenuProps {
  difficulty: DifficultyLevel;
  onDifficultyChange: (difficulty: DifficultyLevel) => void;
  /** Focus the selected level on mount (after a difficulty change remounted the menu). */
  focusDifficulty: boolean;
  patterns: boolean;
  /** Best score on the selected difficulty. */
  bestScore: number;
  /** Best score from before records were split by difficulty. */
  legacyBest: number;
  onTogglePatterns: () => void;
  onStart: () => void;
}

const LEVEL_NOTES: Record<DifficultyLevel, string> = {
  easy: "물감 3통",
  normal: "물감 4통",
  hard: "물감 5통",
};

export default function StartMenu({ difficulty, onDifficultyChange, focusDifficulty, patterns, bestScore, legacyBest, onTogglePatterns, onStart }: StartMenuProps) {
  const config = DIFFICULTY_CONFIGS[difficulty];

  return (
    <div className="cm-sheet">
      <div className="cm-card motion-safe:animate-panel-in">
        <div className="cm-title">
          <div className="cm-drops">{COLOR_PALETTE.slice(0, 6).map((c) => <Drop key={c.id} hex={c.hex} />)}</div>
          <h1>색깔 맞추기</h1>
          <p>가운데 물감 방울과 같은 색 물감 통을 눌러요.<br />{config.duration}초 동안 몇 개나 맞힐 수 있을까요?</p>
        </div>

        <div className="cm-field" role="group" aria-labelledby="cm-level-label">
          <p id="cm-level-label">난이도</p>
          <div className="cm-levels">
            {(Object.keys(DIFFICULTY_CONFIGS) as DifficultyLevel[]).map((level) => (
              <button key={level} aria-pressed={difficulty === level} autoFocus={focusDifficulty && difficulty === level} onClick={() => onDifficultyChange(level)}>
                {DIFFICULTY_CONFIGS[level].name}
                <small>{LEVEL_NOTES[level]}</small>
              </button>
            ))}
          </div>
          <button className="cm-toggle" role="switch" aria-checked={patterns} onClick={onTogglePatterns}>
            <span>
              무늬로도 구별하기
              <small>색마다 다른 무늬가 생겨요. 비슷한 색이 헷갈릴 때 좋아요.</small>
            </span>
            <i className="cm-switch" aria-hidden="true" />
          </button>
        </div>

        <ul className="cm-rules">
          <li><b>맞히면 10점</b>, 연속으로 맞힐수록 보너스가 붙어요.</li>
          <li><b>5개 맞힐 때마다 레벨 업!</b> 고를 시간이 짧아지고 물감 통이 늘어나요.</li>
          <li>틀리면 남은 시간이 1.5초 줄어요. 키보드는 숫자 1~6으로 고를 수 있어요.</li>
        </ul>

        <button className="cm-primary" onClick={onStart}>
          <PlayIcon size={18} weight="fill" /> 시작하기
        </button>
        {bestScore > 0 && <p className="cm-best">{config.name} 최고 기록 <b className="cm-num">{bestScore}</b>점</p>}
        {legacyBest > 0 && <p className="cm-best">난이도 구분 전 기록 <b className="cm-num">{legacyBest}</b>점</p>}
      </div>
    </div>
  );
}
