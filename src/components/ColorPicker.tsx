import { CardColor } from '../types';
import { cn } from '../utils/cn';
import { useApp } from '../contexts/AppContext';

interface ColorPickerProps {
  onSelect: (color: CardColor) => void;
}

const colors: { color: CardColor; emoji: string }[] = [
  { color: 'red', emoji: '🔴' },
  { color: 'blue', emoji: '🔵' },
  { color: 'green', emoji: '🟢' },
  { color: 'yellow', emoji: '🟡' },
];

const colorBg: Record<CardColor, string> = {
  red: 'bg-red-500 hover:bg-red-600 ring-red-300',
  blue: 'bg-blue-500 hover:bg-blue-600 ring-blue-300',
  green: 'bg-green-500 hover:bg-green-600 ring-green-300',
  yellow: 'bg-yellow-400 hover:bg-yellow-500 ring-yellow-300',
};

export function ColorPicker({ onSelect }: ColorPickerProps) {
  const { t } = useApp();
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="theme-card-bg rounded-2xl p-8 theme-shadow border max-w-sm w-full mx-4">
        <h3 className="text-2xl font-bold theme-text-primary text-center mb-2">🌈 {t('selectColor')}</h3>
        <p className="theme-text-secondary text-center mb-6">{t('whichColor')}</p>
        <div className="grid grid-cols-2 gap-4">
          {colors.map(({ color, emoji }) => (
            <button
              key={color}
              onClick={() => onSelect(color)}
              className={cn(
                'py-4 px-6 rounded-xl text-white font-bold text-lg transition-all duration-200',
                'hover:scale-105 hover:ring-4 active:scale-95 cursor-pointer',
                colorBg[color],
              )}
            >
              <span className="text-2xl block mb-1">{emoji}</span>
              {t(color)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
