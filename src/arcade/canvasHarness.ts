import type {
  CanvasGameCallbacks,
  CanvasGameController,
  CanvasGamePhase,
  CanvasGameSnapshot,
} from './types';
import { ArcadeSfx } from './sfx';

export interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export class ParticlePool {
  public readonly items: Particle[];
  private cursor = 0;

  constructor(capacity = 180) {
    this.items = Array.from({ length: capacity }, () => ({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 1,
      size: 4,
      color: '#ffffff',
    }));
  }

  public spawn(
    x: number,
    y: number,
    vx: number,
    vy: number,
    life: number,
    size: number,
    color: string,
  ): void {
    const p = this.items[this.cursor];
    this.cursor = (this.cursor + 1) % this.items.length;
    p.active = true;
    p.x = x;
    p.y = y;
    p.vx = vx;
    p.vy = vy;
    p.life = life;
    p.maxLife = life;
    p.size = size;
    p.color = color;
  }

  public burst(
    x: number,
    y: number,
    count: number,
    speed: number,
    color: string,
    size = 4,
    life = 0.45,
  ): void {
    for (let i = 0; i < count; i++) {
      const a = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const spd = speed * (0.4 + Math.random() * 0.8);
      this.spawn(x, y, Math.cos(a) * spd, Math.sin(a) * spd, life * (0.7 + Math.random() * 0.6), size, color);
    }
  }

  public clear(): void {
    for (const p of this.items) p.active = false;
  }

  public update(dt: number): void {
    for (const p of this.items) {
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.94;
      p.vy *= 0.94;
    }
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    for (const p of this.items) {
      if (!p.active) continue;
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(1, p.size * alpha), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

export interface CanvasGameConfig {
  gameId: string;
  onReset: () => void;
  onUpdate: (dt: number, simDt: number) => void;
  onRender: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
  getHudSnapshot: (phase: CanvasGamePhase, bestScore: number) => Omit<CanvasGameSnapshot, 'phase' | 'bestScore'>;
  onPointerDown?: (x: number, y: number) => void;
  onPointerMove?: (x: number, y: number) => void;
  onPointerUp?: (x: number, y: number) => void;
  onKeyDown?: (code: string) => void;
}

export interface CanvasGameContext {
  width: number;
  height: number;
  held: Set<string>;
  justPressed: Set<string>;
  pointerDown: boolean;
  pointerJustPressed: boolean;
  pointerX: number;
  pointerY: number;
  sfx: ArcadeSfx;
  particles: ParticlePool;
  shake: number;
  hitstop: number;
  finishGame: (score: number, victory?: boolean, summaryText?: string) => void;
  triggerShake: (amount: number, hitstopSec?: number) => void;
}

export function createCanvasGame(
  container: HTMLElement,
  callbacks: CanvasGameCallbacks,
  build: (ctx: CanvasGameContext) => CanvasGameConfig,
): CanvasGameController {
  const canvas = document.createElement('canvas');
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';
  canvas.tabIndex = 0;
  container.innerHTML = '';
  container.appendChild(canvas);

  const ctx2d = canvas.getContext('2d');
  if (!ctx2d) {
    throw new Error('Could not initialize 2D canvas context');
  }

  let phase: CanvasGamePhase = 'title';
  let bestScore = 0;
  let lastSummaryText: string | undefined;
  let lastVictory = false;
  let rafId = 0;
  let lastTime = performance.now();
  let lastHudEmit = 0;

  const held = new Set<string>();
  const justPressed = new Set<string>();
  const sfx = new ArcadeSfx();
  const particles = new ParticlePool(220);

  const gameCtx: CanvasGameContext = {
    width: Math.max(320, container.clientWidth || 960),
    height: Math.max(240, container.clientHeight || 540),
    held,
    justPressed,
    pointerDown: false,
    pointerJustPressed: false,
    pointerX: 0,
    pointerY: 0,
    sfx,
    particles,
    shake: 0,
    hitstop: 0,
    finishGame: (score: number, victory = false, summaryText?: string) => {
      if (phase === 'gameover') return;
      const rounded = Math.round(score);
      if (rounded > bestScore) {
        bestScore = rounded;
        try {
          window.localStorage.setItem(`arcade_best_${cfg.gameId}`, String(bestScore));
        } catch {
          // ignore
        }
      }
      lastVictory = victory;
      lastSummaryText = summaryText;
      phase = 'gameover';
      document.body.dataset.state = 'gameover';
      emitHud(true);
    },
    triggerShake: (amount: number, hitstopSec = 0) => {
      gameCtx.shake = Math.min(1.5, Math.max(gameCtx.shake, amount));
      if (hitstopSec > 0) {
        gameCtx.hitstop = Math.max(gameCtx.hitstop, hitstopSec);
      }
    },
  };

  const cfg = build(gameCtx);

  try {
    const saved = window.localStorage.getItem(`arcade_best_${cfg.gameId}`);
    if (saved) bestScore = Math.max(0, Number(saved) || 0);
  } catch {
    // ignore
  }

  const syncSize = () => {
    const rect = container.getBoundingClientRect();
    const w = Math.max(320, Math.floor(rect.width || container.clientWidth || 960));
    const h = Math.max(240, Math.floor(rect.height || container.clientHeight || 540));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    gameCtx.width = w;
    gameCtx.height = h;
    if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
    }
    ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  syncSize();
  const resizeObserver = new ResizeObserver(syncSize);
  resizeObserver.observe(container);

  let lastHudKey = '';
  const emitHud = (force = false) => {
    const now = performance.now();
    if (!force && now - lastHudEmit < 140) return;
    const base = cfg.getHudSnapshot(phase, bestScore);
    const nextBest = Math.max(bestScore, Math.round(base.score));
    const key = `${phase}|${base.score}|${nextBest}|${base.primaryValue}|${base.secondaryValue}`;
    if (!force && key === lastHudKey) return;
    lastHudKey = key;
    lastHudEmit = now;
    callbacks.onSnapshot({
      ...base,
      phase,
      bestScore: nextBest,
      victory: lastVictory,
      summaryText: lastSummaryText,
    });
  };

  const startOrRestart = () => {
    held.clear();
    justPressed.clear();
    particles.clear();
    gameCtx.pointerDown = false;
    gameCtx.pointerJustPressed = false;
    gameCtx.shake = 0;
    gameCtx.hitstop = 0;
    lastVictory = false;
    lastSummaryText = undefined;
    cfg.onReset();
    phase = 'playing';
    document.body.dataset.state = 'playing';
    if (document.activeElement instanceof HTMLElement && document.activeElement !== canvas) {
      document.activeElement.blur();
    }
    canvas.focus({ preventScroll: true });
    emitHud(true);
  };

  const pause = () => {
    if (phase !== 'playing') return;
    phase = 'paused';
    document.body.dataset.state = 'paused';
    held.clear();
    gameCtx.pointerDown = false;
    emitHud(true);
  };

  const resume = () => {
    if (phase !== 'paused') return;
    phase = 'playing';
    document.body.dataset.state = 'playing';
    canvas.focus({ preventScroll: true });
    emitHud(true);
  };

  const getLocalCoords = (e: PointerEvent | MouseEvent): [number, number] => {
    const rect = canvas.getBoundingClientRect();
    return [e.clientX - rect.left, e.clientY - rect.top];
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    // Allow global search/cloak shortcut only when modifier/bracket not inside game
    if (e.code === 'Escape' || e.code === 'KeyP') {
      if (phase === 'playing') {
        e.preventDefault();
        pause();
        return;
      }
      if (phase === 'paused') {
        e.preventDefault();
        resume();
        return;
      }
    }

    if ((e.code === 'Enter' || e.code === 'Space') && phase === 'title') {
      e.preventDefault();
      startOrRestart();
      return;
    }

    if (e.code === 'KeyR' && (phase === 'playing' || phase === 'gameover' || phase === 'paused')) {
      e.preventDefault();
      startOrRestart();
      return;
    }

    if (phase === 'playing') {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
      if (!held.has(e.code)) {
        justPressed.add(e.code);
      }
      held.add(e.code);
      cfg.onKeyDown?.(e.code);
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    held.delete(e.code);
  };

  const handlePointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    const [x, y] = getLocalCoords(e);
    gameCtx.pointerX = x;
    gameCtx.pointerY = y;
    gameCtx.pointerDown = true;
    gameCtx.pointerJustPressed = true;
    if (phase === 'playing') {
      canvas.focus({ preventScroll: true });
      cfg.onPointerDown?.(x, y);
    }
  };

  const handlePointerMove = (e: PointerEvent) => {
    const [x, y] = getLocalCoords(e);
    gameCtx.pointerX = x;
    gameCtx.pointerY = y;
    if (phase === 'playing') {
      cfg.onPointerMove?.(x, y);
    }
  };

  const handlePointerUp = (e: PointerEvent) => {
    const [x, y] = getLocalCoords(e);
    gameCtx.pointerX = x;
    gameCtx.pointerY = y;
    gameCtx.pointerDown = false;
    cfg.onPointerUp?.(x, y);
  };

  const handleBlur = () => {
    held.clear();
    gameCtx.pointerDown = false;
  };

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  window.addEventListener('blur', handleBlur);
  canvas.addEventListener('pointerdown', handlePointerDown);
  canvas.addEventListener('pointermove', handlePointerMove);
  window.addEventListener('pointerup', handlePointerUp);

  document.body.dataset.state = 'title';
  cfg.onReset();
  emitHud(true);

  const frame = (now: number) => {
    const rawDt = (now - lastTime) / 1000;
    lastTime = now;
    const dt = Math.min(Math.max(rawDt, 0.001), 0.05);

    if (phase === 'playing') {
      let simDt = dt;
      if (gameCtx.hitstop > 0) {
        gameCtx.hitstop = Math.max(0, gameCtx.hitstop - dt);
        simDt = 0;
      }
      cfg.onUpdate(dt, simDt);
      particles.update(dt);
      gameCtx.shake = Math.max(0, gameCtx.shake - dt * 3.8);
      emitHud(false);
    }

    justPressed.clear();
    gameCtx.pointerJustPressed = false;

    ctx2d.save();
    if (gameCtx.shake > 0.01) {
      const mag = gameCtx.shake * gameCtx.shake * 14;
      ctx2d.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
    }
    cfg.onRender(ctx2d, gameCtx.width, gameCtx.height);
    particles.draw(ctx2d);
    ctx2d.restore();

    rafId = requestAnimationFrame(frame);
  };

  rafId = requestAnimationFrame(frame);

  return {
    start: startOrRestart,
    pause,
    resume,
    restart: startOrRestart,
    setMuted: (muted: boolean) => {
      sfx.setMuted(muted);
    },
    destroy: () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    },
  };
}
