import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import {
  extractGamePayloadFromSiteHtml,
  isAllowedU7AssetHost,
  isValidU7Slug,
  parseHomeCatalogFromHtml,
  sanitizeU7GameHtml,
  unwrapGadgetXml,
  type ParsedU7HomeGame,
} from './src/u7/u7Sanitizer';

const U7_BASE_URL = 'https://sites.google.com/view/drive-u-7-home';
const CACHE_TTL_MS = 30 * 60 * 1000;

let catalogCache: { expiresAt: number; games: ParsedU7HomeGame[] } | null = null;
const gameHtmlCache = new Map<string, { expiresAt: number; html: string }>();
const thumbCache = new Map<string, { contentType: string; buf: Buffer }>();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface RoomPeer {
  peerId: string;
  name: string;
  ws: WebSocket;
}

interface GameRoom {
  code: string;
  hostId: string;
  status: 'waiting' | 'playing';
  seed: number;
  peers: Map<string, RoomPeer>;
  createdAt: number;
}

const rooms = new Map<string, GameRoom>();
const socketMeta = new Map<WebSocket, { peerId: string; roomCode: string | null }>();

function makeRoomCode(): string {
  const words = ['PINE', 'TILT', 'LOOT', 'BUS', 'FORT', 'DROP', 'ZONE', 'STORM'];
  const prefix = words[Math.floor(Math.random() * words.length)];
  const num = Math.floor(10 + Math.random() * 89);
  const code = `${prefix}${num}`;
  return rooms.has(code) ? `${code}${Math.floor(Math.random() * 9)}` : code;
}

function makePeerId(): string {
  return `peer_${Math.random().toString(36).slice(2, 10)}`;
}

function safeSend(ws: WebSocket, payload: unknown): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

function serializeRoomPeers(room: GameRoom) {
  return Array.from(room.peers.values()).map((p) => ({
    peerId: p.peerId,
    name: p.name,
    isHost: p.peerId === room.hostId,
  }));
}

