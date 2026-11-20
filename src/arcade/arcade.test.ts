import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ARCADE_GAMES,
  CLOAK_PRESET,
  filterArcadeGames,
  getArcadeGame,
  isValidArcadeGameId,
  mergeDriveU7Catalog,
  pushRecentGame,
  resolveInitialArcadeRoute,
  toggleFavoriteGame,
} from './gamesCatalog';

test('arcade catalog includes Tilted Pines flagship plus Drive U-7 hits GTA, Mad Pursuit, and Level 67', () => {
  assert.ok(ARCADE_GAMES.length >= 10);
  for (const id of [
    'tilted-pines',
    'gta',
    'driving-games/mad-pursuit',
    'new-games/level-67',
  ]) {
    assert.equal(isValidArcadeGameId(id), true);
    const game = getArcadeGame(id);
    assert.ok(game.coverUrl.startsWith('/src/assets/images/cover_'));
  }
  assert.equal(getArcadeGame('tilted-pines').is3DFlagship, true);
  assert.equal(getArcadeGame('driving-games/mad-pursuit').u7Slug, 'driving-games/mad-pursuit');
  assert.ok(CLOAK_PRESET.cloakTitle.includes('Google Docs'));
});

test('mergeDriveU7Catalog updates live Drive U-7 thumbnails and appends remaining site games', () => {
  const merged = mergeDriveU7Catalog(ARCADE_GAMES, [
    {
      slug: 'driving-games/mad-pursuit',
      title: 'Mad Pursuit',
      category: 'driving',
      rank: 4,
      imgUrl: '/api/u7/thumb?url=mp',
    },
    {
      slug: 'football-bros',
      title: 'Football Bros',
      category: 'sports',
      rank: 8,
      imgUrl: '/api/u7/thumb?url=fb',
    },
  ]);

  const mp = getArcadeGame('driving-games/mad-pursuit', merged);
  assert.equal(mp.coverUrl, '/api/u7/thumb?url=mp');
  assert.equal(mp.fallbackCoverUrl?.startsWith('/src/assets/images/cover_'), true);

  const fb = getArcadeGame('football-bros', merged);
  assert.equal(fb.title, 'Football Bros');
  assert.equal(fb.u7Slug, 'football-bros');
  assert.equal(fb.category, 'sports');
});

test('catalog filtering supports categories, search queries, and saved favorites', () => {
  const all = filterArcadeGames(ARCADE_GAMES, 'all', '', []);
  assert.equal(all.length, ARCADE_GAMES.length);

  const driving = filterArcadeGames(ARCADE_GAMES, 'driving', '', []);
  assert.ok(driving.some((g) => g.id === 'gta'));
  assert.ok(driving.some((g) => g.id === 'driving-games/mad-pursuit'));
  assert.ok(driving.every((g) => g.category === 'driving'));

  const q67 = filterArcadeGames(ARCADE_GAMES, 'all', '67', []);
  assert.deepEqual(
    q67.map((g) => g.id).sort(),
    ['67-clicker', 'new-games/level-67'],
  );

  const favs = filterArcadeGames(ARCADE_GAMES, 'favorites', '', [
    'driving-games/mad-pursuit',
    'new-games/level-67',
  ]);
  assert.equal(favs.length, 2);
});

test('favorites and recently played helpers maintain deterministic deduplicated ordering', () => {
  let favs = toggleFavoriteGame([], 'driving-games/mad-pursuit');
  assert.deepEqual(favs, ['driving-games/mad-pursuit']);
  favs = toggleFavoriteGame(favs, 'new-games/level-67');
  assert.deepEqual(favs, ['driving-games/mad-pursuit', 'new-games/level-67']);
  favs = toggleFavoriteGame(favs, 'driving-games/mad-pursuit');
  assert.deepEqual(favs, ['new-games/level-67']);

  let recent = pushRecentGame([], 'gta', 4);
  recent = pushRecentGame(recent, 'driving-games/mad-pursuit', 4);
  recent = pushRecentGame(recent, 'new-games/level-67', 4);
  recent = pushRecentGame(recent, 'gta', 4);
  assert.deepEqual(recent, ['gta', 'new-games/level-67', 'driving-games/mad-pursuit']);
});

test('route resolver preserves ?autostart=1 for Tilted Pines and normalizes ?game=<id> deep links', () => {
  assert.deepEqual(resolveInitialArcadeRoute('?autostart=1'), {
    activeGameId: 'tilted-pines',
    autoStartTiltedPines: true,
  });

  assert.deepEqual(resolveInitialArcadeRoute('?game=level-67'), {
    activeGameId: 'new-games/level-67',
    autoStartTiltedPines: false,
  });

  assert.deepEqual(resolveInitialArcadeRoute('?game=football-bros'), {
    activeGameId: 'football-bros',
    autoStartTiltedPines: false,
  });
});
