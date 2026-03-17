import { Card } from '../types';
import { UnoCard } from './UnoCard';
import { cn } from '../utils/cn';

interface PlayerHandProps {
  cards: Card[];
  playableCardIds: string[];
  onCardClick: (card: Card) => void;
  isCurrentPlayer: boolean;
}

export function PlayerHand({ cards, playableCardIds, onCardClick, isCurrentPlayer }: PlayerHandProps) {
  // Sort cards by color then value
  const sortedCards = [...cards].sort((a, b) => {
    const colorOrder = ['red', 'yellow', 'green', 'blue', 'wild'];
    const colorDiff = colorOrder.indexOf(a.color) - colorOrder.indexOf(b.color);
    if (colorDiff !== 0) return colorDiff;
    return a.value.localeCompare(b.value);
  });

  return (
    <div className={cn(
      'flex justify-center items-end px-4 pb-2 pt-6 rounded-2xl transition-all max-w-full overflow-x-auto overflow-y-visible',
      isCurrentPlayer && 'bg-white/5 ring-2 ring-yellow-400/30 shadow-lg shadow-yellow-400/10',
    )}>
      {sortedCards.map((card, index) => (
        <div 
          key={card.id} 
          className="transition-all duration-200 hover:-translate-y-4 hover:z-50"
          style={{ 
            marginLeft: index === 0 ? '0' : cards.length > 10 ? '-2rem' : '-1.2rem',
            zIndex: index,
          }}
        >
          <UnoCard
            card={card}
            playable={isCurrentPlayer && playableCardIds.includes(card.id)}
            onClick={() => onCardClick(card)}
          />
        </div>
      ))}
    </div>
  );
}
