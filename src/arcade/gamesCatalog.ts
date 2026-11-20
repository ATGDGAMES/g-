import type {
  ArcadeCategory,
  ArcadeGameId,
  ArcadeGameMeta,
  RemoteU7CatalogEntry,
} from './types';

const CATEGORY_ACCENTS: Record<Exclude<ArcadeCategory, 'all' | 'favorites'>, string> = {
  driving: '#84CC16',
  action: '#EF4444',
  skill: '#22C55E',
  sports: '#38BDF8',
};

const CATEGORY_FALLBACK_COVERS: Record<Exclude<ArcadeCategory, 'all' | 'favorites'>, string> = {
  driving: '/src/assets/images/cover_mad_pursuit_1795133608752.jpg',
  action: '/src/assets/images/cover_gta_vice_1795133608475.jpg',
  skill: '/src/assets/images/cover_level_67_1795133608104.jpg',
  sports: '/src/assets/images/cover_snow_rider_1795133624144.jpg',
};

const CATEGORY_CONTROLS_HINTS: Record<Exclude<ArcadeCategory, 'all' | 'favorites'>, string> = {
  driving: 'WASD / Arrows Drive · Space Boost / Brake',
  action: 'WASD Move · Mouse Aim & Click · R Reload',
  skill: 'Click / Space / Arrows · Instant Retry',
  sports: 'Arrows / WASD Move · Space Action',
};

