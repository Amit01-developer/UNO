import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Card, CardColor, UserAccount } from '../types';
import {
  playCard,
  drawCardAction,
  getPlayableCards,
  canPlayCard,
  isBot,
  getBotMove,
  initializeAIGame,
} from '../gameLogic';
import { UnoCard } from './UnoCard';
import { ColorPicker } from './ColorPicker';
import { cn } from '../utils/cn';
import { useApp } from '../contexts/AppContext';
import { MusicControls } from './BackgroundMusic';

interface AIGameBoardProps {
  user: UserAccount;
  botCount: number;
  onLeave: () => void;
}

export function AIGameBoard({ user, botCount, onLeave }: AIGameBoardProps) {
  const { t, language, theme, toggleLanguage, toggleTheme } = useApp();
  const [gameState, setGameState] = useState<GameState>(() =>
    initializeAIGame(user.name, user.email, user.avatar, botCount)
  );
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pendingWildCard, setPendingWildCard] = useState<Card | null>(null);
  const [showGameOver, setShowGameOver] = useState(false);
  const botTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isLight = theme === 'light';

  const processBotTurn = useCallback((state: GameState) => {
    if (state.phase !== 'playing') return;
    const currentPlayer = state.players[state.currentPlayerIndex];
    if (!isBot(currentPlayer)) return;
    const delay = 800 + Math.random() * 1200;
    botTimeoutRef.current = setTimeout(() => {
      const newState = getBotMove(state);
      setGameState(newState);
      if (newState.phase === 'game-over') {
        setTimeout(() => setShowGameOver(true), 500);
        return;
      }
      const nextPlayer = newState.players[newState.currentPlayerIndex];
      if (isBot(nextPlayer) && newState.phase === 'playing') {
        processBotTurn(newState);
      }
    }, delay);
  }, []);

  useEffect(() => {
    if (gameState.phase !== 'playing') return;
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (isBot(currentPlayer)) {
      processBotTurn(gameState);
    }
    return () => {
      if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current);
    };
  }, [gameState.currentPlayerIndex, gameState.phase, processBotTurn]);

  const myPlayerIndex = gameState.players.findIndex(p => p.email === user.email);
  const myPlayer = gameState.players[myPlayerIndex];
  const topCard = gameState.discardPile[gameState.discardPile.length - 1];
  const isMyTurn = gameState.currentPlayerIndex === myPlayerIndex && gameState.phase === 'playing';
  const playableCards = isMyTurn ? getPlayableCards(myPlayer.hand, topCard) : [];
  const playableCardIds = playableCards.map(c => c.id);
  const opponents = gameState.players.filter((_, i) => i !== myPlayerIndex);

  const handleCardClick = (card: Card) => {
    if (!isMyTurn || !canPlayCard(card, topCard)) return;
    if (card.color === 'wild') {
      setPendingWildCard(card);
      setShowColorPicker(true);
      return;
    }
    const newState = playCard(gameState, card.id);
    setGameState(newState);
    if (newState.phase === 'game-over') setTimeout(() => setShowGameOver(true), 500);
  };

  const handleColorSelect = (color: CardColor) => {
    if (!pendingWildCard) return;
    setShowColorPicker(false);
    const newState = playCard(gameState, pendingWildCard.id, color);
    setPendingWildCard(null);
    setGameState(newState);
    if (newState.phase === 'game-over') setTimeout(() => setShowGameOver(true), 500);
  };

  const handleDrawCard = () => {
    if (!isMyTurn) return;
    setGameState(drawCardAction(gameState));
  };

  const handlePlayAgain = () => {
    if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current);
    setShowGameOver(false);
    setGameState(initializeAIGame(user.name, user.email, user.avatar, botCount));
  };

  const currentColor = topCard.chosenColor || topCard.color;
  const colorDot: Record<string, string> = {
    red: 'bg-red-500', blue: 'bg-blue-500',
    green: 'bg-green-500', yellow: 'bg-yellow-400', wild: 'bg-purple-500',
  };
  const winnerPlayer = gameState.winner ? gameState.players.find(p => p.id === gameState.winner) : null;
  const didIWin = winnerPlayer?.email === user.email;
  const currentTurnPlayer = gameState.players[gameState.currentPlayerIndex];

  const sortedCards = [...myPlayer.hand].sort((a, b) => {
    const colorOrder = ['red', 'yellow', 'green', 'blue', 'wild'];
    const cd = colorOrder.indexOf(a.color) - colorOrder.indexOf(b.color);
    return cd !== 0 ? cd : a.value.localeCompare(b.value);
  });

  return (
    <div className="flex flex-col w-full h-screen overflow-hidden select-none" style={{
      background: isLight
        ? 'linear-gradient(160deg, #f0f4f8 0%, #e2e8f0 50%, #cbd5e1 100%)'
        : 'radial-gradient(ellipse at center, #1a4d7a 0%, #0f3a5f 50%, #091e33 100%)'
    }}>
      {showColorPicker && <ColorPicker onSelect={handleColorSelect} />}

      {/* Game Over */}
      {showGameOver && gameState.phase === 'game-over' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className={cn(
            "rounded-3xl p-10 text-center max-w-md w-full mx-4 border shadow-2xl",
            isLight ? "bg-white border-gray-200" : "bg-gray-900 border-white/10"
          )}>
            <div className="text-7xl mb-4">{didIWin ? '🏆' : '😢'}</div>
            <h2 className={cn("text-3xl font-black mb-2", isLight ? "text-gray-900" : "text-white")}>
              {didIWin ? t('youWon') : t('gameOver')}!
            </h2>
            <p className="text-xl text-yellow-500 font-bold mb-6">{gameState.message}</p>
            <div className="space-y-3">
              <button onClick={handlePlayAgain} className="w-full py-3 bg-green-500 hover:bg-green-400 text-white font-bold rounded-xl text-lg transition-all cursor-pointer">
                🔄 {t('playAgain')}
              </button>
              <button onClick={onLeave} className="w-full py-3 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold rounded-xl text-lg transition-all cursor-pointer">
                🏠 {t('backToLobby')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOP BAR */}
      <div className={cn(
        "flex items-center justify-between px-4 py-2 border-b shrink-0",
        isLight ? "bg-white/80 border-gray-200 backdrop-blur" : "bg-black/40 border-white/10"
      )}>
        {/* Left: Player vs Bot */}
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-9 h-9 rounded-lg border-2 border-yellow-400 overflow-hidden flex items-center justify-center text-xl",
            isLight ? "bg-gray-100" : "bg-gray-800"
          )}>
            {user.avatar}
          </div>
          <span className={cn("font-bold text-sm", isLight ? "text-gray-900" : "text-white")}>{user.name}</span>
          <span className={cn("text-sm", isLight ? "text-gray-500" : "text-gray-400")}>vs</span>
          <span className={cn("font-bold text-sm", isLight ? "text-gray-900" : "text-white")}>{opponents.map(o => o.name).join(', ')}</span>
        </div>

        {/* Center: Turn indicator */}
        <div className={cn(
          'px-5 py-1.5 rounded-full text-sm font-bold border-2 transition-all',
          isMyTurn
            ? 'bg-green-500 border-green-400 text-white shadow-lg shadow-green-500/40'
            : isLight
              ? 'bg-gray-100 border-gray-300 text-gray-600'
              : 'bg-gray-700/60 border-gray-600 text-gray-300'
        )}>
          {isMyTurn ? `● ${t('yourTurn')}!` : `⏳ ${currentTurnPlayer.name}`}
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2">
          <MusicControls />
          <button onClick={toggleLanguage} className={cn(
            "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs border font-bold cursor-pointer transition-all",
            isLight
              ? "bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300"
              : "bg-white/10 hover:bg-white/20 text-white border-white/20"
          )}>
            🌐 {language === 'en' ? 'हिंदी' : 'ENGLISH'}
          </button>
          <button onClick={toggleTheme} className={cn(
            "w-8 h-8 rounded-lg border flex items-center justify-center cursor-pointer transition-all",
            isLight
              ? "bg-gray-100 hover:bg-gray-200 border-gray-300"
              : "bg-white/10 hover:bg-white/20 border-white/20"
          )}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button onClick={onLeave} className={cn(
            "w-8 h-8 rounded-lg border flex items-center justify-center cursor-pointer transition-all",
            isLight
              ? "bg-gray-100 hover:bg-red-100 border-gray-300 text-gray-700"
              : "bg-white/10 hover:bg-red-500/40 border-white/20 text-white"
          )}>
            ✕
          </button>
        </div>
      </div>

      {/* OPPONENT AREA */}
      <div className="flex justify-center items-start pt-4 pb-2 shrink-0">
        {opponents.map((opp) => {
          const isOppTurn = gameState.currentPlayerIndex === gameState.players.findIndex(p => p.id === opp.id);
          return (
            <div key={opp.id} className="flex flex-col items-center gap-2">
              <div className={cn(
                'flex items-center gap-3 px-4 py-2 rounded-2xl border transition-all',
                isOppTurn
                  ? 'bg-yellow-400/20 border-yellow-400/60 shadow-lg shadow-yellow-400/20'
                  : isLight ? 'bg-white/70 border-gray-200' : 'bg-black/30 border-white/10'
              )}>
                <div className={cn(
                  'w-10 h-10 rounded-full border-2 flex items-center justify-center text-xl',
                  isLight ? 'bg-gray-100' : 'bg-gray-700',
                  isOppTurn ? 'border-yellow-400' : isLight ? 'border-gray-300' : 'border-gray-600'
                )}>
                  {opp.avatar || '🤖'}
                </div>
                <div className="flex flex-col">
                  <span className={cn("font-bold text-sm", isLight ? "text-gray-900" : "text-white")}>{opp.name}</span>
                  <div className={cn("w-16 h-1 rounded-full mt-1", isLight ? "bg-gray-200" : "bg-gray-600")}>
                    <div className="h-1 bg-yellow-400 rounded-full" style={{ width: `${Math.min(100, (opp.hand.length / 14) * 100)}%` }} />
                  </div>
                </div>
                {/* Opponent cards fan */}
                <div className="flex items-center ml-2">
                  {Array.from({ length: Math.min(opp.hand.length, 8) }).map((_, i) => (
                    <div
                      key={i}
                      className="w-8 h-11 rounded-md border-2 border-white bg-gradient-to-br from-gray-800 to-black flex items-center justify-center shadow-md"
                      style={{ marginLeft: i === 0 ? 0 : '-14px', zIndex: i }}
                    >
                      <div className="w-4 h-4 rotate-45 bg-gradient-to-br from-red-500 via-yellow-400 to-blue-500 rounded-sm" />
                    </div>
                  ))}
                  {opp.hand.length > 8 && (
                    <span className={cn("ml-2 text-xs font-bold", isLight ? "text-gray-500" : "text-white/60")}>+{opp.hand.length - 8}</span>
                  )}
                </div>
                <span className={cn(
                  'ml-2 text-xs font-bold px-2 py-0.5 rounded-full',
                  opp.hand.length <= 2 ? 'bg-red-500 text-white' : isLight ? 'bg-gray-100 text-gray-600' : 'bg-black/40 text-gray-300'
                )}>
                  {opp.hand.length} {opp.hand.length === 1 ? t('card') : t('cards')}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* CENTER: Draw + Discard + Message */}
      <div className="flex-1 flex items-center justify-center gap-4 relative">
        {/* Draw pile */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={handleDrawCard}
            disabled={!isMyTurn}
            className={cn(
              'relative transition-all duration-200 rounded-2xl',
              isMyTurn ? 'hover:scale-105 hover:-translate-y-1 cursor-pointer' : 'opacity-70 cursor-not-allowed'
            )}
          >
            <div className="w-20 h-28 rounded-2xl border-4 border-gray-600 bg-gradient-to-br from-gray-800 to-black flex items-center justify-center shadow-2xl">
              <div className="w-14 h-20 rounded-xl bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center border-2 border-red-400/30">
                <span className="text-white font-black text-lg tracking-wider">UNO</span>
              </div>
            </div>
            {isMyTurn && playableCards.length === 0 && (
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-yellow-400 text-gray-900 rounded-lg text-xs font-black whitespace-nowrap animate-bounce shadow-lg">
                👆 {t('drawCard')}
              </div>
            )}
          </button>
          <div className="text-center">
            <div className={cn("font-black text-lg", isLight ? "text-gray-800" : "text-white")}>{gameState.drawPile.length}</div>
            <div className={cn("text-[10px] font-bold tracking-widest uppercase", isLight ? "text-gray-500" : "text-gray-400")}>{t('draw')}</div>
          </div>
        </div>

        {/* Discard pile */}
        <div className="flex flex-col items-center gap-1">
          <div className="relative">
            <div className="absolute -inset-3 bg-yellow-400/20 rounded-3xl blur-xl animate-pulse" />
            <UnoCard card={topCard} highlight />
          </div>
          <div className="text-center mt-1">
            <div className={cn("font-black text-lg", isLight ? "text-gray-800" : "text-white")}>{gameState.discardPile.length}</div>
            <div className={cn("text-[10px] font-bold tracking-widest uppercase", isLight ? "text-gray-500" : "text-gray-400")}>{t('discard')}</div>
          </div>
        </div>

        {/* Message bubble */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <div className={cn(
            "text-sm font-medium px-4 py-2 rounded-2xl shadow-lg max-w-[180px]",
            isLight ? "bg-white border border-gray-200 text-gray-700" : "bg-white/90 text-gray-800"
          )}>
            {isMyTurn ? t('yourTurnPlay') : gameState.message}
          </div>
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center border",
            isLight ? "bg-gray-100 border-gray-300" : "bg-white/20 border-white/30 text-white"
          )}>
            💬
          </div>
        </div>

        {/* Color dot */}
        <div className="absolute left-8 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
          <div className={cn('w-8 h-8 rounded-full shadow-xl', colorDot[currentColor],
            isLight ? 'border-2 border-gray-300' : 'border-2 border-white'
          )} />
          <div className={cn("text-[9px] font-bold uppercase tracking-wider", isLight ? "text-gray-500" : "text-gray-400")}>{t('currentColor')}</div>
        </div>
      </div>

      {/* PLAYER HAND */}
      <div className="shrink-0 pb-4">
        <div className="flex items-center gap-2 px-4 mb-2">
          <div className={cn(
            "w-8 h-8 rounded-lg border-2 border-yellow-400 flex items-center justify-center text-lg",
            isLight ? "bg-gray-100" : "bg-gray-800"
          )}>
            {user.avatar}
          </div>
          <span className={cn(
            'px-3 py-1 rounded-lg text-sm font-bold',
            isMyTurn ? 'bg-yellow-400 text-gray-900' : isLight ? 'bg-gray-200 text-gray-700' : 'bg-gray-700 text-gray-300'
          )}>
            {user.name}
          </span>
          <span className={cn("text-xs", isLight ? "text-gray-500" : "text-gray-400")}>
            {myPlayer.hand.length} {myPlayer.hand.length === 1 ? t('card') : t('cards')}
          </span>
          {myPlayer.hand.length === 1 && (
            <span className="px-2 py-0.5 bg-red-500 text-white font-black text-xs animate-pulse rounded-full">{t('uno')}! 🔥</span>
          )}
        </div>

        {/* Cards */}
        <div className="flex justify-center items-end px-4 overflow-x-auto overflow-y-visible pb-2 pt-4">
          {sortedCards.map((card, index) => (
            <div
              key={card.id}
              className="transition-all duration-200 hover:-translate-y-6 hover:z-50"
              style={{
                marginLeft: index === 0 ? 0 : sortedCards.length > 10 ? '-2rem' : '-1.2rem',
                zIndex: index,
              }}
            >
              <UnoCard
                card={card}
                playable={isMyTurn && playableCardIds.includes(card.id)}
                onClick={() => handleCardClick(card)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
