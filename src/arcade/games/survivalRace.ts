import { createCanvasGame } from '../canvasHarness';
import type { CanvasGameCallbacks, CanvasGameController } from '../types';

interface HexTile {
  q: number;
  r: number;
  x: number;
  y: number;
  state: 'solid' | 'cracking' | 'fallen';
  timer: number;
  hasBoost: boolean;
}

interface Racer {
  isPlayer: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  z: number;
  vz: number;
  angle: number;
  color: string;
  alive: boolean;
  aiTurnBias: number;
}

const HEX_RADIUS = 38;

export function createSurvivalRaceGame(
  container: HTMLElement,
  callbacks: CanvasGameCallbacks,
): CanvasGameController {
  return createCanvasGame(container, callbacks, (g) => {
    let tiles: HexTile[] = [];
    let racers: Racer[] = [];
    let elapsed = 0;
    let score = 0;

    const buildArena = () => {
      tiles = [];
      const radius = 6;
      for (let q = -radius; q <= radius; q++) {
        for (let r = -radius; r <= radius; r++) {
          if (Math.abs(q + r) > radius) continue;
          const x = HEX_RADIUS * Math.sqrt(3) * (q + r / 2);
          const y = HEX_RADIUS * 1.5 * r;
          tiles.push({
            q,
            r,
            x,
            y,
            state: 'solid',
            timer: 0.72,
            hasBoost: Math.abs(q) + Math.abs(r) === 3 && (q + r) % 2 === 0,
          });
        }
      }
    };

    const findTileAt = (x: number, y: number): HexTile | null => {
      let best: HexTile | null = null;
      let bestD = HEX_RADIUS * 0.96;
      for (const t of tiles) {
        if (t.state === 'fallen') continue;
        const d = Math.hypot(t.x - x, t.y - y);
        if (d < bestD) {
          bestD = d;
          best = t;
        }
      }
      return best;
    };

    return {
      gameId: 'survival-race',
      onReset: () => {
        buildArena();
        elapsed = 0;
        score = 0;
        const colors = ['#84cc16', '#38bdf8', '#f97316', '#a855f7', '#ec4899', '#facc15', '#ef4444'];
        racers = colors.map((color, i) => {
          const ang = (Math.PI * 2 * i) / colors.length;
          const rad = 165;
          return {
            isPlayer: i === 0,
            x: Math.cos(ang) * rad,
            y: Math.sin(ang) * rad,
            vx: 0,
            vy: 0,
            z: 0,
            vz: 0,
            angle: ang + Math.PI,
            color,
            alive: true,
            aiTurnBias: (i % 2 === 0 ? 1 : -1) * 0.4,
          };
        });
      },
      onUpdate: (_dt, simDt) => {
        if (simDt <= 0) return;
        elapsed += simDt;
        score += simDt * 120;

        for (const t of tiles) {
          if (t.state === 'cracking') {
            t.timer -= simDt;
            if (t.timer <= 0) {
              t.state = 'fallen';
            }
          }
        }

        const player = racers[0];
        let aliveRivals = 0;

        for (const r of racers) {
          if (!r.alive) continue;
          if (!r.isPlayer) aliveRivals++;

          if (r.isPlayer) {
            const steer =
              (g.held.has('KeyD') || g.held.has('ArrowRight') ? 1 : 0) -
              (g.held.has('KeyA') || g.held.has('ArrowLeft') ? 1 : 0);
            const thrust = g.held.has('KeyS') || g.held.has('ArrowDown') ? 110 : 245;
            r.angle += steer * 3.6 * simDt;
            r.vx += (Math.cos(r.angle) * thrust - r.vx) * Math.min(1, simDt * 5);
            r.vy += (Math.sin(r.angle) * thrust - r.vy) * Math.min(1, simDt * 5);

            if ((g.justPressed.has('Space') || g.justPressed.has('KeyW') || g.justPressed.has('ArrowUp')) && r.z === 0) {
              r.vz = 230;
              g.sfx.jump();
            }
          } else {
            // AI seeks solid tiles toward center and avoids edges
            const distFromCenter = Math.hypot(r.x, r.y);
            let targetAngle = Math.atan2(-r.y, -r.x) + r.aiTurnBias;
            if (distFromCenter < 180) {
              const aheadTile = findTileAt(r.x + Math.cos(r.angle) * 58, r.y + Math.sin(r.angle) * 58);
              if (aheadTile && aheadTile.state === 'solid') {
                targetAngle = r.angle + Math.sin(elapsed * 2 + r.aiTurnBias) * 0.6;
              } else {
                targetAngle = Math.atan2(-r.y, -r.x) + (Math.random() - 0.5) * 0.7;
              }
            }
            let diff = targetAngle - r.angle;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            r.angle += Math.max(-3.2 * simDt, Math.min(3.2 * simDt, diff));
            r.vx += (Math.cos(r.angle) * 215 - r.vx) * Math.min(1, simDt * 4.5);
            r.vy += (Math.sin(r.angle) * 215 - r.vy) * Math.min(1, simDt * 4.5);
          }

          r.x += r.vx * simDt;
          r.y += r.vy * simDt;
          if (r.z > 0 || r.vz > 0) {
            r.z += r.vz * simDt;
            r.vz -= 640 * simDt;
            if (r.z <= 0) {
              r.z = 0;
              r.vz = 0;
            }
          }

          if (r.z <= 2) {
            const tile = findTileAt(r.x, r.y);
            if (!tile) {
              r.alive = false;
              g.particles.burst(g.width * 0.5 + r.x, g.height * 0.5 + r.y, 16, 180, r.color, 4, 0.4);
              if (r.isPlayer) {
                g.sfx.crash();
                g.finishGame(score, false, `Fell into the sky at ${elapsed.toFixed(1)}s!`);
                return;
              } else {
                score += 300;
                g.sfx.score();
              }
            } else {
              if (tile.state === 'solid') {
                tile.state = 'cracking';
              }
              if (tile.hasBoost) {
                tile.hasBoost = false;
                r.vx *= 1.35;
                r.vy *= 1.35;
                if (r.isPlayer) {
                  score += 200;
                  g.sfx.boost();
                }
              }
            }
          }
        }

        // Car-to-car bump
        for (let i = 0; i < racers.length; i++) {
          const a = racers[i];
          if (!a.alive) continue;
          for (let j = i + 1; j < racers.length; j++) {
            const b = racers[j];
            if (!b.alive) continue;
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const d = Math.hypot(dx, dy);
            if (d < 24 && d > 0.01) {
              const nx = dx / d;
              const ny = dy / d;
              a.vx -= nx * 130;
              a.vy -= ny * 130;
              b.vx += nx * 130;
              b.vy += ny * 130;
              if (a.isPlayer || b.isPlayer) g.sfx.hit();
            }
          }
        }

        if (player.alive && aliveRivals === 0) {
          score += 1500;
          g.sfx.score();
          g.finishGame(score, true, `Last Car Standing in ${elapsed.toFixed(1)}s!`);
        }
      },
      onRender: (ctx, w, h) => {
        const bg = ctx.createLinearGradient(0, 0, 0, h);
        bg.addColorStop(0, '#0f172a');
        bg.addColorStop(1, '#1e1b4b');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        ctx.save();
        ctx.translate(w * 0.5, h * 0.5);

        const drawHex = (cx: number, cy: number, r: number) => {
          ctx.beginPath();
          for (let k = 0; k < 6; k++) {
            const a = (Math.PI / 3) * k + Math.PI / 6;
            const px = cx + Math.cos(a) * r;
            const py = cy + Math.sin(a) * r;
            if (k === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
        };

        for (const t of tiles) {
          if (t.state === 'fallen') continue;
          drawHex(t.x, t.y, HEX_RADIUS - 2);
          if (t.state === 'cracking') {
            ctx.fillStyle = t.timer < 0.25 ? '#ef4444' : '#f59e0b';
            ctx.strokeStyle = '#fef3c7';
          } else {
            ctx.fillStyle = '#0f766e';
            ctx.strokeStyle = '#38bdf8';
          }
          ctx.lineWidth = 2;
          ctx.fill();
          ctx.stroke();

          if (t.hasBoost) {
            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.arc(t.x, t.y, 7, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        for (const r of racers) {
          if (!r.alive) continue;
          const scale = 1 + r.z * 0.008;
          ctx.save();
          ctx.translate(r.x, r.y - r.z * 0.45);
          ctx.scale(scale, scale);
          ctx.rotate(r.angle);
          ctx.fillStyle = r.color;
          ctx.beginPath();
          ctx.roundRect(-15, -9, 30, 18, 4);
          ctx.fill();
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(-3, -7, 10, 14);
          if (r.isPlayer) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.strokeRect(-16, -10, 32, 20);
          }
          ctx.restore();
        }

        ctx.restore();
      },
      getHudSnapshot: () => {
        const aliveCount = racers.filter((r) => r.alive).length;
        return {
          score: Math.round(score),
          primaryLabel: 'SURVIVORS · TIME',
          primaryValue: `${aliveCount}/${racers.length} · ${elapsed.toFixed(1)}s`,
          secondaryLabel: 'TILES LEFT',
          secondaryValue: `${tiles.filter((t) => t.state !== 'fallen').length}`,
        };
      },
    };
  });
}