export const ARCADE_GAMES: ArcadeGameMeta[] = [
  {
    id: 'tilted-pines',
    title: 'Tilted Pines BR',
    tagline: '100-player Chapter 1 Battle Royale with P2P multiplayer, 8 POIs, destructible buildings, and Locker skins including Neegy.',
    category: 'action',
    controlsHint: 'WASD Move · Click Shoot · Q/E/C Build · B Locker',
    badgeText: '100P P2P 3D',
    accentHex: '#FACC15',
    coverUrl: '/src/assets/images/cover_tilted_pines_1795133609153.jpg',
    fallbackCoverUrl: '/src/assets/images/cover_tilted_pines_1795133609153.jpg',
    featuredRank: 1,
    tags: ['fortnite', 'battle royale', '3d', 'multiplayer', 'p2p', 'shooter', 'neegy', 'skins'],
    is3DFlagship: true,
  },
  {
    id: 'driving-games/mad-pursuit',
    title: 'Mad Pursuit',
    tagline: 'Full Drive U-7 edition — drift through city intersections, smash police interceptors, and escape the heat ad-free.',
    category: 'driving',
    controlsHint: 'WASD / Arrows Steer · Space Drift / Nitro',
    badgeText: 'AD-FREE IFRAME',
    accentHex: '#84CC16',
    coverUrl: '/src/assets/images/cover_mad_pursuit_1795133608752.jpg',
    fallbackCoverUrl: '/src/assets/images/cover_mad_pursuit_1795133608752.jpg',
    featuredRank: 2,
    tags: ['mad pursuit', 'car vs police', 'chase', 'drift', 'nitro', 'driving'],
    u7Slug: 'driving-games/mad-pursuit',
  },
  {
    id: 'new-games/level-67',
    title: 'Level 67',
    tagline: 'Official Drive U-7 viral wave gauntlet — hold to climb, release to dive, and clear all 67 precision sectors ad-free.',
    category: 'skill',
    controlsHint: 'Hold Space / Click Climb · Release Dive',
    badgeText: 'AD-FREE IFRAME',
    accentHex: '#22C55E',
    coverUrl: '/src/assets/images/cover_level_67_1795133608104.jpg',
    fallbackCoverUrl: '/src/assets/images/cover_level_67_1795133608104.jpg',
    featuredRank: 3,
    tags: ['level 67', '67', 'wave', 'geometry', 'dash', 'hard', 'skill'],
    u7Slug: 'new-games/level-67',
  },
  {
    id: 'gta',
    title: 'GTA Vice City',
    tagline: 'Play the full open-world Vice City driving & action sandbox straight from Drive U-7 with zero ad popups.',
    category: 'driving',
    controlsHint: 'WASD Move/Drive · F Enter Car · Click Shoot',
    badgeText: 'AD-FREE IFRAME',
    accentHex: '#EC4899',
    coverUrl: '/src/assets/images/cover_gta_vice_1795133608475.jpg',
    fallbackCoverUrl: '/src/assets/images/cover_gta_vice_1795133608475.jpg',
    featuredRank: 4,
    tags: ['gta', 'vice city', 'open world', 'cars', 'police', 'miami', 'driving'],
    u7Slug: 'gta',
  },
  {
    id: 'flash-games/fortnite',
    title: 'GTA',
    tagline: 'Drive U-7 homepage featured GTA / Drive Auto sandbox — free-roam city driving and chaos in a clean ad-free iframe.',
    category: 'driving',
    controlsHint: 'WASD Drive · Space Brake · Mouse Camera',
    badgeText: 'AD-FREE IFRAME',
    accentHex: '#F43F5E',
    coverUrl: '/src/assets/images/cover_gta_vice_1795133608475.jpg',
    fallbackCoverUrl: '/src/assets/images/cover_gta_vice_1795133608475.jpg',
    featuredRank: 5,
    tags: ['gta', 'drive auto', 'sandbox', 'cars', 'u7 home'],
    u7Slug: 'flash-games/fortnite',
  },
  {
    id: 'survival-race',
    title: 'Race',
    tagline: 'Official Survival Race arena from Drive U-7 — drift across falling hex tiles and knock rival cars into the sky.',
    category: 'driving',
    controlsHint: 'A/D or Left/Right Steer · Space Jump',
    badgeText: 'AD-FREE IFRAME',
    accentHex: '#38BDF8',
    coverUrl: '/src/assets/images/cover_survival_race_1795133623416.jpg',
    fallbackCoverUrl: '/src/assets/images/cover_survival_race_1795133623416.jpg',
    featuredRank: 6,
    tags: ['race', 'survival race', 'hex', 'drift', 'cars', 'stunt'],
    u7Slug: 'survival-race',
  },
  {
    id: 'snow-rider',
    title: 'Snow Rider',
    tagline: 'Carve down the endless 3D winter slope from Drive U-7, leap over logs, and dodge giant rolling snowballs.',
    category: 'sports',
    controlsHint: 'Left/Right or A/D Steer · Up/Space Jump',
    badgeText: 'AD-FREE IFRAME',
    accentHex: '#60A5FA',
    coverUrl: '/src/assets/images/cover_snow_rider_1795133624144.jpg',
    fallbackCoverUrl: '/src/assets/images/cover_snow_rider_1795133624144.jpg',
    featuredRank: 7,
    tags: ['snow rider', 'snow', 'sled', 'runner', 'winter', 'sports'],
    u7Slug: 'snow-rider',
  },
  {
    id: 'paper-io-2',
    title: 'Paper.io 2',
    tagline: 'Claim territory and slice rival trails in the full Drive U-7 Paper.io 2 build with all ad scripts removed.',
    category: 'skill',
    controlsHint: 'Mouse / WASD / Arrows Steer',
    badgeText: 'AD-FREE IFRAME',
    accentHex: '#A855F7',
    coverUrl: '/src/assets/images/cover_paper_io_1795133623788.jpg',
    fallbackCoverUrl: '/src/assets/images/cover_paper_io_1795133623788.jpg',
    featuredRank: 8,
    tags: ['paper.io', 'io', 'territory', 'bots', 'arena', 'skill'],
    u7Slug: 'paper-io-2',
  },
  {
    id: 'basket-random',
    title: 'Basket Random',
    tagline: 'Official 1P/2P ragdoll physics basketball from Drive U-7 — zero bottom banners or interstitials.',
    category: 'sports',
    controlsHint: 'W / Up Arrow Jump & Dunk',
    badgeText: 'AD-FREE IFRAME',
    accentHex: '#F97316',
    coverUrl: '/src/assets/images/cover_basket_random_1795133623879.jpg',
    fallbackCoverUrl: '/src/assets/images/cover_basket_random_1795133623879.jpg',
    featuredRank: 9,
    tags: ['basket random', 'basketball', '2 player', 'sports', 'arcade'],
    u7Slug: 'basket-random',
  },
  {
    id: 'knife-hit',
    title: 'Knife Hit',
    tagline: 'Flip blades cleanly into spinning targets and boss wheels without hitting embedded knives.',
    category: 'skill',
    controlsHint: 'Click / Space Throw Knife',
    badgeText: 'AD-FREE IFRAME',
    accentHex: '#EF4444',
    coverUrl: '/src/assets/images/cover_knife_hit_1795133623548.jpg',
    fallbackCoverUrl: '/src/assets/images/cover_knife_hit_1795133623548.jpg',
    featuredRank: 10,
    tags: ['knife hit', 'super knife', 'timing', 'target', 'boss', 'skill'],
    u7Slug: 'knife-hit',
  },
  {
    id: '67-clicker',
    title: '67 Clicker',
    tagline: 'Official Drive U-7 67 Clicker — stack multipliers and unlock prestige tiers without popup overlays.',
    category: 'action',
    controlsHint: 'Click Core · Buy Upgrades',
    badgeText: 'AD-FREE IFRAME',
    accentHex: '#F59E0B',
    coverUrl: '/src/assets/images/cover_67_clicker_1795133623872.jpg',
    fallbackCoverUrl: '/src/assets/images/cover_67_clicker_1795133623872.jpg',
    featuredRank: 11,
    tags: ['67 clicker', 'clicker', 'idle', 'meme', 'tycoon'],
    u7Slug: '67-clicker',
  },
];

