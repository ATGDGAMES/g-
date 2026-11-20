import test from 'node:test';
import assert from 'node:assert/strict';

import {
  extractGamePayloadFromSiteHtml,
  inferU7Category,
  isAllowedU7AssetHost,
  isValidU7Slug,
  parseHomeCatalogFromHtml,
  sanitizeU7GameHtml,
  unwrapGadgetXml,
} from './u7Sanitizer';

test('validates Drive U-7 slugs and CDN asset host allowlist strictly', () => {
  assert.equal(isValidU7Slug('driving-games/mad-pursuit'), true);
  assert.equal(isValidU7Slug('new-games/level-67'), true);
  assert.equal(isValidU7Slug('gta'), true);
  assert.equal(isValidU7Slug('../etc/passwd'), false);
  assert.equal(isValidU7Slug('https://evil.com/x'), false);

  assert.equal(isAllowedU7AssetHost('https://cdn.jsdelivr.net/gh/a/b@main/1.xml'), true);
  assert.equal(isAllowedU7AssetHost('https://sites.google.com/sitesv-images-rt/abc'), true);
  assert.equal(isAllowedU7AssetHost('http://cdn.jsdelivr.net/a.xml'), false);
  assert.equal(isAllowedU7AssetHost('https://script.google.com/macros/s/ad/exec'), false);
});

test('parses homepage game cards with exact Drive U-7 titles, slugs, and thumbnails', () => {
  const sampleHtml = `
    <div>
      <a href="/view/drive-u-7-home/driving-games/mad-pursuit">
        <img src="https://sites.google.com/sitesv-images-rt/IMG_MP_123=w1280" />
      </a>
      <p>Mad Pursuit</p>
      <a href="/view/drive-u-7-home/new-games/level-67">
        <img src="https://sites.google.com/sitesv-images-rt/IMG_L67_456=w1280" />
      </a>
      <p>Level 67</p>
      <a href="/view/drive-u-7-home/flash-games/fortnite">
        <img src="https://sites.google.com/sitesv-images-rt/IMG_GTA_789=w1280" />
      </a>
      <p>GTA</p>
    </div>
  `;

  const parsed = parseHomeCatalogFromHtml(sampleHtml);
  assert.equal(parsed.length, 3);
  assert.deepEqual(
    parsed.map((g) => ({ slug: g.slug, title: g.title, category: g.category })),
    [
      { slug: 'driving-games/mad-pursuit', title: 'Mad Pursuit', category: 'driving' },
      { slug: 'new-games/level-67', title: 'Level 67', category: 'skill' },
      { slug: 'flash-games/fortnite', title: 'GTA', category: 'driving' },
    ],
  );
  assert.equal(parsed[0].rawImgUrl, 'https://sites.google.com/sitesv-images-rt/IMG_MP_123=w1280');
});

test('extracts FILE_URL XML and Ruffle inline payloads from [data-code]', () => {
  const xmlSiteHtml = `<div data-code="const FILE_URL = &#39;https://cdn.jsdelivr.net/gh/777kze777/zeha67@main/3.xml&#39;;"></div>`;
  assert.deepEqual(extractGamePayloadFromSiteHtml(xmlSiteHtml), {
    kind: 'xml-url',
    url: 'https://cdn.jsdelivr.net/gh/777kze777/zeha67@main/3.xml',
  });

  const ruffleSiteHtml = `<div data-code="const gameHTML = \`<!DOCTYPE html><html><body>&lt;ruffle-player&gt;&lt;/ruffle-player&gt;</body></html>\`;"></div>`;
  const extracted = extractGamePayloadFromSiteHtml(ruffleSiteHtml);
  assert.equal(extracted.kind, 'inline-html');
  if (extracted.kind === 'inline-html') {
    assert.ok(extracted.html.includes('<ruffle-player>'));
  }
});

test('unwraps Google Gadget XML CDATA and removes all sticky ads, ad iframes, countdowns, and SDKs', () => {
  const sampleXml = `<?xml version="1.0" encoding="UTF-8" ?>
<Module>
  <ModulePrefs title="Test" />
  <Content type="html"><![CDATA[
    <!DOCTYPE html>
    <html>
      <head>
        <title>Mad Pursuit</title>
        <script src="https://www.googletagmanager.com/gtag/js?id=UA-123"></script>
        <script>
          (function (a, b, c) {
            var d = a.getElementsByTagName(b)[0];
            a.src = "https://cdn.jsdelivr.net/gh/testamalame/sef@4a1e4d5/sedk.js";
            d.parentNode.insertBefore(a, d);
          })(document, "script", "gamemonetize-sdk");
        </script>
      </head>
      <body>
        <canvas id="unity-canvas"></canvas>
        <script>window.mockYSDK = { adv: {} };</script>
        <!-- Sticky Bottom Center Ad (728x90) with Smooth Slide-Out and Reappearance -->
        <style>
          #ad-container { position: fixed; bottom: 0; }
          #ad-iframe { width: 745px; }
        </style>
        <div id="ad-container" aria-hidden="true">
          <iframe id="ad-iframe" src="https://script.google.com/macros/s/ABC/exec"></iframe>
          <button id="close-ad">Close (12)</button>
        </div>
        <div id="unblocked-text">G+</div>
        <script>
          (function () {
            const showDelay = 2000;
            const countdownStart = 12;
            const reappearDelay = 150000;
            function showAd() {}
          })();
        </script>
      </body>
    </html>
  ]]></Content>
</Module>`;

  const unwrapped = unwrapGadgetXml(sampleXml);
  assert.ok(unwrapped.includes('<canvas id="unity-canvas"></canvas>'));

  const sanitized = sanitizeU7GameHtml(unwrapped, 'https://cdn.jsdelivr.net/gh/777kze777/zeha67@main/');
  assert.equal(sanitized.includes('script.google.com/macros'), false);
  assert.equal(sanitized.includes('googletagmanager.com'), false);
  assert.equal(sanitized.includes('sedk.js'), false);
  assert.equal(sanitized.includes('countdownStart'), false);
  assert.equal(sanitized.includes('<div id="ad-container"'), false);
  assert.equal(sanitized.includes('<div id="unblocked-text"'), false);
  // Real game canvas + mockYSDK + runtime shield must be preserved
  assert.ok(sanitized.includes('<canvas id="unity-canvas"></canvas>'));
  assert.ok(sanitized.includes('window.mockYSDK'));
  assert.ok(sanitized.includes('id="clutch-u7-ad-shield"'));
  assert.ok(sanitized.includes('<base href="https://cdn.jsdelivr.net/gh/777kze777/zeha67@main/">'));
});

test('infers Drive U-7 categories accurately', () => {
  assert.equal(inferU7Category('driving-games/mad-pursuit', 'Mad Pursuit'), 'driving');
  assert.equal(inferU7Category('football-bros', 'Football Bros'), 'sports');
  assert.equal(inferU7Category('renny', 'Granny'), 'action');
  assert.equal(inferU7Category('new-games/level-67', 'Level 67'), 'skill');
});
