import * as THREE from 'three';
import type { MaterialType, SkinId, StructurePiece, WeaponId, WeaponRarity } from '../game/types';
import { GRID_SIZE, WALL_HEIGHT } from '../game/mapData';
import { getSkinDef } from '../game/skins';
import { RARITY_COLORS } from '../game/weapons';
import type { ProceduralTexturePack } from './textures';

export interface MaterialLibrary {
  wood: THREE.MeshStandardMaterial;
  brick: THREE.MeshStandardMaterial;
  metal: THREE.MeshStandardMaterial;
  woodTrim: THREE.MeshStandardMaterial;
  hazardTrim: THREE.MeshStandardMaterial;
  treeTrunk: THREE.MeshStandardMaterial;
  treeFoliage: THREE.MeshStandardMaterial;
  treeFoliageAlt: THREE.MeshStandardMaterial;
  rock: THREE.MeshStandardMaterial;
  blueprintValid: THREE.MeshStandardMaterial;
  blueprintInvalid: THREE.MeshStandardMaterial;
  shadowDisc: THREE.MeshBasicMaterial;
  dispose: () => void;
}

export function createMaterialLibrary(tex: ProceduralTexturePack): MaterialLibrary {
  const wood = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: tex.woodMap,
    bumpMap: tex.woodBump,
    bumpScale: 0.04,
    roughness: 0.82,
    metalness: 0.02,
  });
  const brick = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: tex.brickMap,
    bumpMap: tex.brickBump,
    bumpScale: 0.06,
    roughness: 0.88,
    metalness: 0.04,
  });
  const metal = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: tex.metalMap,
    bumpMap: tex.metalBump,
    bumpScale: 0.05,
    roughness: 0.34,
    metalness: 0.72,
  });
  const woodTrim = new THREE.MeshStandardMaterial({
    color: 0x6b3f1e,
    roughness: 0.86,
    metalness: 0.0,
  });
  const hazardTrim = new THREE.MeshStandardMaterial({
    color: 0xeab308,
    roughness: 0.48,
    metalness: 0.25,
  });
  const treeTrunk = new THREE.MeshStandardMaterial({
    color: 0x613b20,
    roughness: 0.92,
    metalness: 0.0,
  });
  const treeFoliage = new THREE.MeshStandardMaterial({
    color: 0x2e8537,
    roughness: 0.7,
    metalness: 0.0,
    flatShading: true,
  });
  const treeFoliageAlt = new THREE.MeshStandardMaterial({
    color: 0x3f9b43,
    roughness: 0.68,
    metalness: 0.0,
    flatShading: true,
  });
  const rock = new THREE.MeshStandardMaterial({
    color: 0x77818c,
    roughness: 0.86,
    metalness: 0.06,
    flatShading: true,
  });
  const blueprintValid = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.55,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  });
  const blueprintInvalid = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xb91c1c,
    emissiveIntensity: 0.55,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  });
  const shadowDisc = new THREE.MeshBasicMaterial({
    map: tex.shadowDiscMap,
    transparent: true,
    opacity: 0.48,
    depthWrite: false,
  });

  return {
    wood,
    brick,
    metal,
    woodTrim,
    hazardTrim,
    treeTrunk,
    treeFoliage,
    treeFoliageAlt,
    rock,
    blueprintValid,
    blueprintInvalid,
    shadowDisc,
    dispose: () => {
      wood.dispose();
      brick.dispose();
      metal.dispose();
      woodTrim.dispose();
      hazardTrim.dispose();
      treeTrunk.dispose();
      treeFoliage.dispose();
      treeFoliageAlt.dispose();
      rock.dispose();
      blueprintValid.dispose();
      blueprintInvalid.dispose();
      shadowDisc.dispose();
    },
  };
}

function getMatByType(mats: MaterialLibrary, type: MaterialType): THREE.MeshStandardMaterial {
  if (type === 'brick') return mats.brick;
  if (type === 'metal') return mats.metal;
  return mats.wood;
}

