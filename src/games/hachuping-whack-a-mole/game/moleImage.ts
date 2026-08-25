/**
 * SVG-based mole icon. Returns a data URL that can be used with Canvas drawImage.
 */

const MOLE_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <!-- Mole body -->
  <circle cx="50" cy="50" r="35" fill="#8B4513" stroke="#654321" stroke-width="2"/>
  
  <!-- Left ear -->
  <circle cx="25" cy="20" r="10" fill="#8B4513" stroke="#654321" stroke-width="1.5"/>
  
  <!-- Right ear -->
  <circle cx="75" cy="20" r="10" fill="#8B4513" stroke="#654321" stroke-width="1.5"/>
  
  <!-- Left eye white -->
  <circle cx="35" cy="40" r="8" fill="white"/>
  <!-- Left eye pupil -->
  <circle cx="35" cy="40" r="5" fill="black"/>
  <!-- Left eye shine -->
  <circle cx="37" cy="38" r="2" fill="white"/>
  
  <!-- Right eye white -->
  <circle cx="65" cy="40" r="8" fill="white"/>
  <!-- Right eye pupil -->
  <circle cx="65" cy="40" r="5" fill="black"/>
  <!-- Right eye shine -->
  <circle cx="67" cy="38" r="2" fill="white"/>
  
  <!-- Nose -->
  <circle cx="50" cy="55" r="5" fill="#654321"/>
  
  <!-- Mouth -->
  <path d="M 50 60 Q 45 65 40 63" stroke="#654321" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <path d="M 50 60 Q 55 65 60 63" stroke="#654321" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  
  <!-- Cheeks -->
  <circle cx="25" cy="48" r="6" fill="#D2691E" opacity="0.3"/>
  <circle cx="75" cy="48" r="6" fill="#D2691E" opacity="0.3"/>
</svg>
`;

let moleImage: HTMLImageElement | null = null;

export async function getMoleImage(): Promise<HTMLImageElement> {
  if (moleImage) {
    return moleImage;
  }

  moleImage = new Image();
  const svg = new Blob([MOLE_SVG], { type: "image/svg+xml" });
  const url = URL.createObjectURL(svg);
  
  return new Promise((resolve, reject) => {
    moleImage!.onload = () => resolve(moleImage!);
    moleImage!.onerror = reject;
    moleImage!.src = url;
  });
}

export function drawMoleImage(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  alpha: number = 1,
): void {
  if (!moleImage || !moleImage.complete) {
    // Fallback to drawing if image not loaded
    return;
  }

  ctx.globalAlpha = alpha;
  ctx.drawImage(moleImage, x - size / 2, y - size / 2, size, size);
  ctx.globalAlpha = 1;
}
