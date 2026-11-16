# Kitchen Fighter generated assets

Created with the built-in ImageGen tool. Runtime uses local files only.

- `kitchen-realistic.jpg`: photorealistic kitchen background.
- `fighters-realistic-cutout.webp`: transparent default fighter atlas; left male, right female. Alpha verified (corner and center background alpha = 0).
- `fighters-realistic.webp`: original generated atlas retained as the cutout edit reference.

Shipped as JPEG (background) and WebP with alpha (fighters) to stay under the 1MB per-file limit for phones. The original PNGs are kept outside the repository.

## Background prompt

Use case: photorealistic-natural. Asset type: background plate for a humorous 2.5D side-view fighting game. Photorealistic cinematic Korean restaurant kitchen at night, eye-level wide camera, stainless steel back counter and brushed metal range hood, tiled charcoal backsplash, practical warm pendant lights, a pot with faint steam, wood cabinets and worn concrete floor. Camera straight onto back wall, clear uncluttered fighting floor filling lower 40 percent of frame. No island or counters in the foreground, no people, no characters, no weapons, no text or logos. Balanced natural realistic lighting, visible material grain and believable reflections, high detail, no cartoon, no vector illustration. Landscape 16:9 composition. Floor contact for characters at 84 percent of image height; back counter behind characters. This is an actual background asset, no UI, no screenshot.

## Default fighters prompt

Asset type: transparent default character atlas for realistic 2.5D fighting game. Two separate photorealistic full-body adult Korean restaurant kitchen competitors, each fully visible head to shoes, standing at equal scale side by side with generous clear separation. LEFT half: adult Korean male chef wearing charcoal t-shirt, orange brown canvas apron, dark trousers and realistic leather sneakers, in a boxing stance facing to the right, arms held at chest height with right hand loosely holding nothing. RIGHT half: adult Korean female chef wearing slate blue work shirt, dark blue denim apron, dark trousers and leather sneakers, in fighting stance facing left, arms at chest level holding nothing. Human realistic anatomy and proportions, expressive determined slightly humorous faces, real cloth folds, studio photography, warm kitchen lighting from upper left, crisp natural skin texture. No cartoon, no caricature, no objects or weapons, no captions, no ground plane, no cast shadow. Genuinely transparent background. Landscape image atlas, each person centered in their own half, ample margin on all sides.

## Cutout edit prompt

Edit target: this two-person character atlas. Remove the entire black and brown studio background and all glow/ground/shadows behind the people. Make every background pixel genuinely transparent (alpha zero), not black, not a checkerboard drawn into the image. Preserve both photographed people exactly, including both full bodies, faces, clothes, shoes, proportions, pose, their current pixel placement and canvas dimensions. Keep two separate non-overlapping people, one on each half. No text. This is a transparent cutout sprite atlas, not a studio photograph.
