import * as THREE from 'three';

export interface ProceduralTexturePack {
  woodMap: THREE.CanvasTexture;
  woodBump: THREE.CanvasTexture;
  brickMap: THREE.CanvasTexture;
  brickBump: THREE.CanvasTexture;
  metalMap: THREE.CanvasTexture;
  metalBump: THREE.CanvasTexture;
  terrainDetailMap: THREE.CanvasTexture;
  waterMap: THREE.CanvasTexture;
  stormMap: THREE.CanvasTexture;
  shadowDiscMap: THREE.CanvasTexture;
  dispose: () => void;
}

function makeCanvas(size = 256): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  return [canvas, ctx];
}

function finalizeTexture(
  canvas: HTMLCanvasElement,
  isColor: boolean,
  maxAnisotropy: number,
  repeatX = 1,
  repeatY = repeatX,
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

export function createProceduralTexturePack(maxAnisotropy: number): ProceduralTexturePack {
  // 1. Stylized Chapter 1 Wood Planks
  const [woodC, wCtx] = makeCanvas(256);
  const [woodBC, wbCtx] = makeCanvas(256);
  wCtx.fillStyle = '#bd7f45';
  wCtx.fillRect(0, 0, 256, 256);
  wbCtx.fillStyle = '#808080';
  wbCtx.fillRect(0, 0, 256, 256);

  const plankCount = 6;
  const plankH = 256 / plankCount;
  for (let i = 0; i < plankCount; i++) {
    const y = i * plankH;
    wCtx.fillStyle = i % 2 === 0 ? '#c98a4b' : '#b2743b';
    wCtx.fillRect(0, y + 3, 256, plankH - 4);
    // Warm top bevel highlight
    wCtx.fillStyle = 'rgba(255, 224, 178, 0.24)';
    wCtx.fillRect(0, y + 3, 256, 3);
    // Plank seam
    wCtx.fillStyle = '#623819';
    wCtx.fillRect(0, y, 256, 3);
    wbCtx.fillStyle = '#252525';
    wbCtx.fillRect(0, y, 256, 3);

    wCtx.fillStyle = 'rgba(92, 52, 20, 0.20)';
    for (let g = 0; g < 10; g++) {
      const gx = (i * 53 + g * 29) % 240;
      const gy = y + 8 + ((g * 7) % (plankH - 14));
      wCtx.fillRect(gx, gy, 28 + (g % 3) * 14, 2);
    }
    wCtx.fillStyle = '#3f2e21';
    wCtx.fillRect(14, y + 8, 4, 4);
    wCtx.fillRect(238, y + plankH - 12, 4, 4);
  }

  // 2. Stylized Terracotta Brick Masonry
  const [brickC, bCtx] = makeCanvas(256);
  const [brickBC, bbCtx] = makeCanvas(256);
  bCtx.fillStyle = '#9aa3ad';
  bCtx.fillRect(0, 0, 256, 256);
  bbCtx.fillStyle = '#353535';
  bbCtx.fillRect(0, 0, 256, 256);

  const rows = 8;
  const cols = 4;
  const bw = 256 / cols;
  const bh = 256 / rows;
  const brickPalette = ['#b85440', '#c8604a', '#a84a38', '#be5a46'];
  for (let r = 0; r < rows; r++) {
    const offset = (r % 2) * (bw * 0.5);
    for (let c = -1; c <= cols; c++) {
      const bx = c * bw + offset;
      const by = r * bh;
      bCtx.fillStyle = brickPalette[(r * 3 + c + 4) % brickPalette.length];
      bCtx.fillRect(bx + 3, by + 3, bw - 6, bh - 6);
      bCtx.fillStyle = 'rgba(255, 220, 200, 0.16)';
      bCtx.fillRect(bx + 3, by + 3, bw - 6, 3);
      bbCtx.fillStyle = '#cbcbcb';
      bbCtx.fillRect(bx + 3, by + 3, bw - 6, bh - 6);
    }
  }

  // 3. Corrugated / Riveted Industrial Metal
  const [metalC, mCtx] = makeCanvas(256);
  const [metalBC, mbCtx] = makeCanvas(256);
  mCtx.fillStyle = '#5a6f86';
  mCtx.fillRect(0, 0, 256, 256);
  mbCtx.fillStyle = '#808080';
  mbCtx.fillRect(0, 0, 256, 256);

  for (let x = 0; x < 256; x += 16) {
    mCtx.fillStyle = x % 32 === 0 ? '#6e849c' : '#4b5f74';
    mCtx.fillRect(x, 0, 8, 256);
    mbCtx.fillStyle = x % 32 === 0 ? '#c0c0c0' : '#505050';
    mbCtx.fillRect(x, 0, 8, 256);
  }
  mCtx.strokeStyle = '#364556';
  mCtx.lineWidth = 4;
  mCtx.strokeRect(2, 2, 252, 252);
  mCtx.fillStyle = '#a8bdd4';
  for (let i = 16; i < 256; i += 32) {
    mCtx.fillRect(i, 10, 4, 4);
    mCtx.fillRect(i, 242, 4, 4);
  }

  // 4. Stylized Fortnite Grass & Ground Micro-Detail (multiplied over vertexColors)
  const [terrC, tCtx] = makeCanvas(256);
  tCtx.fillStyle = '#ececec';
  tCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 360; i++) {
    const gx = (i * 73) % 256;
    const gy = (i * 139) % 256;
    tCtx.fillStyle = i % 3 === 0 ? 'rgba(255,255,255,0.28)' : 'rgba(65, 95, 50, 0.16)';
    tCtx.fillRect(gx, gy, 3, 7);
    if (i % 5 === 0) {
      tCtx.fillRect(gx + 2, gy + 2, 2, 5);
    }
  }

  // 5. Stylized Water Caustic Shimmer
  const [watC, watCtx] = makeCanvas(256);
  watCtx.fillStyle = '#0ea5e9';
  watCtx.fillRect(0, 0, 256, 256);
  watCtx.strokeStyle = 'rgba(186, 230, 253, 0.34)';
  watCtx.lineWidth = 3;
  for (let y = 16; y < 256; y += 32) {
    watCtx.beginPath();
    for (let x = 0; x <= 256; x += 16) {
      const wy = y + Math.sin((x / 256) * Math.PI * 4 + y) * 5;
      if (x === 0) watCtx.moveTo(x, wy);
      else watCtx.lineTo(x, wy);
    }
    watCtx.stroke();
  }

  // 6. Seamless Storm Energy Swirl
  const [stormC, sCtx] = makeCanvas(256);
  const grad = sCtx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, 'rgba(139, 92, 246, 0.03)');
  grad.addColorStop(0.55, 'rgba(147, 51, 234, 0.22)');
  grad.addColorStop(1, 'rgba(109, 40, 217, 0.42)');
  sCtx.fillStyle = grad;
  sCtx.fillRect(0, 0, 256, 256);
  sCtx.strokeStyle = 'rgba(221, 214, 254, 0.28)';
  sCtx.lineWidth = 3;
  for (let row = 28; row < 256; row += 42) {
    sCtx.beginPath();
    for (let x = 0; x <= 256; x += 8) {
      const y = row + Math.sin((x / 256) * Math.PI * 2) * 10;
      if (x === 0) sCtx.moveTo(x, y);
      else sCtx.lineTo(x, y);
    }
    sCtx.stroke();
  }

  // 7. Soft Radial Contact Shadow Disc
  const [shC, shCtx] = makeCanvas(128);
  const rGrad = shCtx.createRadialGradient(64, 64, 6, 64, 64, 60);
  rGrad.addColorStop(0, 'rgba(10, 14, 20, 0.65)');
  rGrad.addColorStop(0.6, 'rgba(10, 14, 20, 0.25)');
  rGrad.addColorStop(1, 'rgba(10, 14, 20, 0)');
  shCtx.fillStyle = rGrad;
  shCtx.fillRect(0, 0, 128, 128);

  const woodMap = finalizeTexture(woodC, true, maxAnisotropy);
  const woodBump = finalizeTexture(woodBC, false, maxAnisotropy);
  const brickMap = finalizeTexture(brickC, true, maxAnisotropy);
  const brickBump = finalizeTexture(brickBC, false, maxAnisotropy);
  const metalMap = finalizeTexture(metalC, true, maxAnisotropy);
  const metalBump = finalizeTexture(metalBC, false, maxAnisotropy);
  const terrainDetailMap = finalizeTexture(terrC, true, maxAnisotropy, 64, 64);
  const waterMap = finalizeTexture(watC, true, maxAnisotropy, 36, 36);
  const stormMap = finalizeTexture(stormC, true, maxAnisotropy, 8, 1);
  const shadowDiscMap = finalizeTexture(shC, true, 1);
  shadowDiscMap.wrapS = THREE.ClampToEdgeWrapping;
  shadowDiscMap.wrapT = THREE.ClampToEdgeWrapping;

  return {
    woodMap,
    woodBump,
    brickMap,
    brickBump,
    metalMap,
    metalBump,
    terrainDetailMap,
    waterMap,
    stormMap,
    shadowDiscMap,
    dispose: () => {
      woodMap.dispose();
      woodBump.dispose();
      brickMap.dispose();
      brickBump.dispose();
      metalMap.dispose();
      metalBump.dispose();
      terrainDetailMap.dispose();
      waterMap.dispose();
      stormMap.dispose();
      shadowDiscMap.dispose();
    },
  };
}
