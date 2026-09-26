# 삼국 영지 전투 서버

기존 Vite 게임과 별도로 배포하는 Next.js App Router 프로젝트입니다. DB 구조, 전투 엔진/API, 요청 시 자원 동기화, 장수 경험치·레벨업과 브라우저 체험 화면을 제공합니다. 기존 Vite 게임 UI와의 연동, 가입 화면, 가챠·건설·편성·장비 관리 서버 API는 후속 작업입니다. `Item`과 슬롯 모델은 해당 기능의 데이터를 저장할 수 있습니다.

## DB 없이 화면 체험하기

이 폴더에서 `npm ci`, `npm run dev`를 실행하고 `http://localhost:3000`을 여세요. `.env`나 Supabase 계정 없이 이용할 수 있습니다.

- **영지:** 시간 기반 자원 생산, 농장·정방·병영 강화(최대 10레벨).
- **시작:** 군주·영지 이름을 직접 정하고 장수 0명, 빈 부대, 초빙장 3장으로 시작합니다.
- **장수:** 촉 11명·위 12명·오 10명·군웅 3명, 총 36명이 각각 1~5성으로 등장합니다. 등급 확률은 45/30/17/7/1%, 각 등급 안에서 장수는 균등 추첨하며 명부는 최대 300명입니다. 1회·5회 모집은 초빙장을 먼저 쓰고 부족한 횟수당 금 300을 소비합니다. 5회 모집에 확정 등급은 없습니다.
- **도감·연출:** 36명의 개별 일러스트 초상, 이름·별호·역할 검색, 세력 필터, 보유 표시, 등급별 능력치 비교와 모집 결과 공개 연출을 제공합니다. 장수 상세는 2D 초상으로 표시하며 3D 뷰어와 Three.js 의존성은 제거했습니다. 기존 v2 저장의 장수·부대·진행 기록을 유지합니다.
- **부대 편성:** 주장 1명·부장 2명 선택, 병력 보충. 보충 1명당 식량과 예비군 각각 1 소비. 통솔 감소로 생긴 초과 병력은 예비군으로 반환.
- **출정:** 세 NPC 거점 토벌, 기존 순수 전투 엔진의 턴별 로그, 생존 병력과 금·경험치 반영. 최근 10회 기록 보관.
- **저장:** 현재 브라우저의 localStorage에 자동 저장하며 재접속 시 경과 시간만큼 자원을 계산합니다. JSON 백업·불러오기와 ‘새로운 이야기’ 초기화를 지원합니다. 데스크톱에서는 왼쪽 메뉴, 모바일·태블릿에서는 페이지 하단에서 이용할 수 있고, 첫 시작 화면에서도 백업을 불러올 수 있습니다. 현재 저장 형식은 v2이며 이전 v1 기록을 자동 변환하지 않습니다.

체험판은 브라우저에서 계산하는 별도 저장 데이터이며 `/api/battle`이나 실제 DB를 호출하지 않습니다. 실제 계정으로 이어지지 않으며 여러 탭의 동시 플레이는 지원하지 않습니다. `lib/demoGame.ts`의 데이터는 Prisma 모델의 필드 이름을 따르는 화면용 DTO입니다(Decimal은 숫자, 날짜는 ISO 문자열). 향후 인증된 서버 API 응답으로 교체해야 합니다. 체험판 RNG와 로컬 저장소를 실제 게임의 보상 지급에 사용하면 안 됩니다.

```text
app/                       Next.js 진입점 / Tailwind CSS
  api/battle/route.ts       인증, 입력 검증, HTTP 응답
components/GameDemo.tsx     영지·장수·편성·출정 체험 화면
components/SummonReveal.tsx 모집 결과 공개 연출
components/HeroDetails.tsx  장수 상세·등급 비교
components/HeroRoster.tsx   검색·세력 필터·도감·보유 명부
lib/
  heroCatalog.ts           전체 장수·등급별 능력치·보유 상한
  additionalHeroes.ts      추가 장수 30명
  heroPortrait.ts          초상 아틀라스 좌표
  demoGame.ts               체험 DTO, 자원·모집·편성·전투 동작
  battleEngine.ts          DB와 무관한 전투 계산 (주입한 RNG 사용)
  battleService.ts         직렬화 트랜잭션, 보상, 멱등성
  auth.ts                  Supabase getUser 토큰 검증
  db.ts                    Prisma singleton / pg pool
  resources.ts             Lazy Calculation
  progression.ts           장수 레벨업
prisma/
  schema.prisma            8개 모델 및 enum
  bootstrap.sql            빈 DB용 전체 스키마 + 제약 + RLS
  constraints.sql          Prisma로 표현할 수 없는 제약
  seed.ts                  개발용 부대 생성
tests/                     전투·자원·성장 테스트
```