export const ARCADE_CATEGORIES: Array<{ id: ArcadeCategory; label: string }> = [
  { id: 'all', label: 'All Games' },
  { id: 'action', label: 'Action' },
  { id: 'driving', label: 'Driving' },
  { id: 'skill', label: 'Skill & IO' },
  { id: 'sports', label: 'Sports' },
  { id: 'favorites', label: 'Saved' },
];

export const CLOAK_PRESET = {
  normalTitle: 'CLUTCH U7 — Ad-Free Drive U-7 Unblocked Games',
  cloakTitle: 'Unit 4 Literary Analysis — Google Docs',
  cloakDocHeader: 'Unit 4: Post-Modern Spatial Architecture & Narrative Flow',
};

/**
 * Merges the live Drive U-7 homepage catalog into our seeded catalog so
 * Tilted Pines BR + all ~78 real Drive U-7 games appear with authentic
 * thumbnails and clean ad-free iframe launches.
 */
export function mergeDriveU7Catalog(
  baseGames: ArcadeGameMeta[],
  remoteEntries: RemoteU7CatalogEntry[],
): ArcadeGameMeta[] {
  const bySlug = new Map<string, ArcadeGameMeta>();
  const result: ArcadeGameMeta[] = baseGames.map((g) => {
    const copy = { ...g };
    if (copy.u7Slug) {
      bySlug.set(copy.u7Slug, copy);
    }
    return copy;
  });

  for (const remote of remoteEntries) {
    const existing = bySlug.get(remote.slug);
    if (existing) {
      if (remote.imgUrl) {
        existing.coverUrl = remote.imgUrl;
      }
      if (remote.title && remote.slug !== 'gta') {
        existing.title = remote.title;
      }
      continue;
    }

    const cat = remote.category || 'skill';
    const fallbackCover = CATEGORY_FALLBACK_COVERS[cat];
    const item: ArcadeGameMeta = {
      id: remote.slug,
      title: remote.title,
      tagline: `Play ${remote.title} straight from Drive U-7 inside a clean, ad-stripped iframe stage.`,
      category: cat,
      controlsHint: CATEGORY_CONTROLS_HINTS[cat],
      badgeText: 'AD-FREE IFRAME',
      accentHex: CATEGORY_ACCENTS[cat],
      coverUrl: remote.imgUrl || fallbackCover,
      fallbackCoverUrl: fallbackCover,
      featuredRank: 100 + remote.rank,
      tags: [
        remote.title.toLowerCase(),
        remote.slug.toLowerCase().replace(/[/\-_]+/g, ' '),
        cat,
        'drive u7',
      ],
      u7Slug: remote.slug,
    };
    bySlug.set(remote.slug, item);
    result.push(item);
  }

  return result;
}

