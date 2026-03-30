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
} from '../gameLogic';
import { subscribeToRoom, updateRoomGameState } from '../utils/room';
import { UnoCard } from './UnoCard';
import { PlayerHand } from './PlayerHand';
import { OpponentHand } from './OpponentHand';
import { ColorPicker } from './ColorPicker';
import { MusicControls } from './BackgroundMusic';
import { cn } from '../utils/cn';
import { useApp } from '../contexts/AppContext';

interface GameBoardProps {
  user: UserAccount;
  initialGameState: GameState;
  roomPin: string;
  onLeave: () => void;
}

interface RankNotif {
  rank: number;
  name: string;
  avatar: string;
  isMe: boolean;
}

const rankEmoji = (rank: number) =>
  rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;

export function GameBoard({ user, initialGameState, roomPin, onLeave }: GameBoardProps) {
  const { t, language, theme, toggleLanguage, toggleTheme } = useApp();
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pendingWildCard, setPendingWildCard] = useState<Card | null>(null);
  const [rankNotif, setRankNotif] = useState<RankNotif | null>(null);
  const prevRankingsLen = useRef(0);

  // Real-time Firestore listener
  useEffect(() => {
    const unsub = subscribeToRoom(roomPin, (room) => {
      if (!room) { onLeave(); return; }
      if (room.gameState) setGameState(room.gameState);
    });
    return () => unsub();
  }, [roomPin, onLeave]);

  // Detect new ranking entry and show toast
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

  const updateGame = useCallback((newState: GameState) => {
    setGameState(newState);
    updateRoomGameState(roomPin, newState);
  }, [roomPin]);

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
  const positions: ('left' | 'top' | 'right')[] =
    opponents.length === 1 ? ['top'] :
    opponents.length === 2 ? ['left', 'right'] :
    opponents.length === 3 ? ['left', 'top', 'right'] :
    opponents.length === 4 ? ['left', 'top', 'top', 'right'] :
    ['left', 'left', 'top', 'right', 'right'];

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
    updateGame(playCard(gameState, card.id));
  };

  const handleColorSelect = (color: CardColor) => {
    if (!pendingWildCard) return;
    setShowColorPicker(false);
    updateGame(playCard(gameState, pendingWildCard.id, color));
    setPendingWildCard(null);
  };

  const handleDrawCard = () => {
    if (!isMyTurn || hasDrawn) return;
    updateGame(drawCardAction(gameState));
  };

  const handlePass = () => {
    if (!isMyTurn || !hasDrawn || !myPlayer) return;
    const nextPlayerIndex = getNextPlayerIndex(gameState.currentPlayerIndex, gameState.direction, gameState.players.length);
    const nextPlayer = gameState.players[nextPlayerIndex];
    updateGame({
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
    updateGame({
      ...gameState,
      players: newPlayers,
      drawPile: newDrawPile,
      discardPile: newDiscardPile,
      lastAction: `🚨 ${target.name} caught! +2 penalty cards!`,
    });
  };

  const dirArrow = gameState.direction === 1 ? '⟳' : '⟲';
  const currentColor = topCard.chosenColor || topCard.color;
  const colorIndicator: Record<string, string> = {
    red: 'bg-red-500', blue: 'bg-blue-500',
    green: 'bg-green-500', yellow: 'bg-yellow-400', wild: 'bg-purple-500',
  };
  const currentTurnPlayer = gameState.players[gameState.currentPlayerIndex] ?? { name: '' };

  return (
    <div className="relative w-full min-h-screen flex flex-col" style={{
      background: theme === 'light'
        ? 'linear-gradient(160deg, #f0f4f8 0%, #e2e8f0 50%, #cbd5e1 100%)'
        : 'radial-gradient(ellipse at center, #2563a8 0%, #1a4d7a 50%, #0f3a5f 100%)'
    }}>
      {showColorPicker && <ColorPicker onSelect={handleColorSelect} />}

      {/* Rank notification toast */}
      {rankNotif && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className={cn(
            "px-6 py-4 rounded-2xl shadow-2xl border text-center",
            rankNotif.isMe
              ? "bg-yellow-400 border-yellow-500 text-gray-900"
              : theme === 'light' ? "bg-white border-gray-200 text-gray-800" : "bg-gray-800 border-white/20 text-white"
          )}>
            <div className="text-3xl mb-1">{rankEmoji(rankNotif.rank)}</div>
            <div className="font-black text-lg">
              {rankNotif.isMe ? '🎉 You finished!' : `${rankNotif.avatar} ${rankNotif.name} finished!`}
            </div>
            <div className="text-sm font-bold opacity-80">Position #{rankNotif.rank}</div>
          </div>
        </div>
      )}

      {/* Game Over Overlay */}
      {gameState.phase === 'game-over' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className={cn(
            "rounded-3xl p-8 text-center max-w-md w-full mx-4 border shadow-2xl",
            theme === 'light' ? "bg-white border-gray-200" : "bg-gray-900 border-white/10"
          )}>
            <div className="text-6xl mb-3">
              {myRankEntry?.rank === 1 ? '🏆' : myRankEntry ? rankEmoji(myRankEntry.rank) : '🎮'}
            </div>
            <h2 className={cn("text-3xl font-black mb-1", theme === 'light' ? "text-gray-900" : "text-white")}>
              {myRankEntry?.rank === 1 ? t('youWon') : t('gameOver')}!
            </h2>
            {myRankEntry && (
              <p className="text-lg text-yellow-400 font-bold mb-3">
                You finished {rankEmoji(myRankEntry.rank)}
              </p>
            )}

            {gameState.rankings && gameState.rankings.length > 0 && (
              <div className="mb-6 space-y-2">
                {gameState.rankings.map((r) => (
                  <div
                    key={r.email}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2 rounded-xl",
                      r.email === user.email
                        ? "bg-yellow-400/20 border border-yellow-400/50"
                        : theme === 'light' ? "bg-gray-100" : "bg-white/10"
                    )}
                  >
                    <span className="text-xl">{rankEmoji(r.rank)}</span>
                    <span className="text-xl">{r.avatar}</span>
                    <span className={cn("font-bold flex-1 text-left", theme === 'light' ? "text-gray-900" : "text-white")}>
                      {r.name} {r.email === user.email ? '(You)' : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={onLeave}
              className="w-full px-8 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 font-bold rounded-xl text-lg hover:scale-105 transition-transform cursor-pointer"
            >
              🏠 {t('backToLobby')}
            </button>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <div className={cn(
        "flex items-center justify-between px-2 sm:px-4 py-2 backdrop-blur-sm border-b shadow-lg gap-1",
        theme === 'light'
          ? "bg-white/90 border-gray-200"
          : "bg-gradient-to-r from-gray-900/80 to-gray-800/80 border-white/10"
      )}>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-lg sm:text-xl shadow-lg border-2 border-white/20 shrink-0">
            {user.avatar}
          </div>
          <div className="flex flex-col min-w-0">
            <span className={cn("font-bold text-xs sm:text-sm truncate", theme === 'light' ? "text-gray-900" : "text-white")}>{user.name}</span>
            <span className={cn("px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-mono w-fit", theme === 'light' ? "bg-gray-100 text-gray-600" : "bg-gray-700/50 text-gray-300")}>
              PIN: {roomPin}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {/* My rank badge if already finished */}
          {myRankEntry && gameState.phase === 'playing' && (
            <div className="px-2 py-1 bg-yellow-400 text-gray-900 rounded-full text-xs font-black">
              {rankEmoji(myRankEntry.rank)} Finished!
            </div>
          )}

          <div className={cn(
            'px-2 sm:px-4 py-1 sm:py-1.5 rounded-lg text-xs font-bold shadow-md',
            isMyTurn ? 'bg-green-500 text-white animate-pulse' : theme === 'light' ? 'bg-gray-100 text-gray-600' : 'bg-gray-700/80 text-gray-300'
          )}>
            {isMyTurn ? `🎯 ${t('yourTurn')}!` : `⏳ ${currentTurnPlayer.name}`}
          </div>

          <MusicControls />

          <button
            onClick={toggleLanguage}
            className={cn(
              "hidden sm:block px-2 py-1 rounded-lg text-xs transition-all cursor-pointer border font-bold shadow-md",
              theme === 'light'
                ? "bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300"
                : "bg-white/10 hover:bg-white/20 text-white border-white/20"
            )}
          >
            {language === 'en' ? 'हिंदी' : 'EN'}
          </button>

          <button
            onClick={toggleTheme}
            className={cn(
              "w-7 h-7 sm:w-9 sm:h-9 rounded-lg transition-all cursor-pointer border flex items-center justify-center shadow-md",
              theme === 'light'
                ? "bg-gray-100 hover:bg-gray-200 border-gray-300"
                : "bg-white/10 hover:bg-white/20 border-white/20"
            )}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          <button
            onClick={onLeave}
            className="px-2 sm:px-3 py-1 sm:py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs transition-all cursor-pointer shadow-md font-bold"
          >
            🚪
          </button>
        </div>
      </div>

      {/* Opponents Area */}
      <div className="relative flex-1 min-h-[180px] sm:min-h-[220px] pt-2 sm:pt-4 pb-6 sm:pb-8">
        {opponents.map((opp, i) => (
          <OpponentHand
            key={opp.id}
            player={opp}
            isCurrentPlayer={gameState.currentPlayerIndex === gameState.players.findIndex(p => p.id === opp.id)}
            position={positions[i % positions.length]}
          />
        ))}

        {/* Center - Draw + Discard */}
        <div className="absolute top-[60%] sm:top-[65%] left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="hidden sm:block absolute inset-0 w-[400px] h-[280px] -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 rounded-[50%] bg-gradient-to-br from-green-700/40 to-green-900/40 border-4 border-yellow-600/30 shadow-2xl" />

          <div className="relative flex items-center gap-4 sm:gap-6 z-10">
            {/* Draw pile */}
            <button
              onClick={handleDrawCard}
              disabled={!isMyTurn || hasDrawn}
              className={cn(
                'relative transition-all duration-200',
                isMyTurn && !hasDrawn && 'hover:scale-110 cursor-pointer hover:rotate-3',
                (!isMyTurn || hasDrawn) && 'opacity-70',
              )}
            >
              <div className="w-14 h-20 sm:w-20 sm:h-28 rounded-xl border-4 border-gray-700 bg-gradient-to-br from-gray-800 to-black flex items-center justify-center shadow-2xl">
                <div className="w-10 h-14 sm:w-14 sm:h-20 rounded-lg bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
                  <span className="text-white font-black text-xs sm:text-sm">UNO</span>
                </div>
              </div>
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-black/60 rounded text-[9px] text-white font-bold whitespace-nowrap backdrop-blur-sm">
                {t('draw')} ({gameState.drawPile.length})
              </div>
              {isMyTurn && !hasDrawn && playableCards.length === 0 && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-yellow-400 text-gray-900 rounded-lg text-[10px] font-black whitespace-nowrap animate-bounce shadow-lg">
                  👆 {t('drawCard')}
                </div>
              )}
              {hasDrawn && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-blue-400 text-gray-900 rounded-lg text-[10px] font-black whitespace-nowrap shadow-lg">
                  Already drew!
                </div>
              )}
            </button>

            {/* Discard pile */}
            <div className="relative">
              <div className="absolute -inset-2 bg-yellow-400/20 rounded-2xl blur-xl animate-pulse" />
              <UnoCard card={topCard} highlight />
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-black/60 rounded text-[9px] text-white font-bold whitespace-nowrap backdrop-blur-sm">
                {t('discard')} ({gameState.discardPile.length})
              </div>
            </div>

            {/* Direction & Color Indicator */}
            <div className="absolute -right-16 sm:-right-24 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-white/10 backdrop-blur-sm border-2 border-white/20 flex items-center justify-center shadow-lg">
                <div className="text-xl sm:text-3xl">{dirArrow}</div>
              </div>
              <div className={cn(
                'w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white shadow-xl',
                colorIndicator[currentColor],
              )} title={`${t('currentColor')}: ${currentColor}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Pass button after drawing */}
      {hasDrawn && (
        <div className="flex justify-center px-4 pt-1">
          <button
            onClick={handlePass}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl text-sm shadow-lg transition-all hover:scale-105 cursor-pointer"
          >
            ⏭ Pass Turn
          </button>
        </div>
      )}

      {/* UNO Catch buttons */}
      {!isMyTurn && opponents.some(o => o.hand.length === 1 && !o.isUno) && (
        <div className="flex justify-center gap-2 px-4 pt-1 flex-wrap">
          {opponents.filter(o => o.hand.length === 1 && !o.isUno).map(o => (
            <button
              key={o.email}
              onClick={() => handleCatchUno(o.email)}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-black rounded-xl text-xs shadow-lg animate-pulse transition-all hover:scale-105 cursor-pointer"
            >
              🚨 Catch {o.name} (no UNO!)
            </button>
          ))}
        </div>
      )}

      {/* Message bar */}
      <div className="flex items-center justify-center px-4 py-2 flex-wrap gap-2">
        <div className={cn(
          'px-6 py-2 rounded-xl text-sm font-bold max-w-lg text-center shadow-lg backdrop-blur-sm',
          isMyTurn
            ? 'bg-yellow-400 text-gray-900 border-2 border-yellow-500'
            : theme === 'light'
              ? 'bg-white border border-gray-200 text-gray-700'
              : 'bg-black/40 text-white border border-white/20',
        )}>
          {isMyTurn ? `🎯 ${t('yourTurnPlay')}` : gameState.message}
        </div>
        {gameState.lastAction && (
          <div className={cn(
            "px-4 py-1.5 rounded-lg text-xs border font-medium",
            theme === 'light'
              ? "bg-gray-100 border-gray-200 text-gray-600"
              : "bg-black/40 backdrop-blur-sm text-gray-200 border-white/10"
          )}>
            {gameState.lastAction}
          </div>
        )}
      </div>

      {/* Player's hand — hidden once they've finished */}
      {myPlayer ? (
        <div className="px-2 sm:px-4 pb-6 sm:pb-8 pt-1 overflow-visible">
          <div className="flex items-center justify-between mb-1 px-1 sm:px-2">
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg border-2 border-white/30">
                <span className="text-sm">{user.avatar}</span>
              </div>
              <span className={cn(
                'px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-bold shadow-md',
                isMyTurn
                  ? 'bg-yellow-400 text-gray-900'
                  : theme === 'light' ? 'bg-gray-200 text-gray-700' : 'bg-gray-700/80 text-gray-200',
              )}>
                {user.name}
              </span>
              <span className={cn(
                "px-1.5 sm:px-2 py-1 rounded text-xs font-bold border",
                theme === 'light' ? "bg-gray-100 text-gray-700 border-gray-200" : "bg-black/40 backdrop-blur-sm text-white border-white/10"
              )}>
                {myPlayer.hand.length} {myPlayer.hand.length === 1 ? t('card') : t('cards')}
              </span>
              {myPlayer.hand.length === 1 && (
                <span className="px-2 py-1 bg-red-500 text-white font-black text-xs animate-pulse rounded shadow-lg">
                  {t('uno')}! 🔥
                </span>
              )}
            </div>
          </div>
          <PlayerHand
            cards={myPlayer.hand}
            playableCardIds={playableCardIds}
            onCardClick={handleCardClick}
            isCurrentPlayer={isMyTurn}
          />
        </div>
      ) : myRankEntry && gameState.phase === 'playing' ? (
        <div className="flex justify-center py-4 pb-8">
          <div className={cn(
            "px-6 py-3 rounded-2xl text-sm font-bold border",
            theme === 'light' ? "bg-white border-gray-200 text-gray-600" : "bg-white/10 border-white/20 text-gray-300"
          )}>
            👀 Watching the rest of the game... {rankEmoji(myRankEntry.rank)} You finished #{myRankEntry.rank}!
          </div>
        </div>
      ) : null}
    </div>
  );
}
