/** Crops a centered, top-aligned square from the source (faces in portrait character photos
 * sit near the top), then draws it — avoiding the stretch/squish a naive drawImage would
 * cause on non-square character photos. Shared by every game that renders a player photo. */
export function drawImageTopCrop(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  dx: number,
  dy: number,
  size: number,
): void {
  const squareSize = Math.min(image.naturalWidth, image.naturalHeight);
  const sx = (image.naturalWidth - squareSize) / 2;
  ctx.drawImage(image, sx, 0, squareSize, squareSize, dx, dy, size, size);
}
