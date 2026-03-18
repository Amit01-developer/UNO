import { useState, useEffect } from 'react';

// ── Global singleton state ────────────────────────────────────────────────────
let audio: HTMLAudioElement | null = null;
let globalPlaying = false;
let globalVolume = 0.2;
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
  const { isPlaying, togglePlay } = useBackgroundMusic();

  return (
    <button
      onClick={togglePlay}
      className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 hover:scale-110 active:scale-95 flex items-center justify-center transition-all cursor-pointer shadow-md shrink-0"
      title={isPlaying ? 'Mute Music' : 'Unmute Music'}
    >
      {isPlaying ? (
        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
        </svg>
      ) : (
        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
        </svg>
      )}
    </button>
  );
}

// App.tsx ke liye — sirf audio init karta hai, kuch render nahi karta
export function BackgroundMusic() {
  useEffect(() => { initAudio(); }, []);
  return null;
}
