# GH ARCADE hub redesign

Applied frontend-design and design-taste-frontend. Variance 6, motion 3, density 5.

The old hub used a blue console frame and cartridge styling. The redesign presents a digital game storefront: a large featured cover with a separate title and launch button, a manual game picker, recent games, searchable genre-filtered catalog, and a distinct coming-soon section. Brand name, primary label, game IDs, availability rules and recent-game behavior are preserved.

Typography uses variable Pretendard subsets and a small licensed Gasoek One subset for the existing brand mark. Cobalt is reserved for actions, focus and selected controls. Neutral light and dark surfaces let each game cover retain its own palette. Media and controls use 6px corners; only avatars are circular. Hover motion is subtle and disabled with reduced-motion preferences. Theme follows the system by default and can be changed manually.

## Artwork

All 13 covers were produced individually with the built-in image generation tool, then resized and JPEG-compressed to 160×90 picker previews, 640×360 catalog thumbnails and 1280×720 feature covers in public/art/hub. Artwork is promotional illustration, not an in-game screenshot. Existing game artwork and game interfaces remain intact.

References: docs/screenshots/ghost-movers.png; public/art/fantasy-tactics/cover.png; public/art/three-kingdoms-card/valley.png; public/art/mole-3d.png.

Initial cover briefs: Ghost Movers — cozy nocturnal isometric apartment, friendly ghost, moving boxes and seven furniture abilities; Ten Seconds — clockwork laboratory, tiny explorer and three temporal echoes with plates, doors and laser puzzles; Fantasy Tactics — four adventurers on a maritime journey beyond the forest toward islands and a lighthouse; Three Kingdoms Card — collectible officers and a growing walled valley settlement.

## Validation

- Production build passed; hub tests: 5 passed. Diff whitespace check passed.
- Browser inspection at 1440, 1024, 768, 390 and 320 pixels: no horizontal overflow; desktop and mobile light/dark layouts verified.
- Verified search with no results, reset/focus restoration, genre filtering, manual recommendation selection, game entry/exit, recent games and non-clickable upcoming games.
- Production smoke test: Slither loads on selection; Jump entry and hub return also verified.
- Final mobile Lighthouse: performance 89, accessibility 100, best practices 100, SEO 92; LCP 3.2 seconds. Local preview measurement, not a hosted production benchmark.
- Cover dimensions reserve space; media failures display a game-name fallback. Reduced-motion preferences disable visual transitions and smooth scrolling.
- Images use separate small previews, card thumbnails and feature sizes; default feature is preloaded. All game modules load only on selection. Fonts use licensed variable subsets with display swap.
- Marketing-only elements such as logo walls, testimonials, marquee and FAQ are not applicable to this game catalog.

## Additional generation prompts

### echo-maze

Wide 16:9 game storefront key art for a 3D maze exploration game. A tiny charming golden five-pointed star adventurer with a face walks through a large tactile maze of mint-gray stone walls, viewed from a readable elevated isometric camera. A pale cyan exit portal is visible around several corners. A small bronze memory anchor and golden hourglass lie on the path, hinting at recalling a position and racing time. Indigo slate surroundings, cool moss and warm scattered time-crystal highlights. Premium simple clay diorama render, large legible maze geometry, single continuous world. No text, numbers, maps, interface, lettering, watermarks or brands.

### three-kingdoms

Wide 16:9 premium game cover art for a Three Kingdoms 3D hexagonal turn-based war strategy. Stylized miniature Chinese ancient soldiers with distinct armor and standards stand on a substantial hex-tiled terrain board containing mountains, rivers and a walled Chinese city. A mounted jade-armored long-bearded commander and navy-armored cavalry lead small infantry and archers, vermilion banners identify an opposing force. Tight cinematic three-quarter isometric view, clear hex geometry, no board icons or interface. Refined miniature sculpted 3D models, ink-gray mountains, muted jade fields, red cloth, brass armor. The subject is a tactical strategy board, not realistic gore or a generic epic battle. No typography, numbers, symbols labeling tiles, words, interface or watermarks.

