import { useEffect, useRef, useState } from 'react';
import { RefreshCw, ShieldCheck } from 'lucide-react';
import type { ArcadeGameMeta } from '../arcade/types';
import { sanitizeU7GameHtml, unwrapGadgetXml } from '../u7/u7Sanitizer';
import { findStaticU7XmlUrl } from '../u7/u7StaticCatalog';

interface IframeGameRunnerProps {
  game: ArcadeGameMeta;
  restartSignal: number;
}

let backendAvailablePromise: Promise<boolean> | null = null;

function checkExpressBackendAvailable(): Promise<boolean> {
  if (!backendAvailablePromise) {
    backendAvailablePromise = fetch('./api/health', { cache: 'no-store' })
      .then((res) => {
        const ct = res.headers.get('content-type') || '';
        return res.ok && ct.includes('application/json');
      })
      .catch(() => false);
  }
  return backendAvailablePromise;
}

export function IframeGameRunner({ game, restartSignal }: IframeGameRunnerProps) {
  const slug = game.u7Slug ?? game.id;
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [mode, setMode] = useState<'resolving' | 'server-src' | 'static-srcdoc' | 'error'>('resolving');
  const [staticSrcDoc, setStaticSrcDoc] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const serverSrc = `./api/u7/play?slug=${encodeURIComponent(slug)}&r=${restartSignal}`;

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    setMode('resolving');
    setStaticSrcDoc('');
    setErrorMsg('');
    document.body.dataset.state = 'loading';

    (async () => {
      const hasBackend = await checkExpressBackendAvailable();
      if (cancelled) return;

      if (hasBackend) {
        setMode('server-src');
        return;
      }

      // Static hosting fallback (e.g., GitHub Pages without Express backend):
      // Fetch CORS-enabled jsDelivr XML directly, strip ads cleanly in-browser,
      // and mount via iframe srcDoc.
      const xmlUrl = findStaticU7XmlUrl(slug);
      if (!xmlUrl) {
        setMode('error');
        setErrorMsg(`"${game.title}" requires the Node backend or is not in the static mirror.`);
        return;
      }

      try {
        if (xmlUrl.endsWith('.xml') || xmlUrl.includes('.xml?')) {
          const res = await fetch(xmlUrl);
          if (!res.ok) throw new Error(`CDN HTTP ${res.status}`);
          const xmlText = await res.text();
          const unwrapped = unwrapGadgetXml(xmlText);
          const baseHref = xmlUrl.slice(0, xmlUrl.lastIndexOf('/') + 1);
          const cleanHtml = sanitizeU7GameHtml(unwrapped, baseHref);
          if (!cancelled) {
            setStaticSrcDoc(cleanHtml);
            setMode('static-srcdoc');
          }
        } else {
          // Direct iframe-url static entry
          const cleanHtml = sanitizeU7GameHtml(
            `<!DOCTYPE html><html><body><iframe src="${xmlUrl}" style="width:100%;height:100%;border:0" allow="autoplay; fullscreen; gamepad"></iframe></body></html>`,
          );
          if (!cancelled) {
            setStaticSrcDoc(cleanHtml);
            setMode('static-srcdoc');
          }
        }
      } catch (err) {
        if (!cancelled) {
          setMode('error');
          setErrorMsg(err instanceof Error ? err.message : 'Unable to load game stream');
        }
      }
    })();

    return () => {
      cancelled = true;
      document.body.dataset.state = 'title';
    };
  }, [slug, restartSignal, game.title]);

  const handleIframeLoad = () => {
    setLoaded(true);
    document.body.dataset.state = 'playing';
    try {
      iframeRef.current?.focus();
    } catch {
      // ignore cross-context focus warnings
    }
  };

  return (
    <div className="relative w-full h-full bg-[#0b0f19] overflow-hidden">
      {mode === 'server-src' && (
        <iframe
          ref={iframeRef}
          key={`srv-${slug}-${restartSignal}`}
          src={serverSrc}
          title={`${game.title} — Ad-Free Drive U-7`}
          data-testid="u7-game-iframe"
          allow="fullscreen; autoplay; gamepad; clipboard-read; clipboard-write"
          onLoad={handleIframeLoad}
          className="w-full h-full border-0 block bg-[#0b0f19]"
        />
      )}

      {mode === 'static-srcdoc' && (
        <iframe
          ref={iframeRef}
          key={`doc-${slug}-${restartSignal}`}
          srcDoc={staticSrcDoc}
          title={`${game.title} — Ad-Free Drive U-7`}
          data-testid="u7-game-iframe"
          allow="fullscreen; autoplay; gamepad; clipboard-read; clipboard-write"
          onLoad={handleIframeLoad}
          className="w-full h-full border-0 block bg-[#0b0f19]"
        />
      )}

      {mode === 'error' && (
        <div className="w-full h-full flex items-center justify-center p-6 text-center">
          <div className="max-w-md rounded-2xl bg-[#121826] border border-slate-800 p-6 space-y-2">
            <div className="font-display text-2xl font-extrabold italic uppercase text-white">
              Could Not Load {game.title}
            </div>
            <p className="text-xs text-slate-400">{errorMsg}</p>
          </div>
        </div>
      )}

      {mode !== 'error' && !loaded && (
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