// Shared static character geometries so 100 character rigs reuse GPU buffers with near-zero memory
const CHAR_GEO = {
  shadow: new THREE.CircleGeometry(0.65, 16),
  thigh: new THREE.CapsuleGeometry(0.125, 0.34, 4, 8),
  boot: new THREE.CapsuleGeometry(0.13, 0.22, 4, 8),
  kneePad: new THREE.BoxGeometry(0.24, 0.14, 0.14),
  torso: new THREE.CylinderGeometry(0.32, 0.25, 0.64, 10),
  belt: new THREE.CylinderGeometry(0.28, 0.28, 0.11, 10),
  pouch: new THREE.BoxGeometry(0.14, 0.16, 0.12),
  pack: new THREE.BoxGeometry(0.38, 0.46, 0.22),
  bedroll: new THREE.CylinderGeometry(0.09, 0.09, 0.42, 8),
  antenna: new THREE.CylinderGeometry(0.014, 0.018, 0.36, 5),
  pauldron: new THREE.SphereGeometry(0.14, 8, 6),
  cranium: new THREE.SphereGeometry(0.21, 12, 10),
  hairCap: new THREE.SphereGeometry(0.22, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.58),
  hairSwoop: new THREE.ConeGeometry(0.14, 0.26, 6),
  visor: new THREE.BoxGeometry(0.28, 0.08, 0.07),
  sleeve: new THREE.CapsuleGeometry(0.095, 0.2, 4, 8),
  forearm: new THREE.CapsuleGeometry(0.08, 0.22, 4, 8),
  // Custom skin geometries
  neegyNeck: new THREE.CylinderGeometry(0.06, 0.082, 0.48, 10),
  neegyHead: new THREE.SphereGeometry(0.22, 14, 12),
  neegyStubble: new THREE.SphereGeometry(0.18, 10, 8),
  neegyEar: new THREE.SphereGeometry(0.075, 8, 8),
  neegyEyeWhite: new THREE.SphereGeometry(0.058, 10, 8),
  neegyIris: new THREE.SphereGeometry(0.04, 8, 8),
  neegyPupil: new THREE.SphereGeometry(0.022, 8, 6),
  neegyNose: new THREE.SphereGeometry(0.064, 10, 8),
  neegyLip: new THREE.BoxGeometry(0.17, 0.042, 0.085),
  neegyTooth: new THREE.BoxGeometry(0.062, 0.092, 0.04),
  skullRib: new THREE.BoxGeometry(0.36, 0.05, 0.34),
  skullSocket: new THREE.SphereGeometry(0.055, 8, 8),
  knightHorn: new THREE.ConeGeometry(0.055, 0.24, 6),
  knightSpike: new THREE.ConeGeometry(0.045, 0.14, 5),
  bearHead: new THREE.SphereGeometry(0.25, 12, 10),
  bearEar: new THREE.SphereGeometry(0.09, 8, 8),
  bearMuzzle: new THREE.SphereGeometry(0.105, 10, 8),
  bearBelly: new THREE.CircleGeometry(0.18, 12),
  starBadge: new THREE.OctahedronGeometry(0.11, 0),
};

const SHARED_PANTS = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.84, metalness: 0.05 });
const SHARED_SKIN = new THREE.MeshStandardMaterial({ color: 0xe6b596, roughness: 0.58, metalness: 0.0 });
const SHARED_BOOT = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.42, metalness: 0.22 });
const SHARED_GEAR = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.48, metalness: 0.38 });
const SHARED_BEDROLL = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.85 });
const SHARED_WHITE = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35, metalness: 0.05 });
const SHARED_BLACK = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.55, metalness: 0.15 });
const SHARED_NEEGY_SKIN = new THREE.MeshStandardMaterial({ color: 0xf0c4a4, roughness: 0.56, metalness: 0.0 });
const SHARED_NEEGY_STUBBLE = new THREE.MeshStandardMaterial({ color: 0xb88b70, roughness: 0.85, metalness: 0.0 });
const SHARED_NEEGY_IRIS = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.22, metalness: 0.1 });
const SHARED_NEEGY_SHIRT = new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.72, metalness: 0.0 });
const SHARED_CRIMSON = new THREE.MeshStandardMaterial({ color: 0xdc2626, emissive: 0x991b1b, emissiveIntensity: 0.6, roughness: 0.3 });
const SHARED_BEAR_MUZZLE = new THREE.MeshStandardMaterial({ color: 0xfbcfe8, roughness: 0.75 });

/**
 * Composite 3-12 part procedural Weapon/Tool silhouette.
 */
