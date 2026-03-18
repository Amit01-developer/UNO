import { Card } from '../types';
import { cn } from '../utils/cn';

interface UnoCardProps {
  card: Card;
  onClick?: () => void;
  playable?: boolean;
  faceDown?: boolean;
  small?: boolean;
  highlight?: boolean;
}

const colorMap: Record<string, string> = {
  red: 'bg-red-600',
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-400',
  wild: 'bg-gradient-to-br from-red-500 via-yellow-400 via-green-500 to-blue-500',
};

const colorBg: Record<string, string> = {
  red: 'bg-red-100 text-red-800',
  blue: 'bg-blue-100 text-blue-800',
  green: 'bg-green-100 text-green-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  wild: 'bg-purple-100 text-purple-800',
};

const valueDisplay: Record<string, string> = {
  skip: '⊘',
  reverse: '⟲',
  draw2: '+2',
  wild: 'W',
  wild4: '+4',
};

export function UnoCard({ card, onClick, playable = false, faceDown = false, small = false, highlight = false }: UnoCardProps) {
  const displayColor = card.chosenColor || card.color;

  if (faceDown) {
    return (
      <div className={cn(
        'rounded-xl border-4 border-white bg-black flex items-center justify-center shadow-2xl relative',
        small ? 'w-8 h-11 sm:w-10 sm:h-14' : 'w-14 h-20 sm:w-20 sm:h-28',
      )}>
        <div className="absolute inset-1 rounded-lg overflow-hidden">
          <div className="w-full h-full bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900"
               style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.3) 10px, rgba(0,0,0,0.3) 20px)'}} />
        </div>
        <div className={cn(
          'relative rotate-45 bg-gradient-to-br from-red-500 via-yellow-400 via-green-500 to-blue-500 flex items-center justify-center font-black text-black',
          small ? 'w-5 h-5 text-[6px]' : 'w-8 h-8 sm:w-12 sm:h-12 text-[8px] sm:text-sm',
        )}>
          <span className="rotate-[-45deg]">UNO</span>
        </div>
      </div>
    );
  }

  const displayValue = valueDisplay[card.value] || card.value;

  return (
    <button
      onClick={onClick}
      disabled={!playable}
      className={cn(
        'rounded-xl border-4 border-white flex flex-col items-center justify-center shadow-2xl transition-all duration-200 relative overflow-hidden select-none',
        colorMap[displayColor],
        small ? 'w-10 h-14 sm:w-14 sm:h-20' : 'w-14 h-20 sm:w-20 sm:h-28',
        playable && 'hover:scale-110 hover:-translate-y-4 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] cursor-pointer ring-4 ring-yellow-400',
        !playable && !highlight && 'opacity-80',
        highlight && 'ring-4 ring-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.6)]',
      )}
    >
      {/* Diamond shape in center */}
      <div className={cn(
        'absolute rotate-45 bg-white flex items-center justify-center',
        small ? 'w-6 h-6 sm:w-8 sm:h-8' : 'w-7 h-7 sm:w-9 sm:h-9',
      )}>
        <span className={cn(
          'rotate-[-45deg] font-black drop-shadow-lg',
          small ? 'text-base sm:text-xl' : 'text-lg sm:text-2xl',
          displayColor === 'yellow' ? 'text-yellow-600' :
          displayColor === 'red' ? 'text-red-600' :
          displayColor === 'blue' ? 'text-blue-600' :
          displayColor === 'green' ? 'text-green-600' :
          'text-gray-800',
        )}>
          {displayValue}
        </span>
      </div>

      {/* Top-left corner value */}
      <span className={cn(
        'absolute font-black text-white drop-shadow-md',
        small ? 'top-0.5 left-1 text-[10px]' : 'top-1 left-2 text-sm sm:top-2 sm:left-3 sm:text-lg',
      )}>
        {displayValue}
      </span>

      {/* Bottom-right corner value (rotated) */}
      <span className={cn(
        'absolute font-black text-white drop-shadow-md rotate-180',
        small ? 'bottom-0.5 right-1 text-[10px]' : 'bottom-1 right-2 text-sm sm:bottom-2 sm:right-3 sm:text-lg',
      )}>
        {displayValue}
      </span>

      {/* Chosen color indicator for wild */}
      {card.chosenColor && (
        <div className={cn(
          'absolute bottom-0.5 left-1/2 -translate-x-1/2 rounded-full text-[7px] sm:text-[9px] px-1 sm:px-2 py-0.5 font-bold',
          colorBg[card.chosenColor],
        )}>
          {card.chosenColor.toUpperCase()}
        </div>
      )}
    </button>
  );
}
