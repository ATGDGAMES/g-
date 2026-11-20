import { createCanvasGame } from '../canvasHarness';
import type { CanvasGameCallbacks, CanvasGameController } from '../types';

interface EmbeddedItem {
  angle: number;
  kind: 'knife' | 'apple';
}

export function createKnifeHitGame(
  container: HTMLElement,
  callbacks: CanvasGameCallbacks,
): CanvasGameController {
  return createCanvasGame(container, callbacks, (g) => {
    let stage = 1;
    let score = 0;
    let apples = 0;
    let targetAngle = 0;
    let spinSpeed = 2.0;
    let knivesLeft = 7;
    let flyingKnifeY: number | null = null;
    let embedded: EmbeddedItem[] = [];
    let stageFlash = 0;

    const setupStage = (s: number) => {
      stage = s;
      targetAngle = 0;
      spinSpeed = 1.7 + Math.min(2.6, s * 0.22);
      knivesLeft = 6 + Math.min(6, Math.floor(s / 2));
      flyingKnifeY = null;
      embedded = [];
      const presetKnives = Math.min(4, Math.floor(s / 2));
      for (let i = 0; i < presetKnives; i++) {
        embedded.push({ angle: (Math.PI * 2 * i) / Math.max(1, presetKnives), kind: 'knife' });
      }
      if (s % 2 === 1) {
        embedded.push({ angle: Math.PI * 0.65, kind: 'apple' });
      }
    };

    const throwKnife = () => {
      if (flyingKnifeY !== null || knivesLeft <= 0 || stageFlash > 0) return;
      flyingKnifeY = g.height * 0.8;
      g.sfx.tone(420, 0.06, 'triangle', 0.1, 240);
    };

    return {
      gameId: 'knife-hit',
      onReset: () => {
        score = 0;
        apples = 0;
        stageFlash = 0;
        setupStage(1);
      },
      onKeyDown: (code) => {
        if (code === 'Space') throwKnife();
      },
      onPointerDown: () => {
        throwKnife();
      },
      onUpdate: (_dt, simDt) => {
        if (simDt <= 0) return;
        const cx = g.width * 0.5;
        const cy = g.height * 0.34;
        const logR = 68;

        if (stageFlash > 0) {
          stageFlash -= simDt;
          if (stageFlash <= 0) {
            setupStage(stage + 1);
          }
          return;
        }

        // Variable boss spin reversal on higher stages
        const modSpin =
          stage % 5 === 0
            ? Math.sin(performance.now() * 0.0022) * (spinSpeed + 1.4)
            : stage >= 3
              ? spinSpeed * (0.85 + 0.4 * Math.sin(performance.now() * 0.003))
              : spinSpeed;
        targetAngle = (targetAngle + modSpin * simDt) % (Math.PI * 2);

        if (flyingKnifeY !== null) {
          flyingKnifeY -= 1250 * simDt;
          if (flyingKnifeY <= cy + logR + 12) {
            // Compute local impact angle (bottom of log = Math.PI / 2)
            const hitAngle = ((Math.PI / 2 - targetAngle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
            let collidedKnife = false;
            for (let i = embedded.length - 1; i >= 0; i--) {
              const item = embedded[i];
              let diff = Math.abs(hitAngle - item.angle);
              if (diff > Math.PI) diff = Math.PI * 2 - diff;
              if (diff < 0.24) {
                if (item.kind === 'apple') {
                  apples++;
                  score += 50;
                  embedded.splice(i, 1);
                  g.sfx.pickup();
                  g.particles.burst(cx, cy + logR, 14, 200, '#ef4444', 4, 0.35);
                } else {
                  collidedKnife = true;
                  break;
                }
              }
            }

            flyingKnifeY = null;
            if (collidedKnife) {
              g.sfx.crash();
              g.triggerShake(0.8, 0.05);
              g.finishGame(score, false, `Blade Clashed on Stage ${stage} · ${apples} Apples`);
              return;
            }

            embedded.push({ angle: hitAngle, kind: 'knife' });
            knivesLeft--;
            score += 20 * stage;
            g.sfx.hit();
            g.triggerShake(0.18);
            g.particles.burst(cx, cy + logR, 8, 130, '#fde68a', 3, 0.25);

            if (knivesLeft <= 0) {
              score += 150 * stage;
              g.sfx.score();
              g.particles.burst(cx, cy, 28, 280, '#facc15', 5, 0.55);
              stageFlash = 0.55;
            }
          }
        }
      },
      onRender: (ctx, w, h) => {
        ctx.fillStyle = '#0b1220';
        ctx.fillRect(0, 0, w, h);

        const cx = w * 0.5;
        const cy = h * 0.34;
        const logR = 68;

        // Embedded items rotating with the oak log
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(targetAngle);

        for (const item of embedded) {
          ctx.save();
          ctx.rotate(item.angle);
          if (item.kind === 'knife') {
            ctx.fillStyle = '#cbd5e1';
            ctx.fillRect(logR - 6, -3, 28, 6);
            ctx.fillStyle = '#78350f';
            ctx.fillRect(logR + 22, -5, 22, 10);
          } else {
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(logR + 14, 0, 11, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#22c55e';
            ctx.fillRect(logR + 23, -2, 6, 4);
          }
          ctx.restore();
        }

        // Oak log body
        if (stageFlash <= 0) {
          ctx.fillStyle = stage % 5 === 0 ? '#7c2d12' : '#92400e';
          ctx.beginPath();
          ctx.arc(0, 0, logR, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = stage % 5 === 0 ? '#ef4444' : '#d97706';
          ctx.lineWidth = 7;
          ctx.stroke();

          ctx.fillStyle = '#fde68a';
          ctx.beginPath();
          ctx.arc(0, 0, logR * 0.62, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        // Flying knife or ready knife at bottom
        const drawKnifeY = flyingKnifeY !== null ? flyingKnifeY : h * 0.8;
        if (knivesLeft > 0 && stageFlash <= 0) {
          ctx.fillStyle = '#e2e8f0';
          ctx.beginPath();
          ctx.moveTo(cx, drawKnifeY - 26);
          ctx.lineTo(cx - 6, drawKnifeY);
          ctx.lineTo(cx + 6, drawKnifeY);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#78350f';
          ctx.fillRect(cx - 5, drawKnifeY, 10, 26);
        }

        // Remaining knife icons on left side
        for (let i = 0; i < knivesLeft; i++) {
          const iy = h * 0.85 - i * 18;
          ctx.fillStyle = '#facc15';
          ctx.fillRect(28, iy, 22, 5);
        }
      },
      getHudSnapshot: () => ({
        score,
        primaryLabel: stage % 5 === 0 ? 'BOSS STAGE · BLADES' : 'STAGE · BLADES',
        primaryValue: `STAGE ${stage} · ${knivesLeft} LEFT`,
        secondaryLabel: 'APPLES',
        secondaryValue: `${apples}`,
      }),
    };
  });
}