export function createWeaponModel(weaponId: WeaponId, rarity: WeaponRarity): THREE.Group {
  const group = new THREE.Group();
  const darkSteel = new THREE.MeshStandardMaterial({ color: 0x222933, roughness: 0.38, metalness: 0.82 });
  const accentMat = new THREE.MeshStandardMaterial({
    color: RARITY_COLORS[rarity].hex,
    roughness: 0.34,
    metalness: 0.48,
  });
  const gripMat = new THREE.MeshStandardMaterial({ color: 0x5c3c24, roughness: 0.84, metalness: 0.05 });

  if (weaponId === 'pickaxe') {
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.038, 1.05, 8), gripMat);
    shaft.position.y = 0.42;
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.14, 8), darkSteel);
    collar.position.y = 0.92;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.09, 0.08), darkSteel);
    head.position.y = 0.94;
    const tipL = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.22, 4), accentMat);
    tipL.rotation.z = Math.PI / 2;
    tipL.position.set(-0.42, 0.94, 0);
    const tipR = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.22, 4), accentMat);
    tipR.rotation.z = -Math.PI / 2;
    tipR.position.set(0.42, 0.94, 0);
    group.add(shaft, collar, head, tipL, tipR);
    return group;
  }

  if (weaponId === 'mini_shield' || weaponId === 'medkit') {
    const bottleColor = weaponId === 'mini_shield' ? 0x38bdf8 : 0xf8fafc;
    const body = new THREE.Mesh(
      weaponId === 'mini_shield'
        ? new THREE.CylinderGeometry(0.14, 0.16, 0.36, 10)
        : new THREE.BoxGeometry(0.36, 0.26, 0.2),
      new THREE.MeshStandardMaterial({
        color: bottleColor,
        emissive: weaponId === 'mini_shield' ? 0x0284c7 : 0x000000,
        emissiveIntensity: 0.35,
        roughness: 0.2,
        metalness: 0.1,
      }),
    );
    body.position.y = 0.18;
    const cap = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.08, 0.14),
      new THREE.MeshStandardMaterial({ color: weaponId === 'mini_shield' ? 0x92400e : 0xef4444, roughness: 0.6 }),
    );
    cap.position.y = 0.38;
    group.add(body, cap);
    return group;
  }

  const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.14, 0.44), darkSteel);
  const stock = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.14, 0.26),
    weaponId === 'shotgun' ? gripMat : accentMat,
  );
  stock.position.set(0, -0.02, 0.32);

  const barrelLen = weaponId === 'sniper' ? 0.68 : weaponId === 'ar' ? 0.45 : weaponId === 'shotgun' ? 0.5 : 0.26;
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.03, barrelLen, 8), darkSteel);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.03, -0.22 - barrelLen * 0.45);

  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.16, 0.08), gripMat);
  grip.position.set(0, -0.12, 0.08);
  grip.rotation.x = 0.25;

  const mag = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 0.09), accentMat);
  mag.position.set(0, -0.13, -0.08);
  mag.rotation.x = -0.18;

  group.add(receiver, stock, barrel, grip, mag);

  if (weaponId === 'sniper') {
    const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.042, 0.28, 8), accentMat);
    scope.rotation.x = Math.PI / 2;
    scope.position.set(0, 0.11, -0.04);
    group.add(scope);
  }
  if (weaponId === 'shotgun') {
    const pump = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.075, 0.22), accentMat);
    pump.position.set(0, -0.03, -0.35);
    group.add(pump);
  }

  return group;
}

export interface CharacterRig {
  root: THREE.Group;
  bodyPivot: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  weaponMount: THREE.Group;
  head: THREE.Group;
  shadowDisc: THREE.Mesh;
  setWeapon: (weaponId: WeaponId, rarity: WeaponRarity) => void;
  updatePose: (speed: number, grounded: boolean, swingAnim: number, dt: number, walkPhase: number) => void;
}

/**
 * Stylized Fortnite Chapter 1 heroic-proportioned character rig using shared GPU geometries.
 * Supports customizable skins including Neegy, Explorer, Skull Trooper, Brite Bomber, Black Knight, and Cuddle Team.
 */
