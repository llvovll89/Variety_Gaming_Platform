import { simulateBattle } from "./battleEngine";
import { activeTroop, playerTroop, targetTroop, type DemoBattle, type DemoState } from "./demoGame";
export function practiceBattle(state: DemoState, targetId: string, random: () => number): DemoBattle {
  const target = state.targets.find(t => t.id === targetId);
  if (!target || target.currentTroops <= 0) throw new Error("모의전 대상을 확인하세요.");
  if (activeTroop(state).currentTroops <= 0) throw new Error("병력을 보충한 뒤 모의전을 진행하세요.");
  const result = simulateBattle(playerTroop(state), targetTroop(target), random);
  return { ...result, id: `practice-${targetId}`, targetName: `${target.name} 모의전`, createdAt: state.castle.lastUpdatedAt, goldReward: 0, experienceReward: 0 };
}
