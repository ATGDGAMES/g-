import { createCanvasGame } from '../canvasHarness';
import type { CanvasGameCallbacks, CanvasGameController } from '../types';

const GRID = 68;
const CELL = 16;

interface PaperActor {
  id: number;
  isPlayer: boolean;
  name: string;
  color: string;
  trailColor: string;
  x: number;
  y: number;
  dirX: number;
  dirY: number;
  nextDirX: number;
  nextDirY: number;
  trail: Array<{ gx: number; gy: number }>;
  alive: boolean;
  aiTimer: number;
}

export function createPaperIoGame(
  container: HTMLElement,
  callbacks: CanvasGameCallbacks,
): CanvasGameController {
  return createCanvasGame(container, callbacks, (g) => {
    const owner = new Int8Array(GRID * GRID);
    let actors: PaperActor[] = [];
    let kills = 0;

    const idx = (gx: number, gy: number) => gy * GRID + gx;

    const claimLoop = (actor: PaperActor) => {
      for (const pt of actor.trail) {
        if (pt.gx >= 0 && pt.gx < GRID && pt.gy >= 0 && pt.gy < GRID) {
          owner[idx(pt.gx, pt.gy)] = actor.id;
        }
      }
      actor.trail = [];

      // Flood-fill outside from border to fill enclosed holes cleanly
      const visited = new Uint8Array(GRID * GRID);
      const queue: number[] = [];
      for (let x = 0; x < GRID; x++) {
        for (const y of [0, GRID - 1]) {
          const i = idx(x, y);
          if (owner[i] !== actor.id && !visited[i]) {
            visited[i] = 1;
            queue.push(i);
          }
        }
      }
      for (let y = 0; y < GRID; y++) {
        for (const x of [0, GRID - 1]) {
          const i = idx(x, y);
          if (owner[i] !== actor.id && !visited[i]) {
            visited[i] = 1;
            queue.push(i);
          }
        }
      }
      let head = 0;
      while (head < queue.length) {
        const cur = queue[head++];
        const cx = cur % GRID;
        const cy = (cur / GRID) | 0;
        const neighbors = [
          [cx + 1, cy],
          [cx - 1, cy],
          [cx, cy + 1],
          [cx, cy - 1],
        ];
        for (const [nx, ny] of neighbors) {
          if (nx < 0 || nx >= GRID || ny < 0 || ny >= GRID) continue;
          const ni = idx(nx, ny);
          if (!visited[ni] && owner[ni] !== actor.id) {
            visited[ni] = 1;
            queue.push(ni);
          }
        }
      }

      let gained = 0;
      for (let i = 0; i < GRID * GRID; i++) {
        if (!visited[i] && owner[i] !== actor.id) {
          owner[i] = actor.id;
          gained++;
        }
      }
      if (actor.isPlayer && gained > 0) {
        g.sfx.pickup();
      }
    };

    const spawnActor = (
      id: number,
      isPlayer: boolean,
      name: string,
      color: string,
      trailColor: string,
      cgx: number,
      cgy: number,
    ): PaperActor => {
      for (let dx = -2; dx <= 2; dx++) {
        for (let dy = -2; dy <= 2; dy++) {
          const gx = Math.max(1, Math.min(GRID - 2, cgx + dx));
          const gy = Math.max(1, Math.min(GRID - 2, cgy + dy));
          owner[idx(gx, gy)] = id;
        }
      }
      return {
        id,
        isPlayer,
        name,
        color,
        trailColor,
        x: (cgx + 0.5) * CELL,
        y: (cgy + 0.5) * CELL,
        dirX: 1,
        dirY: 0,
        nextDirX: 1,
        nextDirY: 0,
        trail: [],
        alive: true,
        aiTimer: 0.5,
      };
    };

    const countOwned = (id: number): number => {
      let c = 0;
      for (let i = 0; i < owner.length; i++) {
        if (owner[i] === id) c++;
      }
      return c;
    };

    return {
      gameId: 'paper-io-2',
      onReset: () => {
        owner.fill(0);
        kills = 0;
        actors = [
          spawnActor(1, true, 'YOU', '#a855f7', 'rgba(168,85,247,0.45)', 34, 34),
          spawnActor(2, false, 'CYBER', '#06b6d4', 'rgba(6,182,212,0.45)', 14, 14),
          spawnActor(3, false, 'VOLT', '#84cc16', 'rgba(132,204,22,0.45)', 52, 16),
          spawnActor(4, false, 'BLAZE', '#f97316', 'rgba(249,115,22,0.45)', 16, 52),
          spawnActor(5, false, 'RUBY', '#f43f5e', 'rgba(244,63,94,0.45)', 52, 52),
        ];
      },
      onKeyDown: (code) => {
        const p = actors[0];
        if (!p || !p.alive) return;
        if ((code === 'KeyW' || code === 'ArrowUp') && p.dirY !== 1) {
          p.nextDirX = 0;
          p.nextDirY = -1;
        } else if ((code === 'KeyS' || code === 'ArrowDown') && p.dirY !== -1) {
          p.nextDirX = 0;
          p.nextDirY = 1;
        } else if ((code === 'KeyA' || code === 'ArrowLeft') && p.dirX !== 1) {
          p.nextDirX = -1;
          p.nextDirY = 0;
        } else if ((code === 'KeyD' || code === 'ArrowRight') && p.dirX !== -1) {
          p.nextDirX = 1;
          p.nextDirY = 0;
        }
      },
      onUpdate: (_dt, simDt) => {
        if (simDt <= 0) return;

        for (const a of actors) {
          if (!a.alive) continue;

          if (!a.isPlayer) {
            a.aiTimer -= simDt;
            const gx = Math.floor(a.x / CELL);
            const gy = Math.floor(a.y / CELL);
            const nearEdge = gx < 4 || gx > GRID - 5 || gy < 4 || gy > GRID - 5;
            if (a.aiTimer <= 0 || nearEdge) {
              a.aiTimer = 0.45 + Math.random() * 0.9;
              const dirs = [
                [1, 0],
                [-1, 0],
                [0, 1],
                [0, -1],
              ].filter(([dx, dy]) => !(dx === -a.dirX && dy === -a.dirY));
              // Bias back to turf if trail is long
              const pick =
                a.trail.length > 10 && Math.random() < 0.7
                  ? dirs.find(([dx, dy]) => {
                      const nx = Math.max(0, Math.min(GRID - 1, gx + dx * 2));
                      const ny = Math.max(0, Math.min(GRID - 1, gy + dy * 2));
                      return owner[idx(nx, ny)] === a.id;
                    }) ?? dirs[Math.floor(Math.random() * dirs.length)]
                  : dirs[Math.floor(Math.random() * dirs.length)];
              a.nextDirX = pick[0];
              a.nextDirY = pick[1];
            }
          }

          // Snap turns cleanly near cell centers
          const cx = Math.floor(a.x / CELL) * CELL + CELL * 0.5;
          const cy = Math.floor(a.y / CELL) * CELL + CELL * 0.5;
          if ((a.nextDirX !== a.dirX || a.nextDirY !== a.dirY) && Math.hypot(a.x - cx, a.y - cy) < 5.5) {
            a.x = cx;
            a.y = cy;
            a.dirX = a.nextDirX;
            a.dirY = a.nextDirY;
          }

          const speed = a.isPlayer ? 158 : 136;
          a.x += a.dirX * speed * simDt;
          a.y += a.dirY * speed * simDt;

          const gx = Math.floor(a.x / CELL);
          const gy = Math.floor(a.y / CELL);

          // Arena wall check
          if (gx < 0 || gx >= GRID || gy < 0 || gy >= GRID) {
            a.alive = false;
            for (let i = 0; i < owner.length; i++) if (owner[i] === a.id) owner[i] = 0;
            a.trail = [];
            if (a.isPlayer) {
              g.sfx.crash();
              const pct = Math.round((countOwned(1) / (GRID * GRID)) * 100);
              g.finishGame(pct * 10 + kills * 150, false, `Hit Arena Wall · ${pct}% Territory`);
              return;
            }
            continue;
          }

          const curOwner = owner[idx(gx, gy)];
          if (curOwner === a.id) {
            if (a.trail.length > 0) {
              claimLoop(a);
            }
          } else {
            const last = a.trail[a.trail.length - 1];
            if (!last || last.gx !== gx || last.gy !== gy) {
              // Self-cut check
              if (a.trail.some((pt) => pt.gx === gx && pt.gy === gy)) {
                a.alive = false;
                for (let i = 0; i < owner.length; i++) if (owner[i] === a.id) owner[i] = 0;
                a.trail = [];
                if (a.isPlayer) {
                  g.sfx.crash();
                  const pct = Math.round((countOwned(1) / (GRID * GRID)) * 100);
                  g.finishGame(pct * 10 + kills * 150, false, `Cut your own trail · ${pct}% Territory`);
                  return;
                }
                continue;
              }
              a.trail.push({ gx, gy });
            }
          }

          // Check cutting any rival's trail
          for (const other of actors) {
            if (!other.alive || other.id === a.id) continue;
            if (other.trail.some((pt) => pt.gx === gx && pt.gy === gy)) {
              other.alive = false;
              for (let i = 0; i < owner.length; i++) if (owner[i] === other.id) owner[i] = 0;
              other.trail = [];
              if (a.isPlayer) {
                kills++;
                g.sfx.score();
              }
              if (other.isPlayer) {
                g.sfx.crash();
                const pct = Math.round((countOwned(1) / (GRID * GRID)) * 100);
                g.finishGame(pct * 10 + kills * 150, false, `${a.name} sliced your trail!`);
                return;
              }
            }
          }
        }

        const pPct = Math.round((countOwned(1) / (GRID * GRID)) * 100);
        if (pPct >= 95) {
          g.finishGame(1000 + kills * 200, true, `ARENA CONQUERED! ${pPct}% · ${kills} KOs`);
        }
      },
      onRender: (ctx, w, h) => {
        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 0, w, h);

        const p = actors[0];
        const camX = (p ? p.x : (GRID * CELL) * 0.5) - w * 0.5;
        const camY = (p ? p.y : (GRID * CELL) * 0.5) - h * 0.5;

        ctx.save();
        ctx.translate(-camX, -camY);

        ctx.fillStyle = '#111827';
        ctx.fillRect(0, 0, GRID * CELL, GRID * CELL);
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 4;
        ctx.strokeRect(0, 0, GRID * CELL, GRID * CELL);

        const palette: Record<number, string> = {
          1: '#7e22ce',
          2: '#0e7490',
          3: '#4d7c0f',
          4: '#c2410c',
          5: '#be123c',
        };

        for (let gy = 0; gy < GRID; gy++) {
          for (let gx = 0; gx < GRID; gx++) {
            const o = owner[idx(gx, gy)];
            if (o > 0) {
              ctx.fillStyle = palette[o] || '#475569';
              ctx.fillRect(gx * CELL, gy * CELL, CELL + 0.5, CELL + 0.5);
            }
          }
        }

        for (const a of actors) {
          if (!a.alive) continue;
          ctx.fillStyle = a.trailColor;
          for (const pt of a.trail) {
            ctx.fillRect(pt.gx * CELL + 2, pt.gy * CELL + 2, CELL - 4, CELL - 4);
          }
          ctx.fillStyle = a.color;
          ctx.fillRect(a.x - 9, a.y - 9, 18, 18);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.strokeRect(a.x - 9, a.y - 9, 18, 18);
        }

        ctx.restore();
      },
      getHudSnapshot: () => {
        const pct = Math.round((countOwned(1) / (GRID * GRID)) * 100);
        return {
          score: pct * 10 + kills * 150,
          primaryLabel: 'TERRITORY · KOs',
          primaryValue: `${pct}% · ${kills} KOs`,
          secondaryLabel: 'RIVALS ALIVE',
          secondaryValue: `${actors.filter((a) => !a.isPlayer && a.alive).length}`,
        };
      },
    };
  });
}
