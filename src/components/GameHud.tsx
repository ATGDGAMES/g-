import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Pause } from 'lucide-react';
import type { BuildPieceType, HudSnapshot, MaterialType } from '../game/types';
import { ISLAND_RADIUS } from '../game/terrain';
import { RARITY_COLORS, WEAPONS } from '../game/weapons';
import { BuildPieceSvg, MaterialSvg, WeaponSvg } from './GameIcons';

interface GameHudProps {
  hud: HudSnapshot;
  onToggleMute: () => void;
  onPause: () => void;
}

export const GameHud: React.FC<GameHudProps> = ({ hud, onToggleMute, onPause }) => {
  const minimapRef = useRef<HTMLCanvasElement | null>(null);
  const [ghostHp, setGhostHp] = useState(hud.hp);

  // Delayed trailing damage ghost bar
  useEffect(() => {
    if (hud.hp < ghostHp) {
      const id = window.setTimeout(() => setGhostHp(hud.hp), 380);
      return () => window.clearTimeout(id);
    } else {
      setGhostHp(hud.hp);
    }
  }, [hud.hp, ghostHp]);

  // Render live Chapter 1 Minimap
  useEffect(() => {
    const canvas = minimapRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const half = size / 2;
    const scale = half / (ISLAND_RADIUS + 24);

    // Ocean backdrop
    ctx.fillStyle = '#0c4a6e';
    ctx.fillRect(0, 0, size, size);

    // Island landmass
    ctx.beginPath();
    ctx.arc(half, half, ISLAND_RADIUS * scale, 0, Math.PI * 2);
    ctx.fillStyle = '#4d7c2b';
    ctx.fill();

    // Sparkling Basin (Loot Lake style water basin)
    ctx.beginPath();
    ctx.arc(half + 34 * scale, half - 56 * scale, 32 * scale, 0, Math.PI * 2);
    ctx.fillStyle = '#0284c7';
    ctx.fill();

    // Dirt road network connecting all 8 POIs
    ctx.strokeStyle = '#9a7b4f';
    ctx.lineWidth = 1.6;
    const roads: Array<[number, number, number, number]> = [
      [-14, 134, 18, 92],
      [18, 92, -24, -12],
      [-24, -12, -118, -110],
      [-24, -12, -140, 68],
      [-24, -12, 124, 34],
      [124, 34, 128, -128],
      [18, 92, -96, 158],
      [-140, 68, -96, 158],
    ];
    ctx.beginPath();
    for (const [ax, az, bx, bz] of roads) {
      ctx.moveTo(half + ax * scale, half + az * scale);
      ctx.lineTo(half + bx * scale, half + bz * scale);
    }
    ctx.stroke();

    // 8 POI landmark pads
    ctx.fillStyle = '#e2e8f0';
    const pois: Array<[number, number, number]> = [
      [-24, -12, 6],    // Tilted Crossing
      [-118, -110, 5],  // Pleasant Meadow
      [124, 34, 5],     // Retail Ridge
      [-140, 68, 4.5],  // Anarchy Barn
      [18, 92, 4.5],    // Salty Crossroads
      [128, -128, 4],   // Lonely Lookout
      [34, -56, 3.5],   // Sparkling Basin Island
      [-96, 158, 4.5],  // Coastal Depot
    ];
    for (const [px, pz, r] of pois) {
      ctx.fillRect(half + px * scale - r / 2, half + pz * scale - r / 2, r, r);
    }

    // Current Storm Ring (Purple)
    ctx.beginPath();
    ctx.arc(
      half + hud.stormCenterX * scale,
      half + hud.stormCenterZ * scale,
      Math.max(2, hud.stormRadius * scale),
      0,
      Math.PI * 2,
    );
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // Next Safe Zone Target Ring (White)
    ctx.beginPath();
    ctx.arc(
      half + hud.stormTargetCenterX * scale,
      half + hud.stormTargetCenterZ * scale,
      Math.max(2, hud.stormTargetRadius * scale),
      0,
      Math.PI * 2,
    );
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // Markers (Peers, Gunfire Pings, Player Arrow)
    for (const m of hud.minimapMarkers) {
      const mx = half + m.x * scale;
      const mz = half + m.z * scale;
      if (m.kind === 'shot') {
        ctx.fillStyle = '#f87171';
        ctx.beginPath();
        ctx.arc(mx, mz, 2.8, 0, Math.PI * 2);
        ctx.fill();
      } else if (m.kind === 'peer') {
        ctx.fillStyle = '#34d399';
        ctx.beginPath();
        ctx.arc(mx, mz, 3.2, 0, Math.PI * 2);
        ctx.fill();
      } else if (m.kind === 'player') {
        ctx.save();
        ctx.translate(mx, mz);
        ctx.rotate(-(m.yaw ?? 0));
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.moveTo(0, -5.5);
        ctx.lineTo(4, 4.5);
        ctx.lineTo(0, 2.5);
        ctx.lineTo(-4, 4.5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }
  }, [
    hud.playerX,
    hud.playerZ,
    hud.playerYaw,
    hud.stormCenterX,
    hud.stormCenterZ,
    hud.stormRadius,
    hud.stormTargetCenterX,
    hud.stormTargetCenterZ,
    hud.stormTargetRadius,
    hud.minimapMarkers,
  ]);

  const activeSlot = hud.slots[hud.activeSlot];
  const buildPieces: BuildPieceType[] = ['wall', 'floor', 'ramp', 'roof'];
  const buildKeys = ['Z', 'X', 'C', 'V'];
  const matsOrder: MaterialType[] = ['wood', 'brick', 'metal'];

  return (
    <div className="fixed inset-0 z-10 pointer-events-none select-none overflow-hidden">
      {/* Storm or Critical Low-HP Peripheral Vignette */}
      {(hud.inStorm || hud.hp <= 30) && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            boxShadow: hud.inStorm
              ? 'inset 0 0 95px rgba(147, 51, 234, 0.65)'
              : 'inset 0 0 85px rgba(220, 38, 38, 0.55)',
          }}
        />
      )}

      {/* TOP-LEFT: Compact Match Telemetry (Alive / Elims / Storm) */}
      <div className="fixed top-4 left-4 flex flex-col gap-2">
        <div
          className="flex items-center gap-4 px-3.5 py-2 rounded border border-white/15 text-white"
          style={{ backgroundColor: 'rgba(12, 20, 38, 0.78)' }}
        >
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-300 font-bold">Alive</div>
            <div className="font-mono-num text-xl font-bold leading-none text-white">
              {hud.aliveCount}
            </div>
          </div>
          <div className="w-px h-7 bg-white/15" />
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-300 font-bold">Elims</div>
            <div className="font-mono-num text-xl font-bold leading-none text-yellow-400">
              {hud.eliminations}
            </div>
          </div>
          <div className="w-px h-7 bg-white/15" />
          <div>
            <div className="text-[10px] uppercase tracking-wider text-purple-300 font-bold">
              {hud.stormShrinking ? `Storm P${hud.stormPhase}` : `Next Eye P${hud.stormPhase}`}
            </div>
            <div className="font-mono-num text-xl font-bold leading-none text-purple-200">
              {hud.stormTimer}s
            </div>
          </div>
          {hud.p2pPeersConnected > 0 && (
            <>
              <div className="w-px h-7 bg-white/15" />
              <div>
                <div className="text-[10px] uppercase tracking-wider text-emerald-300 font-bold">P2P</div>
                <div className="font-mono-num text-xl font-bold leading-none text-emerald-300">
                  {hud.p2pPeersConnected + 1}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Elimination Feed */}
        {hud.killFeed.length > 0 && (
          <div className="flex flex-col gap-1 max-w-xs">
            {hud.killFeed.slice(0, 3).map((kf) => (
              <div
                key={kf.id}
                className="px-2.5 py-1 rounded text-[11px] font-semibold text-white/95 truncate"
                style={{ backgroundColor: 'rgba(12, 20, 38, 0.68)' }}
              >
                <span className="text-sky-300">{kf.killerName}</span>{' '}
                <span className="text-slate-400">[{kf.weaponName}]</span>{' '}
                <span className="text-rose-300">{kf.victimName}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TOP-RIGHT: Minimap + Utility Controls */}
      <div className="fixed top-4 right-4 flex items-start gap-2.5">
        <div className="flex gap-1.5 pointer-events-auto">
          <button
            type="button"
            tabIndex={-1}
            aria-label={hud.muted ? 'Unmute Audio' : 'Mute Audio'}
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleMute();
            }}
            className="w-9 h-9 rounded flex items-center justify-center border border-white/20 text-white hover:bg-slate-800 cursor-pointer"
            style={{ backgroundColor: 'rgba(12, 20, 38, 0.8)' }}
          >
            {hud.muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            type="button"
            tabIndex={-1}
            aria-label="Pause Game"
            onClick={(e) => {
              e.currentTarget.blur();
              onPause();
            }}
            className="w-9 h-9 rounded flex items-center justify-center border border-white/20 text-white hover:bg-slate-800 cursor-pointer"
            style={{ backgroundColor: 'rgba(12, 20, 38, 0.8)' }}
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>

        <div className="rounded border-2 border-white/25 overflow-hidden shadow-lg">
          <canvas ref={minimapRef} width={136} height={136} className="block" />
        </div>
      </div>

      {/* EXACT (0,0) CENTER CROSSHAIR & INTERACT PROMPT */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center">
        {/* Reticle */}
        <div className="relative w-8 h-8 flex items-center justify-center">
          <div className="w-1 h-1 rounded-full bg-white shadow" />
          {!hud.buildMode && (
            <>
              <div className="absolute top-0.5 w-0.5 h-2 bg-white/85" />
              <div className="absolute bottom-0.5 w-0.5 h-2 bg-white/85" />
              <div className="absolute left-0.5 h-0.5 w-2 bg-white/85" />
              <div className="absolute right-0.5 h-0.5 w-2 bg-white/85" />
            </>
          )}
          {hud.hitMarkerKind !== 'none' && (
            <svg viewBox="0 0 24 24" className="absolute inset-0 w-8 h-8">
              <path
                d="M5 5L9 9M19 5L15 9M5 19L9 15M19 19L15 15"
                stroke={
                  hud.hitMarkerKind === 'kill' || hud.hitMarkerKind === 'crit'
                    ? '#ef4444'
                    : hud.hitMarkerKind === 'structure'
                      ? '#facc15'
                      : '#ffffff'
                }
                strokeWidth="2.4"
                strokeLinecap="round"
              />
            </svg>
          )}
        </div>

        {hud.isReloading && (
          <div
            className="mt-4 px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider text-yellow-300"
            style={{ backgroundColor: 'rgba(12, 20, 38, 0.8)' }}
          >
            Reloading...
          </div>
        )}

        {hud.interactPrompt && (
          <div
            className="mt-5 px-3 py-1.5 rounded border border-yellow-400/70 text-xs font-bold text-white flex items-center gap-2"
            style={{ backgroundColor: 'rgba(12, 20, 38, 0.86)' }}
          >
            <span className="px-1.5 py-0.5 rounded bg-yellow-400 text-slate-950 font-mono-num text-[11px]">
              E
            </span>
            <span>{hud.interactPrompt}</span>
          </div>
        )}

        {hud.buildMode && (
          <div
            className="mt-5 px-3 py-1 rounded text-[11px] font-bold uppercase tracking-wider text-sky-300"
            style={{ backgroundColor: 'rgba(12, 20, 38, 0.82)' }}
          >
            Build Mode · {hud.selectedBuild} ({hud.buildMaterial}) · Click Place · R Rotate
          </div>
        )}
      </div>

      {/* BOTTOM-CENTER: Classic Chapter 1 Shield + Health Bars */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 w-[300px] sm:w-[340px] flex flex-col gap-1.5">
        {/* Shield Bar */}
        <div
          className="relative h-4 rounded-sm overflow-hidden border border-sky-300/35"
          style={{ backgroundColor: 'rgba(10, 18, 34, 0.85)' }}
        >
          <div
            className="h-full bg-sky-400 transition-all duration-150"
            style={{ width: `${Math.max(0, Math.min(100, (hud.shield / hud.maxShield) * 100))}%` }}
          />
          <span className="absolute inset-0 flex items-center justify-end pr-2 font-mono-num text-[11px] font-bold text-white hud-stroke">
            {hud.shield}
          </span>
        </div>

        {/* Health Bar with trailing ghost */}
        <div
          className="relative h-6 rounded-sm overflow-hidden border border-emerald-300/40"
          style={{ backgroundColor: 'rgba(10, 18, 34, 0.88)' }}
        >
          <div
            className="absolute inset-y-0 left-0 bg-white/55 transition-all duration-300"
            style={{ width: `${Math.max(0, Math.min(100, (ghostHp / hud.maxHp) * 100))}%` }}
          />
          <div
            className="relative h-full bg-emerald-500 transition-all duration-100"
            style={{ width: `${Math.max(0, Math.min(100, (hud.hp / hud.maxHp) * 100))}%` }}
          />
          <span className="absolute inset-0 flex items-center justify-between px-2.5 font-mono-num text-xs font-extrabold text-white hud-stroke">
            <span>HP</span>
            <span>
              {hud.hp} / {hud.maxHp}
            </span>
          </span>
        </div>
      </div>

      {/* BOTTOM-RIGHT: Materials, Build Pieces & 5-Slot Hotbar */}
      <div className="fixed bottom-4 right-4 flex flex-col items-end gap-2">
        {/* Materials Row */}
        <div className="flex items-center gap-2">
          {matsOrder.map((mat) => {
            const active = hud.buildMode && hud.buildMaterial === mat;
            return (
              <div
                key={mat}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-mono-num font-bold ${
                  active ? 'border-yellow-400 text-yellow-300' : 'border-white/15 text-white'
                }`}
                style={{ backgroundColor: 'rgba(12, 20, 38, 0.82)' }}
              >
                <MaterialSvg type={mat} className="w-4 h-4" />
                <span>{hud.materials[mat]}</span>
              </div>
            );
          })}
        </div>

        {/* Build Piece Strip */}
        <div className="flex items-center gap-1.5">
          {buildPieces.map((piece, idx) => {
            const selected = hud.buildMode && hud.selectedBuild === piece;
            return (
              <div
                key={piece}
                className={`w-11 h-10 rounded border flex flex-col items-center justify-center ${
                  selected
                    ? 'border-sky-300 text-sky-200'
                    : 'border-white/15 text-slate-300'
                }`}
                style={{
                  backgroundColor: selected
                    ? 'rgba(14, 116, 144, 0.88)'
                    : 'rgba(12, 20, 38, 0.72)',
                }}
              >
                <BuildPieceSvg kind={piece} className="w-4 h-4" />
                <span className="text-[9px] font-mono-num font-bold leading-none mt-0.5">
                  {buildKeys[idx]}
                </span>
              </div>
            );
          })}
        </div>

        {/* 5-Slot Weapon/Item Hotbar */}
        <div className="flex items-center gap-1.5">
          {hud.slots.map((slot, idx) => {
            const isActive = !hud.buildMode && hud.activeSlot === idx;
            const rarityStyle = slot ? RARITY_COLORS[slot.rarity] : null;
            return (
              <div
                key={idx}
                className={`relative w-14 h-14 rounded border-2 flex flex-col items-center justify-center transition-transform ${
                  isActive ? 'scale-105 border-yellow-300' : 'border-white/20'
                }`}
                style={{
                  backgroundColor: rarityStyle ? rarityStyle.bg : 'rgba(12, 20, 38, 0.65)',
                }}
              >
                <span className="absolute top-0.5 left-1 text-[10px] font-mono-num font-bold text-white/90">
                  {idx + 1}
                </span>
                {slot && (
                  <>
                    <WeaponSvg id={slot.weaponId} className="w-7 h-7 text-white drop-shadow" />
                    <span className="text-[10px] font-mono-num font-bold text-white leading-none mt-0.5">
                      {WEAPONS[slot.weaponId].kind === 'heal'
                        ? `x${slot.count}`
                        : WEAPONS[slot.weaponId].magSize > 0
                          ? slot.ammo
                          : '∞'}
                    </span>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {activeSlot && !hud.buildMode && (
          <div className="text-[11px] font-bold text-white hud-stroke">
            {RARITY_COLORS[activeSlot.rarity].label} {WEAPONS[activeSlot.weaponId].name}
          </div>
        )}
      </div>
    </div>
  );
};
