import type { P2PMessage, P2PPeerInfo } from '../game/types';

export interface P2PRoomState {
  connected: boolean;
  peerId: string | null;
  roomCode: string | null;
  hostId: string | null;
  isHost: boolean;
  seed: number;
  status: 'idle' | 'waiting' | 'playing';
  peers: P2PPeerInfo[];
  error: string | null;
}

interface PeerLink {
  peerId: string;
  pc: RTCPeerConnection | null;
  dc: RTCDataChannel | null;
  state: 'connecting' | 'connected' | 'relay';
}

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export class P2PClient {
  private ws: WebSocket | null = null;
  private links = new Map<string, PeerLink>();
  private state: P2PRoomState = {
    connected: false,
    peerId: null,
    roomCode: null,
    hostId: null,
    isHost: true,
    seed: 101,
    status: 'idle',
    peers: [],
    error: null,
  };

  private onStateChange: (state: P2PRoomState) => void;
  private onMatchStart: (seed: number, isHost: boolean) => void;
  private onGameMessage: (fromPeerId: string, msg: P2PMessage) => void;

  constructor(callbacks: {
    onStateChange: (state: P2PRoomState) => void;
    onMatchStart: (seed: number, isHost: boolean) => void;
    onGameMessage: (fromPeerId: string, msg: P2PMessage) => void;
  }) {
    this.onStateChange = callbacks.onStateChange;
    this.onMatchStart = callbacks.onMatchStart;
    this.onGameMessage = callbacks.onGameMessage;
  }

  public connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${proto}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    this.ws = ws;

    ws.onopen = () => {
      this.state.connected = true;
      this.state.error = null;
      this.emitState();
    };

    ws.onclose = () => {
      this.state.connected = false;
      this.emitState();
    };

    ws.onerror = () => {
      this.state.connected = false;
      this.emitState();
    };

    ws.onmessage = (ev) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(String(ev.data)) as Record<string, unknown>;
      } catch {
        return;
      }
      this.handleWsMessage(msg);
    };
  }

  public createRoom(name: string): void {
    this.connect();
    this.sendWsWhenReady({ type: 'room:create', name });
  }

  public joinRoom(roomCode: string, name: string): void {
    this.connect();
    this.sendWsWhenReady({ type: 'room:join', roomCode, name });
  }

  public quickMatch(name: string): void {
    this.connect();
    this.sendWsWhenReady({ type: 'room:join', quickMatch: true, name });
  }

  public leaveRoom(): void {
    this.closeAllPeerLinks();
    this.sendWs({ type: 'room:leave' });
    this.state.roomCode = null;
    this.state.status = 'idle';
    this.state.peers = [];
    this.state.isHost = true;
    this.emitState();
  }

  public startRoomMatch(): void {
    this.sendWs({ type: 'room:start' });
  }

  public getState(): P2PRoomState {
    return { ...this.state, peers: [...this.state.peers] };
  }

  public getConnectedPeerCount(): number {
    return Math.max(0, this.state.peers.length - 1);
  }

  /**
   * Broadcasts a game message via direct WebRTC DataChannels when open,
   * falling back seamlessly to WS relay for any peer whose NAT blocks direct UDP.
   */
  public broadcast(msg: P2PMessage): void {
    if (!this.state.roomCode) return;
    const raw = JSON.stringify(msg);
    let needsWsRelay = false;

    for (const peer of this.state.peers) {
      if (peer.peerId === this.state.peerId) continue;
      const link = this.links.get(peer.peerId);
      if (link?.dc && link.dc.readyState === 'open') {
        try {
          link.dc.send(raw);
        } catch {
          needsWsRelay = true;
        }
      } else {
        needsWsRelay = true;
      }
    }

    if (needsWsRelay) {
      this.sendWs({ type: 'p2p:relay', payload: msg });
    }
  }

  public sendToPeer(targetPeerId: string, msg: P2PMessage): void {
    const link = this.links.get(targetPeerId);
    if (link?.dc && link.dc.readyState === 'open') {
      try {
        link.dc.send(JSON.stringify(msg));
        return;
      } catch {
        // fallback to ws
      }
    }
    this.sendWs({ type: 'p2p:relay', targetPeerId, payload: msg });
  }

  public dispose(): void {
    this.closeAllPeerLinks();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private sendWsWhenReady(payload: unknown): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
      return;
    }
    const timer = window.setInterval(() => {
      if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
        window.clearInterval(timer);
        return;
      }
      if (this.ws.readyState === WebSocket.OPEN) {
        window.clearInterval(timer);
        this.ws.send(JSON.stringify(payload));
      }
    }, 50);
  }

  private sendWs(payload: unknown): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  private handleWsMessage(msg: Record<string, unknown>): void {
    const type = String(msg.type || '');

    if (type === 'welcome') {
      this.state.peerId = String(msg.peerId || '');
      this.emitState();
      return;
    }

    if (type === 'room:error') {
      this.state.error = String(msg.error || 'Could not join room');
      this.emitState();
      return;
    }

    if (type === 'room:joined') {
      this.state.error = null;
      this.state.roomCode = String(msg.roomCode || '');
      this.state.peerId = String(msg.peerId || this.state.peerId || '');
      this.state.hostId = String(msg.hostId || '');
      this.state.isHost = Boolean(msg.isHost);
      this.state.seed = Number(msg.seed || 101);
      this.state.status = msg.status === 'playing' ? 'playing' : 'waiting';
      const rawPeers = Array.isArray(msg.peers) ? msg.peers : [];
      this.syncPeerList(rawPeers as Array<{ peerId: string; name: string; isHost: boolean }>);

      // Initiate WebRTC connections to existing peers
      for (const p of this.state.peers) {
        if (p.peerId !== this.state.peerId) {
          this.ensurePeerConnection(p.peerId, true);
        }
      }
      this.emitState();
      if (this.state.status === 'playing') {
        this.onMatchStart(this.state.seed, this.state.isHost);
      }
      return;
    }

    if (type === 'peer:joined') {
      this.state.hostId = String(msg.hostId || this.state.hostId || '');
      this.state.isHost = this.state.hostId === this.state.peerId;
      const rawPeers = Array.isArray(msg.peers) ? msg.peers : [];
      this.syncPeerList(rawPeers as Array<{ peerId: string; name: string; isHost: boolean }>);
      this.emitState();
      return;
    }

    if (type === 'peer:left') {
      const leftId = String(msg.peerId || '');
      this.closePeerLink(leftId);
      this.state.hostId = String(msg.hostId || this.state.hostId || '');
      this.state.isHost = this.state.hostId === this.state.peerId;
      const rawPeers = Array.isArray(msg.peers) ? msg.peers : [];
      this.syncPeerList(rawPeers as Array<{ peerId: string; name: string; isHost: boolean }>);
      this.emitState();
      return;
    }

    if (type === 'match:started') {
      this.state.status = 'playing';
      this.state.seed = Number(msg.seed || this.state.seed);
      this.state.hostId = String(msg.hostId || this.state.hostId || '');
      this.state.isHost = this.state.hostId === this.state.peerId;
      this.emitState();
      this.onMatchStart(this.state.seed, this.state.isHost);
      return;
    }

    if (type === 'rtc:signal') {
      const fromPeerId = String(msg.fromPeerId || '');
      const signal = msg.signal as { sdp?: RTCSessionDescriptionInit; candidate?: RTCIceCandidateInit };
      if (fromPeerId && signal) {
        void this.handleRtcSignal(fromPeerId, signal);
      }
      return;
    }

    if (type === 'p2p:relay') {
      const fromPeerId = String(msg.fromPeerId || '');
      const payload = msg.payload as P2PMessage;
      if (fromPeerId && payload) {
        this.onGameMessage(fromPeerId, payload);
      }
    }
  }

  private syncPeerList(rawPeers: Array<{ peerId: string; name: string; isHost: boolean }>): void {
    this.state.peers = rawPeers.map((p) => {
      const link = this.links.get(p.peerId);
      return {
        peerId: p.peerId,
        name: p.name,
        isHost: p.isHost,
        rtcState: link ? link.state : 'relay',
      };
    });
  }

  private ensurePeerConnection(remotePeerId: string, initiator: boolean): PeerLink {
    const existing = this.links.get(remotePeerId);
    if (existing) return existing;

    if (typeof RTCPeerConnection === 'undefined') {
      const relayOnly: PeerLink = { peerId: remotePeerId, pc: null, dc: null, state: 'relay' };
      this.links.set(remotePeerId, relayOnly);
      return relayOnly;
    }

    const pc = new RTCPeerConnection(RTC_CONFIG);
    const link: PeerLink = { peerId: remotePeerId, pc, dc: null, state: 'connecting' };
    this.links.set(remotePeerId, link);

    pc.onicecandidate = (ev) => {
      if (ev.candidate) {
        this.sendWs({
          type: 'rtc:signal',
          targetPeerId: remotePeerId,
          signal: { candidate: ev.candidate.toJSON() },
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        link.state = 'relay';
        this.refreshPeerRtcStates();
      }
    };

    const wireDataChannel = (dc: RTCDataChannel) => {
      link.dc = dc;
      dc.onopen = () => {
        link.state = 'connected';
        this.refreshPeerRtcStates();
      };
      dc.onclose = () => {
        link.state = 'relay';
        this.refreshPeerRtcStates();
      };
      dc.onmessage = (ev) => {
        try {
          const parsed = JSON.parse(String(ev.data)) as P2PMessage;
          this.onGameMessage(remotePeerId, parsed);
        } catch {
          // ignore malformed packet
        }
      };
    };

    if (initiator) {
      const dc = pc.createDataChannel('game-sync', { ordered: false, maxRetransmits: 1 });
      wireDataChannel(dc);
      void pc
        .createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .then(() => {
          this.sendWs({
            type: 'rtc:signal',
            targetPeerId: remotePeerId,
            signal: { sdp: pc.localDescription },
          });
        })
        .catch(() => {
          link.state = 'relay';
          this.refreshPeerRtcStates();
        });
    } else {
      pc.ondatachannel = (ev) => {
        wireDataChannel(ev.channel);
      };
    }

    return link;
  }

  private async handleRtcSignal(
    fromPeerId: string,
    signal: { sdp?: RTCSessionDescriptionInit; candidate?: RTCIceCandidateInit },
  ): Promise<void> {
    const link = this.ensurePeerConnection(fromPeerId, false);
    if (!link.pc) return;

    try {
      if (signal.sdp) {
        await link.pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        if (signal.sdp.type === 'offer') {
          const answer = await link.pc.createAnswer();
          await link.pc.setLocalDescription(answer);
          this.sendWs({
            type: 'rtc:signal',
            targetPeerId: fromPeerId,
            signal: { sdp: link.pc.localDescription },
          });
        }
      } else if (signal.candidate) {
        await link.pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
      }
    } catch {
      link.state = 'relay';
      this.refreshPeerRtcStates();
    }
  }

  private refreshPeerRtcStates(): void {
    this.state.peers = this.state.peers.map((p) => ({
      ...p,
      rtcState: this.links.get(p.peerId)?.state ?? 'relay',
    }));
    this.emitState();
  }

  private closePeerLink(peerId: string): void {
    const link = this.links.get(peerId);
    if (!link) return;
    try {
      link.dc?.close();
      link.pc?.close();
    } catch {
      // ignore
    }
    this.links.delete(peerId);
  }

  private closeAllPeerLinks(): void {
    for (const id of this.links.keys()) {
      this.closePeerLink(id);
    }
  }

  private emitState(): void {
    this.onStateChange(this.getState());
  }
}
