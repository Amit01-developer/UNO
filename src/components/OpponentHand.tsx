import { Player } from '../types';
import { cn } from '../utils/cn';
import { useApp } from '../contexts/AppContext';

interface OpponentHandProps {
  player: Player;
  isCurrentPlayer: boolean;
  position: 'left' | 'top' | 'right';
}

export function OpponentHand({ player, isCurrentPlayer, position }: OpponentHandProps) {
  const { t } = useApp();
  const cardCount = player.hand.length;

  return (
    <div className={cn(
      'flex flex-col items-center gap-1 z-10',
      position === 'left' && 'absolute left-4 top-1/2 -translate-y-1/2',
      position === 'right' && 'absolute right-4 top-1/2 -translate-y-1/2',
      position === 'top' && 'absolute top-4 left-1/2 -translate-x-1/2',
    )}>
      {/* Player Name Badge */}
      <div className={cn(
        'px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-lg backdrop-blur-sm',
        isCurrentPlayer
          ? 'bg-yellow-400 text-gray-900 animate-pulse shadow-yellow-400/50'
          : 'bg-gray-800/80 text-gray-200 border border-white/10',
      )}>
        {player.name}
        {player.isUno && <span className="ml-1">🔥</span>}
      </div>

      {/* Cards Display */}
      <div className={cn(
        'flex items-center',
        position === 'left' || position === 'right' ? 'flex-col gap-0' : 'flex-row gap-0',
      )}>
        {Array.from({ length: Math.min(cardCount, 10) }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'w-8 h-11 rounded-lg border-2 border-white bg-black flex items-center justify-center shadow-lg',
              position === 'left' || position === 'right' ? '-mt-7 first:mt-0' : '-ml-5 first:ml-0',
            )}
          >
            <div className="w-4 h-4 rotate-45 bg-gradient-to-br from-red-500 via-yellow-400 via-green-500 to-blue-500" />
          </div>
        ))}
      </div>

      {/* Card Count Badge */}
      <div className={cn(
        'text-[10px] font-bold px-2 py-0.5 rounded-md shadow-md backdrop-blur-sm',
        cardCount <= 2 ? 'bg-red-500 text-white' : 'bg-gray-800/80 text-gray-200 border border-white/10',
      )}>
        {cardCount} {cardCount === 1 ? t('card') : t('cards')}
      </div>
    </div>
  );
}
