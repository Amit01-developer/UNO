import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Card, CardColor, UserAccount } from '../types';
import {
  playCard,
  drawCardAction,
  getPlayableCards,
  canPlayCard,
  canPlayWild4,
  getNextPlayerIndex,
  drawCardsFromPile,
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

interface RankNotif {
  rank: number;
  name: string;
  avatar: string;
  isMe: boolean;
}

export function AIGameBoard({ user, botCount, onLeave }: AIGameBoardProps) {
  const { t, language, theme, toggleLanguage, toggleTheme } = useApp();
  const [gameState, setGameState] = useState<GameState>(() =>
    initializeAIGame(user.name, user.email, user.avatar, botCount)
  );
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pendingWildCard, setPendingWildCard] = useState<Card | null>(null);
  const [showGameOver, setShowGameOver] = useState(false);
  const [rankNotif, setRankNotif] = useState<RankNotif | null>(null);
  const botTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevRankingsLen = useRef(0);

  const isLight = theme === 'light';

  // Detect new ranking entry and show popup
  useEffect(() => {
    const rankings = gameState.rankings ?? [];
    if (rankings.length > prevRankingsLen.current) {
      const newest = rankings[rankings.length - 1];
      setRankNotif({
        rank: newest.rank,
        name: newest.name,
        avatar: newest.avatar,
        isMe: newest.email === user.email,
      });
      const timer = setTimeout(() => setRankNotif(null), 2500);
      prevRankingsLen.current = rankings.length;
      return () => clearTimeout(timer);
    }
    prevRankingsLen.current = rankings.length;
  }, [gameState.rankings, user.email]);

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
  const isMyTurn = myPlayerIndex !== -1 && gameState.currentPlayerIndex === myPlayerIndex && gameState.phase === 'playing';
  const hasDrawn = isMyTurn && !!gameState.drawnCardId;

  // My rank if I've already finished
  const myRankEntry = (gameState.rankings ?? []).find(r => r.email === user.email);

  const playableCards = isMyTurn && myPlayer
    ? (hasDrawn
        ? myPlayer.hand.filter(c => {
            if (c.id !== gameState.drawnCardId) return false;
            if (c.value === 'wild4') return canPlayWild4(myPlayer.hand, topCard);
            return canPlayCard(c, topCard);
          })
        : getPlayableCards(myPlayer.hand, topCard))
    : [];
  const playableCardIds = playableCards.map(c => c.id);
  const opponents = gameState.players.filter((_, i) => i !== myPlayerIndex);

  const updateState = (newState: GameState) => {
    setGameState(newState);
    if (newState.phase === 'game-over') setTimeout(() => setShowGameOver(true), 500);
  };

  const handleCardClick = (card: Card) => {
    if (!isMyTurn || !myPlayer) return;
    if (card.value === 'wild4') {
      if (!canPlayWild4(myPlayer.hand, topCard)) return;
      setPendingWildCard(card);
      setShowColorPicker(true);
      return;
    }
    if (!canPlayCard(card, topCard)) return;
    if (card.color === 'wild') {
      setPendingWildCard(card);
      setShowColorPicker(true);
      return;
    }
    updateState(playCard(gameState, card.id));
  };

  const handleColorSelect = (color: CardColor) => {
    if (!pendingWildCard) return;
    setShowColorPicker(false);
    updateState(playCard(gameState, pendingWildCard.id, color));
    setPendingWildCard(null);
  };

  const handleDrawCard = () => {
    if (!isMyTurn || hasDrawn) return;
    setGameState(drawCardAction(gameState));
  };

  const handlePass = () => {
    if (!isMyTurn || !hasDrawn || !myPlayer) return;
    const nextPlayerIndex = getNextPlayerIndex(gameState.currentPlayerIndex, gameState.direction, gameState.players.length);
    const nextPlayer = gameState.players[nextPlayerIndex];
    setGameState({
      ...gameState,
      currentPlayerIndex: nextPlayerIndex,
      drawnCardId: null,
      message: `${nextPlayer.name}'s turn!`,
      lastAction: `${myPlayer.name} drew and passed`,
    });
  };

  const handleCatchUno = (targetEmail: string) => {
    const targetIdx = gameState.players.findIndex(p => p.email === targetEmail);
    if (targetIdx === -1) return;
    const target = { ...gameState.players[targetIdx] };
    if (target.hand.length !== 1 || target.isUno) return;
    const { drawn, newDrawPile, newDiscardPile } = drawCardsFromPile(gameState.drawPile, gameState.discardPile, 2);
    target.hand = [...target.hand, ...drawn];
    const newPlayers = [...gameState.players];
    newPlayers[targetIdx] = target;
    setGameState({
      ...gameState,
      players: newPlayers,
      drawPile: newDrawPile,
      discardPile: newDiscardPile,
      lastAction: `🚨 ${target.name} caught! +2 penalty cards!`,
    });
  };

  const handlePlayAgain = () => {
    if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current);
    prevRankingsLen.current = 0;
    setShowGameOver(false);
    setRankNotif(null);
    setGameState(initializeAIGame(user.name, user.email, user.avatar, botCount));
  };

  const currentColor = topCard.chosenColor || topCard.color;
  const colorDot: Record<string, string> = {
    red: 'bg-red-500', blue: 'bg-blue-500',
    green: 'bg-green-500', yellow: 'bg-yellow-400', wild: 'bg-purple-500',
  };
  const currentTurnPlayer = gameState.players[gameState.currentPlayerIndex] ?? { name: '' };

  const rankEmoji = (rank: number) =>
    rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;

  const sortedCards = myPlayer ? [...myPlayer.hand].sort((a, b) => {
    const colorOrder = ['red', 'yellow', 'green', 'blue', 'wild'];
    const cd = colorOrder.indexOf(a.color) - colorOrder.indexOf(b.color);
    return cd !== 0 ? cd : a.value.localeCompare(b.value);
  }) : [];

  return (
    <div className="flex flex-col w-full h-screen overflow-hidden select-none" style={{
      background: isLight
        ? 'linear-gradient(160deg, #f0f4f8 0%, #e2e8f0 50%, #cbd5e1 100%)'
        : 'radial-gradient(ellipse at center, #1a4d7a 0%, #0f3a5f 50%, #091e33 100%)'
    }}>
      {showColorPicker && <ColorPicker onSelect={handleColorSelect} />}

      {/* Rank notification toast — shows when any player finishes */}
      {rankNotif && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className={cn(
            "px-6 py-4 rounded-2xl shadow-2xl border text-center",
            rankNotif.isMe
              ? "bg-yellow-400 border-yellow-500 text-gray-900"
              : isLight ? "bg-white border-gray-200 text-gray-800" : "bg-gray-800 border-white/20 text-white"
          )}>
            <div className="text-3xl mb-1">{rankEmoji(rankNotif.rank)}</div>
            <div className="font-black text-lg">
              {rankNotif.isMe ? '🎉 You finished!' : `${rankNotif.avatar} ${rankNotif.name} finished!`}
            </div>
            <div className="text-sm font-bold opacity-80">Position #{rankNotif.rank}</div>
          </div>
        </div>
      )}

      {/* Game Over — final rankings */}
      {showGameOver && gameState.phase === 'game-over' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className={cn(
            "rounded-3xl p-8 text-center max-w-md w-full mx-4 border shadow-2xl",
            isLight ? "bg-white border-gray-200" : "bg-gray-900 border-white/10"
          )}>
            <div className="text-6xl mb-3">{myRankEntry?.rank === 1 ? '🏆' : myRankEntry ? rankEmoji(myRankEntry.rank) : '🎮'}</div>
            <h2 className={cn("text-3xl font-black mb-1", isLight ? "text-gray-900" : "text-white")}>
              {myRankEntry?.rank === 1 ? t('youWon') : t('gameOver')}!
            </h2>
            {myRankEntry && (
              <p className="text-lg text-yellow-500 font-bold mb-3">
                You finished {rankEmoji(myRankEntry.rank)}
              </p>
            )}

            {/* Rankings list */}
            <div className="mb-6 space-y-2">
              {(gameState.rankings ?? []).map((r) => (
                <div
                  key={r.email}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2 rounded-xl",
                    r.email === user.email
                      ? "bg-yellow-400/20 border border-yellow-400/50"
                      : isLight ? "bg-gray-100" : "bg-white/10"
                  )}
                >
                  <span className="text-xl">{rankEmoji(r.rank)}</span>
                  <span className="text-xl">{r.avatar}</span>
                  <span className={cn("font-bold flex-1 text-left", isLight ? "text-gray-900" : "text-white")}>
                    {r.name} {r.email === user.email ? '(You)' : ''}
                  </span>
                </div>
              ))}
            </div>

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
        "flex items-center justify-between px-2 sm:px-4 py-2 border-b shrink-0 gap-1",
        isLight ? "bg-white/80 border-gray-200 backdrop-blur" : "bg-black/40 border-white/10"
      )}>
        <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
          <div className={cn(
            "w-8 h-8 sm:w-9 sm:h-9 rounded-lg border-2 border-yellow-400 overflow-hidden flex items-center justify-center text-lg sm:text-xl shrink-0",
            isLight ? "bg-gray-100" : "bg-gray-800"
          )}>
            {user.avatar}
          </div>
          <span className={cn("font-bold text-xs sm:text-sm truncate max-w-[60px] sm:max-w-none", isLight ? "text-gray-900" : "text-white")}>{user.name}</span>
          <span className={cn("text-xs shrink-0", isLight ? "text-gray-500" : "text-gray-400")}>vs</span>
          <span className={cn("font-bold text-xs sm:text-sm truncate max-w-[70px] sm:max-w-none", isLight ? "text-gray-900" : "text-white")}>
            {opponents.map(o => o.name).join(', ')}
          </span>
        </div>

        {/* My rank badge if I've already finished */}
        {myRankEntry && gameState.phase === 'playing' && (
          <div className="px-3 py-1 bg-yellow-400 text-gray-900 rounded-full text-xs font-black shrink-0">
            {rankEmoji(myRankEntry.rank)} Finished!
          </div>
        )}

        <div className={cn(
          'px-2 sm:px-5 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-bold border-2 transition-all shrink-0',
          isMyTurn
            ? 'bg-green-500 border-green-400 text-white shadow-lg shadow-green-500/40'
            : isLight
              ? 'bg-gray-100 border-gray-300 text-gray-600'
              : 'bg-gray-700/60 border-gray-600 text-gray-300'
        )}>
          {isMyTurn ? `● ${t('yourTurn')}!` : `⏳ ${currentTurnPlayer.name}`}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <MusicControls />
          <button onClick={toggleLanguage} className={cn(
            "hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg text-xs border font-bold cursor-pointer transition-all",
            isLight ? "bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300" : "bg-white/10 hover:bg-white/20 text-white border-white/20"
          )}>
            🌐 {language === 'en' ? 'हिंदी' : 'EN'}
          </button>
          <button onClick={toggleTheme} className={cn(
            "w-7 h-7 sm:w-8 sm:h-8 rounded-lg border flex items-center justify-center cursor-pointer transition-all",
            isLight ? "bg-gray-100 hover:bg-gray-200 border-gray-300" : "bg-white/10 hover:bg-white/20 border-white/20"
          )}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button onClick={onLeave} className={cn(
            "w-7 h-7 sm:w-8 sm:h-8 rounded-lg border flex items-center justify-center cursor-pointer transition-all",
            isLight ? "bg-gray-100 hover:bg-red-100 border-gray-300 text-gray-700" : "bg-white/10 hover:bg-red-500/40 border-white/20 text-white"
          )}>
            ✕
          </button>
        </div>
      </div>

      {/* OPPONENT AREA */}
      <div className="flex justify-center items-start pt-2 pb-1 shrink-0 flex-wrap gap-2 px-2">
        {opponents.map((opp) => {
          const isOppTurn = gameState.currentPlayerIndex === gameState.players.findIndex(p => p.id === opp.id);
          const oppRank = (gameState.rankings ?? []).find(r => r.email === opp.email);
          return (
            <div key={opp.id} className="flex flex-col items-center gap-1">
              <div className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-2xl border transition-all',
                isOppTurn
                  ? 'bg-yellow-400/20 border-yellow-400/60 shadow-lg shadow-yellow-400/20'
                  : isLight ? 'bg-white/70 border-gray-200' : 'bg-black/30 border-white/10'
              )}>
                <div className={cn(
                  'w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 flex items-center justify-center text-lg sm:text-xl shrink-0',
                  isLight ? 'bg-gray-100' : 'bg-gray-700',
                  isOppTurn ? 'border-yellow-400' : isLight ? 'border-gray-300' : 'border-gray-600'
                )}>
                  {opp.avatar || '🤖'}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className={cn("font-bold text-xs sm:text-sm truncate max-w-[80px]", isLight ? "text-gray-900" : "text-white")}>{opp.name}</span>
                  {oppRank ? (
                    <span className="text-xs font-bold text-yellow-400">{rankEmoji(oppRank.rank)} Finished</span>
                  ) : (
                    <div className={cn("w-12 h-1 rounded-full mt-1", isLight ? "bg-gray-200" : "bg-gray-600")}>
                      <div className="h-1 bg-yellow-400 rounded-full" style={{ width: `${Math.min(100, (opp.hand.length / 14) * 100)}%` }} />
                    </div>
                  )}
                </div>
                <div className="flex items-center ml-1">
                  {Array.from({ length: Math.min(opp.hand.length, 6) }).map((_, i) => (
                    <div
                      key={i}
                      className="w-6 h-9 sm:w-8 sm:h-11 rounded-md border-2 border-white bg-gradient-to-br from-gray-800 to-black flex items-center justify-center shadow-md"
                      style={{ marginLeft: i === 0 ? 0 : '-10px', zIndex: i }}
                    >
                      <div className="w-3 h-3 rotate-45 bg-gradient-to-br from-red-500 via-yellow-400 to-blue-500 rounded-sm" />
                    </div>
                  ))}
                  {opp.hand.length > 6 && (
                    <span className={cn("ml-1 text-xs font-bold", isLight ? "text-gray-500" : "text-white/60")}>+{opp.hand.length - 6}</span>
                  )}
                </div>
                <span className={cn(
                  'ml-1 text-xs font-bold px-1.5 py-0.5 rounded-full shrink-0',
                  opp.hand.length <= 2 ? 'bg-red-500 text-white' : isLight ? 'bg-gray-100 text-gray-600' : 'bg-black/40 text-gray-300'
                )}>
                  {opp.hand.length}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* CENTER: Draw + Discard + Message */}
      <div className="flex-1 flex items-center justify-center gap-3 sm:gap-4 relative px-2">
        <div className="flex flex-col items-center gap-1">
          <div className={cn('w-7 h-7 sm:w-8 sm:h-8 rounded-full shadow-xl', colorDot[currentColor],
            isLight ? 'border-2 border-gray-300' : 'border-2 border-white'
          )} />
          <div className={cn("text-[8px] sm:text-[9px] font-bold uppercase tracking-wider", isLight ? "text-gray-500" : "text-gray-400")}>{t('currentColor')}</div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <button
            onClick={handleDrawCard}
            disabled={!isMyTurn || hasDrawn}
            className={cn(
              'relative transition-all duration-200 rounded-xl',
              isMyTurn && !hasDrawn ? 'hover:scale-105 hover:-translate-y-1 cursor-pointer' : 'opacity-70 cursor-not-allowed'
            )}
          >
            <div className="w-14 h-20 sm:w-20 sm:h-28 rounded-xl border-4 border-gray-600 bg-gradient-to-br from-gray-800 to-black flex items-center justify-center shadow-2xl">
              <div className="w-10 h-14 sm:w-14 sm:h-20 rounded-lg bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center border-2 border-red-400/30">
                <span className="text-white font-black text-sm sm:text-lg tracking-wider">UNO</span>
              </div>
            </div>
            {isMyTurn && !hasDrawn && playableCards.length === 0 && (
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-yellow-400 text-gray-900 rounded-lg text-[10px] font-black whitespace-nowrap animate-bounce shadow-lg">
                👆 {t('drawCard')}
              </div>
            )}
            {hasDrawn && (
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-blue-400 text-gray-900 rounded-lg text-[10px] font-black whitespace-nowrap shadow-lg">
                Already drew!
              </div>
            )}
          </button>
          <div className="text-center">
            <div className={cn("font-black text-base sm:text-lg", isLight ? "text-gray-800" : "text-white")}>{gameState.drawPile.length}</div>
            <div className={cn("text-[9px] sm:text-[10px] font-bold tracking-widest uppercase", isLight ? "text-gray-500" : "text-gray-400")}>{t('draw')}</div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className="relative">
            <div className="absolute -inset-2 bg-yellow-400/20 rounded-3xl blur-xl animate-pulse" />
            <UnoCard card={topCard} highlight />
          </div>
          <div className="text-center mt-1">
            <div className={cn("font-black text-base sm:text-lg", isLight ? "text-gray-800" : "text-white")}>{gameState.discardPile.length}</div>
            <div className={cn("text-[9px] sm:text-[10px] font-bold tracking-widest uppercase", isLight ? "text-gray-500" : "text-gray-400")}>{t('discard')}</div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1 max-w-[80px] sm:max-w-[180px]">
          <div className={cn(
            "text-[10px] sm:text-sm font-medium px-2 sm:px-4 py-1 sm:py-2 rounded-2xl shadow-lg text-center",
            isLight ? "bg-white border border-gray-200 text-gray-700" : "bg-white/90 text-gray-800"
          )}>
            {isMyTurn ? t('yourTurnPlay') : gameState.message}
          </div>
        </div>
      </div>

      {/* PLAYER HAND */}
      <div className="shrink-0 pb-3">
        {hasDrawn && (
          <div className="flex justify-center mb-2">
            <button
              onClick={handlePass}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl text-sm shadow-lg transition-all hover:scale-105 cursor-pointer"
            >
              ⏭ Pass Turn
            </button>
          </div>
        )}

        {opponents.some(o => o.hand.length === 1 && !o.isUno) && (
          <div className="flex justify-center gap-2 mb-2 flex-wrap px-2">
            {opponents.filter(o => o.hand.length === 1 && !o.isUno).map(o => (
              <button
                key={o.email}
                onClick={() => handleCatchUno(o.email)}
                className="px-4 py-1.5 bg-red-500 hover:bg-red-600 text-white font-black rounded-xl text-xs shadow-lg animate-pulse transition-all hover:scale-105 cursor-pointer"
              >
                🚨 Catch {o.name}!
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 px-3 mb-1 flex-wrap">
          <div className={cn(
            "w-7 h-7 sm:w-8 sm:h-8 rounded-lg border-2 border-yellow-400 flex items-center justify-center text-base sm:text-lg",
            isLight ? "bg-gray-100" : "bg-gray-800"
          )}>
            {user.avatar}
          </div>
          <span className={cn(
            'px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-bold',
            isMyTurn ? 'bg-yellow-400 text-gray-900' : isLight ? 'bg-gray-200 text-gray-700' : 'bg-gray-700 text-gray-300'
          )}>
            {user.name}
          </span>
          {myPlayer ? (
            <>
              <span className={cn("text-xs", isLight ? "text-gray-500" : "text-gray-400")}>
                {myPlayer.hand.length} {myPlayer.hand.length === 1 ? t('card') : t('cards')}
              </span>
              {myPlayer.hand.length === 1 && (
                <span className="px-2 py-0.5 bg-red-500 text-white font-black text-xs animate-pulse rounded-full">{t('uno')}! 🔥</span>
              )}
            </>
          ) : myRankEntry ? (
            <span className="px-2 py-0.5 bg-yellow-400 text-gray-900 font-black text-xs rounded-full">
              {rankEmoji(myRankEntry.rank)} Finished! Watching...
            </span>
          ) : null}
        </div>

        {/* Cards — only show if player is still in game */}
        {myPlayer && (
          <div className="flex justify-center items-end px-2 overflow-x-auto overflow-y-visible pb-2 pt-4">
            {sortedCards.map((card, index) => (
              <div
                key={card.id}
                className="transition-all duration-200 hover:-translate-y-6 hover:z-50 active:-translate-y-6 active:z-50"
                style={{
                  marginLeft: index === 0 ? 0 : sortedCards.length > 10 ? '-1.6rem' : sortedCards.length > 6 ? '-1rem' : '-0.7rem',
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
        )}

        {/* Spectator message when player has finished */}
        {!myPlayer && myRankEntry && gameState.phase === 'playing' && (
          <div className="flex justify-center py-4">
            <div className={cn(
              "px-6 py-3 rounded-2xl text-sm font-bold border",
              isLight ? "bg-white border-gray-200 text-gray-600" : "bg-white/10 border-white/20 text-gray-300"
            )}>
              👀 Watching the rest of the game...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
