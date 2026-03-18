import { useState } from 'react';
import { cn } from '../utils/cn';
import { UserAccount, RoomData } from '../types';
import { createRoom, joinRoom } from '../utils/room';
import { useApp } from '../contexts/AppContext';
import { MusicControls } from './BackgroundMusic';

interface LobbyScreenProps {
  user: UserAccount;
  onLogout: () => void;
  onRoomJoined: (room: RoomData) => void;
  onPlayAI: (botCount: number) => void;
}

export function LobbyScreen({ user, onLogout, onRoomJoined, onPlayAI }: LobbyScreenProps) {
  const { t, language, theme, toggleLanguage, toggleTheme } = useApp();
  const [mode, setMode] = useState<'select' | 'create' | 'join' | 'ai'>('select');
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [aiBotCount, setAiBotCount] = useState(2);
  const [joinPin, setJoinPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateRoom = async () => {
    setLoading(true);
    const room = await createRoom(user.email, user.name, user.avatar, maxPlayers);
    setLoading(false);
    onRoomJoined(room);
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (joinPin.length !== 6) { setError('pinError'); return; }
    setLoading(true);
    const result = await joinRoom(joinPin, { email: user.email, name: user.name, avatar: user.avatar, ready: true });
    setLoading(false);
    if (result.success && result.room) {
      onRoomJoined(result.room);
    } else {
      setError(result.error || 'joinError');
    }
  };

  const handleStartAI = () => {
    onPlayAI(aiBotCount);
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
        <button
          onClick={toggleLanguage}
          className={cn(
            "topbar-btn px-3 py-1 rounded-lg text-xs transition-colors cursor-pointer border font-bold backdrop-blur-sm",
            theme === 'light'
              ? "bg-white/90 hover:bg-white text-gray-800 border-gray-300 shadow-sm"
              : "bg-white/10 hover:bg-white/20 text-white border-white/20"
          )}
        >
          {language === 'en' ? 'हिंदी' : 'English'}
        </button>
        <button
          onClick={toggleTheme}
          className={cn(
            "topbar-btn w-8 h-8 rounded-lg transition-colors cursor-pointer border flex items-center justify-center backdrop-blur-sm",
            theme === 'light'
              ? "bg-white/90 hover:bg-white border-gray-300 shadow-sm"
              : "bg-white/10 hover:bg-white/20 border-white/20"
          )}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>

      <div className="max-w-lg w-full">
        {/* UNO Logo */}
        <div className="text-center mb-6">
          <div className="w-44 h-24 bg-gradient-to-br from-red-500 to-red-700 rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-red-500/30 border-4 border-yellow-400 transform -rotate-2">
            <span className="text-white font-black text-5xl tracking-tighter" style={{ textShadow: '3px 3px 0 #000' }}>UNO</span>
          </div>
          <p className={cn("mt-3 text-sm", theme === 'light' ? 'text-gray-600' : 'text-gray-300')}>{t('chooseMode')} 🎮</p>
        </div>

        {/* User Info Card */}
        <div className={cn(
          "backdrop-blur rounded-2xl p-3 sm:p-4 mb-4 border flex items-center justify-between gap-2",
          theme === 'light'
            ? "bg-white border-gray-200 shadow-md"
            : "theme-card-bg theme-shadow"
        )}>
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-xl sm:text-2xl shadow-lg shrink-0">
              {user.avatar}
            </div>
            <div className="min-w-0">
              <p className={cn("font-bold text-sm sm:text-base truncate", theme === 'light' ? 'text-gray-900' : 'text-white')}>{user.name}</p>
              <p className={cn("text-xs truncate max-w-[140px] sm:max-w-none", theme === 'light' ? 'text-gray-500' : 'text-gray-400')}>{user.email}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className={cn(
              "logout-btn px-3 py-2 rounded-xl text-xs sm:text-sm transition-colors cursor-pointer border shrink-0",
              theme === 'light'
                ? "bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
                : "bg-red-900/40 hover:bg-red-800/50 text-red-300 border-red-800/30"
            )}
          >
            🚪 {t('logout')}
          </button>
        </div>

        {/* Mode: Select */}
        {mode === 'select' && (
          <div className="space-y-4">
            <button
              onClick={() => setMode('ai')}
              className="lobby-btn-ai w-full bg-gradient-to-r from-purple-600 to-pink-700 hover:from-purple-500 hover:to-pink-600 text-white rounded-2xl p-6 shadow-xl border border-purple-500/30 transition-all hover:scale-[1.02] cursor-pointer text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-purple-400/20 rounded-2xl flex items-center justify-center text-4xl group-hover:animate-bounce">
                  🤖
                </div>
                <div>
                  <h3 className="text-xl font-black">{t('playWithAI')}</h3>
                  <p className="text-purple-200 text-sm">{t('playOffline')}</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setMode('create')}
              className="lobby-btn-create w-full bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-500 hover:to-emerald-600 text-white rounded-2xl p-6 shadow-xl border border-green-500/30 transition-all hover:scale-[1.02] cursor-pointer text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-green-400/20 rounded-2xl flex items-center justify-center text-4xl">
                  🏠
                </div>
                <div>
                  <h3 className="text-xl font-black">{t('createRoom')}</h3>
                  <p className="text-green-200 text-sm">{t('createNewRoom')}</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setMode('join')}
              className="lobby-btn-join w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white rounded-2xl p-6 shadow-xl border border-blue-500/30 transition-all hover:scale-[1.02] cursor-pointer text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-400/20 rounded-2xl flex items-center justify-center text-4xl">
                  🔗
                </div>
                <div>
                  <h3 className="text-xl font-black">{t('joinRoom')}</h3>
                  <p className="text-blue-200 text-sm">{t('joinWithPin')}</p>
                </div>
              </div>
            </button>

            <div className={cn(
              "rounded-2xl p-5 border mt-4",
              theme === 'light'
                ? "bg-white border-gray-200 shadow-md"
                : "theme-card-bg theme-shadow"
            )}>
              <h3 className="theme-text-primary font-bold mb-3">🎮 {t('howToPlay')}</h3>
              <ol className="theme-text-secondary text-sm space-y-2">
                <li className="flex gap-2"><span className="text-purple-400 font-bold">🤖</span> {t('aiModeInstant')}</li>
                <li className="flex gap-2"><span className="text-green-400 font-bold">🏠</span> {t('createOrJoin')}</li>
                <li className="flex gap-2"><span className="text-blue-400 font-bold">🔗</span> {t('sharePinFriends')}</li>
                <li className="flex gap-2"><span className="text-yellow-400 font-bold">🎴</span> {t('playUnoFun')}</li>
              </ol>
            </div>
          </div>
        )}

        {/* Mode: AI */}
        {mode === 'ai' && (
          <div className={cn(
            "backdrop-blur-xl rounded-3xl p-7 border",
            theme === 'light'
              ? "bg-white border-gray-200 shadow-lg"
              : "theme-card-bg theme-shadow"
          )}>
            <button onClick={() => setMode('select')} className="go-back-btn theme-text-secondary text-sm mb-4 cursor-pointer flex items-center gap-1">
              ← {t('goBack')}
            </button>
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">🤖</div>
              <h2 className="text-2xl font-black theme-text-primary mb-1">{t('playWithAI')}</h2>
              <p className="theme-text-secondary text-sm">{t('howManyBots')}</p>
            </div>
            <div className="mb-6">
              <label className="block theme-text-primary mb-3 font-semibold text-sm text-center">
                🤖 {t('botPlayers')}
              </label>
              <div className="flex gap-3 sm:gap-4 justify-center">
                {[1, 2, 3].map(n => (
                  <button
                    key={n}
                    onClick={() => setAiBotCount(n)}
                    className={cn(
                      'relative w-20 h-24 sm:w-24 sm:h-28 rounded-2xl font-bold transition-all duration-300 cursor-pointer flex flex-col items-center justify-center gap-1 border-2',
                      aiBotCount === n
                        ? 'bg-gradient-to-br from-purple-500 to-pink-600 border-purple-400 scale-105 shadow-xl shadow-purple-500/30'
                        : theme === 'light'
                          ? 'bg-gray-100 border-gray-300 hover:bg-gray-200 text-gray-800'
                          : 'bot-card-inactive bg-gray-700/80 border-gray-600 hover:bg-gray-600 hover:border-gray-500'
                    )}
                  >
                    <div className="text-3xl">
                      {n === 1 ? '🤖' : n === 2 ? '🤖🤖' : '🤖🤖🤖'}
                    </div>
                    <div className={cn("bot-count-text text-lg font-black", aiBotCount === n || theme === 'dark' ? 'text-white' : 'text-gray-800')}>{n}</div>
                    <div className={cn("bot-label-text text-[10px] font-medium", aiBotCount === n ? 'text-gray-200' : theme === 'light' ? 'text-gray-500' : 'text-gray-300')}>
                      {t(n === 1 ? 'bot' : 'bots')}
                    </div>
                    {aiBotCount === n && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center text-xs font-black text-gray-900 shadow-lg">
                        ✓
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div className={cn(
              "rounded-2xl p-4 mb-6 border",
              theme === 'light' ? "bg-gray-50 border-gray-200" : "theme-input-bg"
            )}>
              <p className="theme-text-secondary text-xs mb-3 font-semibold">👥 {t('playersPreview')}:</p>
              <div className="space-y-2">
                <div className="flex items-center gap-3 px-3 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                  <span className="text-xl">{user.avatar}</span>
                  <span className="theme-text-primary font-bold text-sm flex-1">{user.name}</span>
                  <span className="text-yellow-400 text-xs font-bold">{t('you')} 👤</span>
                </div>
                {[
                  { name: 'SkipMachine ⚡', avatar: '⚡' },
                  { name: 'CardKing 👑', avatar: '👑' },
                  { name: 'WildMaster 🎯', avatar: '🎯' },
                ].slice(0, aiBotCount).map((bot, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                    <span className="text-xl">{bot.avatar}</span>
                    <span className="theme-text-primary font-bold text-sm flex-1">{bot.name}</span>
                    <span className="text-purple-400 text-xs font-bold">{t('aiBot')}</span>
                  </div>
                ))}
              </div>
              <p className="theme-text-muted text-xs mt-3 text-center">
                {t('totalGame').replace('{0}', String(1 + aiBotCount))}
              </p>
            </div>
            <div className={cn(
              "rounded-xl p-3 mb-6 border",
              theme === 'light' ? "bg-gray-50 border-gray-200" : "theme-input-bg"
            )}>
              <p className="theme-text-secondary text-xs text-center">
                💡 <strong className="theme-text-primary">{t('aiStrategy')}</strong>
              </p>
            </div>
            <button
              onClick={handleStartAI}
              className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-black text-lg rounded-xl hover:scale-[1.02] transition-all duration-200 shadow-lg shadow-purple-500/30 cursor-pointer active:scale-95"
            >
              🎮 {t('startGame')}!
            </button>
            <p className="theme-text-muted text-xs text-center mt-3">
              ⚡ {t('instantStart')}
            </p>
          </div>
        )}

        {/* Mode: Create */}
        {mode === 'create' && (
          <div className={cn(
            "backdrop-blur-xl rounded-3xl p-7 border",
            theme === 'light'
              ? "bg-white border-gray-200 shadow-lg"
              : "theme-card-bg theme-shadow"
          )}>
            <button onClick={() => setMode('select')} className="go-back-btn theme-text-secondary text-sm mb-4 cursor-pointer">
              ← {t('goBack')}
            </button>
            <h2 className="text-2xl font-black theme-text-primary mb-1 text-center">🏠 {t('newRoom')}</h2>
            <p className="theme-text-secondary text-sm mb-6 text-center">{t('howManyPlayers')}</p>
            <div className="mb-8">
              <label className="block theme-text-primary mb-3 font-semibold text-sm">
                👥 {t('totalPlayers')}
              </label>
              <div className="flex gap-3 justify-center">
                {[2, 3, 4, 5, 6].map(n => (
                  <button
                    key={n}
                    onClick={() => setMaxPlayers(n)}
                    className={cn(
                      'w-14 h-14 rounded-xl font-bold text-xl transition-all duration-200 cursor-pointer',
                      maxPlayers === n
                        ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-gray-900 scale-110 shadow-lg shadow-yellow-500/30'
                        : theme === 'light'
                          ? 'num-btn-inactive bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                          : 'num-btn-inactive bg-gray-700 text-gray-300 hover:bg-gray-600'
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <p className="theme-text-muted text-sm text-center mt-2">
                {maxPlayers} {t('roomWillHave')}
              </p>
            </div>
            <button
              onClick={handleCreateRoom}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black text-lg rounded-xl hover:scale-[1.02] transition-all duration-200 shadow-lg shadow-green-500/30 cursor-pointer active:scale-95 disabled:opacity-60"
            >
              {loading ? `⏳ ${t('creating')}` : `🏠 ${t('createRoom')}!`}
            </button>
          </div>
        )}

        {/* Mode: Join */}
        {mode === 'join' && (
          <form onSubmit={handleJoinRoom} className={cn(
            "backdrop-blur-xl rounded-3xl p-7 border",
            theme === 'light'
              ? "bg-white border-gray-200 shadow-lg"
              : "theme-card-bg theme-shadow"
          )}>
            <button type="button" onClick={() => { setMode('select'); setError(''); }} className="go-back-btn theme-text-secondary text-sm mb-4 cursor-pointer">
              ← {t('goBack')}
            </button>
            <h2 className="text-2xl font-black theme-text-primary mb-1 text-center">🔗 {t('joinRoom')}</h2>
            <p className="theme-text-secondary text-sm mb-6 text-center">{t('enterRoomPin')}</p>
            <div className="mb-6">
              <label className="block theme-text-primary mb-2 font-semibold text-sm">
                🔢 {t('pinDigits')}
              </label>
              <input
                type="text"
                value={joinPin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setJoinPin(val);
                  setError('');
                }}
                placeholder="______"
                maxLength={6}
                className={cn(
                  "w-full px-6 py-5 border-2 rounded-xl theme-text-primary text-3xl text-center tracking-[0.5em] font-mono focus:outline-none focus:border-yellow-400 transition-colors",
                  theme === 'light'
                    ? "bg-gray-50 border-gray-300 placeholder-gray-300"
                    : "theme-input-bg placeholder-gray-600"
                )}
              />
              <p className="theme-text-muted text-xs text-center mt-2">
                {t('askHostForPin')}
              </p>
            </div>
            {error && (
              <div className="mb-4 p-3 bg-red-900/30 border border-red-500/30 rounded-xl text-red-400 text-sm font-medium text-center">
                ⚠️ {t(error) !== error ? t(error) : error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className={cn(
                'w-full py-4 font-black text-lg rounded-xl transition-all duration-200 shadow-lg cursor-pointer active:scale-95 disabled:opacity-60',
                joinPin.length === 6
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:scale-[1.02] hover:shadow-blue-500/40'
                  : 'theme-card-bg theme-text-muted border'
              )}
            >
              {loading ? `⏳ ${t('joining')}` : joinPin.length === 6 ? `🚀 ${t('joinRoom')}!` : `🔢 ${t('enterPin')}`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