export function createCharacterRig(
  colorHex: number,
  mats: MaterialLibrary,
  isLocal = false,
  skinId: SkinId = 'jonesy',
): CharacterRig {
  const skinDef = getSkinDef(skinId);
  const root = new THREE.Group();
  const bodyPivot = new THREE.Group();
  root.add(bodyPivot);

  const isNeegy = skinId === 'neegy';
  const shirtMat = isNeegy
    ? SHARED_NEEGY_SHIRT
    : new THREE.MeshStandardMaterial({
        color: skinId === 'jonesy' && !isLocal ? colorHex : skinDef.shirtHex,
        roughness: skinId === 'black_knight' ? 0.38 : 0.62,
        metalness: skinId === 'black_knight' ? 0.52 : 0.08,
      });
  const pantsMat =
    skinId === 'jonesy'
      ? SHARED_PANTS
      : new THREE.MeshStandardMaterial({ color: skinDef.pantsHex, roughness: 0.82, metalness: 0.06 });
  const skinToneMat = isNeegy
    ? SHARED_NEEGY_SKIN
    : skinId === 'skull_trooper'
      ? SHARED_WHITE
      : skinId === 'black_knight' || skinId === 'cuddle_team'
        ? shirtMat
        : SHARED_SKIN;
  const hairMat = new THREE.MeshStandardMaterial({
    color: skinDef.hairHex,
    roughness: 0.72,
  });

  const shadowDisc = new THREE.Mesh(CHAR_GEO.shadow, mats.shadowDisc);
  shadowDisc.rotation.x = -Math.PI / 2;
  shadowDisc.position.y = 0.03;
  root.add(shadowDisc);

  const makeLeg = (xOff: number) => {
    const legGroup = new THREE.Group();
    legGroup.position.set(xOff, 0.84, 0);
    const thigh = new THREE.Mesh(CHAR_GEO.thigh, pantsMat);
    thigh.position.y = -0.25;
    if (isNeegy) thigh.scale.set(0.76, 1, 0.76);
    const boot = new THREE.Mesh(CHAR_GEO.boot, SHARED_BOOT);
    boot.position.set(0, -0.65, -0.02);
    if (isNeegy) boot.scale.set(0.84, 0.95, 0.95);
    legGroup.add(thigh, boot);
    if (!isNeegy) {
      const knee = new THREE.Mesh(CHAR_GEO.kneePad, SHARED_GEAR);
      knee.position.set(0, -0.44, -0.09);
      legGroup.add(knee);
    }
    return legGroup;
  };
  const leftLeg = makeLeg(isNeegy ? -0.14 : -0.16);
  const rightLeg = makeLeg(isNeegy ? 0.14 : 0.16);
  bodyPivot.add(leftLeg, rightLeg);

  // Torso
  const torso = new THREE.Mesh(CHAR_GEO.torso, shirtMat);
  torso.position.y = 1.18;
  torso.castShadow = isLocal;
  if (isNeegy) {
    torso.scale.set(0.84, 0.96, 0.78);
  }
  bodyPivot.add(torso);

  // Skin-specific torso armor / emblems / accessories
  if (isNeegy) {
    // Tall skinny iconic neck lifting head cleanly above the yellow tee
    const neck = new THREE.Mesh(CHAR_GEO.neegyNeck, SHARED_NEEGY_SKIN);
    neck.position.set(0, 1.72, 0);
    neck.castShadow = isLocal;
    bodyPivot.add(neck);
  } else {
    const belt = new THREE.Mesh(CHAR_GEO.belt, SHARED_GEAR);
    belt.position.y = 0.88;
    const pouchL = new THREE.Mesh(CHAR_GEO.pouch, SHARED_GEAR);
    pouchL.position.set(-0.26, 0.88, -0.14);
    const pouchR = new THREE.Mesh(CHAR_GEO.pouch, SHARED_GEAR);
    pouchR.position.set(0.26, 0.88, -0.14);
    bodyPivot.add(belt, pouchL, pouchR);

    if (skinId === 'jonesy' || skinId === 'brite_bomber') {
      const backpack = new THREE.Mesh(CHAR_GEO.pack, SHARED_GEAR);
      backpack.position.set(0, 1.2, 0.24);
      const bedroll = new THREE.Mesh(CHAR_GEO.bedroll, SHARED_BEDROLL);
      bedroll.rotation.z = Math.PI / 2;
      bedroll.position.set(0, 1.44, 0.26);
      const antenna = new THREE.Mesh(CHAR_GEO.antenna, SHARED_BOOT);
      antenna.position.set(0.14, 1.56, 0.28);
      bodyPivot.add(backpack, bedroll, antenna);
    }

    if (skinId === 'skull_trooper') {
      for (let r = 0; r < 3; r++) {
        const rib = new THREE.Mesh(CHAR_GEO.skullRib, SHARED_WHITE);
        rib.position.set(0, 1.08 + r * 0.12, -0.02);
        bodyPivot.add(rib);
      }
    } else if (skinId === 'brite_bomber') {
      const star = new THREE.Mesh(
        CHAR_GEO.starBadge,
        new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xeab308, emissiveIntensity: 0.35 }),
      );
      star.position.set(0, 1.22, -0.27);
      bodyPivot.add(star);
    } else if (skinId === 'cuddle_team') {
      const belly = new THREE.Mesh(CHAR_GEO.bearBelly, SHARED_BEAR_MUZZLE);
      belly.position.set(0, 1.15, -0.29);
      belly.rotation.y = Math.PI;
      bodyPivot.add(belly);
    }

    const padMat = skinId === 'black_knight' ? SHARED_CRIMSON : SHARED_GEAR;
    const padL = new THREE.Mesh(CHAR_GEO.pauldron, padMat);
    padL.position.set(-0.35, 1.44, 0);
    const padR = new THREE.Mesh(CHAR_GEO.pauldron, padMat);
    padR.position.set(0.35, 1.44, 0);
    bodyPivot.add(padL, padR);
    if (skinId === 'black_knight') {
      const spL = new THREE.Mesh(CHAR_GEO.knightSpike, SHARED_BLACK);
      spL.position.set(-0.4, 1.58, 0);
      spL.rotation.z = 0.45;
      const spR = new THREE.Mesh(CHAR_GEO.knightSpike, SHARED_BLACK);
      spR.position.set(0.4, 1.58, 0);
      spR.rotation.z = -0.45;
      bodyPivot.add(spL, spR);
    }
  }

  // Head assembly
  const head = new THREE.Group();
  head.position.set(0, isNeegy ? 1.94 : 1.56, 0);

  if (isNeegy) {
    // Tapered bald egg-head
    const cranium = new THREE.Mesh(CHAR_GEO.neegyHead, SHARED_NEEGY_SKIN);
    cranium.position.y = 0.25;
    cranium.scale.set(0.88, 1.26, 0.94);
    cranium.castShadow = isLocal;

    // Jaw stubble shadow
    const stubble = new THREE.Mesh(CHAR_GEO.neegyStubble, SHARED_NEEGY_STUBBLE);
    stubble.position.set(0, 0.08, -0.02);
    stubble.scale.set(0.84, 0.56, 0.88);

    // Big protruding ears
    const earL = new THREE.Mesh(CHAR_GEO.neegyEar, SHARED_NEEGY_SKIN);
    earL.position.set(-0.22, 0.22, 0.02);
    earL.scale.set(0.55, 1.15, 0.72);
    const earR = new THREE.Mesh(CHAR_GEO.neegyEar, SHARED_NEEGY_SKIN);
    earR.position.set(0.22, 0.22, 0.02);
    earR.scale.set(0.55, 1.15, 0.72);

    // Wide-open blue eyes
    for (const side of [-1, 1]) {
      const sclera = new THREE.Mesh(CHAR_GEO.neegyEyeWhite, SHARED_WHITE);
      sclera.position.set(side * 0.082, 0.27, -0.175);
      const iris = new THREE.Mesh(CHAR_GEO.neegyIris, SHARED_NEEGY_IRIS);
      iris.position.set(side * 0.082, 0.27, -0.198);
      const pupil = new THREE.Mesh(CHAR_GEO.neegyPupil, SHARED_BLACK);
      pupil.position.set(side * 0.082, 0.27, -0.222);
      head.add(sclera, iris, pupil);
    }

    // Prominent long bulbous nose
    const nose = new THREE.Mesh(CHAR_GEO.neegyNose, SHARED_NEEGY_SKIN);
    nose.position.set(0, 0.195, -0.265);
    nose.scale.set(0.85, 0.78, 1.65);

    // Upper lip & iconic two huge white buck teeth
    const lip = new THREE.Mesh(CHAR_GEO.neegyLip, SHARED_NEEGY_SKIN);
    lip.position.set(0, 0.115, -0.195);
    const toothL = new THREE.Mesh(CHAR_GEO.neegyTooth, SHARED_WHITE);
    toothL.position.set(-0.036, 0.058, -0.225);
    toothL.rotation.x = 0.08;
    const toothR = new THREE.Mesh(CHAR_GEO.neegyTooth, SHARED_WHITE);
    toothR.position.set(0.036, 0.058, -0.225);
    toothR.rotation.x = 0.08;

    head.add(cranium, stubble, earL, earR, nose, lip, toothL, toothR);
  } else if (skinId === 'cuddle_team') {
    const bearHead = new THREE.Mesh(CHAR_GEO.bearHead, shirtMat);
    bearHead.position.y = 0.22;
    bearHead.castShadow = isLocal;
    const earL = new THREE.Mesh(CHAR_GEO.bearEar, shirtMat);
    earL.position.set(-0.2, 0.43, 0);
    const earR = new THREE.Mesh(CHAR_GEO.bearEar, shirtMat);
    earR.position.set(0.2, 0.43, 0);
    const muzzle = new THREE.Mesh(CHAR_GEO.bearMuzzle, SHARED_BEAR_MUZZLE);
    muzzle.position.set(0, 0.16, -0.22);
    const bearNose = new THREE.Mesh(CHAR_GEO.neegyPupil, SHARED_BLACK);
    bearNose.position.set(0, 0.2, -0.31);
    const eyeL = new THREE.Mesh(CHAR_GEO.neegyPupil, SHARED_BLACK);
    eyeL.position.set(-0.09, 0.27, -0.22);
    const eyeR = new THREE.Mesh(CHAR_GEO.neegyPupil, SHARED_BLACK);
    eyeR.position.set(0.09, 0.27, -0.22);
    head.add(bearHead, earL, earR, muzzle, bearNose, eyeL, eyeR);
  } else if (skinId === 'black_knight') {
    const helm = new THREE.Mesh(CHAR_GEO.cranium, shirtMat);
    helm.position.y = 0.21;
    helm.scale.set(1.02, 1.12, 1.05);
    helm.castShadow = isLocal;
    const visorSlit = new THREE.Mesh(CHAR_GEO.visor, SHARED_CRIMSON);
    visorSlit.position.set(0, 0.23, -0.19);
    const hornL = new THREE.Mesh(CHAR_GEO.knightHorn, SHARED_GEAR);
    hornL.position.set(-0.18, 0.39, 0);
    hornL.rotation.z = 0.55;
    const hornR = new THREE.Mesh(CHAR_GEO.knightHorn, SHARED_GEAR);
    hornR.position.set(0.18, 0.39, 0);
    hornR.rotation.z = -0.55;
    head.add(helm, visorSlit, hornL, hornR);
  } else {
    // Explorer / Skull Trooper / Brite Bomber sculpted head
    const cranium = new THREE.Mesh(CHAR_GEO.cranium, skinToneMat);
    cranium.position.y = 0.2;
    cranium.scale.set(0.95, 1.06, 0.98);
    cranium.castShadow = isLocal;
    const hairCap = new THREE.Mesh(CHAR_GEO.hairCap, hairMat);
    hairCap.position.y = 0.23;
    head.add(cranium, hairCap);

    if (skinId === 'skull_trooper') {
      const sockL = new THREE.Mesh(CHAR_GEO.skullSocket, SHARED_BLACK);
      sockL.position.set(-0.075, 0.22, -0.185);
      const sockR = new THREE.Mesh(CHAR_GEO.skullSocket, SHARED_BLACK);
      sockR.position.set(0.075, 0.22, -0.185);
      const glowL = new THREE.Mesh(
        CHAR_GEO.neegyPupil,
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x38bdf8, emissiveIntensity: 0.9 }),
      );
      glowL.position.set(-0.075, 0.22, -0.22);
      const glowR = glowL.clone();
      glowR.position.set(0.075, 0.22, -0.22);
      head.add(sockL, sockR, glowL, glowR);
    } else {
      const swoop = new THREE.Mesh(CHAR_GEO.hairSwoop, hairMat);
      swoop.position.set(0.05, 0.39, -0.12);
      swoop.rotation.set(-0.9, 0.2, -0.35);
      const visor = new THREE.Mesh(
        CHAR_GEO.visor,
        new THREE.MeshStandardMaterial({ color: skinDef.accentHex, roughness: 0.2, metalness: 0.6 }),
      );
      visor.position.set(0, 0.23, -0.19);
      head.add(swoop, visor);
    }
  }
  bodyPivot.add(head);

  // Arms
  const makeArm = (xOff: number) => {
    const arm = new THREE.Group();
    arm.position.set(xOff, 1.42, 0);
    const sleeve = new THREE.Mesh(CHAR_GEO.sleeve, shirtMat);
    sleeve.position.y = -0.14;
    const forearm = new THREE.Mesh(CHAR_GEO.forearm, skinToneMat);
    forearm.position.y = -0.39;
    if (isNeegy) {
      sleeve.scale.set(0.84, 0.9, 0.84);
      forearm.scale.set(0.7, 1.0, 0.7);
    }
    arm.add(sleeve, forearm);
    return arm;
  };
  const leftArm = makeArm(isNeegy ? -0.34 : -0.41);
  const rightArm = makeArm(isNeegy ? 0.34 : 0.41);
  bodyPivot.add(leftArm, rightArm);

  const weaponMount = new THREE.Group();
  weaponMount.position.set(0, -0.5, -0.15);
  weaponMount.rotation.x = Math.PI / 2;
  rightArm.add(weaponMount);

  let currentWeaponKey = '';
  const setWeapon = (weaponId: WeaponId, rarity: WeaponRarity) => {
    const key = `${weaponId}_${rarity}`;
    if (key === currentWeaponKey) return;
    currentWeaponKey = key;
    while (weaponMount.children.length > 0) {
      weaponMount.remove(weaponMount.children[0]);
    }
    const model = createWeaponModel(weaponId, rarity);
    if (weaponId === 'pickaxe') {
      model.rotation.x = -Math.PI / 2;
      model.position.set(0, 0, 0.1);
    }
    weaponMount.add(model);
  };
  setWeapon('pickaxe', 'common');

  const updatePose = (
    speed: number,
    grounded: boolean,
    swingAnim: number,
    dt: number,
    walkPhase: number,
  ) => {
    const moveFactor = Math.min(1, speed / 6.5);
    const legAngle = grounded ? Math.sin(walkPhase) * 0.62 * moveFactor : 0.35;
    leftLeg.rotation.x = legAngle;
    rightLeg.rotation.x = -legAngle;

    const targetScaleY = grounded ? 1 + Math.abs(Math.sin(walkPhase * 2)) * 0.03 * moveFactor : 1.07;
    const targetScaleXZ = 1 / Math.sqrt(targetScaleY);
    bodyPivot.scale.y = THREE.MathUtils.damp(bodyPivot.scale.y, targetScaleY, 12, dt);
    bodyPivot.scale.x = THREE.MathUtils.damp(bodyPivot.scale.x, targetScaleXZ, 12, dt);
    bodyPivot.scale.z = bodyPivot.scale.x;

    if (swingAnim > 0) {
      rightArm.rotation.x = -1.6 + Math.sin(swingAnim * Math.PI) * 1.9;
      leftArm.rotation.x = -0.35;
    } else if (currentWeaponKey.startsWith('pickaxe')) {
      rightArm.rotation.x = -0.25 - legAngle * 0.55;
      leftArm.rotation.x = -0.25 + legAngle * 0.55;
    } else {
      rightArm.rotation.x = -Math.PI * 0.42;
      leftArm.rotation.x = -Math.PI * 0.38;
      leftArm.rotation.y = 0.35;
    }
  };

  return {
    root,
    bodyPivot,
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    weaponMount,
    head,
    shadowDisc,
    setWeapon,
    updatePose,
  };
}

