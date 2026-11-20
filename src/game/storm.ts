import type { StormState } from './types';

interface StormPhaseSpec {
  waitDuration: number;
  shrinkDuration: number;
  targetRadius: number;
  damagePerSecond: number;
}

const STORM_PHASES: StormPhaseSpec[] = [
  { waitDuration: 32, shrinkDuration: 28, targetRadius: 215, damagePerSecond: 1.0 },
  { waitDuration: 25, shrinkDuration: 24, targetRadius: 140, damagePerSecond: 2.0 },
  { waitDuration: 20, shrinkDuration: 22, targetRadius: 86, damagePerSecond: 3.5 },
  { waitDuration: 18, shrinkDuration: 20, targetRadius: 44, damagePerSecond: 6.0 },
  { waitDuration: 14, shrinkDuration: 16, targetRadius: 16, damagePerSecond: 9.0 },
  { waitDuration: 12, shrinkDuration: 14, targetRadius: 3.0, damagePerSecond: 12.0 },
];

export function createInitialStorm(seed = 1): StormState {
  const angle = (((seed * 9301 + 49297) % 233280) / 233280) * Math.PI * 2;
  const firstOffset = 38;
  return {
    phase: 1,
    phaseTimer: STORM_PHASES[0].waitDuration,
    phaseDuration: STORM_PHASES[0].waitDuration,
    isShrinking: false,
    centerX: 0,
    centerZ: 0,
    radius: 325,
    startCenterX: 0,
    startCenterZ: 0,
    startRadius: 325,
    targetCenterX: Math.cos(angle) * firstOffset,
    targetCenterZ: Math.sin(angle) * firstOffset,
    targetRadius: STORM_PHASES[0].targetRadius,
    damagePerSecond: STORM_PHASES[0].damagePerSecond,
  };
}

export function stepStorm(storm: StormState, dt: number, seedRand: () => number): void {
  const spec = STORM_PHASES[Math.min(storm.phase - 1, STORM_PHASES.length - 1)];
  storm.phaseTimer -= dt;

  if (storm.isShrinking) {
    const progress = Math.min(1, Math.max(0, 1 - storm.phaseTimer / storm.phaseDuration));
    storm.centerX = storm.startCenterX + (storm.targetCenterX - storm.startCenterX) * progress;
    storm.centerZ = storm.startCenterZ + (storm.targetCenterZ - storm.startCenterZ) * progress;
    storm.radius = storm.startRadius + (storm.targetRadius - storm.startRadius) * progress;

    if (storm.phaseTimer <= 0) {
      storm.centerX = storm.targetCenterX;
      storm.centerZ = storm.targetCenterZ;
      storm.radius = storm.targetRadius;
      storm.isShrinking = false;

      if (storm.phase < STORM_PHASES.length) {
        storm.phase += 1;
        const nextSpec = STORM_PHASES[storm.phase - 1];
        storm.phaseTimer = nextSpec.waitDuration;
        storm.phaseDuration = nextSpec.waitDuration;
        storm.damagePerSecond = nextSpec.damagePerSecond;

        const maxShift = Math.max(0, storm.radius - nextSpec.targetRadius) * 0.55;
        const theta = seedRand() * Math.PI * 2;
        const dist = seedRand() * maxShift;
        storm.startCenterX = storm.centerX;
        storm.startCenterZ = storm.centerZ;
        storm.startRadius = storm.radius;
        storm.targetCenterX = storm.centerX + Math.cos(theta) * dist;
        storm.targetCenterZ = storm.centerZ + Math.sin(theta) * dist;
        storm.targetRadius = nextSpec.targetRadius;
      } else {
        storm.phaseTimer = 999;
        storm.phaseDuration = 999;
      }
    }
  } else {
    if (storm.phaseTimer <= 0 && storm.phase <= STORM_PHASES.length) {
      storm.isShrinking = true;
      storm.startCenterX = storm.centerX;
      storm.startCenterZ = storm.centerZ;
      storm.startRadius = storm.radius;
      storm.phaseTimer = spec.shrinkDuration;
      storm.phaseDuration = spec.shrinkDuration;
    }
  }
}

export function isInsideSafeZone(x: number, z: number, storm: StormState): boolean {
  const dx = x - storm.centerX;
  const dz = z - storm.centerZ;
  return dx * dx + dz * dz <= storm.radius * storm.radius;
}

export function getStormDamagePerSecond(storm: StormState): number {
  return storm.damagePerSecond;
}
