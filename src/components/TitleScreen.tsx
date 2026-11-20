import React, { useEffect, useState } from 'react';
import { Users, Wifi, Play, Plus, LogIn, Shuffle, Check } from 'lucide-react';
import type { SkinId } from '../game/types';
import { SKINS } from '../game/skins';
import { RARITY_COLORS } from '../game/weapons';
import type { P2PRoomState } from '../net/p2pClient';
import { SkinBadgeSvg, TitleEmblemSvg } from './GameIcons';

interface RoomListing {
  code: string;
  playerCount: number;
  status: string;
}

interface TitleScreenProps {
  playerName: string;
  onNameChange: (name: string) => void;
  selectedSkin: SkinId;
  onSelectSkin: (skinId: SkinId) => void;
  p2pState: P2PRoomState;
  onStartSolo: () => void;
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => void;
  onQuickMatch: () => void;
  onLeaveRoom: () => void;
  onStartRoomMatch: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  playerName,
  onNameChange,
  selectedSkin,
  onSelectSkin,
  p2pState,
  onStartSolo,
  onCreateRoom,
  onJoinRoom,
  onQuickMatch,
  onLeaveRoom,
  onStartRoomMatch,
}) => {
  const [tab, setTab] = useState<'solo' | 'p2p'>('solo');
  const [joinCode, setJoinCode] = useState('');
  const [rooms, setRooms] = useState<RoomListing[]>([]);

  useEffect(() => {
    if (tab !== 'p2p') return;
    let cancelled = false;
    const fetchRooms = () => {
      fetch('/api/rooms')
        .then((r) => r.json())
        .then((data: { rooms?: RoomListing[] }) => {
          if (!cancelled && Array.isArray(data.rooms)) {
            setRooms(data.rooms);
          }
        })
        .catch(() => {});
    };
    fetchRooms();
    const id = window.setInterval(fetchRooms, 3500);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [tab]);

  // Enter / Space starts immediately when not typing inside an input
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (p2pState.roomCode) {
          if (p2pState.isHost) onStartRoomMatch();
        } else {
          onStartSolo();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [p2pState.roomCode, p2pState.isHost, onStartRoomMatch, onStartSolo]);

  return (
    <div className="fixed inset-0 z-20 flex flex-col justify-between p-6 md:p-10 pointer-events-none">
      {/* Main Left-Third Lobby Column (leaves center & right vista clear for 3D flyover) */}
      <div className="w-full max-w-[410px] pointer-events-auto flex flex-col gap-5">
        <TitleEmblemSvg />

        <div
          className="rounded-lg p-5 border border-sky-300/25 shadow-2xl text-slate-100"
          style={{ backgroundColor: 'rgba(13, 23, 44, 0.88)' }}
        >
          {/* Mode Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded bg-slate-950/75 mb-4">
            <button
              type="button"
              onClick={() => setTab('solo')}
              className={`py-2 px-3 rounded text-xs font-bold tracking-wider uppercase transition-colors whitespace-nowrap ${
                tab === 'solo'
                  ? 'bg-sky-500 text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Solo + AI Bots
            </button>
            <button
              type="button"
              onClick={() => setTab('p2p')}
              className={`py-2 px-3 rounded text-xs font-bold tracking-wider uppercase transition-colors whitespace-nowrap flex items-center justify-center gap-1.5 ${
                tab === 'p2p'
                  ? 'bg-sky-500 text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Wifi className="w-3.5 h-3.5" />
              P2P Multiplayer
            </button>
          </div>

          {/* Callsign */}
          <div className="mb-3.5">
            <label
              htmlFor="player-callsign"
              className="block text-xs font-bold uppercase tracking-wider text-sky-200 mb-1"
            >
              Player Callsign
            </label>
            <input
              id="player-callsign"
              type="text"
              maxLength={18}
              value={playerName}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Explorer"
              className="w-full px-3.5 py-2 rounded bg-slate-950/90 border border-slate-700 text-white text-sm font-semibold focus:outline-none focus:border-yellow-400"
            />
          </div>

          {/* Locker / Skin Selector */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-200">
                Locker Skin
              </span>
              <span className="text-[11px] font-bold text-yellow-300">
                {SKINS.find((s) => s.id === selectedSkin)?.name ?? 'Explorer'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {SKINS.map((skin) => {
                const active = selectedSkin === skin.id;
                const rarity = RARITY_COLORS[skin.rarity];
                return (
                  <button
                    key={skin.id}
                    type="button"
                    data-skin={skin.id}
                    onClick={() => onSelectSkin(skin.id)}
                    className={`relative flex items-center gap-2 p-1.5 rounded border text-left transition-all cursor-pointer ${
                      active
                        ? 'border-yellow-400 ring-1 ring-yellow-400/70 bg-slate-800/95'
                        : 'border-slate-700/80 bg-slate-950/80 hover:border-slate-500'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded overflow-hidden shrink-0 flex items-center justify-center border border-white/15"
                      style={{ backgroundColor: rarity.bg }}
                    >
                      {skin.imageUrl ? (
                        <img
                          src={skin.imageUrl}
                          alt={skin.name}
                          className="w-full h-full object-cover object-top"
                        />
                      ) : (
                        <SkinBadgeSvg id={skin.id} className="w-8 h-8" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-bold text-white truncate leading-tight">
                        {skin.name}
                      </div>
                      <div className="text-[9px] text-slate-400 truncate leading-tight">
                        {rarity.label}
                      </div>
                    </div>
                    {active && (
                      <Check className="w-3 h-3 text-yellow-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {tab === 'solo' && !p2pState.roomCode && (
            <div className="space-y-4">
              <div className="text-xs text-slate-300 leading-relaxed flex items-center justify-between border-t border-slate-700/60 pt-3">
                <span>Lobby Fill</span>
                <span className="font-mono-num text-sky-300 font-semibold">
                  100 Combatants (Smart AI Bots)
                </span>
              </div>
              <div className="text-xs text-slate-300 leading-relaxed flex items-center justify-between">
                <span>Island</span>
                <span className="font-semibold text-white">Tilted &amp; 8 POIs · Ch.1</span>
              </div>

              <button
                type="button"
                data-start="true"
                onClick={onStartSolo}
                className="w-full py-3.5 px-6 rounded bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-500 text-slate-950 font-display text-2xl font-extrabold tracking-wider uppercase shadow-lg transition-transform active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-5 h-5 fill-current" />
                Play Now
              </button>
            </div>
          )}

          {(tab === 'p2p' || p2pState.roomCode) && (
            <div className="space-y-3.5">
              {!p2pState.roomCode ? (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={onCreateRoom}
                      className="py-2.5 px-3 rounded bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      Host Room
                    </button>
                    <button
                      type="button"
                      onClick={onQuickMatch}
                      className="py-2.5 px-3 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Shuffle className="w-4 h-4" />
                      Quick Match
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      aria-label="Room Code"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      placeholder="ROOM CODE (E.G. PINE42)"
                      className="flex-1 px-3 py-2 rounded bg-slate-950/90 border border-slate-700 text-white text-xs font-mono-num uppercase focus:outline-none focus:border-sky-400"
                    />
                    <button
                      type="button"
                      onClick={() => joinCode.trim() && onJoinRoom(joinCode.trim())}
                      disabled={!joinCode.trim()}
                      className="px-4 py-2 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white text-xs font-bold uppercase flex items-center gap-1 cursor-pointer"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      Join
                    </button>
                  </div>

                  {p2pState.error && (
                    <p className="text-xs text-rose-400 font-medium">{p2pState.error}</p>
                  )}

                  {rooms.length > 0 && (
                    <div className="border-t border-slate-700/60 pt-2.5">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        Active Rooms
                      </div>
                      <div className="space-y-1 max-h-24 overflow-y-auto">
                        {rooms.map((r) => (
                          <button
                            key={r.code}
                            type="button"
                            onClick={() => onJoinRoom(r.code)}
                            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded bg-slate-950/70 hover:bg-slate-800 text-xs cursor-pointer"
                          >
                            <span className="font-mono-num font-bold text-yellow-300">{r.code}</span>
                            <span className="text-slate-300">
                              {r.playerCount} Player{r.playerCount !== 1 ? 's' : ''} · {r.status}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-3 border-t border-slate-700/60 pt-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-slate-400">
                        P2P Room Code
                      </div>
                      <div className="font-mono-num text-xl font-bold text-yellow-300">
                        {p2pState.roomCode}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={onLeaveRoom}
                      className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 cursor-pointer"
                    >
                      Leave
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      Connected Peers ({p2pState.peers.length}) + Bots Fill to 100
                    </div>
                    {p2pState.peers.map((peer) => (
                      <div
                        key={peer.peerId}
                        className="flex items-center justify-between px-2.5 py-1.5 rounded bg-slate-950/75 text-xs"
                      >
                        <span className="font-semibold text-white truncate">
                          {peer.name} {peer.isHost ? '(Host)' : ''}
                        </span>
                        <span className="font-mono-num text-[11px] text-sky-300 uppercase">
                          {peer.peerId === p2pState.peerId
                            ? 'You'
                            : peer.rtcState === 'connected'
                              ? 'WebRTC P2P'
                              : 'WS Relay'}
                        </span>
                      </div>
                    ))}
                  </div>

                  {p2pState.isHost ? (
                    <button
                      type="button"
                      data-start="true"
                      onClick={onStartRoomMatch}
                      className="w-full py-3.5 px-6 rounded bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-display text-2xl font-extrabold tracking-wider uppercase shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Play className="w-5 h-5 fill-current" />
                      Launch Match
                    </button>
                  ) : (
                    <div className="text-center py-2.5 text-xs font-semibold text-sky-200 bg-slate-950/60 rounded">
                      Waiting for Host to launch match...
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Safe-Margin Single-Line Control Hint */}
      <div className="text-xs font-semibold tracking-wide text-white hud-stroke">
        WASD Move · Space Jump · Mouse Aim/Shoot · Right-Click Scope · Q Build · 1-5 Slots · E Loot · P Pause
      </div>
    </div>
  );
};
