export type GamePhase = 'title' | 'playing' | 'paused' | 'gameover';

export type WeaponId =
  | 'pickaxe'
  | 'ar'
  | 'shotgun'
  | 'smg'
  | 'sniper'
  | 'mini_shield'
  | 'medkit';

export type WeaponRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type MaterialType = 'wood' | 'brick' | 'metal';

export type BuildPieceType = 'wall' | 'floor' | 'ramp' | 'roof';

export type StructureVariant = 'solid' | 'doorway' | 'window';

export type BotArchetype = 'rusher' | 'marksman' | 'rotator';

export type SkinId =
  | 'jonesy'
  | 'neegy'
  | 'skull_trooper'
  | 'brite_bomber'
  | 'black_knight'
  | 'cuddle_team';

export interface WeaponDef {
  id: WeaponId;
  name: string;
  shortName: string;
  kind: 'melee' | 'hitscan' | 'pellet' | 'heal';
  damage: number;
  structureDamage: number;
  fireRate: number; // shots per second
  magSize: number;
  reloadTime: number; // seconds
  range: number;
  spread: number; // radians
  pellets: number;
  headshotMult: number;
  healAmount?: number;
  healTarget?: 'hp' | 'shield';
  maxHealCap?: number;
}

export interface InventorySlot {
  weaponId: WeaponId;
  rarity: WeaponRarity;
  ammo: number;
  count: number; // used for consumables
}

export interface StructurePiece {
  id: string;
  kind: BuildPieceType;
  variant: StructureVariant;
  material: MaterialType;
  x: number;
  y: number;
  z: number;
  rotY: number; // radians, multiples of PI/2
  hp: number;
  maxHp: number;
  isPlayerBuilt: boolean;
  ownerId?: string;
  isTree?: boolean;
  isRock?: boolean;
  scale?: number;
}

export interface LootPickup {
  id: string;
  weaponId: WeaponId;
  rarity: WeaponRarity;
  ammo: number;
  count: number;
  x: number;
  y: number;
  z: number;
  collected: boolean;
}

export interface ChestNode {
  id: string;
  x: number;
  y: number;
  z: number;
  rotY: number;
  opened: boolean;
}

export interface CombatantState {
  id: string;
  name: string;
  isHuman: boolean;
  isLocal: boolean;
  archetype?: BotArchetype;
  skinId: SkinId;
  colorHex: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  yaw: number;
  pitch: number;
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  alive: boolean;
  grounded: boolean;
  crouching: boolean;
  eliminations: number;
  activeWeapon: WeaponId;
  activeRarity: WeaponRarity;
  buildMode: boolean;
  selectedBuild: BuildPieceType;
  buildMaterial: MaterialType;
  materials: Record<MaterialType, number>;
  slots: (InventorySlot | null)[];
  activeSlot: number;
  fireCooldown: number;
  reloadTimer: number;
  swingAnim: number;
  hurtFlash: number;
  // Bot AI internal fields
  aiTargetId?: string | null;
  aiStrafeDir?: number;
  aiStrafeTimer?: number;
  aiBuildCooldown?: number;
  aiLootTargetId?: string | null;
  aiBurstCount?: number;
  aiLastDamagedTime?: number;
}

export interface StormState {
  phase: number;
  phaseTimer: number;
  phaseDuration: number;
  isShrinking: boolean;
  centerX: number;
  centerZ: number;
  radius: number;
  startCenterX: number;
  startCenterZ: number;
  startRadius: number;
  targetCenterX: number;
  targetCenterZ: number;
  targetRadius: number;
  damagePerSecond: number;
}

export interface KillFeedEntry {
  id: string;
  killerName: string;
  victimName: string;
  weaponName: string;
  timestamp: number;
}

export interface MinimapMarker {
  x: number;
  z: number;
  yaw?: number;
  kind: 'player' | 'peer' | 'bot' | 'chest' | 'shot';
}

export interface HudSnapshot {
  phase: GamePhase;
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  aliveCount: number;
  totalCombatants: number;
  eliminations: number;
  damageDealt: number;
  structuresBuilt: number;
  placement: number;
  materials: Record<MaterialType, number>;
  slots: (InventorySlot | null)[];
  activeSlot: number;
  buildMode: boolean;
  selectedBuild: BuildPieceType;
  buildMaterial: MaterialType;
  buildRotation: number;
  isReloading: boolean;
  isAiming: boolean;
  inStorm: boolean;
  stormPhase: number;
  stormTimer: number;
  stormShrinking: boolean;
  stormCenterX: number;
  stormCenterZ: number;
  stormRadius: number;
  stormTargetCenterX: number;
  stormTargetCenterZ: number;
  stormTargetRadius: number;
  playerX: number;
  playerZ: number;
  playerYaw: number;
  interactPrompt: string | null;
  hitMarkerKind: 'none' | 'body' | 'crit' | 'kill' | 'structure';
  killFeed: KillFeedEntry[];
  minimapMarkers: MinimapMarker[];
  pointerLocked: boolean;
  muted: boolean;
  matchTime: number;
  p2pPeersConnected: number;
  killerName: string | null;
}

export interface P2PPeerInfo {
  peerId: string;
  name: string;
  isHost: boolean;
  rtcState: 'connecting' | 'connected' | 'relay';
}

export type P2PMessage =
  | {
      type: 'player:state';
      peerId: string;
      name: string;
      x: number;
      y: number;
      z: number;
      yaw: number;
      pitch: number;
      hp: number;
      shield: number;
      alive: boolean;
      activeWeapon: WeaponId;
      activeRarity: WeaponRarity;
      buildMode: boolean;
      skinId?: SkinId;
    }
  | {
      type: 'world:snapshot';
      structures: StructurePiece[];
      chests: ChestNode[];
      storm: StormState;
      bots: Array<{
        id: string;
        name: string;
        archetype: BotArchetype;
        skinId?: SkinId;
        x: number;
        y: number;
        z: number;
        yaw: number;
        hp: number;
        shield: number;
        alive: boolean;
        activeWeapon: WeaponId;
        colorHex: number;
      }>;
    }
  | {
      type: 'struct:place';
      piece: StructurePiece;
    }
  | {
      type: 'struct:damage';
      id: string;
      damage: number;
      attackerId: string;
    }
  | {
      type: 'combat:shot';
      shooterId: string;
      ox: number;
      oy: number;
      oz: number;
      dx: number;
      dy: number;
      dz: number;
      weaponId: WeaponId;
    }
  | {
      type: 'combat:hit';
      targetId: string;
      attackerId: string;
      attackerName: string;
      damage: number;
      weaponId: WeaponId;
    }
  | {
      type: 'chest:open';
      chestId: string;
    }
  | {
      type: 'loot:collect';
      lootId: string;
    };
