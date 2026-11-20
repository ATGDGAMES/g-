import { createCanvasGame } from '../canvasHarness';
import type { CanvasGameCallbacks, CanvasGameController } from '../types';

interface CopCar {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  kind: 'cruiser' | 'interceptor' | 'swat';
  hp: number;
  maxHp: number;
  sirenPhase: number;
  hitFlash: number;
}

interface Pickup {
  x: number;
  y: number;
  kind: 'cash' | 'nitro' | 'repair';
  collected: boolean;
  bob: number;
}

interface SkidMark {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  alpha: number;
}

const BLOCK_SIZE = 280;
const ROAD_WIDTH = 104;

export function isOnRoad(x: number, y: number): boolean {
  const mx = ((x % BLOCK_SIZE) + BLOCK_SIZE) % BLOCK_SIZE;
  const my = ((y % BLOCK_SIZE) + BLOCK_SIZE) % BLOCK_SIZE;
  return mx < ROAD_WIDTH || my < ROAD_WIDTH;
}

export function createMadPursuitGame(
  container: HTMLElement,
  callbacks: CanvasGameCallbacks,
): CanvasGameController {
  return createCanvasGame(container, callbacks, (g) => {
    const player = {
      x: 52,
      y: 52,
      vx: 0,
      vy: 0,
      angle: 0,
      hp: 100,
      maxHp: 100,
      nitro: 100,
      invuln: 0,
    };

    let score = 0;
    let cash = 0;
    let bustedCops = 0;
    let elapsed = 0;
    let heat = 1;
    let spawnTimer = 1.5;
    let nextId = 1;
    let cops: CopCar[] = [];
    let pickups: Pickup[] = [];
    let skids: SkidMark[] = [];

    const spawnPickupsAround = (cx: number, cy: number, count: number) => {
      for (let i = 0; i < count; i++) {
        const bx = Math.round((cx + (Math.random() - 0.5) * 1400) / BLOCK_SIZE) * BLOCK_SIZE + 52;
        const by = Math.round((cy + (Math.random() - 0.5) * 1400) / BLOCK_SIZE) * BLOCK_SIZE + 52;
        const r = Math.random();
        pickups.push({
          x: bx + (Math.random() - 0.5) * 32,
          y: by + (Math.random() - 0.5) * 32,
          kind: r < 0.62 ? 'cash' : r < 0.85 ? 'nitro' : 'repair',
          collected: false,
          bob: Math.random() * Math.PI * 2,
        });
      }
    };

    const spawnCop = () => {
      const a = Math.random() * Math.PI * 2;
      const dist = 540 + Math.random() * 140;
      const x = player.x + Math.cos(a) * dist;
      const y = player.y + Math.sin(a) * dist;
      const roll = Math.random();
      const kind: CopCar['kind'] =
        heat >= 3 && roll > 0.72 ? 'swat' : heat >= 2 && roll > 0.42 ? 'interceptor' : 'cruiser';
      const maxHp = kind === 'swat' ? 85 : kind === 'interceptor' ? 40 : 35;
      cops.push({
        id: nextId++,
        x,
        y,
        vx: 0,
        vy: 0,
        angle: Math.atan2(player.y - y, player.x - x),
        kind,
        hp: maxHp,
        maxHp,
        sirenPhase: Math.random() * Math.PI * 2,
        hitFlash: 0,
      });
    };

    return {
      gameId: 'mad-pursuit',
      onReset: () => {
        player.x = 52;
        player.y = 52;
        player.vx = 0;
        player.vy = 0;
        player.angle = 0;
        player.hp = 100;
        player.nitro = 100;
        player.invuln = 1.0;
        score = 0;
        cash = 0;
        bustedCops = 0;
        elapsed = 0;
        heat = 1;
        spawnTimer = 1.2;
        cops = [];
        pickups = [];
        skids = [];
        spawnPickupsAround(player.x, player.y, 16);
        spawnCop();
        spawnCop();
      },
      onUpdate: (_dt, simDt) => {
        if (simDt <= 0) return;
        elapsed += simDt;
        heat = Math.min(5, 1 + Math.floor(elapsed / 18 + bustedCops / 3));
        player.invuln = Math.max(0, player.invuln - simDt);

        const throttle =
          (g.held.has('KeyW') || g.held.has('ArrowUp') ? 1 : 0) -
          (g.held.has('KeyS') || g.held.has('ArrowDown') ? 0.6 : 0);
        const steer =
          (g.held.has('KeyD') || g.held.has('ArrowRight') ? 1 : 0) -
          (g.held.has('KeyA') || g.held.has('ArrowLeft') ? 1 : 0);

        const boosting = g.held.has('Space') && player.nitro > 4;
        if (boosting) {
          player.nitro = Math.max(0, player.nitro - 42 * simDt);
          if (Math.random() < 0.55) {
            g.particles.spawn(
              player.x - Math.cos(player.angle) * 20,
              player.y - Math.sin(player.angle) * 20,
              -Math.cos(player.angle) * 180 + (Math.random() - 0.5) * 40,
              -Math.sin(player.angle) * 180 + (Math.random() - 0.5) * 40,
              0.24,
              5,
              '#38bdf8',
            );
          }
        } else {
          player.nitro = Math.min(100, player.nitro + 14 * simDt);
        }

        const speed = Math.hypot(player.vx, player.vy);
        const turnRate = (3.35 - Math.min(1.1, speed / 420)) * (speed > 20 ? 1 : 0.45);
        player.angle += steer * turnRate * simDt;

        const accel = boosting ? 760 : 520;
        const fx = Math.cos(player.angle);
        const fy = Math.sin(player.angle);
        player.vx += fx * throttle * accel * simDt;
        player.vy += fy * throttle * accel * simDt;

        // Drift grip decomposition
        const forwardSpeed = player.vx * fx + player.vy * fy;
        const rx = -fy;
        const ry = fx;
        const lateralSpeed = player.vx * rx + player.vy * ry;

        const newLateral = lateralSpeed * Math.pow(0.08, simDt);
        const roadMult = isOnRoad(player.x, player.y) ? 1.0 : 0.78;
        const maxSpd = (boosting ? 500 : 355) * roadMult;
        const clampedForward = Math.max(-150, Math.min(maxSpd, forwardSpeed * Math.pow(0.66, simDt)));

        player.vx = fx * clampedForward + rx * newLateral;
        player.vy = fy * clampedForward + ry * newLateral;

        const prevX = player.x;
        const prevY = player.y;
        player.x += player.vx * simDt;
        player.y += player.vy * simDt;

        if (Math.abs(lateralSpeed) > 65 && speed > 130) {
          skids.push({ x1: prevX, y1: prevY, x2: player.x, y2: player.y, alpha: 0.45 });
          if (skids.length > 140) skids.shift();
        }
        for (let i = skids.length - 1; i >= 0; i--) {
          skids[i].alpha -= simDt * 0.14;
          if (skids[i].alpha <= 0) skids.splice(i, 1);
        }

        // Building collision check (grid blocks)
        if (!isOnRoad(player.x, player.y)) {
          const mx = ((player.x % BLOCK_SIZE) + BLOCK_SIZE) % BLOCK_SIZE;
          const my = ((player.y % BLOCK_SIZE) + BLOCK_SIZE) % BLOCK_SIZE;
          // Buildings sit inside [ROAD_WIDTH + 22 .. BLOCK_SIZE - 22]
          const pad = ROAD_WIDTH + 20;
          if (mx > pad && mx < BLOCK_SIZE - 20 && my > pad && my < BLOCK_SIZE - 20) {
            player.x = prevX;
            player.y = prevY;
            player.vx *= -0.45;
            player.vy *= -0.45;
            g.triggerShake(0.3, 0.02);
            g.sfx.hit();
          }
        }

        // Score passively ticks up with speed
        score += (Math.hypot(player.vx, player.vy) * 0.08 + heat * 6) * simDt;

        // Spawning cops up to heat cap
        spawnTimer -= simDt;
        const targetCops = Math.min(9, 2 + heat * 1.4);
        if (spawnTimer <= 0 && cops.length < targetCops) {
          spawnCop();
          spawnTimer = Math.max(1.4, 3.6 - heat * 0.45);
        }

        // Update cops with 3 distinct policies
        for (let i = cops.length - 1; i >= 0; i--) {
          const c = cops[i];
          c.sirenPhase += simDt * 12;
          c.hitFlash = Math.max(0, c.hitFlash - simDt);

          let tx = player.x;
          let ty = player.y;
          if (c.kind === 'interceptor') {
            tx += player.vx * 0.65;
            ty += player.vy * 0.65;
          } else if (c.kind === 'swat') {
            tx += Math.cos(player.angle) * 60;
            ty += Math.sin(player.angle) * 60;
          }

          const desired = Math.atan2(ty - c.y, tx - c.x);
          let diff = desired - c.angle;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          const turnSpd = c.kind === 'swat' ? 2.1 : c.kind === 'interceptor' ? 3.2 : 2.8;
          c.angle += Math.max(-turnSpd * simDt, Math.min(turnSpd * simDt, diff));

          const copMax = c.kind === 'swat' ? 285 : c.kind === 'interceptor' ? 345 : 315;
          const copSpd = copMax + heat * 8;
          c.vx += (Math.cos(c.angle) * copSpd - c.vx) * Math.min(1, simDt * 3.5);
          c.vy += (Math.sin(c.angle) * copSpd - c.vy) * Math.min(1, simDt * 3.5);
          c.x += c.vx * simDt;
          c.y += c.vy * simDt;

          // Cop-player collision
          const dx = player.x - c.x;
          const dy = player.y - c.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 32 && dist > 0.01) {
            const nx = dx / dist;
            const ny = dy / dist;
            const overlap = 32 - dist;
            player.x += nx * overlap * 0.5;
            player.y += ny * overlap * 0.5;
            c.x -= nx * overlap * 0.5;
            c.y -= ny * overlap * 0.5;

            const playerSpd = Math.hypot(player.vx, player.vy);
            if (boosting || playerSpd > 270) {
              // Player rams cop!
              c.hp -= boosting ? 48 : 26;
              c.hitFlash = 0.14;
              c.vx -= nx * 240;
              c.vy -= ny * 240;
              g.particles.burst(c.x, c.y, 12, 220, '#facc15', 4, 0.35);
              g.triggerShake(0.45, 0.03);
              g.sfx.hit();
              if (c.hp <= 0) {
                bustedCops++;
                score += 250 * heat;
                g.particles.burst(c.x, c.y, 24, 280, '#f97316', 5, 0.55);
                g.sfx.crash();
                cops.splice(i, 1);
                continue;
              }
            } else if (player.invuln <= 0) {
              const dmg = c.kind === 'swat' ? 22 : 13;
              player.hp = Math.max(0, player.hp - dmg);
              player.invuln = 0.65;
              player.vx += nx * 160;
              player.vy += ny * 160;
              g.particles.burst(player.x, player.y, 14, 200, '#ef4444', 4, 0.35);
              g.triggerShake(0.6, 0.04);
              g.sfx.crash();
              if (player.hp <= 0) {
                g.finishGame(score, false, `Wrecked at Heat ★${heat} · ${bustedCops} Cops Smashed`);
                return;
              }
            }
          }

          if (Math.hypot(player.x - c.x, player.y - c.y) > 1300) {
            cops.splice(i, 1);
          }
        }

        // Update pickups & respawn nearby
        let activePickups = 0;
        for (const p of pickups) {
          if (p.collected) continue;
          p.bob += simDt * 4;
          const d = Math.hypot(player.x - p.x, player.y - p.y);
          if (d < 30) {
            p.collected = true;
            g.sfx.pickup();
            if (p.kind === 'cash') {
              cash += 250;
              score += 250;
              g.particles.burst(p.x, p.y, 10, 140, '#84cc16', 4, 0.3);
            } else if (p.kind === 'nitro') {
              player.nitro = 100;
              score += 100;
              g.particles.burst(p.x, p.y, 10, 160, '#38bdf8', 4, 0.3);
            } else {
              player.hp = Math.min(player.maxHp, player.hp + 35);
              g.particles.burst(p.x, p.y, 10, 140, '#22c55e', 4, 0.3);
            }
          } else if (d < 1200) {
            activePickups++;
          }
        }
        if (activePickups < 8) {
          pickups = pickups.filter((p) => !p.collected && Math.hypot(player.x - p.x, player.y - p.y) < 1200);
          spawnPickupsAround(player.x, player.y, 8);
        }
      },
      onRender: (ctx, w, h) => {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, w, h);

        const camX = player.x - w * 0.5;
        const camY = player.y - h * 0.5;

        ctx.save();
        ctx.translate(-camX, -camY);

        // Draw city block grid around camera
        const startBx = Math.floor(camX / BLOCK_SIZE) - 1;
        const endBx = Math.ceil((camX + w) / BLOCK_SIZE) + 1;
        const startBy = Math.floor(camY / BLOCK_SIZE) - 1;
        const endBy = Math.ceil((camY + h) / BLOCK_SIZE) + 1;

        for (let bx = startBx; bx <= endBx; bx++) {
          for (let by = startBy; by <= endBy; by++) {
            const x = bx * BLOCK_SIZE;
            const y = by * BLOCK_SIZE;

            // Road surface
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(x, y, BLOCK_SIZE, BLOCK_SIZE);

            // Road center dashed lines
            ctx.strokeStyle = 'rgba(250, 204, 21, 0.45)';
            ctx.lineWidth = 2;
            ctx.setLineDash([14, 14]);
            ctx.beginPath();
            ctx.moveTo(x + ROAD_WIDTH * 0.5, y);
            ctx.lineTo(x + ROAD_WIDTH * 0.5, y + BLOCK_SIZE);
            ctx.moveTo(x, y + ROAD_WIDTH * 0.5);
            ctx.lineTo(x + BLOCK_SIZE, y + ROAD_WIDTH * 0.5);
            ctx.stroke();
            ctx.setLineDash([]);

            // Sidewalk & rooftop block
            const pad = ROAD_WIDTH + 4;
            const size = BLOCK_SIZE - ROAD_WIDTH - 8;
            ctx.fillStyle = '#334155';
            ctx.fillRect(x + pad, y + pad, size, size);

            ctx.fillStyle = (bx + by) % 2 === 0 ? '#0f172a' : '#172033';
            ctx.fillRect(x + pad + 14, y + pad + 14, size - 28, size - 28);
            ctx.strokeStyle = '#38bdf844';
            ctx.lineWidth = 2;
            ctx.strokeRect(x + pad + 14, y + pad + 14, size - 28, size - 28);
          }
        }

        // Skid marks
        for (const s of skids) {
          ctx.strokeStyle = `rgba(10, 12, 18, ${s.alpha.toFixed(2)})`;
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.moveTo(s.x1, s.y1);
          ctx.lineTo(s.x2, s.y2);
          ctx.stroke();
        }

        // Pickups
        for (const p of pickups) {
          if (p.collected) continue;
          const r = 12 + Math.sin(p.bob) * 2;
          ctx.fillStyle =
            p.kind === 'cash' ? '#84cc16' : p.kind === 'nitro' ? '#38bdf8' : '#22c55e';
          ctx.beginPath();
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#090d16';
          ctx.font = 'bold 12px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(p.kind === 'cash' ? '$' : p.kind === 'nitro' ? 'N' : '+', p.x, p.y);
        }

        // Cops
        for (const c of cops) {
          ctx.save();
          ctx.translate(c.x, c.y);
          ctx.rotate(c.angle);
          const len = c.kind === 'swat' ? 42 : 34;
          const wid = c.kind === 'swat' ? 22 : 18;
          ctx.fillStyle = c.hitFlash > 0 ? '#ffffff' : c.kind === 'swat' ? '#1e293b' : '#0f172a';
          ctx.fillRect(-len * 0.5, -wid * 0.5, len, wid);
          ctx.fillStyle = c.hitFlash > 0 ? '#ffffff' : '#f8fafc';
          ctx.fillRect(-len * 0.16, -wid * 0.44, len * 0.34, wid * 0.88);
          // Flashing siren bar
          const redOn = Math.sin(c.sirenPhase) > 0;
          ctx.fillStyle = redOn ? '#ef4444' : '#3b82f6';
          ctx.fillRect(-3, -wid * 0.38, 6, wid * 0.36);
          ctx.fillStyle = redOn ? '#3b82f6' : '#ef4444';
          ctx.fillRect(-3, 2, 6, wid * 0.36);
          ctx.restore();
        }

        // Player lime supercar
        ctx.save();
        ctx.translate(player.x, player.y);
        ctx.rotate(player.angle);
        ctx.fillStyle = player.invuln > 0 && Math.floor(elapsed * 16) % 2 === 0 ? '#ffffff' : '#84cc16';
        ctx.beginPath();
        ctx.roundRect(-19, -10, 38, 20, 4);
        ctx.fill();
        // Windshield & spoiler
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-4, -8, 12, 16);
        ctx.fillStyle = '#3f6212';
        ctx.fillRect(-19, -11, 5, 22);
        // Headlights
        ctx.fillStyle = 'rgba(254, 249, 195, 0.35)';
        ctx.beginPath();
        ctx.moveTo(19, -8);
        ctx.lineTo(75, -24);
        ctx.lineTo(75, 24);
        ctx.lineTo(19, 8);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        ctx.restore();
      },
      getHudSnapshot: () => ({
        score: Math.round(score),
        primaryLabel: 'ARMOR · HEAT',
        primaryValue: `${Math.round(player.hp)} HP · ★${heat}`,
        secondaryLabel: 'NITRO · CASH',
        secondaryValue: `${Math.round(player.nitro)}% · $${cash}`,
      }),
    };
  });
}
