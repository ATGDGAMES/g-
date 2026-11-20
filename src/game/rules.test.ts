import test from 'node:test';
import assert from 'node:assert/strict';

import { getTerrainHeight, getSurfaceKind, WATER_LEVEL } from './terrain';
import {
  createSeededRng,
  generateIslandWorld,
  PLAYER_SPAWN,
  snapToBuildGrid,
} from './mapData';
import {
  applyDamage,
  applyHealing,
  BUILD_COST,
  canPlaceBuildPiece,
  computeShotDamage,
  createPlayerBuildPiece,
  damageStructure,
} from './rules';
import { createInitialStorm, isInsideSafeZone, stepStorm } from './storm';
import { computeBotIntent, createBotCombatant } from './botAI';
import { getSkinDef, isValidSkinId, SKINS } from './skins';

test('terrain heightfield provides flat POI foundations and clear spawn vista', () => {
  // Tilted Crossing center pad (-24, -12) should be flat at y=3.2
  const centerY = getTerrainHeight(-24, -12);
  const offsetY = getTerrainHeight(-18, -16);
  assert.ok(Math.abs(centerY - 3.2) < 0.05);
  assert.ok(Math.abs(offsetY - 3.2) < 0.05);

  // Spawn overlook is above water and on a dirt road clearing
  assert.ok(PLAYER_SPAWN.y > WATER_LEVEL + 4);
  assert.equal(getSurfaceKind(PLAYER_SPAWN.x, PLAYER_SPAWN.z), 'dirt_road');

  // Coastal ocean floor drops below water level outside expanded 285m island radius
  assert.ok(getTerrainHeight(330, 0) < WATER_LEVEL);
});

test('generated world includes 8 POIs with destructible buildings, chests, trees, rocks, and spawn loot', () => {
  const world = generateIslandWorld(42);
  assert.ok(world.structures.length > 350);
  assert.ok(world.chests.length >= 16);
  assert.ok(world.loot.length >= 12);

  // Ensure no structure blocks the player spawn point
  for (const s of world.structures) {
    const dist = Math.hypot(s.x - PLAYER_SPAWN.x, s.z - PLAYER_SPAWN.z);
    assert.ok(dist > 4.0, `Structure ${s.id} spawned too close to player (${dist}m)`);
  }
});

test('shield absorbs combat damage first, while storm damage bypasses shield', () => {
  const player = { hp: 100, shield: 50, alive: true };

  // Combat hit of 70 -> wipes 50 shield and deals 20 HP
  const hit1 = applyDamage(player, 70, false);
  assert.equal(hit1.shieldLost, 50);
  assert.equal(hit1.hpLost, 20);
  assert.equal(player.shield, 0);
  assert.equal(player.hp, 80);
  assert.equal(hit1.eliminated, false);

  // Give shield back, test storm bypass
  player.shield = 50;
  const stormHit = applyDamage(player, 15, true);
  assert.equal(stormHit.shieldLost, 0);
  assert.equal(stormHit.hpLost, 15);
  assert.equal(player.shield, 50);
  assert.equal(player.hp, 65);

  // Fatal blow eliminates combatant
  const fatal = applyDamage(player, 200, false);
  assert.equal(fatal.eliminated, true);
  assert.equal(player.alive, false);
  assert.equal(player.hp, 0);
});

test('healing respects mini shield 50 cap and medkit 100 HP cap', () => {
  const actor = { hp: 40, maxHp: 100, shield: 30, maxShield: 100 };
  assert.equal(applyHealing(actor, 'mini_shield'), true);
  assert.equal(actor.shield, 50);
  // Second mini shield cannot exceed 50
  assert.equal(applyHealing(actor, 'mini_shield'), false);

  assert.equal(applyHealing(actor, 'medkit'), true);
  assert.equal(actor.hp, 100);
});

