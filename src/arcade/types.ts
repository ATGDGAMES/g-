export type ArcadeGameId = string;

export type ArcadeCategory = 'all' | 'action' | 'driving' | 'skill' | 'sports' | 'favorites';

export interface ArcadeGameMeta {
  id: ArcadeGameId;
  title: string;
  tagline: string;
  category: Exclude<ArcadeCategory, 'all' | 'favorites'>;
  controlsHint: string;
  badgeText: string;
  accentHex: string;
  coverUrl: string;
  fallbackCoverUrl?: string;
  featuredRank: number;
  tags: string[];
  is3DFlagship?: boolean;
  u7Slug?: string;
}

export interface RemoteU7CatalogEntry {
  slug: string;
  title: string;
  category: Exclude<ArcadeCategory, 'all' | 'favorites'>;
  rank: number;
  imgUrl: string;
}

export type CanvasGamePhase = 'title' | 'playing' | 'paused' | 'gameover';

export interface CanvasGameSnapshot {
  phase: CanvasGamePhase;
  score: number;
  bestScore: number;
  primaryLabel: string;
  primaryValue: string;
  secondaryLabel: string;
  secondaryValue: string;
  victory?: boolean;
  summaryText?: string;
}

export interface CanvasGameCallbacks {
  onSnapshot: (snapshot: CanvasGameSnapshot) => void;
}

export interface CanvasGameController {
  start: () => void;
  pause: () => void;
  resume: () => void;
  restart: () => void;
  setMuted: (muted: boolean) => void;
  destroy: () => void;
}
