import { createCanvasGame } from '../canvasHarness';
import type { CanvasGameCallbacks, CanvasGameController } from '../types';

interface SlopeObject {
  x: number; // -1.2 to 1.2 normalized slope lane
  z: number; // distance ahead
  kind: 'tree' | 'snowball' | 'ramp' | 'gift';
  vx: number;
  collected?: boolean;
}

export function createSnowRiderGame(
  container: HTMLElement,
  callbacks: CanvasGameCallbacks,
): CanvasGameController {
  return createCanvasGame(container, callbacks, (g) => {
    let laneX = 0;
    let jumpY = 0;
    let jumpVy = 0;
    let speed = 26;
    let distance = 0;
    let gifts = 0;
    let spawnTimer = 0.2;
    let objects: SlopeObject[] = [];

    const spawnRow = (zStart = 120) => {
      const r = Math.random();
      const kind: SlopeObject['kind'] =
        r < 0.42 ? 'tree' : r < 0.72 ? 'snowball' : r < 0.86 ? 'gift' : 'ramp';
      const x = (Math.random() - 0.5) * 2.1;
      objects.push({
        x,
        z: zStart,
        kind,
        vx: kind === 'snowball' ? (Math.random() - 0.5) * 0.45 : 0,
      });
    };

    return {
      gameId: 'snow-rider',
      onReset: () => {
        laneX = 0;
        jumpY = 0;
        jumpVy = 0;
        speed = 28;
        distance = 0;
        gifts = 0;
        spawnTimer = 0.15;
        objects = [];
        for (let z = 35; z < 120; z += 14) {
          spawnRow(z);
        }
      },
      onUpdate: (_dt, simDt) => {
        if (simDt <= 0) return;

        const steer =
          (g.held.has('KeyD') || g.held.has('ArrowRight') ? 1 : 0) -
          (g.held.has('KeyA') || g.held.has('ArrowLeft') ? 1 : 0);
        laneX = Math.max(-1.05, Math.min(1.05, laneX + steer * 1.65 * simDt));

        if (
          (g.justPressed.has('Space') || g.justPressed.has('KeyW') || g.justPressed.has('ArrowUp')) &&
          jumpY === 0
        ) {
          jumpVy = 12.5;
          g.sfx.jump();
        }

        if (jumpY > 0 || jumpVy > 0) {
          jumpY += jumpVy * simDt;
          jumpVy -= 30 * simDt;
          if (jumpY <= 0) {
            jumpY = 0;
            jumpVy = 0;
          }
        }

        speed = Math.min(58, 28 + distance * 0.015);
        distance += speed * simDt;

        spawnTimer -= simDt;
        if (spawnTimer <= 0) {
          spawnRow(125);
          spawnTimer = Math.max(0.16, 0.36 - distance * 0.00018);
        }

        for (let i = objects.length - 1; i >= 0; i--) {
          const ob = objects[i];
          ob.z -= speed * simDt;
          ob.x += ob.vx * simDt;
          if (ob.x > 1.1 || ob.x < -1.1) ob.vx *= -1;

          if (ob.z < 5.5 && ob.z > 1.0 && !ob.collected) {
            const dx = Math.abs(ob.x - laneX);
            if (ob.kind === 'gift' && dx < 0.22) {
              ob.collected = true;
              gifts++;
              distance += 35;
              g.sfx.pickup();
              g.particles.burst(g.width * 0.5 + laneX * 140, g.height * 0.78, 12, 180, '#f43f5e', 4, 0.35);
            } else if (ob.kind === 'ramp' && dx < 0.24 && jumpY < 0.8) {
              jumpVy = 16.5;
              g.sfx.boost();
            } else if ((ob.kind === 'tree' || ob.kind === 'snowball') && dx < 0.16) {
              if (ob.kind === 'snowball' && jumpY > 1.3) {
                // Jumped cleanly over snowball!
              } else if (ob.kind === 'tree' && jumpY > 2.2) {
                // Cleared small pine!
              } else {
                g.sfx.crash();
                g.triggerShake(0.7, 0.04);
                g.finishGame(distance + gifts * 50, false, `Wiped out at ${Math.round(distance)}m · ${gifts} Gifts`);
                return;
              }
            }
          }

          if (ob.z < -2) {
            objects.splice(i, 1);
          }
        }
      },
      onRender: (ctx, w, h) => {
        // Crisp winter sky + distant alpine peaks
        const sky = ctx.createLinearGradient(0, 0, 0, h * 0.42);
        sky.addColorStop(0, '#0284c7');
        sky.addColorStop(1, '#bae6fd');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h * 0.42);

        // Snow mountains
        ctx.fillStyle = '#e0f2fe';
        ctx.beginPath();
        ctx.moveTo(0, h * 0.42);
        ctx.lineTo(w * 0.2, h * 0.18);
        ctx.lineTo(w * 0.42, h * 0.36);
        ctx.lineTo(w * 0.65, h * 0.14);
        ctx.lineTo(w * 0.88, h * 0.32);
        ctx.lineTo(w, h * 0.42);
        ctx.closePath();
        ctx.fill();

        // White snow slope floor
        const horizonY = h * 0.38;
        const snowGrad = ctx.createLinearGradient(0, horizonY, 0, h);
        snowGrad.addColorStop(0, '#f0f9ff');
        snowGrad.addColorStop(1, '#cbd5e1');
        ctx.fillStyle = snowGrad;
        ctx.fillRect(0, horizonY, w, h - horizonY);

        // Perspective ski track guidelines
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
        ctx.lineWidth = 3;
        for (const edge of [-1.15, 0, 1.15]) {
          ctx.beginPath();
          ctx.moveTo(w * 0.5 + edge * 24, horizonY);
          ctx.lineTo(w * 0.5 + edge * w * 0.46, h);
          ctx.stroke();
        }

        // Draw far-to-near objects
        const sorted = [...objects].sort((a, b) => b.z - a.z);
        for (const ob of sorted) {
          if (ob.collected || ob.z <= 0.5) continue;
          const t = 1 / (ob.z * 0.032 + 0.36);
          const scale = Math.min(2.8, t);
          const sy = horizonY + (h - horizonY) * Math.min(1.15, Math.pow(1 - ob.z / 130, 1.85));
          const spread = (sy - horizonY) / (h - horizonY);
          const sx = w * 0.5 + ob.x * (w * 0.42 * Math.max(0.08, spread));

          if (ob.kind === 'tree') {
            ctx.fillStyle = '#065f46';
            ctx.beginPath();
            ctx.moveTo(sx, sy - 58 * scale);
            ctx.lineTo(sx - 22 * scale, sy);
            ctx.lineTo(sx + 22 * scale, sy);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#f8fafc';
            ctx.beginPath();
            ctx.moveTo(sx, sy - 58 * scale);
            ctx.lineTo(sx - 9 * scale, sy - 34 * scale);
            ctx.lineTo(sx + 9 * scale, sy - 34 * scale);
            ctx.closePath();
            ctx.fill();
          } else if (ob.kind === 'snowball') {
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(sx, sy - 16 * scale, 18 * scale, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          } else if (ob.kind === 'ramp') {
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(sx - 22 * scale, sy - 8 * scale, 44 * scale, 10 * scale);
          } else {
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(sx - 11 * scale, sy - 20 * scale, 22 * scale, 20 * scale);
            ctx.fillStyle = '#facc15';
            ctx.fillRect(sx - 2 * scale, sy - 20 * scale, 4 * scale, 20 * scale);
          }
        }

        // Player wooden sled
        const px = w * 0.5 + laneX * (w * 0.36);
        const py = h * 0.83 - jumpY * 26;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
        ctx.beginPath();
        ctx.ellipse(px, h * 0.85, 26, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.translate(px, py);
        ctx.rotate((g.held.has('KeyD') ? 0.14 : g.held.has('KeyA') ? -0.14 : 0));
        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.roundRect(-22, -12, 44, 24, 6);
        ctx.fill();
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-16, -24, 32, 16);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(-10, -34, 20, 12);
        ctx.restore();
      },
      getHudSnapshot: () => ({
        score: Math.round(distance + gifts * 50),
        primaryLabel: 'DISTANCE · GIFTS',
        primaryValue: `${Math.round(distance)}m · ${gifts}`,
        secondaryLabel: 'SPEED',
        secondaryValue: `${Math.round(speed * 2)} km/h`,
      }),
    };
  });
}
