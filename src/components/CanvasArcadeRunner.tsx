import { useEffect, useRef, useState } from 'react';
import type { ArcadeGameMeta, CanvasGameController, CanvasGameSnapshot } from '../arcade/types';
import { createArcadeGameController } from '../arcade/gameRegistry';

interface CanvasArcadeRunnerProps {
  game: ArcadeGameMeta;
  muted: boolean;
  cloaked: boolean;
  restartSignal: number;
  onReturnHub: () => void;
}

export function CanvasArcadeRunner({
  game,
  muted,
  cloaked,
  restartSignal,
  onReturnHub,
}: CanvasArcadeRunnerProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const ctrlRef = useRef<CanvasGameController | null>(null);
  const [snap, setSnap] = useState<CanvasGameSnapshot>({
    phase: 'title',
    score: 0,
    bestScore: 0,
    primaryLabel: 'STATUS',
    primaryValue: 'READY',
    secondaryLabel: 'BEST',
    secondaryValue: '0',
  });

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const ctrl = createArcadeGameController(game.id, el, {
      onSnapshot: (next) => setSnap(next),
    });
    ctrlRef.current = ctrl;
    ctrl?.setMuted(muted);

    return () => {
      ctrl?.destroy();
      ctrlRef.current = null;
    };
  }, [game.id]);

  useEffect(() => {
    ctrlRef.current?.setMuted(muted);
  }, [muted]);

  useEffect(() => {
    if (cloaked && snap.phase === 'playing') {
      ctrlRef.current?.pause();
    }
  }, [cloaked, snap.phase]);

  useEffect(() => {
    if (restartSignal > 0) {
      ctrlRef.current?.restart();
    }
  }, [restartSignal]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#090d16]">
      {/* Isolated Canvas mount sibling */}
      <div
        ref={mountRef}
        data-testid="arcade-canvas-viewport"
        className="absolute inset-0 w-full h-full"
      />

      {/* Active Playing Perimeter HUD (<= 2 clusters, zero backdrop-blur) */}
      {snap.phase === 'playing' && (
        <div className="pointer-events-none fixed inset-x-0 top-12 bottom-0 z-10 flex flex-col justify-between p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="bg-[#0b0f19]/90 border border-slate-700/80 px-3.5 py-2 rounded-lg shadow-lg">
              <div className="text-[10px] font-bold tracking-[0.14em] uppercase text-slate-400">
                {snap.primaryLabel}
              </div>
              <div className="font-mono-num text-xl font-bold text-white leading-tight">
                {snap.primaryValue}
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="bg-[#0b0f19]/90 border border-slate-700/80 px-3.5 py-2 rounded-lg shadow-lg text-right">
                <div className="text-[10px] font-bold tracking-[0.14em] uppercase text-slate-400">
                  {snap.secondaryLabel} · BEST {snap.bestScore.toLocaleString()}
                </div>
                <div
                  className="font-mono-num text-xl font-bold leading-tight"
                  style={{ color: game.accentHex }}
                >
                  {snap.secondaryValue}
                </div>
              </div>

              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  ctrlRef.current?.pause();
                }}
                className="pointer-events-auto h-10 px-3 rounded-lg bg-[#0b0f19]/90 border border-slate-700/80 text-xs font-bold text-slate-200 hover:text-white hover:border-slate-500 transition-colors cursor-pointer"
              >
                Pause [P]
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Title Screen Overlay */}
      {snap.phase === 'title' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-6 bg-[#090d16]/90">
          <div className="w-full max-w-3xl grid md:grid-cols-[1.15fr_1fr] gap-6 items-center bg-[#121826] border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <div className="relative overflow-hidden rounded-xl border border-slate-700/70 aspect-video bg-slate-900">
              <img
                src={game.coverUrl}
                alt={game.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex flex-col justify-between gap-4">
              <div>
                <div
                  className="text-xs font-bold tracking-[0.16em] uppercase mb-1"
                  style={{ color: game.accentHex }}
                >
                  {game.category} · {game.badgeText}
                </div>
                <h2 className="font-display text-4xl font-extrabold italic uppercase tracking-tight text-white leading-none">
                  {game.title}
                </h2>
                <p className="mt-2.5 text-sm text-slate-300 leading-relaxed">
                  {game.tagline}
                </p>
              </div>

              <div className="text-xs font-mono-num text-slate-400 border-t border-slate-800 pt-3">
                {game.controlsHint}
                {snap.bestScore > 0 && ` · Best ${snap.bestScore.toLocaleString()}`}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  data-start="true"
                  onClick={(e) => {
                    e.currentTarget.blur();
                    ctrlRef.current?.start();
                  }}
                  className="flex-1 py-3 px-5 rounded-xl font-display text-xl font-extrabold italic uppercase tracking-wide text-slate-950 transition-transform active:scale-95 cursor-pointer"
                  style={{ backgroundColor: game.accentHex }}
                >
                  Play Now
                </button>
                <button
                  type="button"
                  onClick={onReturnHub}
                  className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-bold text-slate-200 cursor-pointer"
                >
                  Hub
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Paused Modal */}
      {snap.phase === 'paused' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-6 bg-[#090d16]/85">
          <div className="w-full max-w-sm bg-[#121826] border border-slate-700 rounded-2xl p-6 text-center shadow-2xl">
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
              Game Paused
            </div>
            <h3 className="font-display text-4xl font-extrabold italic uppercase text-white mt-1">
              {game.title}
            </h3>
            <p className="mt-2 text-xs font-mono-num text-slate-400">{game.controlsHint}</p>
            <div className="mt-6 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={(e) => {
                  e.currentTarget.blur();
                  ctrlRef.current?.resume();
                }}
                className="w-full py-2.5 rounded-xl font-bold text-slate-950 cursor-pointer"
                style={{ backgroundColor: game.accentHex }}
              >
                Resume [Esc]
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.currentTarget.blur();
                  ctrlRef.current?.restart();
                }}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-white cursor-pointer"
              >
                Restart [R]
              </button>
              <button
                type="button"
                onClick={onReturnHub}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 font-bold text-slate-300 cursor-pointer"
              >
                Back to Arcade Hub
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over / Victory Modal */}
      {snap.phase === 'gameover' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-6 bg-[#090d16]/88">
          <div className="w-full max-w-md bg-[#121826] border border-slate-700 rounded-2xl p-6 text-center shadow-2xl">
            <div
              className="text-xs font-bold uppercase tracking-[0.16em]"
              style={{ color: snap.victory ? '#4ade80' : '#f43f5e' }}
            >
              {snap.victory ? 'Stage Cleared' : 'Run Complete'}
            </div>
            <h3 className="font-display text-4xl font-extrabold italic uppercase text-white mt-1">
              {game.title}
            </h3>
            {snap.summaryText && (
              <p className="mt-2 text-sm text-slate-300">{snap.summaryText}</p>
            )}

            <div className="mt-5 grid grid-cols-2 gap-3 text-left">
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Run Score
                </div>
                <div className="font-mono-num text-2xl font-bold text-white">
                  {snap.score.toLocaleString()}
                </div>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Best Score
                </div>
                <div
                  className="font-mono-num text-2xl font-bold"
                  style={{ color: game.accentHex }}
                >
                  {snap.bestScore.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                data-start="true"
                onClick={(e) => {
                  e.currentTarget.blur();
                  ctrlRef.current?.restart();
                }}
                className="flex-1 py-3 rounded-xl font-display text-xl font-extrabold italic uppercase text-slate-950 cursor-pointer"
                style={{ backgroundColor: game.accentHex }}
              >
                Play Again
              </button>
              <button
                type="button"
                onClick={onReturnHub}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-bold text-slate-200 cursor-pointer"
              >
                Arcade Hub
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
