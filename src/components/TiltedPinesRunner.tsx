import { useCallback, useEffect, useRef, useState } from 'react';
import type { GamePhase, HudSnapshot, P2PMessage, SkinId } from '../game/types';
import { isValidSkinId } from '../game/skins';
import { GameEngine } from '../engine/GameEngine';
import { P2PClient, type P2PRoomState } from '../net/p2pClient';
import { TitleScreen } from './TitleScreen';
import { GameHud } from './GameHud';
import { PauseModal } from './PauseModal';
import { GameOverModal } from './GameOverModal';

function getInitialSkin(): SkinId {
  try {
    const paramSkin = new URLSearchParams(window.location.search).get('skin');
    if (isValidSkinId(paramSkin)) return paramSkin;
    const saved = window.localStorage.getItem('tp_selected_skin');
    if (isValidSkinId(saved)) return saved;
  } catch {
    // ignore storage errors
  }
  return 'jonesy';
}

const INITIAL_P2P_STATE: P2PRoomState = {
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

interface TiltedPinesRunnerProps {
  autoStart?: boolean;
  muted?: boolean;
}

export function TiltedPinesRunner({ autoStart = false, muted = false }: TiltedPinesRunnerProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const p2pRef = useRef<P2PClient | null>(null);
  const playerNameRef = useRef('Explorer');
  const initialSkin = getInitialSkin();
  const selectedSkinRef = useRef<SkinId>(initialSkin);

  const [playerName, setPlayerName] = useState('Explorer');
  const [selectedSkin, setSelectedSkin] = useState<SkinId>(initialSkin);
  const [phase, setPhase] = useState<GamePhase>('title');
  const [hud, setHud] = useState<HudSnapshot | null>(null);
  const [p2pState, setP2PState] = useState<P2PRoomState>(INITIAL_P2P_STATE);

  useEffect(() => {
    playerNameRef.current = playerName;
  }, [playerName]);

  useEffect(() => {
    selectedSkinRef.current = selectedSkin;
  }, [selectedSkin]);

  useEffect(() => {
    engineRef.current?.setMuted(muted);
  }, [muted]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const p2p = new P2PClient({
      onStateChange: (nextState) => {
        setP2PState(nextState);
        engineRef.current?.setP2PPeerCount(Math.max(0, nextState.peers.length - 1));
      },
      onMatchStart: (seed, isHost) => {
        const peerCount = p2pRef.current?.getConnectedPeerCount() ?? 0;
        const localPeerId = p2pRef.current?.getState().peerId ?? 'local_player';
        engineRef.current?.startMatch({
          seed,
          playerName: playerNameRef.current,
          isHost,
          skinId: selectedSkinRef.current,
          localPeerId,
          p2pPeersConnected: peerCount,
        });
      },
      onGameMessage: (fromPeerId, msg: P2PMessage) => {
        engineRef.current?.handleP2PMessage(fromPeerId, msg);
      },
    });
    p2pRef.current = p2p;

    const engine = new GameEngine(container, {
      onHudUpdate: (snapshot) => setHud(snapshot),
      onPhaseChange: (nextPhase) => setPhase(nextPhase),
      onSendP2P: (msg) => p2p.broadcast(msg),
    });
    engine.setSelectedSkin(selectedSkinRef.current);
    engine.setMuted(muted);
    engineRef.current = engine;

    if (autoStart) {
      engine.startMatch({
        seed: 101,
        playerName: playerNameRef.current,
        isHost: true,
        skinId: selectedSkinRef.current,
      });
    }

    return () => {
      document.exitPointerLock?.();
      engine.dispose();
      engineRef.current = null;
      p2p.dispose();
      p2pRef.current = null;
    };
  }, [autoStart]);

  const handleSelectSkin = useCallback((skinId: SkinId) => {
    setSelectedSkin(skinId);
    selectedSkinRef.current = skinId;
    engineRef.current?.setSelectedSkin(skinId);
    try {
      window.localStorage.setItem('tp_selected_skin', skinId);
    } catch {
      // ignore
    }
  }, []);

  const handleStartSolo = useCallback(() => {
    const seed = Math.floor(1 + Math.random() * 99999);
    engineRef.current?.startMatch({
      seed,
      playerName: playerNameRef.current || 'Explorer',
      isHost: true,
      skinId: selectedSkinRef.current,
      p2pPeersConnected: 0,
    });
  }, []);

  const handleRestartMatch = useCallback(() => {
    if (p2pState.roomCode && p2pState.isHost) {
      p2pRef.current?.startRoomMatch();
    } else {
      handleStartSolo();
    }
  }, [p2pState.roomCode, p2pState.isHost, handleStartSolo]);

  const handleCreateRoom = useCallback(() => {
    p2pRef.current?.createRoom(playerNameRef.current || 'Explorer');
  }, []);

  const handleJoinRoom = useCallback((code: string) => {
    p2pRef.current?.joinRoom(code, playerNameRef.current || 'Explorer');
  }, []);

  const handleQuickMatch = useCallback(() => {
    p2pRef.current?.quickMatch(playerNameRef.current || 'Explorer');
  }, []);

  const handleLeaveRoom = useCallback(() => {
    p2pRef.current?.leaveRoom();
  }, []);

  const handleStartRoomMatch = useCallback(() => {
    p2pRef.current?.startRoomMatch();
  }, []);

  const handleToggleMute = useCallback(() => {
    if (!hud) return;
    engineRef.current?.setMuted(!hud.muted);
  }, [hud]);

  const handlePause = useCallback(() => {
    engineRef.current?.pauseGame();
  }, []);

  const handleResume = useCallback(() => {
    engineRef.current?.resumeGame();
  }, []);

  const handleReturnTitle = useCallback(() => {
    engineRef.current?.returnToTitle();
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950">
      {/* Dedicated isolated WebGL canvas container */}
      <div
        ref={mountRef}
        data-testid="game-viewport"
        className="absolute inset-0 w-full h-full"
      />

      {phase === 'title' && (
        <TitleScreen
          playerName={playerName}
          onNameChange={setPlayerName}
          selectedSkin={selectedSkin}
          onSelectSkin={handleSelectSkin}
          p2pState={p2pState}
          onStartSolo={handleStartSolo}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onQuickMatch={handleQuickMatch}
          onLeaveRoom={handleLeaveRoom}
          onStartRoomMatch={handleStartRoomMatch}
        />
      )}

      {phase === 'playing' && hud && (
        <GameHud
          hud={hud}
          onToggleMute={handleToggleMute}
          onPause={handlePause}
        />
      )}

      {phase === 'paused' && (
        <PauseModal
          onResume={handleResume}
          onRestart={handleRestartMatch}
          onReturnTitle={handleReturnTitle}
        />
      )}

      {phase === 'gameover' && hud && (
        <GameOverModal
          hud={hud}
          onPlayAgain={handleRestartMatch}
          onReturnTitle={handleReturnTitle}
        />
      )}
    </div>
  );
}