function leaveCurrentRoom(ws: WebSocket): void {
  const meta = socketMeta.get(ws);
  if (!meta || !meta.roomCode) return;

  const room = rooms.get(meta.roomCode);
  meta.roomCode = null;
  if (!room) return;

  room.peers.delete(meta.peerId);
  if (room.peers.size === 0) {
    rooms.delete(room.code);
    return;
  }

  if (room.hostId === meta.peerId) {
    const nextHost = room.peers.values().next().value;
    if (nextHost) {
      room.hostId = nextHost.peerId;
    }
  }

  const peerList = serializeRoomPeers(room);
  for (const peer of room.peers.values()) {
    safeSend(peer.ws, {
      type: 'peer:left',
      peerId: meta.peerId,
      hostId: room.hostId,
      peers: peerList,
    });
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, rooms: rooms.size });
  });

  app.get('/api/rooms', (_req, res) => {
    const list = Array.from(rooms.values())
      .filter((r) => r.peers.size > 0)
      .map((r) => ({
        code: r.code,
        playerCount: r.peers.size,
        status: r.status,
      }))
      .slice(0, 12);
    res.json({ rooms: list });
  });

  app.get('/api/u7/catalog', async (_req, res) => {
    try {
      const now = Date.now();
      if (!catalogCache || catalogCache.expiresAt < now) {
        const homeRes = await fetch(`${U7_BASE_URL}/home`, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ClutchU7/1.0)' },
        });
        if (!homeRes.ok) {
          throw new Error(`Upstream catalog HTTP ${homeRes.status}`);
        }
        const homeHtml = await homeRes.text();
        const parsed = parseHomeCatalogFromHtml(homeHtml);
        if (!parsed.some((g) => g.slug === 'gta')) {
          const gtaThumb = parsed.find((g) => g.slug === 'flash-games/fortnite')?.rawImgUrl || '';
          parsed.splice(2, 0, {
            slug: 'gta',
            title: 'GTA Vice City',
            rawImgUrl: gtaThumb,
            category: 'driving',
            rank: 3,
          });
        }
        catalogCache = { expiresAt: now + CACHE_TTL_MS, games: parsed };
      }

      const games = catalogCache.games.map((g) => ({
        slug: g.slug,
        title: g.title,
        category: g.category,
        rank: g.rank,
        imgUrl: g.rawImgUrl ? `/api/u7/thumb?url=${encodeURIComponent(g.rawImgUrl)}` : '',
        rawImgUrl: g.rawImgUrl,
      }));
      res.json({ games, count: games.length });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load catalog';
      res.status(502).json({ error: message, games: [] });
    }
  });

  app.get('/api/u7/thumb', async (req, res) => {
    const rawUrl = typeof req.query.url === 'string' ? req.query.url : '';
    if (!rawUrl || !isAllowedU7AssetHost(rawUrl)) {
      res.status(400).send('Invalid thumbnail URL');
      return;
    }

    const cached = thumbCache.get(rawUrl);
    if (cached) {
      res.setHeader('Content-Type', cached.contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.send(cached.buf);
      return;
    }

    try {
      const upstream = await fetch(rawUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ClutchU7/1.0)' },
      });
      if (!upstream.ok) {
        res.status(upstream.status).send('Thumbnail unavailable');
        return;
      }
      const contentType = upstream.headers.get('content-type') || 'image/jpeg';
      const buf = Buffer.from(await upstream.arrayBuffer());
      if (thumbCache.size > 140) {
        const oldestKey = thumbCache.keys().next().value;
        if (oldestKey) thumbCache.delete(oldestKey);
      }
      thumbCache.set(rawUrl, { contentType, buf });
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.send(buf);
    } catch {
      res.status(502).send('Thumbnail fetch error');
    }
  });

  app.get('/api/u7/play', async (req, res) => {
    const slug = typeof req.query.slug === 'string' ? req.query.slug.trim() : '';
    if (!isValidU7Slug(slug)) {
      res.status(400).send('Invalid game slug');
      return;
    }

    const now = Date.now();
    const cached = gameHtmlCache.get(slug);
    if (cached && cached.expiresAt > now) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(cached.html);
      return;
    }

    try {
      const pageRes = await fetch(`${U7_BASE_URL}/${slug}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ClutchU7/1.0)' },
      });
      if (!pageRes.ok) {
        res.status(pageRes.status).send(`Game page HTTP ${pageRes.status}`);
        return;
      }

      const siteHtml = await pageRes.text();
      const payload = extractGamePayloadFromSiteHtml(siteHtml);

      let finalHtml = '';
      if (payload.kind === 'xml-url') {
        if (!isAllowedU7AssetHost(payload.url)) {
          res.status(403).send('Blocked asset host');
          return;
        }
        const xmlRes = await fetch(payload.url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ClutchU7/1.0)' },
        });
        if (!xmlRes.ok) {
          res.status(xmlRes.status).send(`Asset HTTP ${xmlRes.status}`);
          return;
        }
        const xmlText = await xmlRes.text();
        const unwrapped = unwrapGadgetXml(xmlText);
        const baseHref = payload.url.slice(0, payload.url.lastIndexOf('/') + 1);
        finalHtml = sanitizeU7GameHtml(unwrapped, baseHref);
      } else if (payload.kind === 'inline-html') {
        finalHtml = sanitizeU7GameHtml(payload.html);
      } else if (payload.kind === 'iframe-url') {
        finalHtml = sanitizeU7GameHtml(
          `<!DOCTYPE html><html><body><iframe src="${payload.url}" style="width:100%;height:100%;border:0" allowfullscreen allow="autoplay; fullscreen; gamepad"></iframe></body></html>`,
        );
      } else {
        res.status(404).send(
          `<!DOCTYPE html><html><body style="margin:0;background:#0b0f19;color:#e2e8f0;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh"><div style="text-align:center"><h2>Embed unavailable for "${slug}"</h2><p style="opacity:.7">Try picking another game from the Arcade Hub.</p></div></body></html>`,
        );
        return;
      }

      if (gameHtmlCache.size > 60) {
        const oldestKey = gameHtmlCache.keys().next().value;
        if (oldestKey) gameHtmlCache.delete(oldestKey);
      }
      gameHtmlCache.set(slug, { expiresAt: now + CACHE_TTL_MS, html: finalHtml });

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(finalHtml);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upstream error';
      res.status(502).send(`Failed to load game "${slug}": ${msg}`);
    }
  });

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    const peerId = makePeerId();
    socketMeta.set(ws, { peerId, roomCode: null });
    safeSend(ws, { type: 'welcome', peerId });

    ws.on('message', (raw) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(String(raw)) as Record<string, unknown>;
      } catch {
        return;
      }

      const meta = socketMeta.get(ws);
      if (!meta) return;

      const msgType = String(msg.type || '');
      const playerName =
        typeof msg.name === 'string' && msg.name.trim()
          ? msg.name.trim().slice(0, 18)
          : 'Explorer';

      if (msgType === 'room:create') {
        leaveCurrentRoom(ws);
        const code = makeRoomCode();
        const seed = Math.floor(1 + Math.random() * 999999);
        const room: GameRoom = {
          code,
          hostId: meta.peerId,
          status: 'waiting',
          seed,
          peers: new Map([[meta.peerId, { peerId: meta.peerId, name: playerName, ws }]]),
          createdAt: Date.now(),
        };
        rooms.set(code, room);
        meta.roomCode = code;

        safeSend(ws, {
          type: 'room:joined',
          roomCode: code,
          peerId: meta.peerId,
          hostId: room.hostId,
          isHost: true,
          seed: room.seed,
          status: room.status,
          peers: serializeRoomPeers(room),
        });
        return;
      }

      if (msgType === 'room:join') {
        const requestedCode =
          typeof msg.roomCode === 'string' ? msg.roomCode.trim().toUpperCase() : '';
        let room = requestedCode ? rooms.get(requestedCode) : undefined;

        if (!room && msg.quickMatch === true) {
          for (const candidate of rooms.values()) {
            if (candidate.status === 'waiting' && candidate.peers.size < 8) {
              room = candidate;
              break;
            }
          }
          if (!room) {
            leaveCurrentRoom(ws);
            const code = makeRoomCode();
            const seed = Math.floor(1 + Math.random() * 999999);
            room = {
              code,
              hostId: meta.peerId,
              status: 'waiting',
              seed,
              peers: new Map([[meta.peerId, { peerId: meta.peerId, name: playerName, ws }]]),
              createdAt: Date.now(),
            };
            rooms.set(code, room);
            meta.roomCode = code;
            safeSend(ws, {
              type: 'room:joined',
              roomCode: code,
              peerId: meta.peerId,
              hostId: room.hostId,
              isHost: true,
              seed: room.seed,
              status: room.status,
              peers: serializeRoomPeers(room),
            });
            return;
          }
        }

        if (!room) {
          safeSend(ws, {
            type: 'room:error',
            error: `Room "${requestedCode}" not found.`,
          });
          return;
        }

        leaveCurrentRoom(ws);
        room.peers.set(meta.peerId, { peerId: meta.peerId, name: playerName, ws });
        meta.roomCode = room.code;

        const peerList = serializeRoomPeers(room);
        safeSend(ws, {
          type: 'room:joined',
          roomCode: room.code,
          peerId: meta.peerId,
          hostId: room.hostId,
          isHost: room.hostId === meta.peerId,
          seed: room.seed,
          status: room.status,
          peers: peerList,
        });

        for (const peer of room.peers.values()) {
          if (peer.peerId !== meta.peerId) {
            safeSend(peer.ws, {
              type: 'peer:joined',
              peerId: meta.peerId,
              name: playerName,
              hostId: room.hostId,
              peers: peerList,
            });
          }
        }
        return;
      }

      if (msgType === 'room:leave') {
        leaveCurrentRoom(ws);
        safeSend(ws, { type: 'room:left' });
        return;
      }

      if (msgType === 'room:start') {
        if (!meta.roomCode) return;
        const room = rooms.get(meta.roomCode);
        if (!room || room.hostId !== meta.peerId) return;
        room.status = 'playing';
        for (const peer of room.peers.values()) {
          safeSend(peer.ws, {
            type: 'match:started',
            seed: room.seed,
            hostId: room.hostId,
          });
        }
        return;
      }

      if (msgType === 'rtc:signal') {
        if (!meta.roomCode) return;
        const room = rooms.get(meta.roomCode);
        if (!room) return;
        const targetPeerId = String(msg.targetPeerId || '');
        const target = room.peers.get(targetPeerId);
        if (target) {
          safeSend(target.ws, {
            type: 'rtc:signal',
            fromPeerId: meta.peerId,
            signal: msg.signal,
          });
        }
        return;
      }

      if (msgType === 'p2p:relay') {
        if (!meta.roomCode) return;
        const room = rooms.get(meta.roomCode);
        if (!room) return;
        const targetPeerId = typeof msg.targetPeerId === 'string' ? msg.targetPeerId : null;
        if (targetPeerId) {
          const target = room.peers.get(targetPeerId);
          if (target) {
            safeSend(target.ws, {
              type: 'p2p:relay',
              fromPeerId: meta.peerId,
              payload: msg.payload,
            });
          }
        } else {
          for (const peer of room.peers.values()) {
            if (peer.peerId !== meta.peerId) {
              safeSend(peer.ws, {
                type: 'p2p:relay',
                fromPeerId: meta.peerId,
                payload: msg.payload,
              });
            }
          }
        }
      }
    });

    ws.on('close', () => {
      leaveCurrentRoom(ws);
      socketMeta.delete(ws);
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT || 3000);
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Tilted Pines server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