const SLUG_ALIAS_MAP: Record<string, string> = {
  'gta-vice-city': 'gta',
  'mad-pursuit': 'driving-games/mad-pursuit',
  'level-67': 'new-games/level-67',
};

export function normalizeArcadeGameId(id: string | null | undefined): string | null {
  if (!id) return null;
  return SLUG_ALIAS_MAP[id] ?? id;
}

export function isValidArcadeGameId(
  value: string | null | undefined,
  games: ArcadeGameMeta[] = ARCADE_GAMES,
): value is ArcadeGameId {
  if (!value) return false;
  const normalized = normalizeArcadeGameId(value);
  return games.some((g) => g.id === normalized || g.u7Slug === normalized);
}

export function getArcadeGame(
  id: ArcadeGameId,
  games: ArcadeGameMeta[] = ARCADE_GAMES,
): ArcadeGameMeta {
  const normalized = normalizeArcadeGameId(id) ?? id;
  return (
    games.find((g) => g.id === normalized || g.u7Slug === normalized) ?? games[0]
  );
}

export function filterArcadeGames(
  games: ArcadeGameMeta[],
  category: ArcadeCategory,
  query: string,
  favoriteIds: ArcadeGameId[],
): ArcadeGameMeta[] {
  const normalized = query.trim().toLowerCase();
  return games.filter((game) => {
    if (category === 'favorites') {
      if (!favoriteIds.includes(game.id)) return false;
    } else if (category !== 'all' && game.category !== category) {
      return false;
    }

    if (!normalized) return true;
    const haystack = `${game.title} ${game.tagline} ${game.category} ${game.id} ${game.tags.join(' ')}`.toLowerCase();
    return haystack.includes(normalized);
  });
}

export function toggleFavoriteGame(favoriteIds: ArcadeGameId[], id: ArcadeGameId): ArcadeGameId[] {
  if (favoriteIds.includes(id)) {
    return favoriteIds.filter((item) => item !== id);
  }
  return [...favoriteIds, id];
}

export function pushRecentGame(
  recentIds: ArcadeGameId[],
  id: ArcadeGameId,
  limit = 6,
): ArcadeGameId[] {
  const next = [id, ...recentIds.filter((item) => item !== id)];
  return next.slice(0, limit);
}

export interface InitialArcadeRoute {
  activeGameId: ArcadeGameId | null;
  autoStartTiltedPines: boolean;
}

export function resolveInitialArcadeRoute(search: string): InitialArcadeRoute {
  const params = new URLSearchParams(search);
  if (params.get('autostart') === '1') {
    return {
      activeGameId: 'tilted-pines',
      autoStartTiltedPines: true,
    };
  }
  const requested = params.get('game');
  if (requested && /^[a-z0-9/_-]+$/i.test(requested)) {
    const normalized = normalizeArcadeGameId(requested);
    if (normalized) {
      return {
        activeGameId: normalized,
        autoStartTiltedPines: false,
      };
    }
  }
  return {
    activeGameId: null,
    autoStartTiltedPines: false,
  };
}
