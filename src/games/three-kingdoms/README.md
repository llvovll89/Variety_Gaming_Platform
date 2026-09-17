# 삼국지 패업

삼국지 11 방식의 턴제 전략 게임. 하나의 육각 지도 위에서 내정과 전술 전투가 이어진다.
시나리오는 194년 여름 중원 쟁패. 도시 12개, 무장 39명, 세력 7개.

## 왜 이런 구조인가

### 규칙은 즉시, 연출만 rAF

이 저장소의 다른 게임은 전부 고정 스텝 시뮬레이션이다. 턴제에는 적분할 것이 없다. 그래서
`engine.ts`의 rAF 루프는 **그리기 전용**이고, 애니메이션 큐가 비고 카메라가 멈추면 스스로
취소한다. 전략 지도는 가만히 있을 때 CPU를 쓰면 안 된다.

### 턴 해결은 스텝 머신

`turn.ts`의 `TurnRunner.next()`가 게임을 "보여줄 수 있는 증분" 하나만큼 진행하고 방금 일어난
일을 반환한다. 엔진은 애니메이션이 끝날 때마다, 테스트는 타이밍 없이 `while`로 호출한다.

대안이었던 "전부 해결한 뒤 기록을 재생"은 렌더러가 과거 위치를 복원해야 해서 진실의 원천이
둘이 된다. `await` 기반은 가짜 타이머 없이 테스트가 불가능하다. 스텝 머신이면 `GameState`가
항상 최신·권위 상태이고, 가속 버튼이 `runner.drain(state)` 한 줄이 된다.

### 플레이어와 AI는 같은 함수를 통과한다

`ai.ts`는 커맨드 생성기일 뿐이다. 실행은 `commands.ts`·`combat.ts`·`siege.ts`로, 플레이어
클릭과 완전히 같은 경로를 탄다. AI가 교전 가치를 판단할 때도 `expectedCasualties()` 같은
실제 전투 함수를 부른다. 그래서 병종 상성과 지형을 자동으로 존중하고, 밸런스 지식이 두 벌로
갈라지지 않는다.

### 규칙 계층은 제자리 변경(mutation)이다

`game/`의 규칙 함수는 `GameState`를 그 자리에서 고친다. 순수 함수가 아니어도 테스트가 되는
이유는 **DOM을 모르고 시드 난수만 쓰기** 때문이다. 복사본을 만드는 것은 테스트 가능성과 무관한
비용이었다.

### 좌표는 이중 표현

계산은 축좌표(axial, 뾰족머리), 저장은 odd-r 오프셋 행우선 배열. 변환은 `hex.ts`가 독점하고
전 타일 왕복 테스트로 잠겨 있다. 이 분리가 "높은 줌에서 홀수 행을 탭하면 옆 칸이 잡힌다"는
디버깅하기 괴로운 버그를 원천 차단한다.

## 파일 지도

```
game/
  hex.ts         축좌표 수학, 픽셀↔헥스, odd-r 변환      ← 가장 먼저 테스트됨
  map.ts         지형 생성, 가도 carve, 도시 영역 보로노이
  scenario.ts    194년 도시·세력 표        officers.ts  무장 39명 튜플 표
  state.ts       createGameState + 선택자   rng.ts      mulberry32 시드 난수
  internal.ts    내정(예약·해결·수입·시설)   pathfinding.ts  다익스트라 + ZOC
  commands.ts    출진/이동/귀환/유린        combat.ts   야전·공성 피해, 사기, 전법
  siege.ts       함락과 전리품              supply.ts   보급 회랑 BFS, 아사
  victory.ts     승패 판정                  turn.ts     스텝 머신 파이프라인
  ai.ts          세력 의사결정 + explainMilitary(밸런싱 계측기)
  camera.ts / input.ts / renderer.ts / inkBrush.ts / engine.ts / uiStore.ts / save.ts
components/  MapCanvas, StartMenu, TopBar, InspectorPanel, DispatchDialog, LogStrip, ResultScreen
```

## 밸런싱하는 법

숫자는 전부 `constants.ts`의 `BALANCE` 한 객체에 있다. 바꾼 뒤 계측기를 돌린다.

- `tests/three-kingdoms.test.mjs`의 `autoplay(seed, turns)`가 플레이어 세력까지 AI로 돌린다.
- `explainMilitary(state, factionId)`가 AI가 왜 그렇게 판단했는지 중간값을 돌려준다. 목표
  후보별 `value` / `force` / `need`를 보면 왜 공세가 안 나오는지 바로 보인다.

이 계측기가 실제로 잡아낸 것들이고, 전부 주석으로 코드에 남겨 두었다.

1. AI가 무장을 전부 내정에 배정해 부대를 이끌 장수가 남지 않았다 → `planInternal`이 최상위
   전투 무장을 예비로 남긴다.
2. 목표를 매 턴 새로 계산해 부대가 두 목표 사이를 오갔다(이동 262회에 전투 22회) →
   `Unit.orderTarget`으로 목표를 고정한다.
3. 건강한 7,000 부대가 도시에 흡수됐다가 다음 달 재편성되는 낭비 루프 → 진짜로 지쳤을 때만
   귀환한다.
4. **공격이 이동력을 0으로 만드는데 점령이 이동력을 요구했다.** 성벽을 부숴도 입성이 불가능했고
   다음 달이면 성벽이 복구됐다. 점령에서 이동력 조건을 뺐다.
5. 수비 병력을 전멸시켜야 점령되는 규칙 때문에 공성이 10턴 넘게 걸려 공격측이 먼저 죽었다 →
   삼국지 11처럼 내구 0이 함락 조건이고, 수비 병력은 성벽을 단단하게 만드는 쪽으로 기여한다.

## 개발 중 콘솔

개발 모드에서 `window.__tk`가 열린다. `state()`, `screenOfCity(id)`, `screenOfHex(hex)`,
`reach()`, `targets()`, `summary()`. 룬 레인저의 `window.__ranger` 선례를 따랐다.

## 아직 없는 것

일기토, 설전, 외교, 기술 연구, 수군, 병기, 등용·포로 처우 UI, 계략, 무장 성장·수명, 전장의
안개, 전국 41도시 맵, 사서 이벤트. AI 턴은 지금 즉시 해결되고 결과만 기록에 남는다. 부대
이동 애니메이션은 스텝 머신이 이미 준비되어 있으니 `engine.endTurn()`에서 `drain` 대신
`next`를 프레임마다 부르면 된다.