/**
 * Composite destructible building, tree, or boulder mesh with Chapter 1 architectural details.
 */
export function createStructureMesh(
  piece: StructurePiece,
  mats: MaterialLibrary,
): THREE.Group {
  const group = new THREE.Group();
  group.position.set(piece.x, piece.y, piece.z);
  group.rotation.y = piece.rotY;
  const s = piece.scale ?? 1;
  group.scale.setScalar(s);

  if (piece.isTree) {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.52, 3.6, 7), mats.treeTrunk);
    trunk.position.y = 1.8;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    group.add(trunk);

    const folMat = Math.abs(Math.round(piece.x)) % 2 === 0 ? mats.treeFoliage : mats.treeFoliageAlt;
    const tiers = [
      { y: 3.4, r: 2.55, h: 2.6 },
      { y: 4.9, r: 2.0, h: 2.4 },
      { y: 6.3, r: 1.45, h: 2.1 },
      { y: 7.4, r: 0.85, h: 1.5 },
    ];
    for (const t of tiers) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(t.r, t.h, 7), folMat);
      cone.position.y = t.y;
      cone.castShadow = true;
      cone.receiveShadow = true;
      group.add(cone);
    }
    return group;
  }

  if (piece.isRock) {
    const mainRock = new THREE.Mesh(new THREE.DodecahedronGeometry(1.38, 0), mats.rock);
    mainRock.position.y = 0.88;
    mainRock.scale.set(1.12, 0.85, 1.0);
    mainRock.castShadow = true;
    mainRock.receiveShadow = true;

    const side1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.82, 0), mats.rock);
    side1.position.set(-0.98, 0.45, 0.42);
    side1.castShadow = true;

    const side2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.68, 0), mats.rock);
    side2.position.set(0.88, 0.38, -0.52);
    side2.castShadow = true;

    group.add(mainRock, side1, side2);
    return group;
  }

  const mat = getMatByType(mats, piece.material);
  const w = GRID_SIZE;
  const h = WALL_HEIGHT;

  if (piece.kind === 'wall') {
    const trimMat = piece.material === 'metal' ? mats.hazardTrim : mats.woodTrim;
    if (piece.variant === 'doorway') {
      const leftJamb = new THREE.Mesh(new THREE.BoxGeometry(1.25, h, 0.26), mat);
      leftJamb.position.set(-w / 2 + 0.625, h / 2, 0);
      leftJamb.castShadow = true;
      leftJamb.receiveShadow = true;

      const rightJamb = new THREE.Mesh(new THREE.BoxGeometry(1.25, h, 0.26), mat);
      rightJamb.position.set(w / 2 - 0.625, h / 2, 0);
      rightJamb.castShadow = true;
      rightJamb.receiveShadow = true;

      const header = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.9, 0.28), mat);
      header.position.set(0, h - 0.45, 0);
      header.castShadow = true;

      const frame = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.16, 0.34), trimMat);
      frame.position.set(0, h - 0.9, 0);
      group.add(leftJamb, rightJamb, header, frame);
    } else if (piece.variant === 'window') {
      const bottomSill = new THREE.Mesh(new THREE.BoxGeometry(w, 1.15, 0.26), mat);
      bottomSill.position.set(0, 0.575, 0);
      bottomSill.castShadow = true;
      bottomSill.receiveShadow = true;

      const topBar = new THREE.Mesh(new THREE.BoxGeometry(w, 0.95, 0.26), mat);
      topBar.position.set(0, h - 0.475, 0);
      topBar.castShadow = true;

      const postL = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.1, 0.26), mat);
      postL.position.set(-w / 2 + 0.6, 1.7, 0);
      postL.castShadow = true;

      const postR = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.1, 0.26), mat);
      postR.position.set(w / 2 - 0.6, 1.7, 0);
      postR.castShadow = true;

      const sillTrim = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.14, 0.34), trimMat);
      sillTrim.position.set(0, 1.15, 0);
      const topTrim = new THREE.Mesh(new THREE.BoxGeometry(w + 0.04, 0.16, 0.32), trimMat);
      topTrim.position.set(0, h - 0.08, 0);
      group.add(bottomSill, topBar, postL, postR, sillTrim, topTrim);
    } else {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.24), mat);
      panel.position.set(0, h / 2, 0);
      panel.castShadow = true;
      panel.receiveShadow = true;

      const topBeam = new THREE.Mesh(new THREE.BoxGeometry(w + 0.06, 0.18, 0.32), trimMat);
      topBeam.position.set(0, h - 0.09, 0);
      const baseBeam = new THREE.Mesh(new THREE.BoxGeometry(w + 0.06, 0.18, 0.32), trimMat);
      baseBeam.position.set(0, 0.09, 0);

      // Iconic Fortnite diagonal X-brace on wood/metal walls
      const brace = new THREE.Mesh(new THREE.BoxGeometry(0.18, 4.3, 0.3), mats.woodTrim);
      brace.position.set(0, h / 2, 0);
      brace.rotation.z = Math.atan2(w, h);
      group.add(panel, topBeam, baseBeam, brace);
    }
    return group;
  }

  if (piece.kind === 'floor') {
    const slab = new THREE.Mesh(new THREE.BoxGeometry(w, 0.22, w), mat);
    slab.position.set(0, 0.11, 0);
    slab.receiveShadow = true;
    slab.castShadow = true;
    const trim = new THREE.Mesh(new THREE.BoxGeometry(w + 0.06, 0.1, w + 0.06), mats.woodTrim);
    trim.position.set(0, 0.05, 0);
    group.add(slab, trim);
    return group;
  }

  if (piece.kind === 'ramp') {
    const diagLen = Math.hypot(w, h);
    const angle = Math.atan2(h, w);
    const deck = new THREE.Mesh(new THREE.BoxGeometry(w, 0.22, diagLen), mat);
    deck.position.set(0, h / 2, 0);
    deck.rotation.x = angle;
    deck.castShadow = true;
    deck.receiveShadow = true;

    const sideL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.36, diagLen), mats.woodTrim);
    sideL.position.set(-w / 2 + 0.1, h / 2, 0);
    sideL.rotation.x = angle;

    const sideR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.36, diagLen), mats.woodTrim);
    sideR.position.set(w / 2 - 0.1, h / 2, 0);
    sideR.rotation.x = angle;

    group.add(deck, sideL, sideR);
    return group;
  }

  const pyramid = new THREE.Mesh(new THREE.ConeGeometry(w * 0.72, 2.2, 4), mat);
  pyramid.position.y = 1.1;
  pyramid.rotation.y = Math.PI / 4;
  pyramid.castShadow = true;
  pyramid.receiveShadow = true;
  const cap = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.26, 0.54), mats.woodTrim);
  cap.position.y = 2.1;
  group.add(pyramid, cap);
  return group;
}

