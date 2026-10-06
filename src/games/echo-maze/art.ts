import * as T from 'three';

/** Weathered capstones use broad cracks instead of miniature brick courses. */
export function capstone(): T.CanvasTexture {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#818e94'; ctx.fillRect(0, 0, 128, 128);
  let seed = 67;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  for (let i = 0; i < 700; i++) {
    ctx.fillStyle = i % 2 ? '#d9dfdb18' : '#24353c18';
    ctx.fillRect(random() * 128, random() * 128, 1 + random() * 5, 1 + random() * 3);
  }
  ctx.strokeStyle = '#3b50596b'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(0, 48); ctx.lineTo(26, 53); ctx.lineTo(39, 42); ctx.lineTo(53, 68); ctx.lineTo(65, 82); ctx.lineTo(73, 128); ctx.stroke();
  ctx.strokeStyle = '#c3cec68a'; ctx.strokeRect(2, 2, 124, 124);
  ctx.fillStyle = '#526d434d';
  for (let i = 0; i < 35; i++) { ctx.beginPath(); ctx.ellipse(random() * 128, 124 - random() * 8, 2 + random() * 9, 2 + random() * 3, 0, 0, Math.PI * 2); ctx.fill(); }
  const texture = new T.CanvasTexture(canvas); texture.colorSpace = T.SRGBColorSpace; return texture;
}

/** Deterministic masonry textures shared by instanced walls and floor tiles. */
export function masonry(floor = false): T.CanvasTexture {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = floor ? '#5c6569' : '#515f6b'; ctx.fillRect(0, 0, 256, 256);
  let seed = floor ? 77 : 131;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const rows = floor ? 2 : 4, rowHeight = 256 / rows;
  for (let row = 0; row < rows; row++) for (let col = -1; col < 4; col++) {
    const x = col * 85 + (row % 2 ? 42 : 0), y = row * rowHeight, grey = 80 + Math.floor(random() * 30);
    ctx.fillStyle = `rgb(${grey},${grey + 9},${grey + 14})`; ctx.fillRect(x + 2, y + 2, 81, rowHeight - 4);
    ctx.strokeStyle = '#b6bcb529'; ctx.strokeRect(x + 3, y + 3, 79, rowHeight - 6);
    for (let i = 0; i < 38; i++) { ctx.fillStyle = random() > .5 ? '#f0e3c515' : '#10182428'; ctx.fillRect(x + random() * 80, y + random() * rowHeight, 1 + random() * 7, 1 + random() * 2); }
    if (random() > .7) { ctx.strokeStyle = '#1d293859'; ctx.beginPath(); ctx.moveTo(x + 13, y + 6); ctx.lineTo(x + 25, y + 18); ctx.lineTo(x + 20, y + rowHeight - 6); ctx.stroke(); }
    if (random() > .6) { ctx.fillStyle = '#637d3c4a'; for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.ellipse(x + random() * 80, y + rowHeight - 3, 2 + random() * 9, 1 + random() * 3, 0, 0, Math.PI * 2); ctx.fill(); } }
  }
  const texture = new T.CanvasTexture(canvas); texture.colorSpace = T.SRGBColorSpace; texture.anisotropy = 4; return texture;
}

export function starGeometry(): T.ExtrudeGeometry {
  const shape = new T.Shape();
  for (let i = 0; i < 10; i++) { const angle = Math.PI / 2 + i * Math.PI / 5, radius = i % 2 ? .21 : .43; const x = Math.cos(angle) * radius, y = Math.sin(angle) * radius; if (!i) shape.moveTo(x, y); else shape.lineTo(x, y); }
  shape.closePath();
  const geometry = new T.ExtrudeGeometry(shape, { depth: .16, bevelEnabled: true, bevelSize: .065, bevelThickness: .075, bevelSegments: 3, steps: 1, curveSegments: 8 }); geometry.translate(0, 0, -.08); return geometry;
}

export function stoneArch(material: T.Material): T.Group {
  const group = new T.Group();
  for (const side of [-1, 1]) for (let i = 0; i < 3; i++) { const block = new T.Mesh(new T.BoxGeometry(.22, .25, .3), material); block.position.set(side * .44, .14 + i * .25, 0); block.castShadow = true; group.add(block); }
  for (let i = 0; i < 9; i++) { const angle = i / 8 * Math.PI, block = new T.Mesh(new T.BoxGeometry(.21, .25, .3), material); block.position.set(Math.cos(angle) * .44, .72 + Math.sin(angle) * .44, 0); block.rotation.z = angle - Math.PI / 2; block.castShadow = true; group.add(block); }
  return group;
}
