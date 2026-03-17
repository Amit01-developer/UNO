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
        'rounded-2xl border-4 border-white bg-black flex items-center justify-center shadow-2xl relative',
        small ? 'w-10 h-14' : 'w-20 h-28',
      )}>
        {/* Diagonal stripes pattern */}
        <div className="absolute inset-1 rounded-xl overflow-hidden">
          <div className="w-full h-full bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900" 
               style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.3) 10px, rgba(0,0,0,0.3) 20px)'}} />
        </div>
        <div className={cn(
          'relative rotate-45 bg-gradient-to-br from-red-500 via-yellow-400 via-green-500 to-blue-500 flex items-center justify-center font-black text-black',
          small ? 'w-6 h-6 text-[8px]' : 'w-12 h-12 text-sm',
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
        'rounded-2xl border-4 border-white flex flex-col items-center justify-center shadow-2xl transition-all duration-200 relative overflow-hidden select-none',
        colorMap[displayColor],
        small ? 'w-14 h-20' : 'w-20 h-28',
        playable && 'hover:scale-110 hover:-translate-y-4 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] cursor-pointer ring-4 ring-yellow-400',
        !playable && !highlight && 'opacity-80',
        highlight && 'ring-4 ring-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.6)]',
      )}
    >
      {/* Diamond shape in center */}
      <div className={cn(
        'absolute rotate-45 bg-white flex items-center justify-center',
        small ? 'w-8 h-8' : 'w-9 h-9',
      )}>
        <span className={cn(
          'rotate-[-45deg] font-black drop-shadow-lg',
          small ? 'text-xl' : 'text-2xl',
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
        small ? 'top-1 left-1.5 text-xs' : 'top-2 left-3 text-lg',
      )}>
        {displayValue}
      </span>
      
      {/* Bottom-right corner value (rotated) */}
      <span className={cn(
        'absolute font-black text-white drop-shadow-md rotate-180',
        small ? 'bottom-1 right-1.5 text-xs' : 'bottom-2 right-3 text-lg',
      )}>
        {displayValue}
      </span>
      
      {/* Chosen color indicator for wild */}
      {card.chosenColor && (
        <div className={cn(
          'absolute bottom-1 left-1/2 -translate-x-1/2 rounded-full text-[9px] px-2 py-0.5 font-bold',
          colorBg[card.chosenColor],
        )}>
          {card.chosenColor.toUpperCase()}
        </div>
      )}
    </button>
  );
}