/**
 * Chapter 1 Loot Chest (composite 5-part mesh with hinged lid).
 */
export function createChestMesh(): { root: THREE.Group; lid: THREE.Group; glow: THREE.PointLight } {
  const root = new THREE.Group();
  const woodBlue = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.52, metalness: 0.18 });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    emissive: 0xd97706,
    emissiveIntensity: 0.42,
    roughness: 0.26,
    metalness: 0.85,
  });

  const base = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.55, 0.72), woodBlue);
  base.position.y = 0.275;
  base.castShadow = true;

  const bandL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.58, 0.76), goldMat);
  bandL.position.set(-0.36, 0.29, 0);
  const bandR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.58, 0.76), goldMat);
  bandR.position.set(0.36, 0.29, 0);
  const clasp = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.08), goldMat);
  clasp.position.set(0, 0.48, 0.38);

  const lid = new THREE.Group();
  lid.position.set(0, 0.55, -0.36);
  const lidBody = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.24, 0.74), woodBlue);
  lidBody.position.set(0, 0.12, 0.36);
  const lidTrim = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.08, 0.78), goldMat);
  lidTrim.position.set(0, 0.22, 0.36);
  lid.add(lidBody, lidTrim);

  const glow = new THREE.PointLight(0xfbbf24, 1.5, 8, 1.8);
  glow.position.set(0, 0.8, 0);

  root.add(base, bandL, bandR, clasp, lid, glow);
  return { root, lid, glow };
}

