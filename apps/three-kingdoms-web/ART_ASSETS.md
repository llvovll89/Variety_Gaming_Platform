# 추가 장수 초상

- 도구: 내장 `image_gen` (CLI 사용 안 함).
- 프로젝트 파일: `public/art/heroes-expanded.png` (1145×1374 PNG).
- 기존 `public/art/heroes.png`의 6명은 유지. 새 파일에는 `additionalHeroes.ts` 순서로 30명을 배치했습니다.
- 표시: `lib/heroPortrait.ts`에서 실제 셀 경계에 맞춰 CSS 배경 좌표를 적용합니다. 3D 모형은 사용하지 않습니다.
- 생성 일러스트이며 역사 인물의 실제 외모를 재현한 자료가 아닙니다.

## 최종 생성 프롬프트

Create one production game portrait sprite atlas, historical-scene / painterly semi-realistic Three Kingdoms collectible strategy game. EXACTLY 5 columns by 6 rows = 30 equally sized SQUARE portrait cells, aligned to edges with ZERO gutters, ZERO borders, NO text or labels. Overall image aspect ratio 5:6. Every cell is one distinct Chinese adult character bust, face centered near upper middle, entire head and shoulders contained strictly within its own cell. Premium painted illustration, detailed silk and lamellar armor, dark navy smoky backgrounds with muted warm gold backlighting. NOT 3D renders. Strong distinct faces, ages, headgear, costumes, gender and silhouettes. No duplication. Exact reading order left-to-right, top-to-bottom:
Row 1: Liu Bei benevolent middle-aged lord green gold robes and small crown; Zhang Fei burly roaring warrior dark beard black armor snake spear; Ma Chao handsome young warrior white armor lion helmet; Huang Zhong elderly white-bearded archer bronze armor; Pang Tong eccentric weathered scholar humble brown robe black headcloth.
Row 2: Jiang Wei young composed general teal armor spear; Wei Yan stern red-faced veteran green iron helmet; Huang Yueying adult woman inventor ochre robes wooden mechanical device; Sima Yi older narrow-eyed strategist black violet robe tall black scholar crown; Xiahou Dun rugged armored general black eyepatch covering LEFT eye.
Row 3: Xiahou Yuan bearded sturdy archer blue armor; Zhang Liao stern blue silver armored cavalry commander; Xu Chu broad powerful round-faced warrior heavy black armor; Dian Wei bald muscular rugged warrior holding paired short halberds; Xu Huang mature general white headwrap steel axe.
Row 4: Zhang He elegant angular-faced officer ornate blue plume helmet; Xun Yu refined dignified court scholar blue silk and ivory scroll; Guo Jia slim pale young strategist dark blue robe; Zhen Ji adult noble woman silver-blue silk and pearl hairpins; Sun Quan young auburn-bearded lord purple gold robe.
Row 5: Sun Ce spirited young commander crimson armor; Zhou Yu handsome clean-shaven general red silk bronze armor; Lu Xun youthful composed scholar-general white crimson robe; Lu Meng mature determined general red-black armor; Gan Ning fierce smiling pirate-warrior red headband bells chains and open brocade collar.
Row 6: Huang Gai older gray-bearded commander weathered red heavy armor; Da Qiao adult elegant woman peach ivory silk floral hairpin; Xiao Qiao adult cheerful woman pale pink silk butterfly hairpin distinctly different face; Diao Chan adult graceful woman violet silk crescent gold hair ornaments; Yuan Shao proud middle-aged noble lord purple gold ornate crown trimmed beard.
These are 30 different illustrated portraits in one sprite atlas used by CSS cropping. Exact 5x6 grid is mandatory. No typography, no UI, no watermark, no characters crossing cell boundaries.