### hachuping-slither

Wide 16:9 polished stylized 3D game key art for Slither arcade. Three cheerful segmented worms with large expressive googly eyes curl and race across a charcoal-blue hexagon-tiled arena toward tiny colorful glowing star food. Main yellow worm large in foreground, blue worm loops behind, pink worm across the other side. Smooth round spherical body segments, recognizable worm silhouettes, no fangs, no real snakes. Top-down-oblique game camera with strong readable curved paths. Restrained lighting in dark arena, saturated food pinpoints only, tactile premium toy rendering. No text, numbers, leaderboard, map, UI, watermarks, logos or typography. Single landscape scene.

### hachuping-dodge

Wide 16:9 premium illustrated indie survival-action game key art. A brave hooded ranger in dark teal-green armor with bright green eyes carries a chunky magical rune rifle, standing in a ruined mossy forest arena. Small hostile minion creatures surround the ranger in the distance; a few pale green rune projectiles arc toward them. Clearly readable hooded silhouette, readable weapon, a single energetic but composed battle moment. 3D stylized low-poly toy rendering with painterly atmosphere, muted jade, charcoal and warm sunlight. The rifle is fantasy rune-powered, not a realistic military weapon. No text, no score, numbers, HUD, typography, logos or watermark.

### hachuping-jump

Wide 16:9 polished arcade game storefront key art. A round expressive blue bird with a cream belly, tiny orange beak and lifted wings flies through an obstacle gap between floating grassy stone islands. A golden checkpoint ring hangs ahead, clouds and distant stacked islands create depth. A readable flight-path composition, bird large toward left-center, obstacles large toward right, blue sky and warm sun, soft tactile 3D miniature rendering. Whimsical but professionally composed, no video-game logo homage. No text, UI, numbers, scores, lettering, badges or watermarks. Single landscape composition.

### hachuping-whack-a-mole

Wide 16:9 polished 3D clay game cover art for Whack-a-Mole, matching the reference cute brown moles with yellow construction helmets and mint-green 3x3 hole board. New key art: close low three-quarter angle of the mint nine-hole board, three brown helmeted moles pop out with expressive playful faces. One yellow toy mallet is visible at the side to communicate tapping, no human hand. Cozy toy-like setting and high-quality tactile materials with crisp soft shadows, light cool background, golden helmets. Clearly preserve the character identity and board's nine-hole structure. No text, words, numbers, interface, timer, badges, branding or watermark.

### hachuping-memory

Wide 16:9 beautifully crafted clay toy game storefront key art for an upcoming animal memory game. A friendly fox, bear, rabbit and penguin appear on four large rounded square wooden memory tiles, arranged on a cool blue play table with a few face-down patterned tiles nearby. Character portraits should read instantly at thumbnail size, charming expressive faces, tasteful orange, soft blue and mint accents, clean dimensional rendering, soft shadows. No hands or people. No text, letters, numbers, logos, interface, badges or watermark. One continuous scene.

### hachuping-color-match

Wide 16:9 beautifully crafted toy game cover artwork for an upcoming color matching game. Four large tactile ceramic color disks (red, yellow, blue and green) arranged on a soft cool-gray play table, a smaller blue token hovering just above the matching blue disk to show the matching mechanic. Distinct confident geometry, restrained environment, crisp studio daylight and pleasant soft shadow. Clearly distinguish all four colors. Premium playful 3D object rendering, no faces or people. No typography, words, numbers, interface, badges, labels or watermark. Single landscape composition.

### hachuping-balloon

Wide 16:9 high-quality clay 3D game storefront key art for an upcoming balloon popping game for young children. A cheerful cluster of rounded coral, sky-blue, golden-yellow and mint balloons floats upward against a clear powder-blue sky with soft fluffy clouds. One coral balloon is popping into harmless colorful confetti, simple readable shapes, strings curve gently, clear airy composition. Toy-like tactility, warm natural daylight, no faces or people, professional children's game artwork. No text, words, numbers, interface, timer, typography, logos or watermark.

