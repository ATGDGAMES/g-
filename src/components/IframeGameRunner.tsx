import { useEffect, useRef, useState } from 'react';
import { RefreshCw, ShieldCheck } from 'lucide-react';
import type { ArcadeGameMeta } from '../arcade/types';

interface IframeGameRunnerProps {
  game: ArcadeGameMeta;
  restartSignal: number;
}

export function IframeGameRunner({ game, restartSignal }: IframeGameRunnerProps) {
  const slug = game.u7Slug ?? game.id;
  const src = `/api/u7/play?slug=${encodeURIComponent(slug)}&r=${restartSignal}`;
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    document.body.dataset.state = 'loading';
    return () => {
      document.body.dataset.state = 'title';
    };
  }, [slug, restartSignal]);

  return (
    <div className="relative w-full h-full bg-[#0b0f19] overflow-hidden">
      <iframe
        ref={iframeRef}
        key={`${slug}-${restartSignal}`}
        src={src}
        title={`${game.title} — Ad-Free Drive U-7`}
        data-testid="u7-game-iframe"
        allow="fullscreen; autoplay; gamepad; clipboard-read; clipboard-write"
        onLoad={() => {
          setLoaded(true);
          document.body.dataset.state = 'playing';
          try {
            iframeRef.current?.focus();
          } catch {
            // ignore cross-context focus warnings
          }
        }}
        className="w-full h-full border-0 block bg-[#0b0f19]"
      />

      {!loaded && (
        <div className="absolute inset-0 bg-[#0b0f19]/90 flex flex-col items-center justify-center gap-3 pointer-events-none z-10">
          <div className="w-10 h-10 rounded-full border-2 border-yellow-400/30 border-t-yellow-400 animate-spin" />
          <div className="text-center">
            <div className="font-display text-2xl font-extrabold italic uppercase tracking-wide text-white">
              Loading {game.title}
            </div>
            <div className="mt-1 inline-flex items-center gap-1.5 text-xs font-mono-num text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Stripping ads &amp; initializing iframe engine...</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-2">
            <RefreshCw className="w-3 h-3" />
            <span>Large Unity WebGL builds may take a few seconds</span>
          </div>
        </div>
      )}
    </div>
  );
}