test('destructible buildings take weak-point crit harvesting and player building snaps to grid', () => {
  const snapped = snapToBuildGrid(0, 2, 0, 0, 'wall', 0);
  assert.equal(snapped.x % 4, 0);

  const wall = createPlayerBuildPiece('w1', 'p1', 'wall', 'wood', snapped.x, snapped.y, snapped.z, snapped.rotY);
  // World building gives mats on pickaxe hit
  wall.isPlayerBuilt = false;

  const critHit = damageStructure(wall, 50, true, true);
  assert.equal(critHit.damaged, true);
  assert.equal(wall.hp, 50); // 150 - (50 * 2)
  assert.equal(critHit.harvestedAmount, 12);

  const killHit = damageStructure(wall, 50, true, false);
  assert.equal(killHit.destroyed, true);
  assert.equal(wall.hp, 0);
  assert.equal(killHit.harvestedAmount, 14); // 6 hit + 8 destroy bonus

  // Duplicate placement check
  const activePiece = createPlayerBuildPiece('w2', 'p1', 'wall', 'wood', 8, 2, 8, 0);
  const builder = { alive: true, materials: { wood: BUILD_COST, brick: 0, metal: 0 } };
  assert.equal(canPlaceBuildPiece(builder, 'wood', [activePiece], 8, 2, 8, 'wall'), false);
  assert.equal(canPlaceBuildPiece(builder, 'wood', [activePiece], 12, 2, 8, 'wall'), true);
});

test('weapon damage scales with rarity and headshot multiplier', () => {
  const bodyCommon = computeShotDamage('ar', 'common', false, 20);
  const headLegendary = computeShotDamage('ar', 'legendary', true, 20);
  assert.ok(headLegendary > bodyCommon * 2);
});

test('storm shrinks smoothly across phases and identifies safe vs storm coordinates', () => {
  const rand = createSeededRng(7);
  const storm = createInitialStorm(7);
  assert.equal(isInsideSafeZone(0, 0, storm), true);
  assert.equal(isInsideSafeZone(290, 290, storm), false);

  // Advance past wait duration into shrinking
  stepStorm(storm, storm.phaseDuration + 0.1, rand);
  assert.equal(storm.isShrinking, true);
  const rBefore = storm.radius;
  stepStorm(storm, 5, rand);
  assert.ok(storm.radius < rBefore);
});

test('smart AI bots spawn up to 99 combatants and exhibit rusher/marksman behaviors', () => {
  const rand = createSeededRng(11);
  const storm = createInitialStorm(11);
  const bots = Array.from({ length: 99 }, (_, i) =>
    createBotCombatant(i, rand, PLAYER_SPAWN.x, PLAYER_SPAWN.z),
  );
  assert.equal(bots.length, 99);
  for (const b of bots) {
    assert.ok(Math.hypot(b.x - PLAYER_SPAWN.x, b.z - PLAYER_SPAWN.z) >= 40);
  }

  const rusher = bots[0];
  const marksman = bots[1];
  assert.equal(rusher.archetype, 'rusher');
  assert.equal(marksman.archetype, 'marksman');

  // Place a bot target 14m away from rusher
  const enemy = bots[2];
  enemy.x = rusher.x + 14;
  enemy.z = rusher.z;
  enemy.y = getTerrainHeight(enemy.x, enemy.z);

  const rusherIntent = computeBotIntent(rusher, [rusher, enemy], storm, [], [], 12, 0.05);
  assert.equal(rusherIntent.weaponToUse, 'shotgun');
  assert.ok(rusherIntent.moveX > 0.3, 'Rusher should close in toward target');

  // Place enemy 10m from marksman -> marksman kites backward & uses AR
  enemy.x = marksman.x + 10;
  enemy.z = marksman.z;
  marksman.aiLastDamagedTime = 11.8; // recently damaged -> triggers defensive build
  const marksmanIntent = computeBotIntent(marksman, [marksman, enemy], storm, [], [], 12, 0.05);
  assert.equal(marksmanIntent.weaponToUse, 'ar');
  assert.ok(marksmanIntent.moveX < -0.2, 'Marksman should kite backward at close range');
  assert.equal(marksmanIntent.buildRequest, 'wall');
});

test('skin catalog includes Neegy and classic skins and assigns valid skins to bots', () => {
  assert.ok(SKINS.length >= 6);
  assert.equal(isValidSkinId('neegy'), true);
  assert.equal(isValidSkinId('nonexistent_skin'), false);

  const neegy = getSkinDef('neegy');
  assert.equal(neegy.name, 'Neegy');
  assert.equal(neegy.shirtHex, 0xfde047);
  assert.equal(neegy.imageUrl, '/assets/aistudio/images__2__9151d280.jpeg');

  const rand = createSeededRng(99);
  const sampleBots = Array.from({ length: 12 }, (_, i) =>
    createBotCombatant(i, rand, PLAYER_SPAWN.x, PLAYER_SPAWN.z),
  );
  for (const bot of sampleBots) {
    assert.equal(isValidSkinId(bot.skinId), true);
  }
  assert.ok(sampleBots.some((b) => b.skinId === 'neegy'), 'Expected at least one bot wearing Neegy');
});
