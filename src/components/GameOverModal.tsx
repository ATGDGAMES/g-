import React from 'react';
import { Trophy, RotateCcw, Home } from 'lucide-react';
import type { HudSnapshot } from '../game/types';

interface GameOverModalProps {
  hud: HudSnapshot;
  onPlayAgain: () => void;
  onReturnTitle: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  hud,
  onPlayAgain,
  onReturnTitle,
}) => {
  const isVictory = hud.placement === 1 && hud.hp > 0;

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center p-6"
      style={{ backgroundColor: 'rgba(8, 14, 28, 0.78)' }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={isVictory ? 'Victory Royale' : 'Match Eliminated'}
        className="w-full max-w-md rounded-lg border-2 p-6 text-white shadow-2xl"
        style={{
          backgroundColor: 'rgba(13, 23, 44, 0.96)',
          borderColor: isVictory ? '#facc15' : '#64748b',
        }}
      >
        <div className="text-center mb-5">
          {isVictory && (
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-yellow-400/20 text-yellow-400 mb-2">
              <Trophy className="w-7 h-7" />
            </div>
          )}
          <h2
            className={`font-display text-5xl font-extrabold italic uppercase tracking-wide ${
              isVictory ? 'text-yellow-400' : 'text-white'
            }`}
          >
            {isVictory ? 'Victory Royale!' : `Placed #${hud.placement}`}
          </h2>
          {!isVictory && hud.killerName && (
            <p className="text-sm text-rose-300 mt-1 font-semibold">
              Eliminated by {hud.killerName}
            </p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2.5 mb-6">
          <div className="p-3 rounded bg-slate-950/80 border border-slate-800 text-center">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
              Eliminations
            </div>
            <div className="font-mono-num text-2xl font-bold text-yellow-400">
              {hud.eliminations}
            </div>
          </div>
          <div className="p-3 rounded bg-slate-950/80 border border-slate-800 text-center">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
              Damage
            </div>
            <div className="font-mono-num text-2xl font-bold text-sky-300">
              {hud.damageDealt}
            </div>
          </div>
          <div className="p-3 rounded bg-slate-950/80 border border-slate-800 text-center">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
              Structures
            </div>
            <div className="font-mono-num text-2xl font-bold text-emerald-300">
              {hud.structuresBuilt}
            </div>
          </div>
        </div>

        <div className="space-y-2.5">
          <button
            type="button"
            data-start="true"
            onClick={onPlayAgain}
            className="w-full py-3.5 px-6 rounded bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-display text-2xl font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
            Play Again
          </button>

          <button
            type="button"
            onClick={onReturnTitle}
            className="w-full py-2.5 px-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            Return to Lobby
          </button>
        </div>
      </div>
    </div>
  );
};
