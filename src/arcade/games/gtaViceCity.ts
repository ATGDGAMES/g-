import { createCanvasGame } from '../canvasHarness';
import type { CanvasGameCallbacks, CanvasGameController } from '../types';

interface StreetCar {
  id: number;
  x: number;
  y: number;
  angle: number;
  speed: number;
  color: string;
  name: string;
  isPolice?: boolean;
  driver: 'parked' | 'traffic' | 'cop' | 'player';
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  fromPlayer: boolean;
}

const CITY_W = 2000;
const BEACH_X = 1620;

export function createGtaViceCityGame(
  container: HTMLElement,
  callbacks: CanvasGameCallbacks,
): CanvasGameController {
  return createCanvasGame(container, callbacks, (g) => {
    const player = {
      x: 1460,
      y: 920,
      vx: 0,
      vy: 0,
      angle: -Math.PI / 2,
      hp: 100,
      inCarId: null as number | null,
      shootCd: 0,
      invuln: 0,
    };

    let cars: StreetCar[] = [];
    let bullets: Bullet[] = [];
    let cash = 0;
    let wanted = 0;
    let missionsDone = 0;
    let mission = { x: 1460, y: 520 };
    let nextCarId = 1;
    let copSpawnTimer = 2;

    const buildings = [
      { x: 180, y: 180, w: 340, h: 280, color: '#ec4899', label: 'MALIBU CLUB' },
      { x: 740, y: 180, w: 380, h: 280, color: '#06b6d4', label: 'OCEAN VIEW' },
      { x: 180, y: 680, w: 340, h: 320, color: '#f59e0b', label: 'VICE PLAZA' },
      { x: 740, y: 680, w: 380, h: 320, color: '#a855f7', label: 'STARFISH HOTEL' },
      { x: 180, y: 1220, w: 340, h: 320, color: '#14b8a6', label: 'DOCKSIDE' },
      { x: 740, y: 1220, w: 380, h: 320, color: '#f43f5e', label: 'SUNSET BLVD' },
    ];

    const pickNewMission = () => {
      const spots = [
        { x: 1450, y: 340 },
        { x: 630, y: 580 },
        { x: 1450, y: 1480 },
        { x: 630, y: 1120 },
        { x: 1220, y: 860 },
      ];
      const next = spots[Math.floor(Math.random() * spots.length)];
      mission = { x: next.x, y: next.y };
    };

    const spawnCar = (
      x: number,
      y: number,
      angle: number,
      color: string,
      name: string,
      driver: StreetCar['driver'],
      isPolice = false,
    ) => {
      cars.push({
        id: nextCarId++,
        x,
        y,
        angle,
        speed: driver === 'traffic' ? 145 : 0,
        color,
        name,
        isPolice,
        driver,
      });
    };

    const collidesBuilding = (x: number, y: number, r: number): boolean => {
      if (x < r || x > CITY_W - r || y < r || y > CITY_W - r) return true;
      for (const b of buildings) {
        if (x > b.x - r && x < b.x + b.w + r && y > b.y - r && y < b.y + b.h + r) {
          return true;
        }
      }
      return false;
    };

    return {
      gameId: 'gta-vice-city',
      onReset: () => {
        player.x = 1460;
        player.y = 920;
        player.vx = 0;
        player.vy = 0;
        player.angle = -Math.PI / 2;
        player.hp = 100;
        player.inCarId = null;
        player.shootCd = 0;
        player.invuln = 2.0;
        cars = [];
        bullets = [];
        cash = 0;
        wanted = 1;
        missionsDone = 0;
        copSpawnTimer = 4.0;
        pickNewMission();

        // Starter pastel Infernus parked right beside player + Ocean Drive fleet
        spawnCar(1418, 910, -Math.PI / 2, '#f43f5e', 'Infernus 86', 'parked');
        spawnCar(1418, 520, 0, '#06b6d4', 'Ocean Cruiser', 'parked');
        spawnCar(630, 560, Math.PI / 2, '#facc15', 'Vice Cab', 'traffic');
        spawnCar(630, 1280, -Math.PI / 2, '#ec4899', 'Banshee GT', 'traffic');
        spawnCar(1250, 580, Math.PI, '#a855f7', 'Stinger', 'traffic');
        spawnCar(620, 260, 0, '#22d3ee', 'Vice Patrol', 'cop', true);
      },
      onKeyDown: (code) => {
        if (code === 'KeyF' || code === 'KeyE') {
          if (player.inCarId !== null) {
            const car = cars.find((c) => c.id === player.inCarId);
            if (car) {
              car.driver = 'parked';
              car.speed *= 0.4;
              player.x = car.x - Math.sin(car.angle) * 28;
              player.y = car.y + Math.cos(car.angle) * 28;
            }
            player.inCarId = null;
            g.sfx.tone(280, 0.08, 'triangle', 0.1);
          } else {
            let bestCar: StreetCar | null = null;
            let bestDist = 64;
            for (const c of cars) {
              const d = Math.hypot(c.x - player.x, c.y - player.y);
              if (d < bestDist) {
                bestDist = d;
                bestCar = c;
              }
            }
            if (bestCar) {
              bestCar.driver = 'player';
              player.inCarId = bestCar.id;
              player.x = bestCar.x;
              player.y = bestCar.y;
              g.sfx.boost();
            }
          }
        }
      },
      onUpdate: (_dt, simDt) => {
        if (simDt <= 0) return;
        player.shootCd = Math.max(0, player.shootCd - simDt);
        player.invuln = Math.max(0, player.invuln - simDt);

        const activeCar = player.inCarId !== null ? cars.find((c) => c.id === player.inCarId) ?? null : null;

        // Controls
        const forward =
          (g.held.has('KeyW') || g.held.has('ArrowUp') ? 1 : 0) -
          (g.held.has('KeyS') || g.held.has('ArrowDown') ? 1 : 0);
        const turn =
          (g.held.has('KeyD') || g.held.has('ArrowRight') ? 1 : 0) -
          (g.held.has('KeyA') || g.held.has('ArrowLeft') ? 1 : 0);

        if (activeCar) {
          const maxSpd = activeCar.isPolice ? 390 : 410;
          if (forward !== 0) {
            activeCar.speed = Math.max(-140, Math.min(maxSpd, activeCar.speed + forward * 540 * simDt));
          } else {
            activeCar.speed *= Math.pow(0.18, simDt);
          }
          const steerScale = Math.min(1, Math.abs(activeCar.speed) / 90);
          activeCar.angle += turn * 3.1 * steerScale * (activeCar.speed >= 0 ? 1 : -1) * simDt;
          player.x = activeCar.x;
          player.y = activeCar.y;
          player.angle = activeCar.angle;
        } else {
          const moveX =
            (g.held.has('KeyD') || g.held.has('ArrowRight') ? 1 : 0) -
            (g.held.has('KeyA') || g.held.has('ArrowLeft') ? 1 : 0);
          const moveY =
            (g.held.has('KeyS') || g.held.has('ArrowDown') ? 1 : 0) -
            (g.held.has('KeyW') || g.held.has('ArrowUp') ? 1 : 0);
          const mag = Math.hypot(moveX, moveY);
          const nx = player.x + (mag > 0 ? (moveX / mag) * 185 * simDt : 0);
          const ny = player.y + (mag > 0 ? (moveY / mag) * 185 * simDt : 0);
          if (!collidesBuilding(nx, player.y, 12)) player.x = nx;
          if (!collidesBuilding(player.x, ny, 12)) player.y = ny;
          if (mag > 0) player.angle = Math.atan2(moveY, moveX);
        }

        // Fire blaster / drive-by
        if ((g.held.has('Space') || g.pointerDown) && player.shootCd <= 0) {
          player.shootCd = activeCar ? 0.22 : 0.18;
          const aim =
            g.pointerDown
              ? Math.atan2(g.pointerY - g.height * 0.5, g.pointerX - g.width * 0.5)
              : player.angle;
          bullets.push({
            x: player.x + Math.cos(aim) * 20,
            y: player.y + Math.sin(aim) * 20,
            vx: Math.cos(aim) * 620,
            vy: Math.sin(aim) * 620,
            life: 0.75,
            fromPlayer: true,
          });
          g.sfx.tone(360, 0.05, 'square', 0.08, 180);
        }

        // Update all cars
        for (let i = cars.length - 1; i >= 0; i--) {
          const c = cars[i];
          if (c.driver === 'cop') {
            const desired = Math.atan2(player.y - c.y, player.x - c.x);
            let diff = desired - c.angle;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            c.angle += Math.max(-2.6 * simDt, Math.min(2.6 * simDt, diff));
            c.speed += (230 + wanted * 26 - c.speed) * Math.min(1, simDt * 3);
            if (Math.random() < simDt * (0.22 + wanted * 0.12) && Math.hypot(player.x - c.x, player.y - c.y) < 360) {
              const a = Math.atan2(player.y - c.y, player.x - c.x);
              bullets.push({
                x: c.x + Math.cos(a) * 22,
                y: c.y + Math.sin(a) * 22,
                vx: Math.cos(a) * 400,
                vy: Math.sin(a) * 400,
                life: 0.9,
                fromPlayer: false,
              });
            }
          } else if (c.driver === 'traffic') {
            c.speed = 135;
          } else if (c.driver === 'parked') {
            c.speed *= Math.pow(0.08, simDt);
          }

          const nx = c.x + Math.cos(c.angle) * c.speed * simDt;
          const ny = c.y + Math.sin(c.angle) * c.speed * simDt;
          if (!collidesBuilding(nx, ny, 16)) {
            c.x = nx;
            c.y = ny;
          } else {
            if (c.driver === 'traffic') {
              c.angle += Math.PI * 0.5;
            } else {
              c.speed *= -0.35;
            }
          }

          // Ramming / player collision with cop cars
          if (c.driver === 'cop') {
            const d = Math.hypot(c.x - player.x, c.y - player.y);
            if (d < 34) {
              if (activeCar && Math.abs(activeCar.speed) > 210) {
                cash += 400;
                wanted = Math.min(5, wanted + 1);
                g.particles.burst(c.x, c.y, 20, 260, '#f97316', 5, 0.45);
                g.sfx.crash();
                g.triggerShake(0.45, 0.03);
                cars.splice(i, 1);
                continue;
              } else if (player.invuln <= 0) {
                player.hp = Math.max(0, player.hp - 16);
                player.invuln = 0.7;
                g.triggerShake(0.5, 0.03);
                g.sfx.hit();
              }
            }
          }
        }

        // Bullets
        for (let i = bullets.length - 1; i >= 0; i--) {
          const b = bullets[i];
          b.life -= simDt;
          b.x += b.vx * simDt;
          b.y += b.vy * simDt;
          if (b.life <= 0 || collidesBuilding(b.x, b.y, 2)) {
            bullets.splice(i, 1);
            continue;
          }
          if (b.fromPlayer) {
            let hit = false;
            for (let j = cars.length - 1; j >= 0; j--) {
              const c = cars[j];
              if (c.driver === 'cop' && Math.hypot(b.x - c.x, b.y - c.y) < 22) {
                cash += 300;
                wanted = Math.min(5, wanted + (Math.random() < 0.35 ? 1 : 0));
                g.particles.burst(c.x, c.y, 16, 220, '#facc15', 4, 0.4);
                g.sfx.crash();
                cars.splice(j, 1);
                hit = true;
                break;
              }
            }
            if (hit) bullets.splice(i, 1);
          } else if (Math.hypot(b.x - player.x, b.y - player.y) < 18) {
            bullets.splice(i, 1);
            if (player.invuln <= 0) {
              player.hp = Math.max(0, player.hp - (activeCar ? 8 : 14));
              player.invuln = 0.35;
              g.triggerShake(0.35);
              g.sfx.hit();
            }
          }
        }

        // Check mission pickup
        if (Math.hypot(player.x - mission.x, player.y - mission.y) < 42) {
          missionsDone++;
          cash += 1500;
          player.hp = Math.min(100, player.hp + 20);
          g.particles.burst(mission.x, mission.y, 24, 240, '#ec4899', 5, 0.5);
          g.sfx.score();
          pickNewMission();
        }

        // Cop wave spawner
        copSpawnTimer -= simDt;
        const activeCops = cars.filter((c) => c.driver === 'cop').length;
        if (copSpawnTimer <= 0 && activeCops < 1 + wanted) {
          const ang = Math.random() * Math.PI * 2;
          const sx = Math.max(80, Math.min(BEACH_X - 40, player.x + Math.cos(ang) * 580));
          const sy = Math.max(80, Math.min(CITY_W - 80, player.y + Math.sin(ang) * 580));
          if (!collidesBuilding(sx, sy, 20)) {
            spawnCar(sx, sy, ang + Math.PI, '#1e293b', 'Vice Patrol', 'cop', true);
          }
          copSpawnTimer = Math.max(2.0, 4.8 - wanted * 0.5);
        }

        if (player.hp <= 0) {
          g.finishGame(cash, false, `Busted on Ocean Drive · ${missionsDone} Drops · $${cash}`);
        }
      },
      onRender: (ctx, w, h) => {
        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 0, w, h);

        const camX = player.x - w * 0.5;
        const camY = player.y - h * 0.5;
        ctx.save();
        ctx.translate(-camX, -camY);

        // Asphalt city grid + Ocean Beach sand & turquoise surf
        ctx.fillStyle = '#1b1d2e';
        ctx.fillRect(0, 0, BEACH_X, CITY_W);
        ctx.fillStyle = '#475569';
        ctx.fillRect(BEACH_X - 36, 0, 36, CITY_W);
        ctx.fillStyle = '#fde68a';
        ctx.fillRect(BEACH_X, 0, 140, CITY_W);
        ctx.fillStyle = '#0891b2';
        ctx.fillRect(BEACH_X + 140, 0, CITY_W - (BEACH_X + 140), CITY_W);

        // Rolling surf foam waves along Ocean Beach
        const waveShift = Math.sin(performance.now() * 0.0025) * 10;
        ctx.strokeStyle = 'rgba(224, 242, 254, 0.65)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        for (let y = 0; y <= CITY_W; y += 60) {
          const x = BEACH_X + 148 + waveShift + Math.sin(y * 0.025) * 6;
          if (y === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Road markings
        ctx.strokeStyle = 'rgba(244, 114, 182, 0.35)';
        ctx.lineWidth = 3;
        ctx.setLineDash([22, 18]);
        for (const rx of [630, 1260, 1500]) {
          ctx.beginPath();
          ctx.moveTo(rx, 0);
          ctx.lineTo(rx, CITY_W);
          ctx.stroke();
        }
        for (const ry of [570, 1110]) {
          ctx.beginPath();
          ctx.moveTo(0, ry);
          ctx.lineTo(BEACH_X - 36, ry);
          ctx.stroke();
        }
        ctx.setLineDash([]);

        // Sidewalks & neon 1986 Art Deco rooftops
        for (const b of buildings) {
          ctx.fillStyle = '#334155';
          ctx.fillRect(b.x - 16, b.y - 16, b.w + 32, b.h + 32);
          ctx.fillStyle = '#111827';
          ctx.fillRect(b.x, b.y, b.w, b.h);
          ctx.strokeStyle = b.color;
          ctx.lineWidth = 4;
          ctx.strokeRect(b.x + 6, b.y + 6, b.w - 12, b.h - 12);
          ctx.fillStyle = b.color;
          ctx.font = 'bold 20px "Barlow Condensed", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(b.label, b.x + b.w * 0.5, b.y + b.h * 0.5);
        }

        // Palm trees with star-fronds along Ocean Drive promenade
        for (let py = 120; py < CITY_W; py += 200) {
          const px = BEACH_X - 18;
          ctx.fillStyle = '#065f46';
          for (let k = 0; k < 6; k++) {
            const a = (Math.PI / 3) * k + 0.25;
            ctx.beginPath();
            ctx.ellipse(px + Math.cos(a) * 14, py + Math.sin(a) * 14, 14, 5, a, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = '#10b981';
          ctx.beginPath();
          ctx.arc(px, py, 7, 0, Math.PI * 2);
          ctx.fill();
        }

        // Pink Mission Marker Ring
        const pulse = 26 + Math.sin(performance.now() * 0.008) * 6;
        ctx.strokeStyle = '#ec4899';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(mission.x, mission.y, pulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(236, 72, 153, 0.25)';
        ctx.fill();

        // Cars
        for (const c of cars) {
          ctx.save();
          ctx.translate(c.x, c.y);
          ctx.rotate(c.angle);
          ctx.fillStyle = c.color;
          ctx.beginPath();
          ctx.roundRect(-21, -11, 42, 22, 4);
          ctx.fill();
          ctx.fillStyle = c.isPolice ? '#f8fafc' : '#0f172a';
          ctx.fillRect(-5, -9, 13, 18);
          if (c.isPolice) {
            const flip = Math.floor(performance.now() / 160) % 2 === 0;
            ctx.fillStyle = flip ? '#ef4444' : '#3b82f6';
            ctx.fillRect(-2, -8, 5, 8);
            ctx.fillStyle = flip ? '#3b82f6' : '#ef4444';
            ctx.fillRect(-2, 0, 5, 8);
          }
          ctx.restore();
        }

        // Player on foot
        if (player.inCarId === null) {
          ctx.save();
          ctx.translate(player.x, player.y);
          ctx.rotate(player.angle);
          ctx.fillStyle = '#22d3ee';
          ctx.beginPath();
          ctx.arc(0, 0, 11, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fde68a';
          ctx.beginPath();
          ctx.arc(4, 0, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Bullets
        for (const b of bullets) {
          ctx.fillStyle = b.fromPlayer ? '#facc15' : '#ef4444';
          ctx.beginPath();
          ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();

        // Direction arrow toward pink mission drop if off-screen
        const dx = mission.x - player.x;
        const dy = mission.y - player.y;
        if (Math.hypot(dx, dy) > Math.min(w, h) * 0.42) {
          const ang = Math.atan2(dy, dx);
          const ax = w * 0.5 + Math.cos(ang) * 110;
          const ay = h * 0.5 + Math.sin(ang) * 110;
          ctx.save();
          ctx.translate(ax, ay);
          ctx.rotate(ang);
          ctx.fillStyle = '#ec4899';
          ctx.beginPath();
          ctx.moveTo(14, 0);
          ctx.lineTo(-8, -8);
          ctx.lineTo(-8, 8);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      },
      getHudSnapshot: () => ({
        score: cash,
        primaryLabel: 'HP · WANTED',
        primaryValue: `${Math.round(player.hp)} HP · ${'★'.repeat(Math.max(1, wanted))}`,
        secondaryLabel: player.inCarId ? 'VEHICLE · DROPS' : 'ON FOOT [F] · DROPS',
        secondaryValue: `${player.inCarId ? 'IN CAR' : 'WALKING'} · ${missionsDone}`,
      }),
    };
  });
}
