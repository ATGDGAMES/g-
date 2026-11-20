import { createCanvasGame } from '../canvasHarness';
import type { CanvasGameCallbacks, CanvasGameController } from '../types';

interface UpgradeDef {
  id: string;
  name: string;
  baseCost: number;
  cpsAdd: number;
  clickAdd: number;
  owned: number;
  color: string;
}

interface FloatingNum {
  x: number;
  y: number;
  vy: number;
  text: string;
  life: number;
  color: string;
}

export function create67ClickerGame(
  container: HTMLElement,
  callbacks: CanvasGameCallbacks,
): CanvasGameController {
  return createCanvasGame(container, callbacks, (g) => {
    let coins = 0;
    let totalEarned = 0;
    let perClick = 1;
    let cps = 0;
    let fever = 0; // 0..100
    let coreScale = 1;
    let floaters: FloatingNum[] = [];
    let upgrades: UpgradeDef[] = [];

    const makeUpgrades = (): UpgradeDef[] => [
      { id: 'cursor', name: 'Auto-Tapper', baseCost: 25, cpsAdd: 2, clickAdd: 0, owned: 0, color: '#38bdf8' },
      { id: 'gloves', name: 'Double Tap', baseCost: 67, cpsAdd: 0, clickAdd: 4, owned: 0, color: '#22c55e' },
      { id: 'overclock', name: 'Chromebook OC', baseCost: 240, cpsAdd: 18, clickAdd: 0, owned: 0, color: '#a855f7' },
      { id: 'neegy', name: 'Neegy Mascot', baseCost: 900, cpsAdd: 67, clickAdd: 15, owned: 0, color: '#facc15' },
      { id: 'vault', name: 'U7 Vault Core', baseCost: 3400, cpsAdd: 280, clickAdd: 67, owned: 0, color: '#f97316' },
    ];

    const getUpgradeCost = (u: UpgradeDef) => Math.round(u.baseCost * Math.pow(1.38, u.owned));

    const getCoreCenter = () => ({
      x: g.width * 0.36,
      y: g.height * 0.52,
      r: Math.min(92, Math.min(g.width, g.height) * 0.2),
    });

    const getShopRect = (i: number) => {
      const panelX = g.width * 0.64;
      const panelW = Math.max(210, g.width * 0.32);
      const y = 118 + i * 72;
      return { x: panelX, y, w: panelW, h: 62 };
    };

    const doClickCore = (fx: number, fy: number) => {
      fever = Math.min(100, fever + 14);
      const mult = fever >= 75 ? 6.7 : fever >= 40 ? 2 : 1;
      const gained = Math.round(perClick * mult);
      coins += gained;
      totalEarned += gained;
      coreScale = 1.15;
      floaters.push({
        x: fx + (Math.random() - 0.5) * 32,
        y: fy - 18,
        vy: -78,
        text: `+${gained}${mult > 1 ? ` (x${mult})` : ''}`,
        life: 0.75,
        color: mult >= 6.7 ? '#facc15' : '#4ade80',
      });
      g.sfx.tone(fever >= 75 ? 740 : 520, 0.05, 'triangle', 0.09, 860);
      g.particles.burst(fx, fy, 7, 150, mult >= 6.7 ? '#facc15' : '#38bdf8', 4, 0.3);
    };

    const buyUpgrade = (u: UpgradeDef) => {
      const cost = getUpgradeCost(u);
      if (coins < cost) return;
      coins -= cost;
      u.owned++;
      cps += u.cpsAdd;
      perClick += u.clickAdd;
      g.sfx.score();
      const rect = getShopRect(upgrades.indexOf(u));
      g.particles.burst(rect.x + rect.w * 0.5, rect.y + rect.h * 0.5, 14, 180, u.color, 4, 0.35);
    };

    return {
      gameId: '67-clicker',
      onReset: () => {
        coins = 0;
        totalEarned = 0;
        perClick = 1;
        cps = 0;
        fever = 0;
        coreScale = 1;
        floaters = [];
        upgrades = makeUpgrades();
      },
      onKeyDown: (code) => {
        if (code === 'Space') {
          const c = getCoreCenter();
          doClickCore(c.x, c.y);
        } else if (code >= 'Digit1' && code <= 'Digit5') {
          const idx = Number(code.replace('Digit', '')) - 1;
          if (upgrades[idx]) buyUpgrade(upgrades[idx]);
        }
      },
      onPointerDown: (x, y) => {
        const c = getCoreCenter();
        if (Math.hypot(x - c.x, y - c.y) <= c.r + 18) {
          doClickCore(x, y);
          return;
        }
        for (let i = 0; i < upgrades.length; i++) {
          const r = getShopRect(i);
          if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
            buyUpgrade(upgrades[i]);
            return;
          }
        }
        // Clicking open canvas area also taps core!
        doClickCore(c.x, c.y);
      },
      onUpdate: (_dt, simDt) => {
        if (simDt <= 0) return;
        const earned = cps * simDt;
        coins += earned;
        totalEarned += earned;
        fever = Math.max(0, fever - 18 * simDt);
        coreScale += (1 - coreScale) * Math.min(1, simDt * 12);

        for (let i = floaters.length - 1; i >= 0; i--) {
          const f = floaters[i];
          f.life -= simDt;
          f.y += f.vy * simDt;
          if (f.life <= 0) floaters.splice(i, 1);
        }
      },
      onRender: (ctx, w, h) => {
        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 0, w, h);

        // Subtle grid
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.06)';
        ctx.lineWidth = 1;
        for (let x = 0; x < w; x += 48) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
          ctx.stroke();
        }
        for (let y = 0; y < h; y += 48) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }

        const c = getCoreCenter();
        const mult = fever >= 75 ? 6.7 : fever >= 40 ? 2 : 1;

        // Fever Ring around 67 Core
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r + 20, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = mult >= 6.7 ? '#facc15' : mult >= 2 ? '#4ade80' : '#38bdf8';
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r + 20, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * fever) / 100);
        ctx.stroke();

        // Main 67 Coin Core
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.scale(coreScale, coreScale);
        ctx.fillStyle = mult >= 6.7 ? '#f59e0b' : '#eab308';
        ctx.beginPath();
        ctx.arc(0, 0, c.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 5;
        ctx.stroke();

        ctx.fillStyle = '#090d16';
        ctx.font = `800 ${Math.round(c.r * 0.78)}px "Barlow Condensed", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('67', 0, 4);
        ctx.restore();

        // Coin & CPS readout above core
        ctx.fillStyle = '#f8fafc';
        ctx.font = '800 32px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.floor(coins).toLocaleString()} PTS`, c.x, 48);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 13px "JetBrains Mono", monospace';
        ctx.fillText(`+${perClick}/CLICK · +${cps}/SEC · FEVER x${mult}`, c.x, 72);

        // Upgrade Shop Dock on right
        ctx.textAlign = 'left';
        ctx.fillStyle = '#facc15';
        ctx.font = '800 16px "Barlow Condensed", sans-serif';
        ctx.fillText('VAULT UPGRADES (CLICK OR KEYS 1–5)', w * 0.64, 102);

        for (let i = 0; i < upgrades.length; i++) {
          const u = upgrades[i];
          const r = getShopRect(i);
          const cost = getUpgradeCost(u);
          const affordable = coins >= cost;
          ctx.fillStyle = affordable ? '#1e293b' : '#111827';
          ctx.strokeStyle = affordable ? u.color : '#334155';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(r.x, r.y, r.w, r.h, 8);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = affordable ? '#f8fafc' : '#64748b';
          ctx.font = '700 14px "Plus Jakarta Sans", sans-serif';
          ctx.fillText(`[${i + 1}] ${u.name} (${u.owned})`, r.x + 12, r.y + 24);
          ctx.fillStyle = affordable ? u.color : '#475569';
          ctx.font = '600 12px "JetBrains Mono", monospace';
          ctx.fillText(`${cost.toLocaleString()} PTS · +${u.cpsAdd}/s +${u.clickAdd}/tap`, r.x + 12, r.y + 45);
        }

        // Floaters
        for (const f of floaters) {
          ctx.globalAlpha = Math.max(0, f.life / 0.75);
          ctx.fillStyle = f.color;
          ctx.font = '800 18px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText(f.text, f.x, f.y);
        }
        ctx.globalAlpha = 1;
      },
      getHudSnapshot: () => ({
        score: Math.floor(totalEarned),
        primaryLabel: 'BANK · TOTAL',
        primaryValue: `${Math.floor(coins).toLocaleString()} · ${Math.floor(totalEarned).toLocaleString()}`,
        secondaryLabel: 'OUTPUT',
        secondaryValue: `+${perClick} TAP · +${cps}/S`,
      }),
    };
  });
}
