import type {
  BuildPieceType,
  ChestNode,
  LootPickup,
  MaterialType,
  StructurePiece,
  StructureVariant,
  WeaponId,
  WeaponRarity,
} from './types';
import {
  getRoadDistance,
  getSurfaceKind,
  getTerrainHeight,
  getTerrainSlope,
  ISLAND_RADIUS,
} from './terrain';

export const GRID_SIZE = 4.0;
export const WALL_HEIGHT = 3.2;

export const MATERIAL_MAX_HP: Record<MaterialType, number> = {
  wood: 150,
  brick: 240,
  metal: 360,
};

export interface SpawnPoint {
  x: number;
  y: number;
  z: number;
  yaw: number;
}

export const PLAYER_SPAWN: SpawnPoint = {
  x: -14,
  y: getTerrainHeight(-14, 134),
  z: 134,
  yaw: 0.08, // Facing north-northwest toward Salty Crossroads & Tilted Crossing Clock Tower
};

export function createSeededRng(seed: number): () => number {
  let s = (seed >>> 0) || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * Snap a player's build placement in front of them onto the Fortnite 4m x 3.2m grid.
 */
export function snapToBuildGrid(
  playerX: number,
  playerY: number,
  playerZ: number,
  yaw: number,
  pieceType: BuildPieceType,
  extraRotQuarter = 0,
): { x: number; y: number; z: number; rotY: number } {
  const fx = -Math.sin(yaw);
  const fz = -Math.cos(yaw);
  const targetX = playerX + fx * 3.4;
  const targetZ = playerZ + fz * 3.4;

  const cellX = Math.round(targetX / GRID_SIZE) * GRID_SIZE;
  const cellZ = Math.round(targetZ / GRID_SIZE) * GRID_SIZE;
  const groundY = getTerrainHeight(cellX, cellZ);
  const baseLevel = Math.max(
    groundY,
    Math.floor((playerY + 0.6) / WALL_HEIGHT) * WALL_HEIGHT + (groundY % WALL_HEIGHT),
  );
  const snappedY =
    Math.abs(playerY - groundY) < 1.2
      ? groundY
      : groundY + Math.round((playerY - groundY) / WALL_HEIGHT) * WALL_HEIGHT;

  const cardinalIdx = ((Math.round(-yaw / (Math.PI / 2)) % 4) + 4) % 4;
  const rotY = ((cardinalIdx + extraRotQuarter) % 4) * (Math.PI / 2);

  if (pieceType === 'wall') {
    const edgeOffset = GRID_SIZE * 0.5;
    let wx = cellX;
    let wz = cellZ;
    let wallRot = (cardinalIdx % 2 === 0 ? 0 : Math.PI / 2) + (extraRotQuarter % 2) * (Math.PI / 2);
    if (Math.abs(fx) > Math.abs(fz)) {
      wx = Math.round((playerX + fx * 2.4) / GRID_SIZE) * GRID_SIZE + Math.sign(fx) * edgeOffset;
      wz = Math.round(targetZ / GRID_SIZE) * GRID_SIZE;
      wallRot = Math.PI / 2;
    } else {
      wx = Math.round(targetX / GRID_SIZE) * GRID_SIZE;
      wz = Math.round((playerZ + fz * 2.4) / GRID_SIZE) * GRID_SIZE + Math.sign(fz) * edgeOffset;
      wallRot = 0;
    }
    return {
      x: wx,
      y: Math.max(getTerrainHeight(wx, wz), snappedY),
      z: wz,
      rotY: wallRot,
    };
  }

  return {
    x: cellX,
    y: Math.max(groundY, baseLevel > snappedY ? snappedY : groundY),
    z: cellZ,
    rotY,
  };
}

export interface GeneratedWorldData {
  structures: StructurePiece[];
  chests: ChestNode[];
  loot: LootPickup[];
}

export function generateIslandWorld(seed = 1): GeneratedWorldData {
  const rand = createSeededRng(seed);
  const structures: StructurePiece[] = [];
  const chests: ChestNode[] = [];
  const loot: LootPickup[] = [];
  let seq = 1;

  const pushStruct = (
    kind: BuildPieceType,
    variant: StructureVariant,
    material: MaterialType,
    x: number,
    y: number,
    z: number,
    rotY: number,
    opts?: {
      isTree?: boolean;
      isRock?: boolean;
      isClockTower?: boolean;
      scale?: number;
      hpOverride?: number;
    },
  ) => {
    const maxHp = opts?.hpOverride ?? MATERIAL_MAX_HP[material];
    structures.push({
      id: `st_${seq++}`,
      kind,
      variant,
      material,
      x,
      y,
      z,
      rotY,
      hp: maxHp,
      maxHp,
      isPlayerBuilt: false,
      isTree: opts?.isTree,
      isRock: opts?.isRock,
      scale: opts?.scale ?? 1,
    });
  };

  const buildModularHouse = (
    cx: number,
    cz: number,
    cellsX: number,
    cellsZ: number,
    floors: number,
    wallMat: MaterialType,
    floorMat: MaterialType,
    doorSide: 'north' | 'south' | 'east' | 'west',
    withRamp = true,
  ) => {
    const baseY = getTerrainHeight(cx, cz);
    const startX = cx - ((cellsX - 1) * GRID_SIZE) / 2;
    const startZ = cz - ((cellsZ - 1) * GRID_SIZE) / 2;

    for (let fl = 0; fl < floors; fl++) {
      const fy = baseY + fl * WALL_HEIGHT;

      for (let ix = 0; ix < cellsX; ix++) {
        for (let iz = 0; iz < cellsZ; iz++) {
          const px = startX + ix * GRID_SIZE;
          const pz = startZ + iz * GRID_SIZE;
          if (fl > 0 && withRamp && ix === 0 && iz === 0) continue;
          pushStruct('floor', 'solid', floorMat, px, fy, pz, 0);
        }
      }

      if (withRamp && fl < floors - 1) {
        pushStruct('ramp', 'solid', 'wood', startX, fy, startZ, 0);
      }

      for (let ix = 0; ix < cellsX; ix++) {
        const px = startX + ix * GRID_SIZE;
        const northZ = startZ - GRID_SIZE / 2;
        const northVar: StructureVariant =
          fl === 0 && doorSide === 'north' && ix === Math.floor(cellsX / 2) ? 'doorway' : 'window';
        pushStruct('wall', northVar, wallMat, px, fy, northZ, 0);

        const southZ = startZ + (cellsZ - 1) * GRID_SIZE + GRID_SIZE / 2;
        const southVar: StructureVariant =
          fl === 0 && doorSide === 'south' && ix === Math.floor(cellsX / 2) ? 'doorway' : 'window';
        pushStruct('wall', southVar, wallMat, px, fy, southZ, 0);
      }

      for (let iz = 0; iz < cellsZ; iz++) {
        const pz = startZ + iz * GRID_SIZE;
        const westX = startX - GRID_SIZE / 2;
        const westVar: StructureVariant =
          fl === 0 && doorSide === 'west' && iz === Math.floor(cellsZ / 2) ? 'doorway' : 'solid';
        pushStruct('wall', westVar, wallMat, westX, fy, pz, Math.PI / 2);

        const eastX = startX + (cellsX - 1) * GRID_SIZE + GRID_SIZE / 2;
        const eastVar: StructureVariant =
          fl === 0 && doorSide === 'east' && iz === Math.floor(cellsZ / 2) ? 'doorway' : 'window';
        pushStruct('wall', eastVar, wallMat, eastX, fy, pz, Math.PI / 2);
      }
    }

    const topY = baseY + floors * WALL_HEIGHT;
    for (let ix = 0; ix < cellsX; ix++) {
      for (let iz = 0; iz < cellsZ; iz++) {
        pushStruct(
          'roof',
          'solid',
          wallMat,
          startX + ix * GRID_SIZE,
          topY,
          startZ + iz * GRID_SIZE,
          0,
        );
      }
    }
  };

  // === POI 1: TILTED CROSSING (-24, -12) ===
  buildModularHouse(-34, -20, 1, 1, 4, 'brick', 'wood', 'south', true); // 4-Story Clock Tower
  buildModularHouse(-14, -18, 2, 2, 3, 'brick', 'wood', 'west', true);  // Trump/Castle Apartments
  buildModularHouse(-34, 0, 2, 1, 2, 'wood', 'wood', 'north', true);    // Taco & Pawn Shop
  buildModularHouse(-12, 2, 2, 1, 2, 'metal', 'metal', 'west', true);    // Steel Commercial Garage

  // === POI 2: PLEASANT MEADOW (-118, -110) ===
  buildModularHouse(-128, -120, 2, 2, 2, 'brick', 'wood', 'south', true);
  buildModularHouse(-106, -116, 2, 1, 2, 'wood', 'wood', 'west', true);
  buildModularHouse(-118, -96, 2, 2, 2, 'wood', 'wood', 'north', true);

  // === POI 3: RETAIL RIDGE (124, 34) ===
  buildModularHouse(114, 26, 2, 2, 2, 'brick', 'wood', 'east', true);
  buildModularHouse(134, 24, 2, 1, 2, 'metal', 'metal', 'south', true);
  buildModularHouse(124, 46, 2, 1, 1, 'wood', 'wood', 'north', false);

  // === POI 4: ANARCHY BARN (-140, 68) ===
  buildModularHouse(-142, 66, 2, 2, 2, 'wood', 'wood', 'east', true);
  buildModularHouse(-128, 76, 1, 1, 1, 'metal', 'metal', 'north', false);

  // === POI 5: SALTY CROSSROADS (18, 92) ===
  buildModularHouse(10, 88, 2, 2, 2, 'brick', 'wood', 'east', true);
  buildModularHouse(28, 96, 2, 1, 2, 'wood', 'wood', 'west', true);

  // === POI 6: LONELY LOOKOUT (128, -128) ===
  buildModularHouse(128, -128, 1, 1, 4, 'wood', 'wood', 'south', true);
  buildModularHouse(118, -122, 1, 1, 1, 'wood', 'wood', 'east', false);

  // === POI 7: SPARKLING BASIN ISLAND (34, -56) ===
  buildModularHouse(34, -56, 2, 1, 2, 'wood', 'wood', 'south', true);

  // === POI 8: COASTAL DEPOT (-96, 158) ===
  buildModularHouse(-102, 156, 2, 1, 2, 'metal', 'metal', 'north', true);
  buildModularHouse(-86, 160, 2, 1, 1, 'metal', 'metal', 'west', false);

  // Spawn Overlook cover wall (just off-road so forward sightline is wide open)
  const ovY = getTerrainHeight(-4, 126);
  pushStruct('wall', 'solid', 'wood', -3, ovY, 126, Math.PI / 5);

  // === Loot Chests across all 8 POIs + Spawn Overlook ===
  const chestCoords: Array<[number, number, number, number]> = [
    [-14, 128, 0, 0],                   // Starter chest right ahead on spawn trail
    [-34, -20, WALL_HEIGHT * 3, 0],     // Tilted Clock Tower top
    [-14, -18, WALL_HEIGHT * 2, 0],     // Tilted Apartments top
    [-34, 0, WALL_HEIGHT, Math.PI],     // Tilted Pawn Shop
    [-12, 2, WALL_HEIGHT, 0],           // Tilted Steel Garage
    [-128, -120, WALL_HEIGHT, 0],       // Pleasant House 1
    [-118, -96, WALL_HEIGHT, Math.PI],  // Pleasant House 2
    [114, 26, WALL_HEIGHT, 0],          // Retail Brick Store
    [134, 24, WALL_HEIGHT, 0],          // Retail Metal Depot
    [-142, 66, WALL_HEIGHT, 0],         // Anarchy Barn loft
    [10, 88, WALL_HEIGHT, 0],           // Salty Brick House
    [28, 96, WALL_HEIGHT, 0],           // Salty Wood House
    [128, -128, WALL_HEIGHT * 3, 0],    // Lonely Fire Tower top
    [34, -56, WALL_HEIGHT, 0],          // Sparkling Basin Lake Cabin
    [-102, 156, WALL_HEIGHT, 0],        // Coastal Depot
    [60, -2, 0, 0.4],                   // Riverbank camp
    [-68, 42, 0, -0.5],                 // Western hill camp
    [68, -88, 0, 1.1],                  // Northeast ridge camp
  ];

  chestCoords.forEach(([x, z, yOff, rotY], idx) => {
    chests.push({
      id: `chest_${idx + 1}`,
      x,
      y: getTerrainHeight(x, z) + yOff,
      z,
      rotY,
      opened: false,
    });
  });

  // === Ground Loot Pickups (guaranteed accessible near spawn & all POIs) ===
  const groundSpawns: Array<[number, number, WeaponId, WeaponRarity, number]> = [
    [-11.8, 129.5, 'ar', 'uncommon', 30],
    [-16.2, 129.5, 'shotgun', 'common', 5],
    [-24, -10, 'smg', 'rare', 30],
    [-18, -14, 'mini_shield', 'uncommon', 2],
    [-116, -108, 'ar', 'rare', 30],
    [122, 34, 'shotgun', 'epic', 5],
    [-138, 68, 'sniper', 'rare', 1],
    [18, 90, 'smg', 'uncommon', 30],
    [128, -124, 'sniper', 'legendary', 1],
    [34, -54, 'ar', 'epic', 30],
    [-96, 158, 'shotgun', 'rare', 5],
    [4, 108, 'medkit', 'uncommon', 1],
    [-60, 12, 'mini_shield', 'uncommon', 2],
    [72, 62, 'ar', 'rare', 30],
  ];

  groundSpawns.forEach(([x, z, weaponId, rarity, ammo], idx) => {
    loot.push({
      id: `loot_init_${idx + 1}`,
      weaponId,
      rarity,
      ammo,
      count: weaponId === 'mini_shield' ? 2 : 1,
      x,
      y: getTerrainHeight(x, z) + 0.35,
      z,
      collected: false,
    });
  });

  // === Destructible Pine & Oak Trees + Granite Boulders across the 570m Island ===
  const isClearOfPoiAndRoad = (x: number, z: number): boolean => {
    if (getRoadDistance(x, z) < 6.5) return false;
    if (Math.hypot(x - PLAYER_SPAWN.x, z - PLAYER_SPAWN.z) < 14) return false;
    const kind = getSurfaceKind(x, z);
    if (kind === 'town_pad' || kind === 'water_bed' || kind === 'sand') return false;
    if (getTerrainSlope(x, z) > 0.65) return false;
    return true;
  };

  let treesPlaced = 0;
  let attempts = 0;
  while (treesPlaced < 155 && attempts < 1400) {
    attempts++;
    const angle = rand() * Math.PI * 2;
    const dist = 24 + rand() * (ISLAND_RADIUS - 42);
    const tx = Math.cos(angle) * dist;
    const tz = Math.sin(angle) * dist;
    if (!isClearOfPoiAndRoad(tx, tz)) continue;

    let tooClose = false;
    for (let i = 0; i < structures.length; i++) {
      const s = structures[i];
      if (Math.abs(s.x - tx) < 8 && Math.abs(s.z - tz) < 8 && Math.hypot(s.x - tx, s.z - tz) < 7.5) {
        tooClose = true;
        break;
      }
    }
    if (tooClose) continue;

    const ty = getTerrainHeight(tx, tz);
    pushStruct('wall', 'solid', 'wood', tx, ty, tz, rand() * Math.PI * 2, {
      isTree: true,
      scale: 0.9 + rand() * 0.55,
      hpOverride: 180,
    });
    treesPlaced++;
  }

  let rocksPlaced = 0;
  attempts = 0;
  while (rocksPlaced < 68 && attempts < 800) {
    attempts++;
    const angle = rand() * Math.PI * 2;
    const dist = 28 + rand() * (ISLAND_RADIUS - 38);
    const rx = Math.cos(angle) * dist;
    const rz = Math.sin(angle) * dist;
    if (!isClearOfPoiAndRoad(rx, rz)) continue;

    let tooClose = false;
    for (let i = 0; i < structures.length; i++) {
      const s = structures[i];
      if (Math.abs(s.x - rx) < 6 && Math.abs(s.z - rz) < 6 && Math.hypot(s.x - rx, s.z - rz) < 5.5) {
        tooClose = true;
        break;
      }
    }
    if (tooClose) continue;

    const ry = getTerrainHeight(rx, rz);
    pushStruct('wall', 'solid', 'brick', rx, ry, rz, rand() * Math.PI * 2, {
      isRock: true,
      scale: 0.85 + rand() * 0.65,
      hpOverride: 220,
    });
    rocksPlaced++;
  }

  return { structures, chests, loot };
}
