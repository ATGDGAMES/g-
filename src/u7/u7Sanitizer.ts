export type U7GameCategory = 'action' | 'driving' | 'skill' | 'sports';

export interface ParsedU7HomeGame {
  slug: string;
  title: string;
  rawImgUrl: string;
  category: U7GameCategory;
  rank: number;
}

export type ExtractedU7Payload =
  | { kind: 'xml-url'; url: string }
  | { kind: 'inline-html'; html: string }
  | { kind: 'iframe-url'; url: string }
  | { kind: 'none' };

const SAFE_SLUG_RE = /^[a-z0-9][a-z0-9/_-]{0,120}$/i;

export function isValidU7Slug(slug: string): boolean {
  if (!slug || slug.includes('..') || slug.startsWith('/') || slug.endsWith('/')) {
    return false;
  }
  return SAFE_SLUG_RE.test(slug);
}

export function isAllowedU7AssetHost(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    return (
      host === 'cdn.jsdelivr.net' ||
      host === 'raw.githubusercontent.com' ||
      host === 'sites.google.com' ||
      host === 'lh3.googleusercontent.com' ||
      host.endsWith('.googleusercontent.com') ||
      host.endsWith('.github.io')
    );
  } catch {
    return false;
  }
}

export function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ');
}

export function inferU7Category(slug: string, title: string): U7GameCategory {
  const s = `${slug} ${title}`.toLowerCase();
  if (
    /(race|car|drift|pursuit|moto|bike|truck|drive|rally|taxi|highway|parking|gta|auto|offroad|traffic|wheelie|nitro)/.test(
      s,
    )
  ) {
    return 'driving';
  }
  if (
    /(football|soccer|basket|tennis|golf|snow|ski|skate|volley|baseball|boxing|goal|hockey|pool|wrestle|retro bowl)/.test(
      s,
    )
  ) {
    return 'sports';
  }
  if (
    /(cs|counter|half-life|granny|renny|gun|shoot|fnaf|horror|buckshot|zombie|war|fight|sniper|survival|escape|slender|neighbor|shrek|doom|quake|combat|man!|abnormal|delivery)/.test(
      s,
    )
  ) {
    return 'action';
  }
  return 'skill';
}

/**
 * Parses the Drive U-7 homepage HTML for every game card linking to
 * `/view/drive-u-7-home/<slug>` paired with a `sitesv-images-rt` thumbnail
 * and its visible card title.
 */
