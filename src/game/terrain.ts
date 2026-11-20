export const ISLAND_RADIUS = 285;
export const WORLD_HALF_EXTENT = 420;
export const WATER_LEVEL = -1.2;

export type TerrainSurfaceKind =
  | 'water_bed'
  | 'sand'
  | 'meadow'
  | 'dirt_road'
  | 'town_pad'
  | 'cliff';

interface FlatPad {
  x: number;
  z: number;
  halfW: number;
  halfD: number;
  blend: number;
  height: number;
  kind: 'town_pad' | 'dirt_road';
}

// 8 Graded POI Foundations + Spawn Overlook across the expanded 570m-wide Chapter 1 Island
export const POI_PADS: FlatPad[] = [
  // 1. Tilted Crossing (central-west metropolis)
  { x: -24, z: -12, halfW: 26, halfD: 24, blend: 11, height: 3.2, kind: 'town_pad' },
  // 2. Pleasant Meadow (northwest suburban neighborhood)
  { x: -118, z: -110, halfW: 24, halfD: 22, blend: 10, height: 6.5, kind: 'town_pad' },
  // 3. Retail Ridge (eastern commercial town)
  { x: 124, z: 34, halfW: 24, halfD: 22, blend: 10, height: 5.5, kind: 'town_pad' },
  // 4. Anarchy Barn (west-southwest farmland)
  { x: -140, z: 68, halfW: 20, halfD: 18, blend: 10, height: 4.8, kind: 'town_pad' },
  // 5. Salty Crossroads (south-central houses)
  { x: 18, z: 92, halfW: 18, halfD: 18, blend: 9, height: 4.2, kind: 'town_pad' },
  // 6. Lonely Lookout (northeast pine ridge)
  { x: 128, z: -128, halfW: 16, halfD: 16, blend: 10, height: 11.5, kind: 'town_pad' },
  // 7. Sparkling Basin Island (central Loot-Lake-style cabin pad)
  { x: 34, z: -56, halfW: 10, halfD: 10, blend: 5, height: 0.9, kind: 'town_pad' },
  // 8. Coastal Depot (south-west industrial warehouses)
  { x: -96, z: 158, halfW: 18, halfD: 16, blend: 9, height: 3.6, kind: 'town_pad' },
  // 9. Spawn Overlook Clearing (southern trail ridge facing Tilted Crossing & Clock Tower)
  { x: -14, z: 134, halfW: 9, halfD: 9, blend: 7, height: 7.4, kind: 'dirt_road' },
];

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function hash2(ix: number, iz: number): number {
  const n = Math.sin(ix * 127.1 + iz * 311.7) * 43758.5453123;
  return n - Math.floor(n);
}

function valueNoise(x: number, z: number): number {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx);
  const uz = fz * fz * (3 - 2 * fz);

  const a = hash2(ix, iz);
  const b = hash2(ix + 1, iz);
  const c = hash2(ix, iz + 1);
  const d = hash2(ix + 1, iz + 1);

  return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz;
}

function fbm(x: number, z: number): number {
  let val = 0;
  let amp = 0.55;
  let freq = 1;
  for (let i = 0; i < 3; i++) {
    val += amp * (valueNoise(x * freq, z * freq) * 2 - 1);
    freq *= 2.07;
    amp *= 0.48;
  }
  return val;
}

function distToSegment(px: number, pz: number, ax: number, az: number, bx: number, bz: number): number {
  const vx = bx - ax;
  const vz = bz - az;
  const wx = px - ax;
  const wz = pz - az;
  const lenSq = vx * vx + vz * vz;
  const t = lenSq > 0 ? Math.max(0, Math.min(1, (wx * vx + wz * vz) / lenSq)) : 0;
  const cx = ax + vx * t;
  const cz = az + vz * t;
  return Math.hypot(px - cx, pz - cz);
}

export function getRoadDistance(x: number, z: number): number {
  const segments: Array<[number, number, number, number]> = [
    [-14, 134, 18, 92],     // Spawn -> Salty Crossroads
    [18, 92, -24, -12],     // Salty -> Tilted Crossing
    [-24, -12, -118, -110], // Tilted -> Pleasant Meadow
    [-24, -12, -140, 68],   // Tilted -> Anarchy Barn
    [-24, -12, 124, 34],    // Tilted -> Retail Ridge
    [124, 34, 128, -128],   // Retail -> Lonely Lookout
    [18, 92, -96, 158],     // Salty -> Coastal Depot
    [-140, 68, -96, 158],   // Anarchy -> Coastal Depot
  ];
  let best = Infinity;
  for (let i = 0; i < segments.length; i++) {
    const [ax, az, bx, bz] = segments[i];
    const d = distToSegment(x, z, ax, az, bx, bz);
    if (d < best) best = d;
  }
  return best;
}

