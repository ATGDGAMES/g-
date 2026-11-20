import type {
  BotArchetype,
  BuildPieceType,
  CombatantState,
  LootPickup,
  SkinId,
  StormState,
  StructurePiece,
  WeaponId,
} from './types';
import { getTerrainHeight, ISLAND_RADIUS } from './terrain';
import { getSkinDef } from './skins';
import { isInsideSafeZone } from './storm';

export interface BotIntent {
  moveX: number;
  moveZ: number;
  jump: boolean;
  aimYaw: number;
  aimPitch: number;
  shoot: boolean;
  weaponToUse: WeaponId;
  buildRequest: BuildPieceType | null;
  healRequest: boolean;
}

const BOT_CALLSIGNS = [
  'Jonesy',
  'Ramirez',
  'TiltedSweat',
  'BushWookie',
  'LootLlama',
  'DefaultDan',
  'PinesRanger',
  'StormChaser',
  'PumpKing',
  'SniperWolf',
  'BrickBuilder',
  'SkyBasePro',
  'ChestHunter',
  'WailingOak',
  'DustyDepot',
  'PleasantAce',
  'GreasyGrove',
  'SaltySprings',
  'FatalFields',
  'AnarchyRex',
  'RetailHawk',
  'LonelyScout',
  'FlushTactical',
  'SkullTrooper',
  'RenegadeRaider',
  'BlackKnight',
  'RustLord',
  'BriteBomber',
  'CuddleTeam',
  'TomatoHead',
  'RaptorOne',
  'DriftFox',
  'SparkleSpec',
];

const BOT_SKIN_ROTATION: SkinId[] = [
  'jonesy',
  'skull_trooper',
  'brite_bomber',
  'black_knight',
  'cuddle_team',
  'neegy',
  'jonesy',
  'brite_bomber',
];

function resolveBotSkin(callsign: string, index: number): SkinId {
  if (callsign === 'SkullTrooper') return 'skull_trooper';
  if (callsign === 'BriteBomber') return 'brite_bomber';
  if (callsign === 'BlackKnight') return 'black_knight';
  if (callsign === 'CuddleTeam') return 'cuddle_team';
  return BOT_SKIN_ROTATION[index % BOT_SKIN_ROTATION.length];
}

export function createBotCombatant(
  index: number,
  rand: () => number,
  avoidX: number,
  avoidZ: number,
): CombatantState {
  const archetypes: BotArchetype[] = ['rusher', 'marksman', 'rotator'];
  const archetype = archetypes[index % archetypes.length];

  // Distribute up to 99 bots across the 285m-radius island, keeping >= 42m away from player spawn
  let bx = 0;
  let bz = 0;
  for (let attempt = 0; attempt < 40; attempt++) {
    const angle = (index / 99) * Math.PI * 2 + (rand() - 0.5) * 0.45;
    const dist = 32 + Math.sqrt(rand()) * (ISLAND_RADIUS - 52);
    bx = Math.cos(angle) * dist;
    bz = Math.sin(angle) * dist;
    if (Math.hypot(bx - avoidX, bz - avoidZ) >= 42) break;
  }

  const by = getTerrainHeight(bx, bz);
  const primaryWeapon: WeaponId =
    archetype === 'rusher' ? 'shotgun' : archetype === 'marksman' ? 'ar' : 'smg';
  const baseTag = BOT_CALLSIGNS[index % BOT_CALLSIGNS.length];
  const suffix = index >= BOT_CALLSIGNS.length ? `_${index + 1}` : '';
  const skinId = resolveBotSkin(baseTag, index);
  const skinDef = getSkinDef(skinId);

  return {
    id: `bot_${index + 1}`,
    name: `${baseTag}${suffix}`,
    isHuman: false,
    isLocal: false,
    archetype,
    skinId,
    colorHex: skinDef.shirtHex,
    x: bx,
    y: by,
    z: bz,
    vx: 0,
    vy: 0,
    vz: 0,
    yaw: rand() * Math.PI * 2,
    pitch: 0,
    hp: 100,
    maxHp: 100,
    shield: index % 3 === 0 ? 50 : 25,
    maxShield: 100,
    alive: true,
    grounded: true,
    crouching: false,
    eliminations: 0,
    activeWeapon: primaryWeapon,
    activeRarity: index % 5 === 0 ? 'rare' : index % 2 === 0 ? 'uncommon' : 'common',
    buildMode: false,
    selectedBuild: 'wall',
    buildMaterial: 'wood',
    materials: { wood: 160, brick: 60, metal: 30 },
    slots: [
      { weaponId: 'pickaxe', rarity: 'common', ammo: 0, count: 1 },
      { weaponId: primaryWeapon, rarity: 'uncommon', ammo: 30, count: 1 },
      { weaponId: archetype === 'marksman' ? 'sniper' : 'ar', rarity: 'common', ammo: 30, count: 1 },
      { weaponId: 'mini_shield', rarity: 'uncommon', ammo: 0, count: 2 },
      null,
    ],
    activeSlot: 1,
    fireCooldown: 0.5 + rand() * 1.1,
    reloadTimer: 0,
    swingAnim: 0,
    hurtFlash: 0,
    aiTargetId: null,
    aiStrafeDir: rand() > 0.5 ? 1 : -1,
    aiStrafeTimer: 1.5 + rand() * 2,
    aiBuildCooldown: 0,
    aiLootTargetId: null,
    aiBurstCount: 0,
    aiLastDamagedTime: -10,
  };
}

