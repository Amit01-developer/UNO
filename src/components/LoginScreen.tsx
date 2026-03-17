import { useState } from 'react';
import { cn } from '../utils/cn';
import { loginUser, registerUser, signInWithGoogle } from '../utils/auth';
import { UserAccount } from '../types';
import { useApp } from '../contexts/AppContext';

interface LoginScreenProps {
  onAuth: (user: UserAccount) => void;
}

const avatars = [
  '😎', '🦁', '🐯', '🦊', '🐼', '🦅',
  '🐲', '🦄', '👑', '🧙', '🥷', '🏄',
];

export function LoginScreen({ onAuth }: LoginScreenProps) {
  const { t, language, theme, toggleLanguage, toggleTheme } = useApp();
  const [isRegister, setIsRegister] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('😎');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    const result = await signInWithGoogle();
    setLoading(false);
    if (result.success && result.user) {
      onAuth(result.user);
    } else {
      setError(result.error || 'Google sign-in failed!');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await loginUser(email, password);
    setLoading(false);
    if (result.success && result.user) {
      onAuth(result.user);
    } else {
      setError(result.error || 'Login failed!');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await registerUser(email, password, name, avatar);
    setLoading(false);
    if (result.success) {
      onAuth({ email: email.toLowerCase().trim(), password, name: name.trim(), avatar });
    } else {
      setError(result.error || 'Registration failed!');
    }
  };

  return (
    <div className="min-h-screen theme-bg-gradient flex items-center justify-center p-4 py-8 relative overflow-x-hidden">
      {/* Top Bar with Toggles */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        {/* Language Toggle */}
        <button
          onClick={toggleLanguage}
          className="topbar-btn px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs transition-colors cursor-pointer border border-white/20 font-bold backdrop-blur-sm"
        >
          {language === 'en' ? 'हिंदी' : 'English'}
        </button>
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="topbar-btn w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 transition-colors cursor-pointer border border-white/20 flex items-center justify-center backdrop-blur-sm"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>

      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {['🔴', '🔵', '🟢', '🟡', '🃏', '🎴', '⊘', '⟲'].map((emoji, i) => (
          <div
            key={i}
            className="absolute opacity-8 text-7xl"
            style={{
              top: `${10 + (i * 11) % 80}%`,
              left: `${5 + (i * 13) % 90}%`,
              transform: `rotate(${-30 + i * 20}deg)`,
              animation: `float ${3 + i * 0.5}s ease-in-out infinite alternate`,
            }}
          >
            {emoji}
          </div>
        ))}
      </div>

      <div className="max-w-md w-full relative z-10">
        {/* UNO Logo */}
        <div className="text-center mb-6">
          <div className="inline-block relative">
            <div className="w-52 h-28 bg-gradient-to-br from-red-500 to-red-700 rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-red-500/40 border-4 border-yellow-400 transform -rotate-2 hover:rotate-0 transition-transform duration-500">
              <span className="text-white font-black text-6xl tracking-tighter" style={{ textShadow: '4px 4px 0 rgba(0,0,0,0.5)' }}>
                UNO
              </span>
            </div>
            <div className="absolute -top-3 -right-3 bg-yellow-400 text-gray-900 rounded-full w-10 h-10 flex items-center justify-center font-black text-sm shadow-lg animate-bounce">
              🌐
            </div>
          </div>
          <p className="login-subtitle text-gray-400 mt-3 text-base font-medium">
            Online Multiplayer Card Game 🎴
          </p>
        </div>

        {/* Tab Switch */}
        <div className="flex mb-4 theme-card-bg rounded-xl p-1 border theme-shadow">
          <button
            onClick={() => { setIsRegister(false); setError(''); }}
            className={cn(
              'flex-1 py-3 rounded-lg font-bold text-sm transition-all cursor-pointer',
              !isRegister ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 shadow-lg' : 'theme-text-secondary hover:text-white'
            )}
          >
            🔑 {t('login')}
          </button>
          <button
            onClick={() => { setIsRegister(true); setError(''); }}
            className={cn(
              'flex-1 py-3 rounded-lg font-bold text-sm transition-all cursor-pointer',
              isRegister ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-gray-900 shadow-lg' : 'theme-text-secondary hover:text-white'
            )}
          >
            📝 {t('register')}
          </button>
        </div>

        {/* Form Card */}
        <form onSubmit={isRegister ? handleRegister : handleLogin}>
          <div className="theme-card-bg backdrop-blur-xl rounded-3xl p-7 theme-shadow border relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 pointer-events-none" />

            <div className="relative z-10">
              <h2 className="text-2xl font-black theme-text-primary mb-1 text-center">
                {isRegister ? `📝 ${t('createAccount')}` : `🔑 ${t('loginNow')}`}
              </h2>
              <p className="theme-text-secondary text-sm mb-5 text-center">
                {isRegister ? 'Register to play multiplayer!' : 'Login to your account'}
              </p>

              {/* Name (Register only) */}
              {isRegister && (
                <div className="mb-4">
                  <label className="block theme-text-primary mb-1.5 font-semibold text-sm">
                    👤 {t('playerName')}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setError(''); }}
                    placeholder={t('enterName')}
                    maxLength={15}
                    className="w-full px-4 py-3 theme-input-bg border-2 rounded-xl placeholder-gray-500 focus:outline-none focus:border-yellow-400 transition-colors"
                  />
                </div>
              )}

              {/* Email */}
              <div className="mb-4">
                <label className="block theme-text-primary mb-1.5 font-semibold text-sm">
                  📧 {t('email')}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder={t('enterEmail')}
                  className="w-full px-4 py-3 theme-input-bg border-2 rounded-xl placeholder-gray-500 focus:outline-none focus:border-yellow-400 transition-colors"
                />
              </div>

              {/* Password */}
              <div className="mb-4">
                <label className="block theme-text-primary mb-1.5 font-semibold text-sm">
                  🔒 {t('password')}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    placeholder={t('enterPassword')}
                    className="w-full px-4 py-3 theme-input-bg border-2 rounded-xl placeholder-gray-500 focus:outline-none focus:border-yellow-400 transition-colors pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 theme-text-secondary hover:text-white cursor-pointer text-lg"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* Avatar (Register only) */}
              {isRegister && (
                <div className="mb-5">
                  <label className="block theme-text-primary mb-2 font-semibold text-sm">
                    🎭 {t('selectAvatar')}
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {avatars.map((av) => (
                      <button
                        key={av}
                        type="button"
                        onClick={() => setAvatar(av)}
                        className={cn(
                          'w-full aspect-square rounded-xl text-2xl flex items-center justify-center transition-all duration-200 cursor-pointer',
                          avatar === av
                            ? 'bg-gradient-to-br from-yellow-400 to-orange-500 scale-110 shadow-lg ring-2 ring-yellow-300'
                            : 'theme-card-bg hover:opacity-80 hover:scale-105 border'
                        )}
                      >
                        {av}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="mb-4 p-3 bg-red-900/30 border border-red-500/30 rounded-xl text-red-400 text-sm font-medium text-center animate-pulse">
                  ⚠️ {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={cn(
                  'w-full py-4 font-black text-lg rounded-xl transition-all duration-300 shadow-lg cursor-pointer active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed',
                  isRegister
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:scale-[1.02] hover:shadow-green-500/40'
                    : 'bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 hover:scale-[1.02] hover:shadow-yellow-500/40'
                )}
              >
                {loading ? '⏳ Please wait...' : isRegister ? `🚀 ${t('createAccount')}` : `🔓 ${t('loginNow')}`}
              </button>

              {/* Switch Link */}
              <p className="text-center theme-text-muted text-sm mt-4">
                {isRegister ? t('alreadyAccount') : t('noAccount')}{' '}
                <button
                  type="button"
                  onClick={() => { setIsRegister(!isRegister); setError(''); }}
                  className="text-yellow-400 hover:text-yellow-300 font-bold cursor-pointer underline"
                >
                  {isRegister ? t('loginNow') : t('registerNow')}
                </button>
              </p>

              {/* Divider */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-white/10" />
                <span className="theme-text-muted text-xs">OR</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Google Sign In */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-3 flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-800 font-bold rounded-xl transition-all duration-200 shadow-md hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                <svg width="20" height="20" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                {loading ? '⏳ Please wait...' : 'Continue with Google'}
              </button>
            </div>
          </div>
        </form>

        <p className="text-center theme-text-muted text-xs mt-5">
          🌐 Multiplayer UNO - Play with friends anywhere! ❤️
        </p>
      </div>

      <style>{`
        @keyframes float {
          0% { transform: translateY(0px) rotate(var(--rotation, 0deg)); }
          100% { transform: translateY(-20px) rotate(var(--rotation, 0deg)); }
        }
      `}</style>
    </div>
  );
}
