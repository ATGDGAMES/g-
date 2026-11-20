import React from 'react';
import { Play, RotateCcw, Home } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onReturnTitle: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onReturnTitle,
}) => {
  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center p-6"
      style={{ backgroundColor: 'rgba(8, 14, 28, 0.72)' }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Game Paused"
        className="w-full max-w-sm rounded-lg border border-sky-300/30 p-6 text-white shadow-2xl"
        style={{ backgroundColor: 'rgba(13, 23, 44, 0.96)' }}
      >
        <h2 className="font-display text-4xl font-extrabold italic tracking-wide uppercase text-center mb-5 text-yellow-400">
          Match Paused
        </h2>

        <div className="space-y-2.5">
          <button
            type="button"
            onClick={onResume}
            className="w-full py-3 px-5 rounded bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-display text-xl font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            Resume
          </button>

          <button
            type="button"
            onClick={onRestart}
            className="w-full py-2.5 px-5 rounded bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Restart Match
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
