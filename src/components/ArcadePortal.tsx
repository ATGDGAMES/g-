import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Bookmark,
  EyeOff,
  Maximize2,
  Minimize2,
  Play,
  RotateCcw,
  Search,
  ShieldCheck,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  ARCADE_CATEGORIES,
  ARCADE_GAMES,
  CLOAK_PRESET,
  filterArcadeGames,
  getArcadeGame,
  mergeDriveU7Catalog,
  normalizeArcadeGameId,
  pushRecentGame,
  toggleFavoriteGame,
} from '../arcade/gamesCatalog';
import type {
  ArcadeCategory,
  ArcadeGameId,
  ArcadeGameMeta,
  RemoteU7CatalogEntry,
} from '../arcade/types';
import { TiltedPinesRunner } from './TiltedPinesRunner';
import { IframeGameRunner } from './IframeGameRunner';

interface ArcadePortalProps {
  initialGameId: ArcadeGameId | null;
  autoStartTiltedPines: boolean;
}

const FAVORITES_KEY = 'clutch_u7_favorites';
const RECENT_KEY = 'clutch_u7_recent';

function loadStoredIds(key: string): ArcadeGameId[] {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
      .map((id) => normalizeArcadeGameId(id) ?? id);
  } catch {
    return [];
  }
}

