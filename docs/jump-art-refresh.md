# Jump cover-matched gameplay refresh

Design read: a casual flying game for desktop and touch users, with the bright animated-film bird and floating-island world from the existing hub cover. Native Canvas 2D gameplay is preserved. DESIGN_VARIANCE 6, MOTION_INTENSITY 4, VISUAL_DENSITY 4. Colors: azure #71b8ed, ink #28445c, gold #f4cb72, grass #96b55d, rock #ad9673. Existing Pretendard and menu structure remain.

The same transparent blue-bird sprite is used in the character picker, title scene and gameplay. Existing uploaded photos remain usable in a blue character shell. The background now shows floating islands and waterfalls, with existing stage palettes applied as subtle tints. Native obstacle models use rock facets, grass and trailing greenery while retaining their shared collision silhouettes. Crystal, cloud, mushroom, flower, toy and castle shapes preserve their stage identities. Golden rings surround collectible stars; scoring remains unchanged.

Assets generated individually using the built-in image generation tool, referencing public/art/hub/hachuping-jump-large.jpg. Original generated files are preserved outside the repo. Final optimized assets: public/art/jump/blue-bird.png (512px wide, alpha preserved), public/art/jump/floating-islands.jpg (1536px wide).

The outer gameplay backdrop covers the viewport directly from the panoramic image, rather than enlarging the narrow portrait crop. At 1440×1000 it uses 1244 source pixels across instead of 494; the central playfield keeps its existing crop and motion. Stage tinting and the asset-loading fallback remain available.

Validation: 14 jump tests pass, covering collisions, rewards, pause, all six stages and checkpoints. Production build passes. Browser screenshots use the actual renderer with a frozen development fixture to inspect the bird, background and obstacle at desktop/mobile sizes. The fixture changes no production behavior or saved scores. Original physics, hitbox, tap and Space inputs are unchanged. Reduced motion disables backdrop drift, sprite squash and ring pulse.

## Generation prompts

### bird

Use case: stylized-concept. Production game sprite, matching the BLUE BIRD in the reference cover. One single charming round fluffy blue bird flying toward the RIGHT in clean side three-quarter view: vivid azure blue feathers and swept crest, cream belly, big expressive brown eye, small orange beak and feet, dark blue tail feathers. Wings spread but tucked sufficiently to form a compact flying silhouette. Entire bird visible, centered and tightly framed with 8 percent margin, no detached pieces. Premium animated film 3D look, soft sunny lighting, crisp silhouette readable at 55px tall. Truly transparent background. No ground, scenery, text, rings, shadows outside the bird, border, logo or UI. This is an actual gameplay character sprite, not a poster.

### sky

Use case: stylized-concept. Production GAME BACKGROUND based on the floating islands and waterfall world in the reference cover, without the bird or ring. Wide panoramic 16:9 composition of a bright turquoise sky, enormous distant layered floating sandstone islands topped with green grass, vines, little trees and flowers; tall thin waterfalls cascade down through fluffy clouds into a distant azure sea. Premium animated-film stylized 3D, believable rock texture and lush soft foliage, warm afternoon sunshine upper right. Keep the center and upper half mostly open sky with sparse gentle clouds so a flying game character and moving obstacles read clearly. Islands cluster along the lower third and distant left/right edges. NO large foreground island, characters, birds, gold ring, text, number, logo, UI, frame, hard vignette. Fully opaque background.