export function parseHomeCatalogFromHtml(html: string): ParsedU7HomeGame[] {
  const results: ParsedU7HomeGame[] = [];
  const seen = new Set<string>();
  const markerRe = /sitesv-images-rt/g;
  let match: RegExpExecArray | null;

  while ((match = markerRe.exec(html)) !== null) {
    const idx = match.index;
    const atImg = html.slice(Math.max(0, idx - 40), idx + 450);
    const imgMatch = atImg.match(
      /src="(https:\/\/sites\.google\.com\/sitesv-images-rt\/[^"]+)"/,
    );
    if (!imgMatch) continue;

    // Find the closest /view/drive-u-7-home/<slug> anchor near this image (preferring the last one before idx, or first shortly after)
    const beforeImg = html.slice(Math.max(0, idx - 550), idx);
    const allBeforeLinks = [...beforeImg.matchAll(/href="\/view\/drive-u-7-home\/([^"?#]+)"/g)];
    let rawSlug = allBeforeLinks.length > 0 ? allBeforeLinks[allBeforeLinks.length - 1][1].trim() : '';

    if (!rawSlug) {
      const afterShort = html.slice(idx, idx + 450);
      const afterMatch = afterShort.match(/href="\/view\/drive-u-7-home\/([^"?#]+)"/);
      rawSlug = afterMatch ? afterMatch[1].trim() : '';
    }

    if (!isValidU7Slug(rawSlug) || rawSlug === 'home') continue;
    if (seen.has(rawSlug)) continue;

    const afterImg = html.slice(idx, idx + 950);
    const pRe = /<p[^>]*>([\s\S]*?)<\/p>/g;
    let title = '';
    let pMatch: RegExpExecArray | null;
    while ((pMatch = pRe.exec(afterImg)) !== null) {
      const cleaned = decodeHtmlEntities(pMatch[1].replace(/<[^>]+>/g, ''))
        .replace(/\s+/g, ' ')
        .trim();
      if (cleaned) {
        title = cleaned;
        break;
      }
    }

    if (!title) {
      title = rawSlug
        .split('/')
        .pop()!
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
    }

    seen.add(rawSlug);
    results.push({
      slug: rawSlug,
      title,
      rawImgUrl: decodeHtmlEntities(imgMatch[1]),
      category: inferU7Category(rawSlug, title),
      rank: results.length + 1,
    });
  }

  return results;
}

/**
 * Extracts the embedded game launcher payload (`FILE_URL` gadget XML,
 * inline `gameHTML` e.g. Ruffle Flash, or direct non-ad `<iframe>`) from a
 * Drive U-7 subpage HTML (`[data-code]` attribute).
 */
export function extractGamePayloadFromSiteHtml(siteHtml: string): ExtractedU7Payload {
  const dcRe = /data-code="([\s\S]*?)"/g;
  let m: RegExpExecArray | null;

  while ((m = dcRe.exec(siteHtml)) !== null) {
    const decoded = decodeHtmlEntities(m[1]);

    // Pattern 1: Standard Google Gadget XML loader (`const FILE_URL = 'https://cdn.jsdelivr.net/...xml'`)
    const fileUrlMatch = decoded.match(
      /(?:FILE_URL|gameUrl|xmlUrl)\s*=\s*['"]([^'"]+\.xml(?:\?[^'"]*)?)['"]/i,
    );
    if (fileUrlMatch && isAllowedU7AssetHost(fileUrlMatch[1])) {
      return { kind: 'xml-url', url: fileUrlMatch[1] };
    }

    // Any direct jsDelivr XML string inside the embed snippet
    const jsdXmlMatch = decoded.match(
      /['"](https:\/\/cdn\.jsdelivr\.net\/[^'"]+\.xml)['"]/i,
    );
    if (jsdXmlMatch) {
      return { kind: 'xml-url', url: jsdXmlMatch[1] };
    }

    // Pattern 2: Ruffle Flash / inline `const gameHTML = \`...\``
    const gameHtmlBacktick = decoded.match(
      /(?:const|let|var)\s+gameHTML\s*=\s*`([\s\S]*?)`\s*;/,
    );
    if (gameHtmlBacktick && gameHtmlBacktick[1].trim().length > 40) {
      return { kind: 'inline-html', html: gameHtmlBacktick[1] };
    }

    // Pattern 3: Direct embedded non-ad HTML document inside data-code
    if (
      /<!doctype\s+html/i.test(decoded) &&
      !decoded.includes('play-overlay') &&
      (decoded.includes('<canvas') || decoded.includes('UnityLoader') || decoded.includes('ruffle'))
    ) {
      return { kind: 'inline-html', html: decoded };
    }

    // Pattern 4: Direct non-ad iframe src
    const iframeMatch = decoded.match(/<iframe[^>]+src=['"](https:\/\/[^'"]+)['"]/i);
    if (
      iframeMatch &&
      !/(script\.google\.com|doubleclick|googlesyndication|googleadservices)/i.test(
        iframeMatch[1],
      )
    ) {
      return { kind: 'iframe-url', url: iframeMatch[1] };
    }
  }

  return { kind: 'none' };
}

/**
 * Unwraps Google Gadget XML (`<Content type="html"><![CDATA[...]]></Content>`)
 * into raw HTML document text.
 */
export function unwrapGadgetXml(xmlOrHtml: string): string {
  const cdataMatch = xmlOrHtml.match(
    /<Content[^>]*>\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*<\/Content>/i,
  );
  if (cdataMatch) {
    return cdataMatch[1].trim();
  }
  const simpleContentMatch = xmlOrHtml.match(/<Content[^>]*>([\s\S]*?)<\/Content>/i);
  if (simpleContentMatch) {
    const inner = simpleContentMatch[1].trim();
    return inner.includes('&lt;') ? decodeHtmlEntities(inner) : inner;
  }
  return xmlOrHtml;
}

const AD_SHIELD_HEAD = `<style id="clutch-u7-ad-shield">
  #ad-container, #ad-iframe, #close-ad, #ad-right-mask,
  #unblocked-text, #gplus-badge, .adsbygoogle,
  [id*="ad-container"], [id*="ad-iframe"], [class*="ad-banner"],
  iframe[src*="script.google.com"], iframe[src*="doubleclick"], iframe[src*="googlesyndication"] {
    display: none !important;
    visibility: hidden !important;
    opacity: 0 !important;
    width: 0 !important;
    height: 0 !important;
    pointer-events: none !important;
  }
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    width: 100% !important;
    height: 100% !important;
    overflow: hidden !important;
    background: #0b0f19 !important;
  }
</style>
<script id="clutch-u7-runtime-shield">
  (function () {
    try {
      window.gtag = function () {};
      window.ga = function () {};
      window.adsbygoogle = { push: function () {} };
      window.open = function () { return null; };
      window.alert = function () {};
      window.confirm = function () { return false; };
      window.showAd = function () {};
      window.sdk = window.sdk || {
        showBanner: function () { return Promise.resolve(); },
        hideBanner: function () {},
        showReward: function () { return Promise.resolve(); },
        showRewardedAd: function () { return Promise.resolve(); },
      };
      // Safe cross-session save bridge if Unity posts UNITY_SAVE
      window.addEventListener('message', function (e) {
        try {
          if (e.data && e.data.type === 'UNITY_SAVE') {
            localStorage.setItem('u7_save_' + location.search, JSON.stringify(e.data.payload));
          } else if (e.data && e.data.type === 'UNITY_LOAD_REQ') {
            var raw = localStorage.getItem('u7_save_' + location.search);
            window.postMessage({ type: 'UNITY_LOAD', payload: raw ? JSON.parse(raw) : null }, '*');
          }
        } catch (_) {}
      });
    } catch (_) {}
  })();
</script>`;