export function ArcadePortal({
  initialGameId,
  autoStartTiltedPines,
}: ArcadePortalProps) {
  const [catalogGames, setCatalogGames] = useState<ArcadeGameMeta[]>(ARCADE_GAMES);
  const [activeGameId, setActiveGameId] = useState<ArcadeGameId | null>(initialGameId);
  const [category, setCategory] = useState<ArcadeCategory>('all');
  const [query, setQuery] = useState('');
  const [favorites, setFavorites] = useState<ArcadeGameId[]>(() => loadStoredIds(FAVORITES_KEY));
  const [recent, setRecent] = useState<ArcadeGameId[]>(() => loadStoredIds(RECENT_KEY));
  const [muted, setMuted] = useState(false);
  const [cloaked, setCloaked] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [restartSignal, setRestartSignal] = useState(0);

  const stageContainerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Hydrate full Drive U-7 homepage lineup dynamically
  useEffect(() => {
    if (autoStartTiltedPines) return;
    let cancelled = false;
    fetch('/api/u7/catalog')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { games?: RemoteU7CatalogEntry[] } | null) => {
        if (!cancelled && data && Array.isArray(data.games) && data.games.length > 0) {
          setCatalogGames(mergeDriveU7Catalog(ARCADE_GAMES, data.games));
        }
      })
      .catch(() => {
        // Keep built-in curated catalog if offline
      });
    return () => {
      cancelled = true;
    };
  }, [autoStartTiltedPines]);

  const activeGame = useMemo(
    () => (activeGameId ? getArcadeGame(activeGameId, catalogGames) : null),
    [activeGameId, catalogGames],
  );

  // Sync page title & URL param cleanly
  useEffect(() => {
    if (cloaked) {
      document.title = CLOAK_PRESET.cloakTitle;
      return;
    }
    if (activeGame) {
      document.title = `${activeGame.title} — CLUTCH U7`;
    } else {
      document.title = CLOAK_PRESET.normalTitle;
    }
  }, [cloaked, activeGame]);

  useEffect(() => {
    if (autoStartTiltedPines) return;
    try {
      const url = new URL(window.location.href);
      if (activeGameId) {
        url.searchParams.set('game', activeGameId);
      } else {
        url.searchParams.delete('game');
      }
      window.history.replaceState({}, '', url.toString());
    } catch {
      // ignore history errors
    }
  }, [activeGameId, autoStartTiltedPines]);

  // Global panic key '[' and '/' search shortcut
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inInput =
        target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA';

      if (e.code === 'BracketLeft' && !inInput) {
        e.preventDefault();
        setCloaked((prev) => !prev);
        return;
      }
      if (e.key === '/' && !inInput && !activeGameId && !cloaked) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeGameId, cloaked]);

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const launchGame = useCallback((id: ArcadeGameId) => {
    setActiveGameId(id);
    setRestartSignal(0);
    setRecent((prev) => {
      const next = pushRecentGame(prev, id);
      try {
        window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const handleToggleFavorite = useCallback((id: ArcadeGameId) => {
    setFavorites((prev) => {
      const next = toggleFavoriteGame(prev, id);
      try {
        window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    const el = stageContainerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {});
    } else {
      void el.requestFullscreen?.().catch(() => {});
    }
  }, []);

  const handleReturnHub = useCallback(() => {
    document.exitPointerLock?.();
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {});
    }
    setActiveGameId(null);
    document.body.dataset.state = 'title';
  }, []);

  const filteredGames = useMemo(
    () => filterArcadeGames(catalogGames, category, query, favorites),
    [catalogGames, category, query, favorites],
  );

  const flagshipGame = catalogGames[0];
  const u7Trio: ArcadeGameMeta[] = useMemo(
    () => [
      getArcadeGame('gta', catalogGames),
      getArcadeGame('driving-games/mad-pursuit', catalogGames),
      getArcadeGame('new-games/level-67', catalogGames),
    ],
    [catalogGames],
  );

  const recentGames = useMemo(
    () =>
      recent
        .map((id) => catalogGames.find((g) => g.id === id || g.u7Slug === id))
        .filter((g): g is ArcadeGameMeta => Boolean(g)),
    [recent, catalogGames],
  );

  // Direct ?autostart=1 mode preserves 100% pure Tilted Pines viewport
  if (autoStartTiltedPines && activeGameId === 'tilted-pines') {
    return <TiltedPinesRunner autoStart muted={muted} />;
  }

  // Study Cloak disguise screen
  if (cloaked) {
    return (
      <div className="w-full h-full overflow-y-auto bg-[#f8f9fa] text-slate-900 p-8 md:p-14">
        <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-lg shadow-sm p-8 md:p-12">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
            <div>
              <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                Google Docs · Saved to Drive
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mt-1">
                {CLOAK_PRESET.cloakDocHeader}
              </h1>
            </div>
            <button
              type="button"
              onClick={() => setCloaked(false)}
              className="px-3 py-1.5 rounded border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Restore View [
            </button>
          </div>
          <div className="space-y-4 text-sm leading-relaxed text-slate-700 font-serif">
            <p>
              <strong>Thesis Statement:</strong> Across twentieth-century urban planning and digital
              environmental storytelling, spatial elevation and destructible boundaries transform
              passive observation into active participatory navigation.
            </p>
            <p>
              <strong>Section I — Coastal Grid Geometry:</strong> Consider how grid-based street
              networks balance predictability with high-velocity improvisation. When traversal nodes
              are clearly demarcated by contrast cues and peripheral landmarks, navigators make
              sub-second routing decisions without explicit directional prompts.
            </p>
            <p>
              <strong>Section II — Kinetic Momentum & Symmetry:</strong> In closed-loop rhythmic
              environments, angular velocity acts as both a constraint and an expressive medium.
              Reversing gravitational orientation forces immediate mental recalibration while
              preserving deterministic fairness across repeated attempts.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Active Game Stage View
  if (activeGame) {
    const isSaved = favorites.includes(activeGame.id);
    return (
      <div
        ref={stageContainerRef}
        className="w-full h-full flex flex-col bg-[#0b0f19] overflow-hidden"
      >
        {/* Crisp 48px Stage Bar above viewport (never obscures active canvas/iframe) */}
        <header className="h-12 shrink-0 px-4 bg-[#0e1422] border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={handleReturnHub}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-100 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Arcade Hub</span>
            </button>
            <div className="h-4 w-px bg-slate-800" />
            <div className="flex items-center gap-2.5 truncate">
              <span className="font-display text-lg font-extrabold italic uppercase tracking-wide text-white truncate">
                {activeGame.title}
              </span>
              {!activeGame.is3DFlagship && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono-num font-bold text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Ads Removed</span>
                </span>
              )}
              <span className="hidden lg:inline text-xs font-mono-num text-slate-400 truncate">
                {activeGame.controlsHint}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleToggleFavorite(activeGame.id)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                isSaved
                  ? 'bg-amber-400/15 border-amber-400/60 text-amber-300'
                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" fill={isSaved ? 'currentColor' : 'none'} />
              <span className="hidden sm:inline">{isSaved ? 'Saved' : 'Save'}</span>
            </button>

            {!activeGame.is3DFlagship && (
              <button
                type="button"
                onClick={() => setRestartSignal((n) => n + 1)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-500 text-xs font-bold text-slate-200 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reload</span>
              </button>
            )}

            {activeGame.is3DFlagship && (
              <button
                type="button"
                onClick={() => setMuted((m) => !m)}
                aria-label={muted ? 'Unmute audio' : 'Mute audio'}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-200 cursor-pointer"
              >
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            )}

            <button
              type="button"
              onClick={handleToggleFullscreen}
              aria-label="Toggle fullscreen"
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-200 cursor-pointer"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => setCloaked(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 cursor-pointer"
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cloak [</span>
            </button>
          </div>
        </header>

        {/* Active Game Viewport */}
        <div className="relative flex-1 min-h-0">
          {activeGame.is3DFlagship ? (
            <TiltedPinesRunner muted={muted} />
          ) : (
            <IframeGameRunner
              key={activeGame.id}
              game={activeGame}
              restartSignal={restartSignal}
            />
          )}
        </div>
      </div>
    );
  }

  // Arcade Hub Landing View
  return (
    <div className="w-full h-full overflow-y-auto bg-[#0b0f19] text-slate-100">
      {/* Sticky Single-Row Top Bar (3 zones: Brand — Categories — Search & Cloak) */}
      <header className="sticky top-0 z-30 h-16 px-4 md:px-8 bg-[#0b0f19]/95 border-b border-slate-800/90 flex items-center justify-between gap-4">
        {/* Zone 1: Custom Brand Emblem */}
        <div className="flex items-center gap-2.5 shrink-0">
          <svg viewBox="0 0 36 36" className="w-8 h-8" aria-hidden="true">
            <rect x="2" y="2" width="32" height="32" rx="8" fill="#182235" stroke="#facc15" strokeWidth="2.5" />
            <path d="M20 7L10 20h7l-1 9 10-13h-7l1-9z" fill="#facc15" />
          </svg>
          <div>
            <div className="font-display text-2xl font-extrabold italic uppercase tracking-tight leading-none text-white">
              CLUTCH <span className="text-yellow-400">U7</span>
            </div>
            <div className="text-[10px] font-mono-num uppercase tracking-[0.14em] text-emerald-400">
              Drive U-7 · Ad-Free Iframes
            </div>
          </div>
        </div>

        {/* Zone 2: Category Filters */}
        <nav className="hidden lg:flex items-center gap-1.5" aria-label="Game categories">
          {ARCADE_CATEGORIES.map((cat) => {
            const active = category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors cursor-pointer ${
                  active
                    ? 'bg-yellow-400 text-slate-950'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                {cat.label}
                {cat.id === 'favorites' && favorites.length > 0 ? ` (${favorites.length})` : ''}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Search + Study Cloak */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="relative w-44 sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search games... [/]"
              aria-label="Search games"
              className="w-full h-9 pl-8 pr-3 rounded-lg bg-[#121826] border border-slate-700/80 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-yellow-400"
            />
          </div>
          <button
            type="button"
            onClick={() => setCloaked(true)}
            className="h-9 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-100 inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <EyeOff className="w-3.5 h-3.5 text-yellow-400" />
            <span className="hidden sm:inline">Study Cloak [</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-8">
        {/* Mobile/Tablet Category Strip */}
        <div className="flex lg:hidden items-center gap-2 overflow-x-auto pb-1">
          {ARCADE_CATEGORIES.map((cat) => {
            const active = category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-yellow-400 text-slate-950'
                    : 'bg-[#121826] border border-slate-800 text-slate-300'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Above-the-Fold Hero Showcase: Tilted Pines BR + Drive U-7 Top Trio */}
        {category === 'all' && !query && (
          <section className="grid lg:grid-cols-[1.45fr_1fr] gap-5 items-stretch">
            {/* Flagship 3D Card */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-[#121826] flex flex-col justify-between group">
              <div className="relative aspect-[16/9] lg:aspect-auto lg:h-72 overflow-hidden">
                <img
                  src={flagshipGame.coverUrl}
                  alt={flagshipGame.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#121826] via-[#121826]/30 to-transparent" />
                <div className="absolute top-3.5 left-3.5 flex items-center gap-2 bg-[#0b0f19]/90 border border-yellow-400/50 rounded-lg px-2.5 py-1">
                  <img
                    src="/assets/aistudio/images__2__9151d280.jpeg"
                    alt="Neegy skin"
                    className="w-5 h-5 rounded object-cover"
                  />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-yellow-300">
                    Includes Neegy Skin &amp; 100-Player P2P
                  </span>
                </div>
              </div>

              <div className="p-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <div className="text-xs font-mono-num uppercase tracking-[0.12em] text-yellow-400">
                    3D Battle Royale · Chapter 1 Map · AI Bots + WebRTC P2P
                  </div>
                  <h1 className="font-display text-4xl font-extrabold italic uppercase tracking-tight text-white mt-1 leading-none">
                    {flagshipGame.title}
                  </h1>
                  <p className="text-sm text-slate-300 mt-1.5 max-w-xl">
                    {flagshipGame.tagline}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => launchGame('tilted-pines')}
                  className="shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-display text-xl font-extrabold italic uppercase tracking-wide transition-transform active:scale-95 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Play Battle Royale</span>
                </button>
              </div>
            </div>

            {/* Drive U-7 Instant Classics Stack */}
            <div className="bg-[#121826] border border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <h2 className="font-display text-xl font-extrabold italic uppercase tracking-wide text-white">
                  Featured Drive U-7
                </h2>
                <span className="inline-flex items-center gap-1 text-[11px] font-mono-num uppercase tracking-wider text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Ad-Free Iframes
                </span>
              </div>

              <div className="flex-1 flex flex-col justify-between gap-3">
                {u7Trio.map((game) => (
                  <button
                    key={game.id}
                    type="button"
                    onClick={() => launchGame(game.id)}
                    className="w-full text-left flex items-center gap-3.5 p-2.5 rounded-xl bg-[#0e1422] hover:bg-slate-800/80 border border-slate-800 hover:border-slate-600 transition-colors cursor-pointer group"
                  >
                    <img
                      src={game.coverUrl}
                      alt={game.title}
                      onError={(e) => {
                        if (game.fallbackCoverUrl && e.currentTarget.src !== game.fallbackCoverUrl) {
                          e.currentTarget.src = game.fallbackCoverUrl;
                        }
                      }}
                      className="w-28 aspect-video rounded-lg object-cover shrink-0 border border-slate-700/70"
                    />
                    <div className="min-w-0 flex-1">
                      <div
                        className="text-[10px] font-mono-num font-bold uppercase tracking-wider"
                        style={{ color: game.accentHex }}
                      >
                        {game.badgeText}
                      </div>
                      <div className="font-display text-xl font-extrabold italic uppercase text-white leading-tight group-hover:text-yellow-300 transition-colors truncate">
                        {game.title}
                      </div>
                      <div className="text-xs text-slate-400 truncate mt-0.5">
                        {game.controlsHint}
                      </div>
                    </div>
                    <Play className="w-4 h-4 text-slate-400 group-hover:text-yellow-400 shrink-0 mr-1" />
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Recently Played Strip */}
        {recentGames.length > 0 && category === 'all' && !query && (
          <section className="space-y-3">
            <h2 className="font-display text-xl font-extrabold italic uppercase tracking-wide text-slate-200">
              Jump Back In
            </h2>
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {recentGames.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => launchGame(g.id)}
                  className="shrink-0 w-48 text-left rounded-xl bg-[#121826] border border-slate-800 hover:border-slate-600 overflow-hidden transition-transform hover:-translate-y-0.5 cursor-pointer"
                >
                  <img
                    src={g.coverUrl}
                    alt={g.title}
                    onError={(e) => {
                      if (g.fallbackCoverUrl && e.currentTarget.src !== g.fallbackCoverUrl) {
                        e.currentTarget.src = g.fallbackCoverUrl;
                      }
                    }}
                    className="w-full aspect-video object-cover"
                  />
                  <div className="px-3 py-2">
                    <div className="font-display text-base font-extrabold italic uppercase text-white truncate">
                      {g.title}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Full Playable Games Grid */}
        <section className="space-y-4 pb-8">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-2xl font-extrabold italic uppercase tracking-wide text-white">
              {category === 'all'
                ? 'Drive U-7 Full Unblocked Catalog'
                : ARCADE_CATEGORIES.find((c) => c.id === category)?.label}
            </h2>
            <span className="text-xs font-mono-num text-slate-400">
              {filteredGames.length} Ad-Free Games Ready
            </span>
          </div>

          {filteredGames.length === 0 ? (
            <div className="rounded-2xl bg-[#121826] border border-slate-800 p-10 text-center">
              <p className="text-sm text-slate-300">
                No games matched your current filter.
              </p>
              <button
                type="button"
                onClick={() => {
                  setCategory('all');
                  setQuery('');
                }}
                className="mt-4 px-4 py-2 rounded-lg bg-yellow-400 text-slate-950 text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Show All {catalogGames.length} Games
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredGames.map((game) => {
                const isSaved = favorites.includes(game.id);
                return (
                  <article
                    key={game.id}
                    className="rounded-xl bg-[#121826] border border-slate-800 hover:border-slate-600 overflow-hidden flex flex-col transition-transform hover:-translate-y-1 group"
                  >
                    <button
                      type="button"
                      onClick={() => launchGame(game.id)}
                      className="relative aspect-video w-full overflow-hidden bg-slate-900 cursor-pointer block"
                    >
                      <img
                        src={game.coverUrl}
                        alt={game.title}
                        loading="lazy"
                        onError={(e) => {
                          if (game.fallbackCoverUrl && e.currentTarget.src !== game.fallbackCoverUrl) {
                            e.currentTarget.src = game.fallbackCoverUrl;
                          }
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </button>

                    <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className="text-[11px] font-mono-num font-bold uppercase tracking-wider"
                            style={{ color: game.accentHex }}
                          >
                            {game.category} · {game.badgeText}
                          </span>
                          <button
                            type="button"
                            aria-label={isSaved ? `Remove ${game.title} from saved` : `Save ${game.title}`}
                            onClick={() => handleToggleFavorite(game.id)}
                            className={`p-1 rounded hover:bg-slate-800 cursor-pointer ${
                              isSaved ? 'text-amber-400' : 'text-slate-500 hover:text-slate-200'
                            }`}
                          >
                            <Bookmark className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} />
                          </button>
                        </div>

                        <h3 className="font-display text-2xl font-extrabold italic uppercase text-white leading-tight mt-0.5 truncate">
                          {game.title}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {game.tagline}
                        </p>
                      </div>

                      <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
                        <span className="text-[11px] font-mono-num text-slate-400 truncate">
                          {game.controlsHint}
                        </span>
                        <button
                          type="button"
                          onClick={() => launchGame(game.id)}
                          className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-extrabold uppercase tracking-wider text-slate-950 transition-opacity hover:opacity-90 cursor-pointer"
                          style={{ backgroundColor: game.accentHex }}
                        >
                          Play
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
