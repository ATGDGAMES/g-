import type { ArcadeGameId, CanvasGameCallbacks, CanvasGameController } from './types';
import { createMadPursuitGame } from './games/madPursuit';
import { createGtaViceCityGame } from './games/gtaViceCity';
import { createLevel67Game } from './games/level67';
import { createSurvivalRaceGame } from './games/survivalRace';
import { createSnowRiderGame } from './games/snowRider';
import { createPaperIoGame } from './games/paperIo2';
import { createBasketRandomGame } from './games/basketRandom';
import { createKnifeHitGame } from './games/knifeHit';
import { create67ClickerGame } from './games/clicker67';

type CanvasFactory = (container: HTMLElement, callbacks: CanvasGameCallbacks) => CanvasGameController;

const REGISTRY: Partial<Record<ArcadeGameId, CanvasFactory>> = {
  'mad-pursuit': createMadPursuitGame,
  'gta-vice-city': createGtaViceCityGame,
  'level-67': createLevel67Game,
  'survival-race': createSurvivalRaceGame,
  'snow-rider': createSnowRiderGame,
  'paper-io-2': createPaperIoGame,
  'basket-random': createBasketRandomGame,
  'knife-hit': createKnifeHitGame,
  '67-clicker': create67ClickerGame,
};

export function createArcadeGameController(
  id: ArcadeGameId,
  container: HTMLElement,
  callbacks: CanvasGameCallbacks,
): CanvasGameController | null {
  const factory = REGISTRY[id];
  return factory ? factory(container, callbacks) : null;
}