/**
 * Strips all Drive U-7 sticky ads, script.google.com ad iframes, ad countdown
 * timers, G+ badges, and third-party ad/tracker SDK scripts (`sedk.js`,
 * `googletagmanager`, `adsbygoogle`, `ima3.js`, `gamedistribution`, `poki-sdk`),
 * while preserving the real Unity WebGL / Canvas / Ruffle game intact.
 */
export function sanitizeU7GameHtml(rawHtml: string, baseHref?: string): string {
  let out = rawHtml;

  // 1. Remove Sticky Bottom Ad comment + style + container + countdown IIFE block
  out = out.replace(
    /<!--\s*Sticky\s+(?:Bottom\s+Center\s+)?Ad[\s\S]*?-->[\s\S]*?(?=<\/body>|<\/html>|$)/gi,
    (block) => {
      // Only strip everything if it ends inside the ad script; preserve trailing closing tags
      const hasClosingBody = /<\/body>/i.test(block);
      const hasClosingHtml = /<\/html>/i.test(block);
      return `${hasClosingBody ? '</body>' : ''}${hasClosingHtml ? '</html>' : ''}`;
    },
  );

  // 2. Remove any standalone #ad-container div + #ad-iframe
  out = out.replace(
    /<div[^>]*id=["']ad-container["'][^>]*>[\s\S]*?<\/div>\s*(?:<\/div>)?/gi,
    '',
  );
  out = out.replace(
    /<iframe[^>]*id=["']ad-iframe["'][^>]*>[\s\S]*?<\/iframe>/gi,
    '',
  );
  out = out.replace(
    /<iframe[^>]+src=["'][^"']*(?:script\.google\.com\/macros|doubleclick\.net|googlesyndication\.com)[^"']*["'][^>]*>[\s\S]*?<\/iframe>/gi,
    '',
  );

  // 3. Remove #unblocked-text ("G+") badges
  out = out.replace(
    /<div[^>]*id=["']unblocked-text["'][^>]*>[\s\S]*?<\/div>/gi,
    '',
  );

  // 4. Remove inline Drive U-7 ad scripts (countdownStart / showDelay / reappearDelay / showAd / sedk.js)
  out = out.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, (full, inner: string) => {
    const trimmedSrc = full.match(/\bsrc=["']([^"']+)["']/i)?.[1] || '';
    if (
      /(googletagmanager\.com|google-analytics\.com|googlesyndication\.com|doubleclick\.net|googleadservices\.com|imasdk\.googleapis\.com|gamedistribution\.com|poki-sdk|crazygames|sedk\.js|script\.google\.com\/macros)/i.test(
        trimmedSrc,
      )
    ) {
      return '';
    }
    if (
      /(countdownStart|reappearDelay|showAd\(|ad-container|ad-iframe|close-ad|sedk\.js|gamemonetize-sdk|adsbygoogle)/i.test(
        inner,
      )
    ) {
      return '';
    }
    return full;
  });

  // 5. Remove ad stylesheet rules targeting #ad-container
  out = out.replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gi, (full, css: string) => {
    if (/#ad-container\s*\{/i.test(css) && /#ad-iframe\s*\{/i.test(css)) {
      return '';
    }
    return full;
  });

  // 6. Inject optional <base> and our ad-shield CSS/JS into <head>
  const baseTag = baseHref ? `<base href="${baseHref}">` : '';
  const injection = `${baseTag}\n${AD_SHIELD_HEAD}`;
  if (/<head[^>]*>/i.test(out)) {
    out = out.replace(/<head[^>]*>/i, (m) => `${m}\n${injection}`);
  } else if (/<html[^>]*>/i.test(out)) {
    out = out.replace(/<html[^>]*>/i, (m) => `${m}\n<head>${injection}</head>`);
  } else {
    out = `<!DOCTYPE html><html><head>${injection}</head><body>${out}</body></html>`;
  }

  return out;
}
