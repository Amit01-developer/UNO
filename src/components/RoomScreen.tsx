import { useState, useEffect } from 'react';
import { cn } from '../utils/cn';
import { UserAccount, RoomData, GameState } from '../types';
import { leaveRoom, subscribeToRoom, startRoomGame } from '../utils/room';
import { initializeMultiplayerGame } from '../gameLogic';
import { useApp } from '../contexts/AppContext';
import { MusicControls } from './BackgroundMusic';

interface RoomScreenProps {
  user: UserAccount;
  room: RoomData;
  onLeave: () => void;
  onGameStart: (gameState: GameState, roomPin: string) => void;
}

export function RoomScreen({ user, room: initialRoom, onLeave, onGameStart }: RoomScreenProps) {
  const { t, language, theme, toggleLanguage, toggleTheme } = useApp();
  const [room, setRoom] = useState<RoomData>(initialRoom);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const isHost = room.hostEmail === user.email;

  // Real-time Firestore listener
  useEffect(() => {
    const unsub = subscribeToRoom(initialRoom.roomPin, (updated) => {
      if (!updated) {
        // Room deleted (host left)
        if (!isHost) onLeave();
        return;
      }
      setRoom(updated);

      // Game started — navigate all players
      if (updated.status === 'playing' && updated.gameState) {
        onGameStart(updated.gameState, updated.roomPin);
      }
    });

    return () => unsub();
  }, [initialRoom.roomPin, isHost, onLeave, onGameStart]);

  const handleLeave = async () => {
    setLoading(true);
    await leaveRoom(room.roomPin, user.email);
    onLeave();
  };

  const handleStartGame = async () => {
    if (!isHost || room.players.length < 2) return;
    setLoading(true);
    const gameState = initializeMultiplayerGame(room.players);
    await startRoomGame(room.roomPin, gameState);
    // onGameStart will be triggered via the real-time listener above
  };

  const handleCopyPin = () => {
    navigator.clipboard.writeText(room.roomPin).catch(() => {
      const el = document.createElement('textarea');
      el.value = room.roomPin;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn(
      "min-h-screen flex items-center justify-center p-4 py-8 overflow-y-auto",
      theme === 'light'
        ? "bg-gradient-to-br from-slate-100 via-gray-50 to-slate-200"
        : "bg-gradient-to-br from-[#1a4d7a] via-[#2563a8] to-[#0f3a5f]"
    )}>
      {/* Top Bar */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <MusicControls />
        <button onClick={toggleLanguage} className={cn(
          "topbar-btn px-3 py-1 rounded-lg text-xs transition-colors cursor-pointer border font-bold backdrop-blur-sm",
          theme === 'light'
            ? "bg-white/90 hover:bg-white text-gray-800 border-gray-300 shadow-sm"
            : "bg-white/10 hover:bg-white/20 text-white border-white/20"
        )}>
          {language === 'en' ? 'हिंदी' : 'English'}
        </button>
        <button onClick={toggleTheme} className={cn(
          "topbar-btn w-8 h-8 rounded-lg transition-colors cursor-pointer border flex items-center justify-center backdrop-blur-sm",
          theme === 'light'
            ? "bg-white/90 hover:bg-white border-gray-300 shadow-sm"
            : "bg-white/10 hover:bg-white/20 border-white/20"
        )}>
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>

      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-40 h-22 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl mx-auto flex items-center justify-center shadow-xl border-3 border-yellow-400">
            <span className="text-white font-black text-4xl" style={{ textShadow: '2px 2px 0 #000' }}>UNO</span>
          </div>
          <p className="theme-text-secondary mt-2 text-sm">{t('waitingRoom')} 🕐</p>
        </div>

        {/* Room PIN Card */}
        <div className="room-pin-card bg-gradient-to-r from-yellow-500/10 to-orange-500/10 backdrop-blur rounded-2xl p-5 mb-4 border border-yellow-500/30 shadow-xl">
          <div className="text-center">
            <p className="pin-label text-yellow-300 text-sm font-semibold mb-1">📌 {t('roomPin').toUpperCase()}</p>
            <div className="flex items-center justify-center gap-3">
              <span className="pin-text text-5xl font-black text-white tracking-[0.3em] font-mono">
                {room.roomPin}
              </span>
              <button
                onClick={handleCopyPin}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer',
                  copied ? 'bg-green-500 text-white' : 'bg-yellow-400 hover:bg-yellow-300 text-gray-900'
                )}
              >
                {copied ? `✅ ${t('copied')}` : `📋 ${t('copy')}`}
              </button>
            </div>
            <p className="theme-text-secondary text-xs mt-2">{t('sharePin')}</p>
          </div>
        </div>

        {/* Players List */}
        <div className={cn(
          "backdrop-blur-xl rounded-3xl p-6 border mb-4",
          theme === 'light'
            ? "bg-white border-gray-200 shadow-lg"
            : "theme-card-bg theme-shadow"
        )}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black theme-text-primary">
              👥 Players ({room.players.length}/{room.maxPlayers})
            </h2>
            <div className="flex items-center gap-1">
              {Array.from({ length: room.maxPlayers }).map((_, i) => (
                <div key={i} className={cn('w-3 h-3 rounded-full transition-all', i < room.players.length ? 'bg-green-400 shadow-lg shadow-green-400/50' : theme === 'light' ? 'bg-gray-300' : 'bg-gray-600')} />
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {room.players.map((p) => (
              <div
                key={p.email}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl border transition-all',
                  p.email === user.email
                    ? 'bg-yellow-500/10 border-yellow-500/30'
                    : theme === 'light'
                      ? 'bg-gray-50 border-gray-200'
                      : 'player-item-other bg-gray-700/50 border-gray-600/30'
                )}
              >
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-xl shadow">
                  {p.avatar}
                </div>
                <div className="flex-1">
                  <p className={cn("player-name font-bold text-sm", theme === 'light' ? 'text-gray-900' : 'text-white')}>
                    {p.name}
                    {p.email === user.email && <span className="text-yellow-500 text-xs ml-2">({t('you')})</span>}
                  </p>
                  <p className={cn("player-email text-xs", theme === 'light' ? 'text-gray-500' : 'text-gray-400')}>{p.email}</p>
                </div>
                {p.email === room.hostEmail && (
                  <span className="px-2 py-1 bg-yellow-400/20 text-yellow-300 rounded-lg text-xs font-bold">👑 {t('host')}</span>
                )}
                <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse shadow shadow-green-400/50" />
              </div>
            ))}

            {Array.from({ length: room.maxPlayers - room.players.length }).map((_, i) => (
              <div key={`empty-${i}`} className={cn(
                "flex items-center gap-3 p-3 rounded-xl border border-dashed",
                theme === 'light' ? "bg-gray-50 border-gray-300" : "theme-card-bg"
              )}>
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-lg", theme === 'light' ? 'bg-gray-200' : 'theme-input-bg')}>❓</div>
                <div className="flex-1">
                  <p className="theme-text-muted text-sm font-medium">{t('waitingForPlayer')}...</p>
                  <p className="theme-text-muted text-xs">{t('shareThisPin')}</p>
                </div>
                <div className={cn("w-3 h-3 rounded-full", theme === 'light' ? 'bg-gray-300' : 'theme-input-bg')} />
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {isHost && (
            <button
              onClick={handleStartGame}
              disabled={room.players.length < 2 || loading}
              className={cn(
                'w-full py-4 font-black text-lg rounded-xl transition-all duration-200 shadow-lg cursor-pointer active:scale-95',
                room.players.length >= 2 && !loading
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:scale-[1.02] hover:shadow-green-500/40'
                  : 'theme-card-bg theme-text-muted border cursor-not-allowed'
              )}
            >
              {loading ? '⏳ Starting...' : room.players.length >= 2
                ? `🎮 ${t('startGame')}! (${room.players.length} Players)`
                : `⏳ ${t('minPlayers')}`}
            </button>
          )}

          {!isHost && (
            <div className={cn(
              "w-full py-4 border theme-text-primary text-center font-bold rounded-xl",
              theme === 'light' ? "bg-white border-gray-200 text-gray-700" : "theme-card-bg"
            )}>
              ⏳ {t('hostWillStart')}
            </div>
          )}

          <button
            onClick={handleLeave}
            disabled={loading}
            className={cn(
              "leave-btn w-full py-3 font-bold rounded-xl text-sm transition-colors cursor-pointer border disabled:opacity-50",
              theme === 'light'
                ? "bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
                : "bg-red-900/30 hover:bg-red-800/40 text-red-300 border-red-800/30"
            )}
          >
            🚪 {isHost ? t('closeRoom') : t('leaveRoom')}
          </button>
        </div>

        <div className={cn(
          "mt-4 rounded-xl p-4 border",
          theme === 'light' ? "bg-white border-gray-200" : "theme-card-bg"
        )}>
          <p className="theme-text-muted text-xs text-center">
            💡 <strong className="theme-text-secondary">{t('tip')}:</strong> Share PIN with friends — works across any device!
          </p>
        </div>
      </div>
    </div>
  );
}