export function computeBotIntent(
  bot: CombatantState,
  allCombatants: CombatantState[],
  storm: StormState,
  loot: LootPickup[],
  structures: StructurePiece[],
  matchTime: number,
  dt: number,
): BotIntent {
  const archetype = bot.archetype ?? 'rotator';
  bot.aiStrafeTimer = (bot.aiStrafeTimer ?? 1.5) - dt;
  bot.aiBuildCooldown = Math.max(0, (bot.aiBuildCooldown ?? 0) - dt);
  if (bot.aiStrafeTimer <= 0) {
    bot.aiStrafeDir = -(bot.aiStrafeDir ?? 1);
    bot.aiStrafeTimer = 1.1 + (((bot.x * 13.7 + bot.z * 7.3) % 1.4) + 1.4) % 1.4;
  }

  // 1. Heal if low HP/Shield and safe from immediate rush
  if (
    (bot.hp < 55 || bot.shield < 25) &&
    (bot.slots[3]?.count ?? 0) > 0 &&
    matchTime - (bot.aiLastDamagedTime ?? -10) > 2.5
  ) {
    return {
      moveX: 0,
      moveZ: 0,
      jump: false,
      aimYaw: bot.yaw,
      aimPitch: 0,
      shoot: false,
      weaponToUse: 'mini_shield',
      buildRequest: null,
      healRequest: true,
    };
  }

  // 2. Storm rotation priority
  const distToStormCenter = Math.hypot(bot.x - storm.centerX, bot.z - storm.centerZ);
  const nearStormEdge = !isInsideSafeZone(bot.x, bot.z, storm) || distToStormCenter > storm.radius * 0.85;

  // 3. Find nearest valid opponent using fast squared-distance pruning
  let nearestTarget: CombatantState | null = null;
  const maxSight = archetype === 'marksman' ? 72 : archetype === 'rusher' ? 56 : 52;
  let nearestDistSq = maxSight * maxSight;

  for (let i = 0; i < allCombatants.length; i++) {
    const other = allCombatants[i];
    if (!other.alive || other.id === bot.id) continue;
    if (other.isLocal && matchTime < 5.0) continue;

    const dx = other.x - bot.x;
    const dz = other.z - bot.z;
    if (Math.abs(dx) > maxSight || Math.abs(dz) > maxSight) continue;
    const dSq = dx * dx + dz * dz;
    if (dSq < nearestDistSq) {
      nearestDistSq = dSq;
      nearestTarget = other;
    }
  }
  const nearestDist = Math.sqrt(nearestDistSq);

  // 4. Reactive defensive building if recently hit
  let buildRequest: BuildPieceType | null = null;
  if (
    matchTime - (bot.aiLastDamagedTime ?? -10) < 0.7 &&
    (bot.aiBuildCooldown ?? 0) <= 0 &&
    bot.materials.wood >= 10
  ) {
    buildRequest = archetype === 'rusher' ? 'ramp' : 'wall';
    bot.aiBuildCooldown = archetype === 'marksman' ? 3.2 : 4.2;
  }

  // 5. Storm escape movement overrides looting
  if (nearStormEdge && (!nearestTarget || nearestDist > 26)) {
    const toCenterX = storm.centerX - bot.x;
    const toCenterZ = storm.centerZ - bot.z;
    const len = Math.hypot(toCenterX, toCenterZ) || 1;
    const mx = toCenterX / len;
    const mz = toCenterZ / len;
    return {
      moveX: mx,
      moveZ: mz,
      jump: false,
      aimYaw: Math.atan2(-mx, -mz),
      aimPitch: 0,
      shoot: false,
      weaponToUse: bot.activeWeapon,
      buildRequest,
      healRequest: false,
    };
  }

  // 6. Combat behavior per archetype
  if (nearestTarget) {
    const dx = nearestTarget.x - bot.x;
    const dz = nearestTarget.z - bot.z;
    const dy = nearestTarget.y + 1.1 - (bot.y + 1.35);
    const horizDist = Math.hypot(dx, dz) || 1;
    const dirX = dx / horizDist;
    const dirZ = dz / horizDist;
    const strafeX = -dirZ * (bot.aiStrafeDir ?? 1);
    const strafeZ = dirX * (bot.aiStrafeDir ?? 1);

    const aimYaw = Math.atan2(-dirX, -dirZ);
    const aimPitch = Math.max(-0.6, Math.min(0.6, Math.atan2(dy, horizDist)));

    let moveX = 0;
    let moveZ = 0;
    let weaponToUse: WeaponId = bot.activeWeapon;
    let jump = false;

    if (archetype === 'rusher') {
      weaponToUse = horizDist < 18 ? 'shotgun' : 'smg';
      if (horizDist > 8) {
        moveX = dirX * 0.85 + strafeX * 0.35;
        moveZ = dirZ * 0.85 + strafeZ * 0.35;
      } else {
        moveX = strafeX * 0.9;
        moveZ = strafeZ * 0.9;
        jump = (bot.aiStrafeTimer ?? 0) < 0.15;
      }
    } else if (archetype === 'marksman') {
      weaponToUse = horizDist > 42 && bot.slots[2]?.weaponId === 'sniper' ? 'sniper' : 'ar';
      if (horizDist < 20) {
        moveX = -dirX * 0.75 + strafeX * 0.55;
        moveZ = -dirZ * 0.75 + strafeZ * 0.55;
      } else if (horizDist > 40) {
        moveX = dirX * 0.65 + strafeX * 0.4;
        moveZ = dirZ * 0.65 + strafeZ * 0.4;
      } else {
        moveX = strafeX * 0.85;
        moveZ = strafeZ * 0.85;
      }
    } else {
      weaponToUse = horizDist < 15 ? 'smg' : 'ar';
      const approach = horizDist > 24 ? 0.55 : horizDist < 12 ? -0.45 : 0.1;
      moveX = dirX * approach + strafeX * 0.8;
      moveZ = dirZ * approach + strafeZ * 0.8;
    }

    const mLen = Math.hypot(moveX, moveZ) || 1;
    moveX /= mLen;
    moveZ /= mLen;

    let blockedByWall = false;
    const probeX = bot.x + dirX * 2.2;
    const probeZ = bot.z + dirZ * 2.2;
    for (let i = 0; i < structures.length; i++) {
      const s = structures[i];
      if (s.hp <= 0 || s.kind !== 'wall') continue;
      if (Math.abs(s.x - probeX) < 2.2 && Math.abs(s.z - probeZ) < 2.2 && Math.abs(s.y - bot.y) < 2.5) {
        blockedByWall = true;
        break;
      }
    }

    return {
      moveX,
      moveZ,
      jump,
      aimYaw,
      aimPitch,
      shoot: horizDist < (weaponToUse === 'shotgun' ? 24 : 60) || blockedByWall,
      weaponToUse: blockedByWall && horizDist > 16 ? 'pickaxe' : weaponToUse,
      buildRequest,
      healRequest: false,
    };
  }

  // 7. No target visible: seek nearby uncollected loot or patrol toward safe zone
  let bestLoot: LootPickup | null = null;
  let bestLootDist = 32;
  for (let i = 0; i < loot.length; i++) {
    const item = loot[i];
    if (item.collected) continue;
    const d = Math.hypot(item.x - bot.x, item.z - bot.z);
    if (d < bestLootDist) {
      bestLootDist = d;
      bestLoot = item;
    }
  }

  const seedAngle = (Number(bot.id.slice(4)) || 1) * 1.7 + matchTime * 0.06;
  const patrolRadius = Math.min(125, storm.radius * 0.52);
  const goalX = bestLoot ? bestLoot.x : storm.targetCenterX + Math.cos(seedAngle) * patrolRadius;
  const goalZ = bestLoot ? bestLoot.z : storm.targetCenterZ + Math.sin(seedAngle) * patrolRadius;
  const gx = goalX - bot.x;
  const gz = goalZ - bot.z;
  const gLen = Math.hypot(gx, gz) || 1;

  return {
    moveX: gx / gLen,
    moveZ: gz / gLen,
    jump: false,
    aimYaw: Math.atan2(-(gx / gLen), -(gz / gLen)),
    aimPitch: 0,
    shoot: false,
    weaponToUse: bot.activeWeapon,
    buildRequest: null,
    healRequest: false,
  };
}
