import { createCanvasGame } from '../canvasHarness';
import type { CanvasGameCallbacks, CanvasGameController } from '../types';

interface Jumper {
  x: number;
  y: number;
  vx: number;
  vy: number;
  team: 'blue' | 'gold';
  tilt: number;
  cooldown: number;
}

const MODIFIERS = ['NORMAL COURT', 'LOW GRAVITY', 'BOUNCY BALL', 'TURBO HOOPS', 'BIG RIM'] as const;

export function createBasketRandomGame(
  container: HTMLElement,
  callbacks: CanvasGameCallbacks,
): CanvasGameController {
  return createCanvasGame(container, callbacks, (g) => {
    let scoreBlue = 0;
    let scoreGold = 0;
    let modifier: (typeof MODIFIERS)[number] = 'NORMAL COURT';
    let roundPause = 0;

    const ball = {
      x: 480,
      y: 160,
      vx: 0,
      vy: 0,
      r: 16,
      rot: 0,
    };

    let players: Jumper[] = [];

    const resetRound = (randomize = false) => {
      const w = Math.max(640, g.width);
      const h = Math.max(360, g.height);
      const floorY = h - 46;
      ball.x = w * 0.5;
      ball.y = h * 0.25;
      ball.vx = (Math.random() - 0.5) * 140;
      ball.vy = 0;

      players = [
        { x: w * 0.24, y: floorY - 38, vx: 0, vy: 0, team: 'blue', tilt: 0.2, cooldown: 0 },
        { x: w * 0.36, y: floorY - 38, vx: 0, vy: 0, team: 'blue', tilt: -0.2, cooldown: 0 },
        { x: w * 0.64, y: floorY - 38, vx: 0, vy: 0, team: 'gold', tilt: 0.2, cooldown: 0 },
        { x: w * 0.76, y: floorY - 38, vx: 0, vy: 0, team: 'gold', tilt: -0.2, cooldown: 0 },
      ];
      if (randomize) {
        modifier = MODIFIERS[Math.floor(Math.random() * MODIFIERS.length)];
      }
    };

    return {
      gameId: 'basket-random',
      onReset: () => {
        scoreBlue = 0;
        scoreGold = 0;
        modifier = 'NORMAL COURT';
        roundPause = 0;
        resetRound(false);
      },
      onUpdate: (_dt, simDt) => {
        if (simDt <= 0) return;
        const w = g.width;
        const h = g.height;
        const floorY = h - 46;
        const grav = modifier === 'LOW GRAVITY' ? 480 : 980;
        const bounce = modifier === 'BOUNCY BALL' ? 0.88 : 0.72;
        const rimRadius = modifier === 'BIG RIM' ? 32 : 23;

        if (roundPause > 0) {
          roundPause -= simDt;
          if (roundPause <= 0) {
            if (scoreBlue >= 5 || scoreGold >= 5) {
              g.finishGame(
                scoreBlue * 200 + (scoreBlue > scoreGold ? 500 : 0),
                scoreBlue > scoreGold,
                `Final Score: BLUE ${scoreBlue} — ${scoreGold} GOLD`,
              );
              return;
            }
            resetRound(true);
          }
          return;
        }

        const p1Jump =
          g.justPressed.has('KeyW') ||
          g.justPressed.has('Space') ||
          g.pointerJustPressed;
        const p2Jump = g.justPressed.has('ArrowUp');

        for (let i = 0; i < players.length; i++) {
          const p = players[i];
          p.cooldown = Math.max(0, p.cooldown - simDt);

          const onGround = p.y >= floorY - 38;
          if (p.team === 'blue' && p1Jump && onGround) {
            p.vy = modifier === 'LOW GRAVITY' ? -460 : -560;
            const towardHoop = (w * 0.88 - p.x > 160 ? 1 : -0.3) * (modifier === 'TURBO HOOPS' ? 240 : 185);
            p.vx = towardHoop + (Math.random() - 0.5) * 60;
            p.tilt = 0.35;
            g.sfx.jump();
          } else if (p.team === 'gold') {
            if (p2Jump && onGround) {
              p.vy = -560;
              p.vx = -190;
              g.sfx.jump();
            } else if (!g.held.has('ArrowUp') && onGround && p.cooldown <= 0) {
              // Smart CPU jump toward ball
              const distToBall = Math.abs(ball.x - p.x);
              if (distToBall < 180 || Math.random() < 0.03) {
                p.vy = modifier === 'LOW GRAVITY' ? -440 : -530;
                p.vx = (ball.x < p.x ? -165 : 140) + (Math.random() - 0.5) * 50;
                p.cooldown = 0.55 + Math.random() * 0.4;
              }
            }
          }

          p.vy += grav * simDt;
          p.x += p.vx * simDt;
          p.y += p.vy * simDt;
          p.vx *= Math.pow(0.25, simDt);
          p.tilt *= Math.pow(0.1, simDt);

          if (p.y > floorY - 38) {
            p.y = floorY - 38;
            p.vy = 0;
          }
          p.x = Math.max(36, Math.min(w - 36, p.x));

          // Bounce ball off player body/hands
          const dx = ball.x - p.x;
          const dy = ball.y - (p.y - 12);
          const d = Math.hypot(dx, dy);
          if (d < ball.r + 24 && d > 0.01) {
            const nx = dx / d;
            const ny = dy / d;
            ball.x = p.x + nx * (ball.r + 24);
            ball.y = p.y - 12 + ny * (ball.r + 24);
            const aimX = p.team === 'blue' ? (w * 0.9 - p.x) * 1.4 : (w * 0.1 - p.x) * 1.4;
            ball.vx = Math.max(-460, Math.min(460, aimX + nx * 160));
            ball.vy = -Math.max(360, Math.min(620, 460 + Math.abs(p.vy) * 0.45));
            g.sfx.hit();
          }
        }

        // Ball physics
        ball.vy += grav * 0.85 * simDt;
        ball.x += ball.vx * simDt;
        ball.y += ball.vy * simDt;
        ball.rot += ball.vx * 0.02 * simDt;

        if (ball.y > floorY - ball.r) {
          ball.y = floorY - ball.r;
          ball.vy = -Math.abs(ball.vy) * bounce;
          ball.vx *= 0.9;
        }
        if (ball.y < ball.r + 12) {
          ball.y = ball.r + 12;
          ball.vy = Math.abs(ball.vy) * 0.8;
        }
        if (ball.x < ball.r + 12) {
          ball.x = ball.r + 12;
          ball.vx = Math.abs(ball.vx) * 0.8;
        } else if (ball.x > w - ball.r - 12) {
          ball.x = w - ball.r - 12;
          ball.vx = -Math.abs(ball.vx) * 0.8;
        }

        // Check baskets! Right hoop = Blue scores; Left hoop = Gold scores
        const hoopY = h * 0.42;
        const leftHoopX = 56;
        const rightHoopX = w - 56;

        if (ball.vy > 0 && Math.abs(ball.y - hoopY) < 18) {
          if (Math.abs(ball.x - rightHoopX) < rimRadius) {
            scoreBlue++;
            roundPause = 1.1;
            g.sfx.score();
            g.particles.burst(rightHoopX, hoopY, 24, 240, '#38bdf8', 5, 0.5);
          } else if (Math.abs(ball.x - leftHoopX) < rimRadius) {
            scoreGold++;
            roundPause = 1.1;
            g.sfx.crash();
            g.particles.burst(leftHoopX, hoopY, 24, 240, '#facc15', 5, 0.5);
          }
        }
      },
      onRender: (ctx, w, h) => {
        const bg = ctx.createLinearGradient(0, 0, 0, h);
        bg.addColorStop(0, '#1e1b4b');
        bg.addColorStop(1, '#312e81');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        const floorY = h - 46;
        ctx.fillStyle = '#b45309';
        ctx.fillRect(0, floorY, w, 46);
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, floorY);
        ctx.lineTo(w, floorY);
        ctx.stroke();

        // Hoops & Backboards
        const hoopY = h * 0.42;
        const rimW = modifier === 'BIG RIM' ? 54 : 38;
        for (const [hx, isLeft] of [
          [56, true],
          [w - 56, false],
        ] as Array<[number, boolean]>) {
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(isLeft ? 16 : w - 26, hoopY - 65, 10, 80);
          ctx.strokeStyle = '#f97316';
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.moveTo(hx - rimW * 0.5, hoopY);
          ctx.lineTo(hx + rimW * 0.5, hoopY);
          ctx.stroke();
        }

        // Players
        for (const p of players) {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.tilt);
          ctx.fillStyle = p.team === 'blue' ? '#0ea5e9' : '#f59e0b';
          ctx.fillRect(-13, -18, 26, 42);
          ctx.fillStyle = '#fde68a';
          ctx.fillRect(-9, -34, 18, 16);
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(-10, 24, 9, 14);
          ctx.fillRect(1, 24, 9, 14);
          ctx.restore();
        }

        // Basketball
        ctx.save();
        ctx.translate(ball.x, ball.y);
        ctx.rotate(ball.rot);
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(0, 0, ball.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#7c2d12';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-ball.r, 0);
        ctx.lineTo(ball.r, 0);
        ctx.stroke();
        ctx.restore();

        // Big Center Scoreboard
        ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
        ctx.beginPath();
        ctx.roundRect(w * 0.5 - 115, 14, 230, 52, 8);
        ctx.fill();
        ctx.font = 'bold 28px "Barlow Condensed", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#38bdf8';
        ctx.fillText(`BLUE ${scoreBlue}`, w * 0.5 - 52, 46);
        ctx.fillStyle = '#facc15';
        ctx.fillText(`${scoreGold} GOLD`, w * 0.5 + 52, 46);
      },
      getHudSnapshot: () => ({
        score: scoreBlue * 200,
        primaryLabel: 'SCORE (FIRST TO 5)',
        primaryValue: `BLUE ${scoreBlue} - ${scoreGold} GOLD`,
        secondaryLabel: 'COURT RULE',
        secondaryValue: modifier,
      }),
    };
  });
}
