import type { SkinId, WeaponRarity } from './types';

export interface SkinDef {
  id: SkinId;
  name: string;
  subtitle: string;
  rarity: WeaponRarity;
  shirtHex: number;
  pantsHex: number;
  skinHex: number;
  hairHex: number;
  accentHex: number;
  imageUrl?: string;
}

export const SKINS: SkinDef[] = [
  {
    id: 'jonesy',
    name: 'Explorer',
    subtitle: 'Ch.1 Classic',
    rarity: 'common',
    shirtHex: 0x0284c7,
    pantsHex: 0x334155,
    skinHex: 0xe6b596,
    hairHex: 0xd4a34f,
    accentHex: 0x38bdf8,
  },
  {
    id: 'neegy',
    name: 'Neegy',
    subtitle: 'Long-Neck Icon',
    rarity: 'legendary',
    shirtHex: 0xfde047,
    pantsHex: 0x3b4d63,
    skinHex: 0xf0c4a4,
    hairHex: 0xf0c4a4,
    accentHex: 0x38bdf8,
    imageUrl: '/assets/aistudio/images__2__9151d280.jpeg',
  },
  {
    id: 'skull_trooper',
    name: 'Skull Trooper',
    subtitle: 'Phantom Guard',
    rarity: 'epic',
    shirtHex: 0x111827,
    pantsHex: 0x0f172a,
    skinHex: 0xf8fafc,
    hairHex: 0x111827,
    accentHex: 0x38bdf8,
  },
  {
    id: 'brite_bomber',
    name: 'Brite Bomber',
    subtitle: 'Neon Striker',
    rarity: 'rare',
    shirtHex: 0xdb2777,
    pantsHex: 0x4c1d95,
    skinHex: 0xe6b596,
    hairHex: 0x22d3ee,
    accentHex: 0xfacc15,
  },
  {
    id: 'black_knight',
    name: 'Black Knight',
    subtitle: 'Wailing Bane',
    rarity: 'legendary',
    shirtHex: 0x18181b,
    pantsHex: 0x09090b,
    skinHex: 0x18181b,
    hairHex: 0x27272a,
    accentHex: 0xef4444,
  },
  {
    id: 'cuddle_team',
    name: 'Cuddle Team',
    subtitle: 'Plush Leader',
    rarity: 'legendary',
    shirtHex: 0xf43f8e,
    pantsHex: 0xdb2777,
    skinHex: 0xf43f8e,
    hairHex: 0xfbcfe8,
    accentHex: 0x0f172a,
  },
];

export const SKIN_MAP: Record<SkinId, SkinDef> = {
  jonesy: SKINS[0],
  neegy: SKINS[1],
  skull_trooper: SKINS[2],
  brite_bomber: SKINS[3],
  black_knight: SKINS[4],
  cuddle_team: SKINS[5],
};

export function isValidSkinId(value: string | null | undefined): value is SkinId {
  return Boolean(value && value in SKIN_MAP);
}

export function getSkinDef(id: SkinId | undefined): SkinDef {
  if (id && id in SKIN_MAP) {
    return SKIN_MAP[id];
  }
  return SKIN_MAP.jonesy;
}