추가 초상은 `public/art/heroes-expanded.png`에 저장된 30칸 아틀라스입니다. 생성 도구와 최종 프롬프트는 [ART_ASSETS.md](ART_ASSETS.md)에 기록했습니다. 능력치·대사는 게임용 설정입니다.

## 로컬 실행

Node.js 22.12 이상(권장 24)을 사용합니다. 아래 명령은 이 디렉터리에서 실행합니다.

```sh
npm ci
cp .env.example .env
npm run db:generate
npm run db:deploy
npm run dev
```

`.env`에 Supabase 프로젝트의 실제 연결 정보를 입력하세요. `DATABASE_URL`은 Supavisor transaction pooler(6543), `DIRECT_URL`은 session pooler(5432) 또는 direct 연결입니다. 비밀번호의 특수 문자는 URL 인코딩합니다. 서버 DB 역할은 테이블 소유자 또는 BYPASSRLS 권한이 필요합니다. [Supabase 공식 Prisma 연결 안내](https://supabase.com/docs/guides/database/prisma)를 참고하세요.

`db:deploy`는 **비어 있는 새 DB에 한 번만** 실행하는 초기 SQL입니다. 기존 테이블을 삭제하거나 덮어쓰지 않으며, 재실행 시 실패합니다. Prisma 스키마 변경 이력은 아직 도입하지 않았으므로 후속 변경부터 기존 DB를 기준으로 migration을 생성·관리해야 합니다. 테이블 생성·제약·RLS를 한 트랜잭션으로 적용합니다. 브라우저에서 DB 테이블을 직접 수정할 수 있는 RLS 정책은 제공하지 않습니다.

Supabase Auth에 테스트 사용자를 만든 뒤 해당 사용자 UUID를 사용해 개발 데이터를 생성합니다.

```powershell
$env:SEED_USER_ID = "실제 Supabase Auth 사용자 UUID"
npx tsx prisma/seed.ts
```

출력한 두 부대 ID로 전투를 요청할 수 있습니다. 사용자/영지/플레이어 부대는 기존 데이터가 있으면 유지하고, 실행할 때마다 새 NPC를 추가합니다. 테스트 목적으로만 사용하세요.

## API 계약

```http
POST /api/battle
Authorization: Bearer <Supabase access_token>
Content-Type: application/json

{
  "attackerTroopId": "UUID",
  "defenderTroopId": "UUID",
  "requestKey": "UUID"
}
```

새 전투마다 `crypto.randomUUID()`로 요청 키를 만들고 네트워크 오류 재시도에는 **같은 키와 본문**을 사용합니다. 공격 부대 ID를 명시해야 여러 부대를 가진 사용자도 안전하게 출전시킬 수 있습니다. 스탯·병력·보상은 클라이언트에서 받지 않습니다.

응답: `{ battleId, replayed, result: { winner, turns, logs: string[], attackerRemaining, defenderRemaining, experienceReward, goldReward, rewardUserId, heroRewards, mode, rulesVersion } }`.

- 201: 새 전투 저장, 200: 기존 결과 재전송
- 400: 잘못된 입력/자기 공격, 401: 미인증, 403: 공격 부대 소유권 오류
- 404: 대상 없음, 409: 병력·편성·동시성 충돌/요청 키 재사용, 500: 내부 오류

Supabase Auth 서버에서 `getUser(token)`으로 검증하며 사용자 ID를 요청 본문에서 신뢰하지 않습니다. [인증 메서드 문서](https://supabase.com/docs/reference/javascript/auth-getuser).

## 확정한 게임 규칙

- 상세 요청의 공식을 우선 적용: 주장 + 각 부장 × 0.3. 장착 아이템 보너스도 해당 장수 스탯에 포함합니다.
- 1턴 = 선공 부대 공격 → 살아 있는 상대 반격. 최초 통솔 순서를 최대 10턴 동안 유지합니다. 통솔 동률이면 50% 추첨합니다.
- 물리 피해 `무력×0.5 + 현재 병력×0.4 - 상대 무력×0.1`. 계략 확률은 `min(100, 지력/3)%`, 피해 1.5배. 최종 피해 정수 내림 후 최소 10, 실제 감소량은 상대 잔여 병력까지입니다.
- 10턴 후 잔여 병력이 많은 쪽 승리, 같으면 무승부. 빈 부대는 API에서 출전 거부합니다.
- 승자 경험치는 `floor(처치 병력×0.1)`을 참여 장수에게 균등 분배합니다. 나머지는 장수 UUID 순서로 1씩 지급합니다. 레벨업 요구 경험치는 `현재 레벨×100`, 상한 100레벨. 레벨마다 4개 능력치 +1, 기본 통솔 병력 +50.
- 최대 통솔 병력은 참여 장수별 `maxTroops + 장비 포함 통솔×10`의 합입니다.
- PVE 공격 승리 시 NPC의 서버 설정 금 지급. 패배한 NPC는 병력 0으로 남아 재약탈을 막습니다. 자동 리스폰은 없습니다.
- PVP는 **승자(방어 승리 포함)**에게 패자 금의 10%, 최대 1,000금을 이전합니다. NPC가 이기면 보상이 없으며, 무승부도 보상 없음. 수령 자원 상한을 초과하는 금은 약탈하지 않습니다.
- 자원 생산/분: 정방 레벨×10금, 농장×20식량, 병영×5예비군. 보유 장수 중 최대 정치(장비 포함)로 `1+정치/1000` 배율 적용. 자원 상한은 각각 10억입니다.
- Cron 없이 전투 시 양측 영지를 동기화합니다. 초 미만 시간을 보존하고 Decimal로 소수 자원을 적립합니다. 추후 접속·건설·정치 변화 API에서도 같은 트랜잭션 안에서 **변경 전** `syncResources`를 호출해야 합니다.
- 모든 병력·보상·로그 변경은 Serializable 트랜잭션 하나로 처리합니다. 충돌은 최대 3회 시도하고, 사용자+요청 키 유일 제약으로 중복 보상을 방지합니다.

## 검증과 Vercel 배포

```sh
npm run typecheck
npm test
npm run build
```

초기 SQL을 다시 생성할 때는 `npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script --output prisma/schema.generated.sql` 실행 후 `node scripts/assemble-schema.mjs`를 실행합니다. 이미 운영 중인 DB에 이 초기 SQL을 다시 적용하지 마세요.

로컬 스키마 테스트는 PGlite(PostgreSQL WASM)로 SQL 적용, CHECK 제약, RLS 차단을 검증합니다. 실제 Supabase 트랜잭션 충돌·동시 재전송 검증을 대신하지 않습니다. 설치 시 npm audit은 Prisma 개발 도구의 간접 의존성에서 high 4건을 보고했습니다(`deepmerge-ts`, `mysql2` 관련). 이 앱은 MySQL을 사용하지 않으며 Prisma 설정에 외부 사용자 입력을 전달하지 않습니다. 안정 버전 Prisma 업데이트 시 다시 확인해야 합니다.

Vercel 프로젝트의 Root Directory를 `apps/three-kingdoms-web`, Framework를 Next.js로 설정합니다. Build Command는 `npm run build`, Install Command는 `npm ci`입니다. `.env.example`의 환경 변수 4개를 서버 환경 변수로 등록하세요. `NEXT_PUBLIC_` 접두사로 DB 연결 문자열을 노출하면 안 됩니다. DB 초기 적용은 배포 전에 운영자가 한 번 실행하고 빌드마다 실행하지 않습니다. API는 Node.js 런타임이며 Prisma Client를 빌드 시 생성합니다.

실제 Supabase 연결을 통한 통합 테스트와 Vercel 배포에는 대상 프로젝트 및 환경 변수 설정이 필요합니다. 로컬 테스트/빌드 통과는 실제 배포 성공을 의미하지 않습니다.
