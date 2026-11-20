import type {
  BuildPieceType,
  CombatantState,
  MaterialType,
  StructurePiece,
  WeaponId,
  WeaponRarity,
} from './types';
import { MATERIAL_MAX_HP } from './mapData';
import { getWeaponDamage, WEAPONS } from './weapons';

export const BUILD_COST = 10;

export interface DamageResult {
  shieldLost: number;
  hpLost: number;
  eliminated: boolean;
}

/**
 * Fortnite damage model: Shield absorbs non-storm damage first; Storm bypasses shield.
 */
export function applyDamage(
  target: Pick<CombatantState, 'hp' | 'shield' | 'alive'>,
  amount: number,
  bypassShield = false,
): DamageResult {
  if (!target.alive || amount <= 0) {
    return { shieldLost: 0, hpLost: 0, eliminated: false };
  }

  let remaining = amount;
  let shieldLost = 0;

  if (!bypassShield && target.shield > 0) {
    shieldLost = Math.min(target.shield, remaining);
    target.shield = Math.max(0, target.shield - shieldLost);
    remaining -= shieldLost;
  }

  const hpLost = Math.min(target.hp, remaining);
  target.hp = Math.max(0, target.hp - hpLost);

  const eliminated = target.hp <= 0;
  if (eliminated) {
    target.alive = false;
  }

  return { shieldLost, hpLost, eliminated };
}

export function applyHealing(
  target: Pick<CombatantState, 'hp' | 'maxHp' | 'shield' | 'maxShield'>,
  weaponId: WeaponId,
): boolean {
  const def = WEAPONS[weaponId];
  if (def.kind !== 'heal' || !def.healAmount) return false;

  if (def.healTarget === 'shield') {
    const cap = def.maxHealCap ?? target.maxShield;
    if (target.shield >= cap) return false;
    target.shield = Math.min(cap, target.shield + def.healAmount);
    return true;
  }

  if (def.healTarget === 'hp') {
    const cap = def.maxHealCap ?? target.maxHp;
    if (target.hp >= cap) return false;
    target.hp = Math.min(cap, target.hp + def.healAmount);
    return true;
  }

  return false;
}

export interface StructureHitResult {
  damaged: boolean;
  destroyed: boolean;
  harvestedAmount: number;
  harvestedMaterial: MaterialType;
}

export function damageStructure(
  piece: StructurePiece,
  rawDamage: number,
  isPickaxe: boolean,
  isWeakPointCrit = false,
): StructureHitResult {
  if (piece.hp <= 0) {
    return {
      damaged: false,
      destroyed: false,
      harvestedAmount: 0,
      harvestedMaterial: piece.material,
    };
  }

  const finalDamage = isPickaxe && isWeakPointCrit ? rawDamage * 2 : rawDamage;
  piece.hp = Math.max(0, piece.hp - finalDamage);
  const destroyed = piece.hp <= 0;

  let harvestedAmount = 0;
  if (isPickaxe && !piece.isPlayerBuilt) {
    harvestedAmount = isWeakPointCrit ? 12 : 6;
    if (destroyed) harvestedAmount += 8;
  }

  return {
    damaged: true,
    destroyed,
    harvestedAmount,
    harvestedMaterial: piece.material,
  };
}

export function canPlaceBuildPiece(
  actor: Pick<CombatantState, 'alive' | 'materials'>,
  material: MaterialType,
  existingStructures: StructurePiece[],
  x: number,
  y: number,
  z: number,
  kind: BuildPieceType,
): boolean {
  if (!actor.alive) return false;
  if (actor.materials[material] < BUILD_COST) return false;

  for (let i = 0; i < existingStructures.length; i++) {
    const s = existingStructures[i];
    if (s.hp <= 0) continue;
    if (
      s.kind === kind &&
      Math.abs(s.x - x) < 0.8 &&
      Math.abs(s.y - y) < 0.8 &&
      Math.abs(s.z - z) < 0.8
    ) {
      return false;
    }
  }
  return true;
}

export function createPlayerBuildPiece(
  id: string,
  ownerId: string,
  kind: BuildPieceType,
  material: MaterialType,
  x: number,
  y: number,
  z: number,
  rotY: number,
): StructurePiece {
  const maxHp = MATERIAL_MAX_HP[material];
  return {
    id,
    kind,
    variant: 'solid',
    material,
    x,
    y,
    z,
    rotY,
    hp: maxHp,
    maxHp,
    isPlayerBuilt: true,
    ownerId,
  };
}

export function computeShotDamage(
  weaponId: WeaponId,
  rarity: WeaponRarity,
  isHeadshot: boolean,
  distance: number,
): number {
  const def = WEAPONS[weaponId];
  const base = getWeaponDamage(weaponId, rarity);
  if (base <= 0) return 0;

  let falloff = 1.0;
  if (weaponId === 'shotgun' && distance > 14) {
    falloff = Math.max(0.3, 1 - (distance - 14) / 22);
  } else if ((weaponId === 'ar' || weaponId === 'smg') && distance > 55) {
    falloff = Math.max(0.6, 1 - (distance - 55) / 85);
  }

  const mult = isHeadshot ? def.headshotMult : 1.0;
  return Math.max(1, Math.round(base * mult * falloff));
}