/**
 * Stylized low-poly fluffy Chapter 1 cloud cluster.
 */
export function createCloudCluster(): THREE.Group {
  const grp = new THREE.Group();
  const cloudMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.95,
    metalness: 0,
    flatShading: true,
  });
  const puffs: Array<[number, number, number, number]> = [
    [0, 0, 0, 12],
    [-11, -1.5, 2, 9],
    [12, -1, -1, 9.5],
    [4, 2.5, 4, 8],
  ];
  for (const [x, y, z, r] of puffs) {
    const m = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 1), cloudMat);
    m.scale.set(1.3, 0.62, 1.0);
    m.position.set(x, y, z);
    grp.add(m);
  }
  return grp;
}

/**
 * Iconic Chapter 1 Battle Bus cruising high in the sky as an unmistakable world landmark.
 */
export function createBattleBusMesh(): THREE.Group {
  const bus = new THREE.Group();
  const busBlue = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.42, metalness: 0.32 });
  const trimYellow = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.38, metalness: 0.2 });
  const balloonMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.7, metalness: 0.05 });
  const flameMat = new THREE.MeshStandardMaterial({
    color: 0xf97316,
    emissive: 0xf97316,
    emissiveIntensity: 1.5,
  });

  const hull = new THREE.Mesh(new THREE.BoxGeometry(3.8, 2.8, 11.0), busBlue);
  const roofStripe = new THREE.Mesh(new THREE.BoxGeometry(3.9, 0.4, 11.1), trimYellow);
  roofStripe.position.y = 1.45;
  const nose = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.8, 2.1), busBlue);
  nose.position.set(0, -0.35, -6.2);

  const balloon = new THREE.Mesh(new THREE.SphereGeometry(6.2, 14, 12), balloonMat);
  balloon.scale.set(0.95, 1.25, 0.95);
  balloon.position.y = 11.0;

  const basket = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.0, 1.6, 8), flameMat);
  basket.position.y = 3.8;

  bus.add(hull, roofStripe, nose, balloon, basket);
  return bus;
}
