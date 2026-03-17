import { useState, useEffect } from 'react';

// ── Global singleton state ────────────────────────────────────────────────────
let audio: HTMLAudioElement | null = null;
let globalPlaying = false;
let globalVolume = 0.3;
const listeners = new Set<() => void>();

function notify() { listeners.forEach(fn => fn()); }

function initAudio() {
  if (audio) return;
  audio = new Audio('/background-music.mp3');
  audio.loop = true;
  audio.volume = globalVolume;
  audio.play()
    .then(() => { globalPlaying = true; notify(); })
    .catch(() => {
      const resume = () => {
        audio?.play().then(() => { globalPlaying = true; notify(); }).catch(() => {});
        document.removeEventListener('click', resume);
      };
      document.addEventListener('click', resume);
    });
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useBackgroundMusic() {
  const [, rerender] = useState(0);

  useEffect(() => {
    initAudio();
    const update = () => rerender(n => n + 1);
    listeners.add(update);
    return () => { listeners.delete(update); };
  }, []);

  const togglePlay = () => {
    if (!audio) return;
    if (globalPlaying) {
      audio.pause();
      globalPlaying = false;
    } else {
      audio.play().then(() => { globalPlaying = true; notify(); }).catch(() => {});
      return;
    }
    notify();
  };

  const changeVolume = (v: number) => {
    globalVolume = v;
    if (audio) audio.volume = v;
    notify();
  };

  return { isPlaying: globalPlaying, volume: globalVolume, togglePlay, changeVolume };
}

// ── Compact inline controls ───────────────────────────────────────────────────
export function MusicControls() {
  const { isPlaying, volume, togglePlay, changeVolume } = useBackgroundMusic();

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={togglePlay}
        className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 hover:scale-110 active:scale-95 flex items-center justify-center transition-all cursor-pointer shadow-md shrink-0"
        title={isPlaying ? 'Pause Music' : 'Play Music'}
      >
        {isPlaying ? (
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      <svg className="w-3.5 h-3.5 music-vol-text text-white/60 shrink-0" fill="currentColor" viewBox="0 0 24 24">
        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
      </svg>

      <input
        type="range" min="0" max="1" step="0.05"
        value={volume}
        onChange={e => changeVolume(parseFloat(e.target.value))}
        className="w-16 h-1 rounded-lg appearance-none cursor-pointer accent-purple-400"
        style={{
          background: `linear-gradient(to right, rgb(192,132,252) 0%, rgb(192,132,252) ${volume * 100}%, rgba(255,255,255,0.2) ${volume * 100}%, rgba(255,255,255,0.2) 100%)`
        }}
      />

      <span className="text-xs music-vol-text text-white/60 font-mono w-7 shrink-0">
        {Math.round(volume * 100)}%
      </span>

      <span className="text-sm">{isPlaying ? '🎵' : '🎶'}</span>
    </div>
  );
}

// App.tsx ke liye — sirf audio init karta hai, kuch render nahi karta
export function BackgroundMusic() {
  useEffect(() => { initAudio(); }, []);
  return null;
}
