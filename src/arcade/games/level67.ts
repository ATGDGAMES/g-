import { createCanvasGame } from '../canvasHarness';
import type { CanvasGameCallbacks, CanvasGameController } from '../types';

interface DiamondSpike {
  x: number;
  y: number;
  r: number;
  saw: boolean;
}

interface Portal {
  x: number;
  y: number;
  kind: 'gravity' | 'speed';
  triggered: boolean;
}

export function createLevel67Game(
  container: HTMLElement,
  callbacks: CanvasGameCallbacks,
): CanvasGameController {
  return createCanvasGame(container, callbacks, (g) => {
    const wave = {
      x: 150,
      y: 260,
      gravitySign: 1,
      speedMult: 1,
      trail: [] as Array<{ x: number; y: number }>,
    };

    let cameraX = 0;
    let attempts = 1;
    let bestPct = 0;
    let levelLength = 5200;
    let obstacles: DiamondSpike[] = [];
    let portals: Portal[] = [];
    let corridorPts: Array<{ x: number; topY: number; botY: number }> = [];
    let deathFlash = 0;

    const buildCourse = () => {
      obstacles = [];
      portals = [];
      corridorPts = [];
      const h = Math.max(360, g.height);
      const mid = h * 0.5;
      let curCenter = mid;
      let gap = Math.min(220, h * 0.46);

      for (let x = 0; x <= levelLength + 400; x += 90) {
        const progress = x / levelLength;
        if (x > 420) {
          const waveAmp = 55 + progress * 85;
          curCenter = mid + Math.sin(x * 0.0065) * waveAmp + Math.cos(x * 0.013) * 28;
          gap = Math.max(108, Math.min(220, h * 0.44) - progress * 65);
        }
        const topY = Math.max(28, curCenter - gap * 0.5);
        const botY = Math.min(h - 28, curCenter + gap * 0.5);
        corridorPts.push({ x, topY, botY });

        if (x > 580 && x < levelLength - 280 && x % 270 === 0) {
          const idx = Math.floor(x / 270);
          obstacles.push({
            x,
            y: curCenter + (idx % 2 === 0 ? -1 : 1) * (gap * 0.14),
            r: 16 + Math.min(8, progress * 10),
            saw: idx % 3 === 0,
          });
        }
        if (x === 1620 || x === 3420) {
          portals.push({ x, y: curCenter, kind: 'gravity', triggered: false });
        }
        if (x === 2520) {
          portals.push({ x, y: curCenter, kind: 'speed', triggered: false });
        }
      }
    };

    const sampleCorridor = (worldX: number): { topY: number; botY: number } => {
      const idx = Math.max(0, Math.min(corridorPts.length - 2, Math.floor(worldX / 90)));
      const a = corridorPts[idx];
      const b = corridorPts[idx + 1];
      if (!a || !b) return { topY: 36, botY: g.height - 36 };
      const t = Math.max(0, Math.min(1, (worldX - a.x) / 90));
      return {
        topY: a.topY + (b.topY - a.topY) * t,
        botY: a.botY + (b.botY - a.botY) * t,
      };
    };

    const resetRun = () => {
      buildCourse();
      wave.x = 150;
      wave.y = g.height * 0.5;
      wave.gravitySign = 1;
      wave.speedMult = 1;
      wave.trail = [{ x: wave.x, y: wave.y }];
      cameraX = 0;
      deathFlash = 0;
    };

    return {
      gameId: 'level-67',
      onReset: () => {
        attempts = 1;
        resetRun();
      },
      onUpdate: (_dt, simDt) => {
        if (simDt <= 0) return;
        if (deathFlash > 0) {
          deathFlash -= simDt;
          if (deathFlash <= 0) {
            attempts++;
            resetRun();
          }
          return;
        }

        const climbing =
          g.held.has('Space') ||
          g.held.has('KeyW') ||
          g.held.has('ArrowUp') ||
          g.pointerDown;

        const speedX = 330 * wave.speedMult;
        const slopeDir = (climbing ? -1 : 1) * wave.gravitySign;
        const speedY = speedX * 0.92 * slopeDir;

        wave.x += speedX * simDt;
        wave.y += speedY * simDt;
        cameraX = wave.x - Math.min(200, g.width * 0.24);

        wave.trail.push({ x: wave.x, y: wave.y });
        if (wave.trail.length > 75) wave.trail.shift();

        // Portal check
        for (const p of portals) {
          if (!p.triggered && Math.abs(wave.x - p.x) < 24 && Math.abs(wave.y - p.y) < 90) {
            p.triggered = true;
            g.sfx.boost();
            if (p.kind === 'gravity') {
              wave.gravitySign *= -1;
              g.particles.burst(wave.x, wave.y, 16, 200, '#38bdf8', 4, 0.35);
            } else {
              wave.speedMult = 1.24;
              g.particles.burst(wave.x, wave.y, 16, 220, '#f97316', 4, 0.35);
            }
          }
        }

        const pct = Math.min(100, Math.round((wave.x / levelLength) * 100));
        if (pct > bestPct) bestPct = pct;

        // Finish portal
        if (wave.x >= levelLength) {
          g.sfx.score();
          g.finishGame(100 + Math.max(0, 20 - attempts) * 10, true, `SECTOR 67 CLEARED in ${attempts} Attempts!`);
          return;
        }

        // Collision with zig-zag corridor walls or obstacles
        const bounds = sampleCorridor(wave.x);
        let crashed = wave.y - 9 <= bounds.topY || wave.y + 9 >= bounds.botY;
        if (!crashed) {
          for (const ob of obstacles) {
            if (Math.hypot(wave.x - ob.x, wave.y - ob.y) < ob.r + 7) {
              crashed = true;
              break;
            }
          }
        }

        if (crashed) {
          g.sfx.crash();
          g.triggerShake(0.65, 0.04);
          g.particles.burst(wave.x - cameraX, wave.y, 26, 280, '#22c55e', 5, 0.45);
          deathFlash = 0.45;
        }
      },
      onRender: (ctx, w, h) => {
        // High-contrast lime/emerald geometric background inspired by Level 67
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#042f1a');
        grad.addColorStop(0.5, '#073b22');
        grad.addColorStop(1, '#042f1a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Scrolling neon chevron grid
        ctx.strokeStyle = 'rgba(74, 222, 128, 0.14)';
        ctx.lineWidth = 2;
        const offset = cameraX % 80;
        for (let x = -offset; x < w + 80; x += 80) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x + 40, h * 0.5);
          ctx.lineTo(x, h);
          ctx.stroke();
        }

        ctx.save();
        ctx.translate(-cameraX, 0);

        // Top & bottom neon zig-zag barrier polygons
        ctx.fillStyle = '#14532d';
        ctx.strokeStyle = '#fb923c';
        ctx.lineWidth = 4;

        ctx.beginPath();
        ctx.moveTo(corridorPts[0]?.x ?? 0, 0);
        for (const pt of corridorPts) {
          if (pt.x < cameraX - 180 || pt.x > cameraX + w + 180) continue;
          ctx.lineTo(pt.x, pt.topY);
        }
        ctx.lineTo(cameraX + w + 200, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(corridorPts[0]?.x ?? 0, h);
        for (const pt of corridorPts) {
          if (pt.x < cameraX - 180 || pt.x > cameraX + w + 180) continue;
          ctx.lineTo(pt.x, pt.botY);
        }
        ctx.lineTo(cameraX + w + 200, h);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Portals & Finish Wall
        for (const p of portals) {
          if (p.x < cameraX - 100 || p.x > cameraX + w + 100) continue;
          ctx.strokeStyle = p.kind === 'gravity' ? '#38bdf8' : '#f97316';
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, 14, 52, 0, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Obstacles (diamonds & rotating sawblades)
        const now = performance.now() * 0.006;
        for (const ob of obstacles) {
          if (ob.x < cameraX - 80 || ob.x > cameraX + w + 80) continue;
          ctx.save();
          ctx.translate(ob.x, ob.y);
          ctx.rotate(ob.saw ? now : Math.PI / 4);
          ctx.fillStyle = ob.saw ? '#090d16' : '#fb923c';
          ctx.strokeStyle = ob.saw ? '#ef4444' : '#ffffff';
          ctx.lineWidth = 3;
          ctx.fillRect(-ob.r * 0.85, -ob.r * 0.85, ob.r * 1.7, ob.r * 1.7);
          ctx.strokeRect(-ob.r * 0.85, -ob.r * 0.85, ob.r * 1.7, ob.r * 1.7);
          ctx.restore();
        }

        // Finish Line
        ctx.fillStyle = '#facc15';
        ctx.fillRect(levelLength, 0, 18, h);

        // Glowing wave ribbon trail
        if (wave.trail.length > 1) {
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 6;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(wave.trail[0].x, wave.trail[0].y);
          for (let i = 1; i < wave.trail.length; i++) {
            ctx.lineTo(wave.trail[i].x, wave.trail[i].y);
          }
          ctx.stroke();
        }

        // Wave dart avatar
        if (deathFlash <= 0) {
          const climbing =
            g.held.has('Space') || g.held.has('KeyW') || g.held.has('ArrowUp') || g.pointerDown;
          const tilt = (climbing ? -0.68 : 0.68) * wave.gravitySign;
          ctx.save();
          ctx.translate(wave.x, wave.y);
          ctx.rotate(tilt);
          ctx.fillStyle = '#facc15';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(16, 0);
          ctx.lineTo(-12, -10);
          ctx.lineTo(-6, 0);
          ctx.lineTo(-12, 10);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }

        ctx.restore();

        // Top progress bar
        const pct = Math.min(100, Math.round((wave.x / levelLength) * 100));
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.fillRect(w * 0.25, 16, w * 0.5, 10);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(w * 0.25, 16, (w * 0.5 * pct) / 100, 10);
      },
      getHudSnapshot: () => {
        const pct = Math.min(100, Math.round((wave.x / levelLength) * 100));
        return {
          score: Math.max(bestPct, pct),
          primaryLabel: 'PROGRESS · SECTOR',
          primaryValue: `${pct}% · STAGE 67`,
          secondaryLabel: 'ATTEMPT · GRAVITY',
          secondaryValue: `#${attempts} · ${wave.gravitySign > 0 ? 'NORMAL' : 'FLIPPED'}`,
        };
      },
    };
  });
}