export function getTerrainHeight(x: number, z: number): number {
  const r = Math.hypot(x, z);

  // Rolling Chapter 1 hills and dramatic high-ground ridges
  let h = 3.2 + fbm(x * 0.011 + 3.1, z * 0.011 - 1.7) * 8.4;
  h += fbm(x * 0.032 - 2.2, z * 0.032 + 4.4) * 2.1;

  // Northern & Eastern mountainous ridges
  h += Math.max(0, -z - 65) * 0.085;
  h += Math.max(0, x - 90) * 0.06;

  // Southern overlook crest around spawn
  const spawnDist = Math.hypot(x + 14, z - 134);
  h += Math.exp(-(spawnDist * spawnDist) / 900) * 4.2;

  // Sparkling Basin (Loot Lake style shallow lake around (34, -56))
  const lakeDist = Math.hypot(x - 34, z + 56);
  if (lakeDist < 42) {
    const lakeCarve = 1 - smoothstep(14, 42, lakeDist);
    h = h * (1 - lakeCarve) + (-2.4) * lakeCarve;
  }

  // Winding River connecting Lake to Southern Coast
  const riverCenterX = 56 + Math.sin(z * 0.028) * 18;
  const riverDist = Math.abs(x - riverCenterX);
  if (z > -45 && z < 260 && riverDist < 14) {
    const carve = 1 - smoothstep(4, 14, riverDist);
    h -= carve * 5.0;
  }

  // Island coastal cliffs & beaches beyond ISLAND_RADIUS
  if (r > ISLAND_RADIUS - 26) {
    const coastT = smoothstep(ISLAND_RADIUS - 26, ISLAND_RADIUS + 14, r);
    h = h * (1 - coastT) + (-4.5) * coastT;
  }

  // Blend in graded POI pads so multi-story buildings sit flush
  for (let i = 0; i < POI_PADS.length; i++) {
    const pad = POI_PADS[i];
    const dx = Math.max(0, Math.abs(x - pad.x) - pad.halfW);
    const dz = Math.max(0, Math.abs(z - pad.z) - pad.halfD);
    const dist = Math.hypot(dx, dz);
    if (dist < pad.blend) {
      const w = 1 - smoothstep(0, pad.blend, dist);
      h = h * (1 - w) + pad.height * w;
    }
  }

  return h;
}

export function getTerrainSlope(x: number, z: number): number {
  const e = 1.0;
  const hx = (getTerrainHeight(x + e, z) - getTerrainHeight(x - e, z)) / (2 * e);
  const hz = (getTerrainHeight(x, z + e) - getTerrainHeight(x, z - e)) / (2 * e);
  return Math.hypot(hx, hz);
}

export function getSurfaceKind(x: number, z: number, y?: number): TerrainSurfaceKind {
  const h = y ?? getTerrainHeight(x, z);
  if (h < WATER_LEVEL + 0.15) return 'water_bed';
  if (h < WATER_LEVEL + 1.05 && (Math.hypot(x, z) > ISLAND_RADIUS - 32 || Math.hypot(x - 34, z + 56) < 44)) {
    return 'sand';
  }

  for (let i = 0; i < POI_PADS.length; i++) {
    const pad = POI_PADS[i];
    if (Math.abs(x - pad.x) <= pad.halfW && Math.abs(z - pad.z) <= pad.halfD) {
      return pad.kind;
    }
  }

  if (getRoadDistance(x, z) < 3.4 && Math.hypot(x, z) < ISLAND_RADIUS - 22) {
    return 'dirt_road';
  }

  if (getTerrainSlope(x, z) > 0.54) return 'cliff';
  return 'meadow';
}

export function getSurfaceRGB(x: number, z: number, y: number): [number, number, number] {
  const kind = getSurfaceKind(x, z, y);
  const variation = (fbm(x * 0.05, z * 0.05) + 1) * 0.5;

  switch (kind) {
    case 'water_bed':
      return [0.11, 0.25, 0.32];
    case 'sand':
      return [0.69 + variation * 0.05, 0.59 + variation * 0.04, 0.35];
    case 'dirt_road':
      return [0.44 + variation * 0.05, 0.31 + variation * 0.04, 0.18 + variation * 0.03];
    case 'town_pad':
      return [0.30 + variation * 0.04, 0.33 + variation * 0.03, 0.32 + variation * 0.03];
    case 'cliff':
      return [0.27 + variation * 0.06, 0.29 + variation * 0.06, 0.34 + variation * 0.05];
    case 'meadow':
    default: {
      // Iconic Chapter 1 Season 1 saturated spring emerald & olive grass
      const elevBoost = Math.max(0, Math.min(0.08, y * 0.005));
      return [
        0.13 + variation * 0.07 + elevBoost * 0.35,
        0.39 + variation * 0.11 + elevBoost * 0.25,
        0.08 + variation * 0.03,
      ];
    }
  }
}
