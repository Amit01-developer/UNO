import { useState, useEffect } from 'react';
import { UserAccount, RoomData, GameState, AppScreen } from './types';
import { getSession, clearSession } from './utils/auth';
import { LoginScreen } from './components/LoginScreen';
import { LobbyScreen } from './components/LobbyScreen';
import { RoomScreen } from './components/RoomScreen';
import { GameBoard } from './components/GameBoard';
import { AIGameBoard } from './components/AIGameBoard';
import { BackgroundMusic } from './components/BackgroundMusic';

export function App() {
  const [screen, setScreen] = useState<AppScreen>('login');
  const [user, setUser] = useState<UserAccount | null>(null);
  const [currentRoom, setCurrentRoom] = useState<RoomData | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [roomPin, setRoomPin] = useState('');
  const [aiBotCount, setAiBotCount] = useState(2);

  // Check for existing session on mount
  useEffect(() => {
    const session = getSession();
    if (session) {
      setUser(session);
      setScreen('lobby');
    }
  }, []);

  // Toggle body overflow based on screen
  useEffect(() => {
    if (screen === 'game' || screen === 'ai-game') {
      document.body.classList.add('game-active');
    } else {
      document.body.classList.remove('game-active');
    }
    return () => {
      document.body.classList.remove('game-active');
    };
  }, [screen]);

  const handleAuth = (account: UserAccount) => {
    setUser(account);
    setScreen('lobby');
  };

  const handleLogout = () => {
    clearSession();
    setUser(null);
    setCurrentRoom(null);
    setGameState(null);
    setRoomPin('');
    setScreen('login');
  };

  const handleRoomJoined = (room: RoomData) => {
    setCurrentRoom(room);
    setScreen('room');
  };

  const handleRoomLeave = () => {
    setCurrentRoom(null);
    setScreen('lobby');
  };

  const handleGameStart = (gs: GameState, pin: string) => {
    setGameState(gs);
    setRoomPin(pin);
    setScreen('game');
  };

  const handleGameLeave = () => {
    setGameState(null);
    setCurrentRoom(null);
    setRoomPin('');
    setScreen('lobby');
  };

  const handlePlayAI = (botCount: number) => {
    setAiBotCount(botCount);
    setScreen('ai-game');
  };

  const handleAIGameLeave = () => {
    setScreen('lobby');
  };

  return (
    <>
      <BackgroundMusic />
      {(() => {
        switch (screen) {
          case 'login':
          case 'register':
            return <LoginScreen onAuth={handleAuth} />;

          case 'lobby':
            if (!user) return <LoginScreen onAuth={handleAuth} />;
            return (
              <LobbyScreen
                user={user}
                onLogout={handleLogout}
                onRoomJoined={handleRoomJoined}
                onPlayAI={handlePlayAI}
              />
            );

          case 'room':
            if (!user || !currentRoom) return <LoginScreen onAuth={handleAuth} />;
            return (
              <RoomScreen
                user={user}
                room={currentRoom}
                onLeave={handleRoomLeave}
                onGameStart={handleGameStart}
              />
            );

          case 'game':
            if (!user || !gameState) return <LoginScreen onAuth={handleAuth} />;
            return (
              <GameBoard
                user={user}
                initialGameState={gameState}
                roomPin={roomPin}
                onLeave={handleGameLeave}
              />
            );

          case 'ai-game':
            if (!user) return <LoginScreen onAuth={handleAuth} />;
            return (
              <AIGameBoard
                user={user}
                botCount={aiBotCount}
                onLeave={handleAIGameLeave}
              />
            );

          default:
            return <LoginScreen onAuth={handleAuth} />;
        }
      })()}
    </>
  );
}
