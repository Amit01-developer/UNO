import { Card, CardColor, CardValue, AnyColor, GameState, Player, Direction, RoomPlayer } from './types';

let cardIdCounter = 0;

function createCard(color: AnyColor, value: CardValue): Card {
  return { id: `card-${cardIdCounter++}`, color, value };
}

export function createDeck(): Card[] {
  cardIdCounter = 0;
  const colors: CardColor[] = ['red', 'blue', 'green', 'yellow'];
  const deck: Card[] = [];

  for (const color of colors) {
    deck.push(createCard(color, '0'));
    const values: CardValue[] = ['1','2','3','4','5','6','7','8','9','skip','reverse','draw2'];
    for (const value of values) {
      deck.push(createCard(color, value));
      deck.push(createCard(color, value));
    }
  }

  for (let i = 0; i < 4; i++) {
    deck.push(createCard('wild', 'wild'));
    deck.push(createCard('wild', 'wild4'));
  }

  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function dealCards(deck: Card[], numPlayers: number, cardsPerPlayer: number = 7): { hands: Card[][]; remaining: Card[] } {
  const hands: Card[][] = Array.from({ length: numPlayers }, () => []);
  let deckIndex = 0;

  for (let c = 0; c < cardsPerPlayer; c++) {
    for (let p = 0; p < numPlayers; p++) {
      hands[p].push(deck[deckIndex++]);
    }
  }

  return { hands, remaining: deck.slice(deckIndex) };
}

export function canPlayCard(card: Card, topCard: Card): boolean {
  if (card.color === 'wild' && card.value !== 'wild4') return true;
  const topColor = topCard.chosenColor || topCard.color;
  if (card.color === topColor) return true;
  if (card.value === topCard.value) return true;
  return false;
}

// Wild4 can only be played if player has NO card matching current color
export function canPlayWild4(hand: Card[], topCard: Card): boolean {
  const topColor = topCard.chosenColor || topCard.color;
  return !hand.some(c => c.color !== 'wild' && c.color === topColor);
}

export function getPlayableCards(hand: Card[], topCard: Card): Card[] {
  return hand.filter(card => {
    if (card.value === 'wild4') return canPlayWild4(hand, topCard);
    return canPlayCard(card, topCard);
  });
}

export function getNextPlayerIndex(currentIndex: number, direction: Direction, numPlayers: number): number {
  return ((currentIndex + direction) % numPlayers + numPlayers) % numPlayers;
}

export function drawCardsFromPile(drawPile: Card[], discardPile: Card[], count: number): { drawn: Card[]; newDrawPile: Card[]; newDiscardPile: Card[] } {
  let pile = [...drawPile];
  let discard = [...discardPile];
  const drawn: Card[] = [];

  for (let i = 0; i < count; i++) {
    if (pile.length === 0) {
      if (discard.length <= 1) break;
      const topCard = discard[discard.length - 1];
      const toShuffle = discard.slice(0, -1).map(c => ({
        ...c,
        chosenColor: undefined
      }));
      pile = shuffleDeck(toShuffle);
      discard = [topCard];
    }
    drawn.push(pile.pop()!);
  }

  return { drawn, newDrawPile: pile, newDiscardPile: discard };
}

export function initializeMultiplayerGame(roomPlayers: RoomPlayer[]): GameState {
  const deck = shuffleDeck(createDeck());
  const numPlayers = roomPlayers.length;
  const { hands, remaining } = dealCards(deck, numPlayers);

  const players: Player[] = roomPlayers.map((rp, i) => ({
    id: rp.email,
    name: rp.name,
    email: rp.email,
    avatar: rp.avatar,
    hand: hands[i],
    isUno: false,
    connected: true,
  }));

  let drawPile = remaining;
  let startCard: Card | undefined;
  const startIndex = drawPile.findIndex(c => c.color !== 'wild' && !['skip', 'reverse', 'draw2'].includes(c.value));

  if (startIndex >= 0) {
    startCard = drawPile[startIndex];
    drawPile = [...drawPile.slice(0, startIndex), ...drawPile.slice(startIndex + 1)];
  } else {
    startCard = drawPile.pop()!;
  }

  return {
    players,
    drawPile,
    discardPile: [startCard],
    currentPlayerIndex: 0,
    direction: 1,
    phase: 'playing',
    winner: null,
    message: `${players[0].name}'s turn!`,
    pendingCard: null,
    lastAction: 'Game started! 🎉',
    rankings: [],
    drawnCardId: null,
  };
}

export function playCard(state: GameState, cardId: string, chosenColor?: CardColor): GameState {
  const newState = { ...state };
  const player = { ...newState.players[newState.currentPlayerIndex] };
  player.hand = [...player.hand];

  const cardIndex = player.hand.findIndex(c => c.id === cardId);
  if (cardIndex === -1) return state;

  let card = { ...player.hand[cardIndex] };
  player.hand.splice(cardIndex, 1);

  if (card.color === 'wild' && chosenColor) {
    card.chosenColor = chosenColor;
  }

  const newPlayers = [...newState.players];
  newPlayers[newState.currentPlayerIndex] = player;

  const newDiscardPile = [...newState.discardPile, card];
  let newDrawPile = [...newState.drawPile];
  let direction = newState.direction;
  let nextPlayerIndex = newState.currentPlayerIndex;
  let lastAction = `${player.name} played ${getCardDisplayName(card)}`;

  // Check for winner
  if (player.hand.length === 0) {
    const nextRank = (newState.rankings?.length ?? 0) + 1;
    const updatedRankings = [
      ...(newState.rankings ?? []),
      { rank: nextRank, name: player.name, avatar: player.avatar, email: player.email },
    ];

    // Remove finished player from active players
    const remainingPlayers = newPlayers.filter(p => p.email !== player.email);

    // If only 1 player left, they get last rank and game is over
    if (remainingPlayers.length <= 1) {
      const lastPlayer = remainingPlayers[0];
      const finalRankings = lastPlayer
        ? [...updatedRankings, { rank: nextRank + 1, name: lastPlayer.name, avatar: lastPlayer.avatar, email: lastPlayer.email }]
        : updatedRankings;
      return {
        ...newState,
        players: remainingPlayers,
        discardPile: newDiscardPile,
        rankings: finalRankings,
        phase: 'game-over',
        winner: player.id,
        message: `🎉 ${player.name} won! UNO Champion!`,
        lastAction,
      };
    }

    // Game continues with remaining players
    // Fix currentPlayerIndex after removing finished player
    const removedIndex = newState.currentPlayerIndex;
    let nextIdx = getNextPlayerIndex(removedIndex, newState.direction, newPlayers.length);
    // Adjust index for removed player
    const removedPlayerIndex = newPlayers.findIndex(p => p.email === player.email);
    if (nextIdx > removedPlayerIndex) nextIdx--;
    else if (nextIdx === removedPlayerIndex) nextIdx = nextIdx % remainingPlayers.length;
    const safeNextIdx = nextIdx % remainingPlayers.length;

    const nextPlayer = remainingPlayers[safeNextIdx];
    return {
      ...newState,
      players: remainingPlayers,
      drawPile: newDrawPile,
      discardPile: newDiscardPile,
      currentPlayerIndex: safeNextIdx,
      direction,
      rankings: updatedRankings,
      phase: 'playing',
      winner: null,
      message: `🏅 ${player.name} finished #${nextRank}! Now ${nextPlayer.name}'s turn!`,
      lastAction: `🏅 ${player.name} finished in rank #${nextRank}!`,
      pendingCard: null,
      drawnCardId: null,
    };
  }

  // UNO check
  if (player.hand.length === 1) {
    player.isUno = true;
    lastAction += ' - UNO! 🎴';
  }

  // Handle special cards
  if (card.value === 'reverse') {
    direction = (direction * -1) as Direction;
    if (newPlayers.length === 2) {
      // In 2-player, Reverse acts like Skip — current player plays again
      nextPlayerIndex = newState.currentPlayerIndex;
    } else {
      nextPlayerIndex = getNextPlayerIndex(newState.currentPlayerIndex, direction, newPlayers.length);
    }
  } else if (card.value === 'skip') {
    nextPlayerIndex = getNextPlayerIndex(nextPlayerIndex, direction, newPlayers.length);
    const skippedPlayer = newPlayers[nextPlayerIndex];
    lastAction += ` - ${skippedPlayer.name} skip!`;
    nextPlayerIndex = getNextPlayerIndex(nextPlayerIndex, direction, newPlayers.length);
  } else if (card.value === 'draw2') {
    nextPlayerIndex = getNextPlayerIndex(nextPlayerIndex, direction, newPlayers.length);
    const targetPlayer = { ...newPlayers[nextPlayerIndex] };
    const { drawn, newDrawPile: updatedDraw } = drawCardsFromPile(newDrawPile, newDiscardPile, 2);
    targetPlayer.hand = [...targetPlayer.hand, ...drawn];
    newPlayers[nextPlayerIndex] = targetPlayer;
    newDrawPile = updatedDraw;
    lastAction += ` - ${targetPlayer.name} ko +2 cards!`;
    nextPlayerIndex = getNextPlayerIndex(nextPlayerIndex, direction, newPlayers.length);
  } else if (card.value === 'wild4') {
    nextPlayerIndex = getNextPlayerIndex(nextPlayerIndex, direction, newPlayers.length);
    const targetPlayer = { ...newPlayers[nextPlayerIndex] };
    const { drawn, newDrawPile: updatedDraw } = drawCardsFromPile(newDrawPile, newDiscardPile, 4);
    targetPlayer.hand = [...targetPlayer.hand, ...drawn];
    newPlayers[nextPlayerIndex] = targetPlayer;
    newDrawPile = updatedDraw;
    lastAction += ` - ${targetPlayer.name} ko +4 cards!`;
    nextPlayerIndex = getNextPlayerIndex(nextPlayerIndex, direction, newPlayers.length);
  } else {
    nextPlayerIndex = getNextPlayerIndex(nextPlayerIndex, direction, newPlayers.length);
  }

  const nextPlayer = newPlayers[nextPlayerIndex];
  const message = `${nextPlayer.name}'s turn!`;

  return {
    ...newState,
    players: newPlayers,
    drawPile: newDrawPile,
    discardPile: newDiscardPile,
    currentPlayerIndex: nextPlayerIndex,
    direction,
    message,
    lastAction,
    pendingCard: null,
    drawnCardId: null,
  };
}

export function drawCardAction(state: GameState): GameState {
  const player = { ...state.players[state.currentPlayerIndex] };
  const { drawn, newDrawPile, newDiscardPile } = drawCardsFromPile(state.drawPile, state.discardPile, 1);

  if (drawn.length === 0) return state;

  player.hand = [...player.hand, ...drawn];
  player.isUno = false;

  const newPlayers = [...state.players];
  newPlayers[state.currentPlayerIndex] = player;

  const topCard = newDiscardPile[newDiscardPile.length - 1];
  const drawnCard = drawn[0];

  // Check if drawn card is playable (wild4 needs special check)
  const drawnPlayable = drawnCard.value === 'wild4'
    ? canPlayWild4(player.hand, topCard)
    : canPlayCard(drawnCard, topCard);

  if (drawnPlayable) {
    // Player can play the drawn card — lock to only that card
    return {
      ...state,
      players: newPlayers,
      drawPile: newDrawPile,
      discardPile: newDiscardPile,
      drawnCardId: drawnCard.id,
      message: `${player.name} drew a card. Can play it or pass!`,
      lastAction: `${player.name} drew a card`,
    };
  }

  // Can't play drawn card, move to next player
  const nextPlayerIndex = getNextPlayerIndex(state.currentPlayerIndex, state.direction, newPlayers.length);
  const nextPlayer = newPlayers[nextPlayerIndex];

  return {
    ...state,
    players: newPlayers,
    drawPile: newDrawPile,
    discardPile: newDiscardPile,
    currentPlayerIndex: nextPlayerIndex,
    drawnCardId: null,
    message: `${nextPlayer.name}'s turn!`,
    lastAction: `${player.name} drew a card and passed`,
  };
}

export function getCardDisplayName(card: Card): string {
  const colorNames: Record<string, string> = {
    red: '🔴', blue: '🔵', green: '🟢', yellow: '🟡', wild: '🌈'
  };
  const valueNames: Record<string, string> = {
    skip: '⊘', reverse: '⟲', draw2: '+2', wild: 'W', wild4: '+4',
  };

  const color = colorNames[card.chosenColor || card.color] || '';
  const value = valueNames[card.value] || card.value;
  return `${color} ${value}`;
}

// Generate a 6-digit room PIN
export function generateRoomPin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ============ AI GAME LOGIC ============

const botNames = [
  { name: 'SkipMachine', avatar: '⚡' },
  { name: 'CardKing', avatar: '👑' },
  { name: 'WildMaster', avatar: '🎯' },
  { name: 'SkipMachine', avatar: '⚡' },
  { name: 'CardKing', avatar: '👑' },
];

export function initializeAIGame(playerName: string, playerEmail: string, playerAvatar: string, botCount: number): GameState {
  const deck = shuffleDeck(createDeck());
  const numPlayers = 1 + botCount;
  const { hands, remaining } = dealCards(deck, numPlayers);

  const players: Player[] = [];

  // Add human player
  players.push({
    id: playerEmail,
    name: playerName,
    email: playerEmail,
    avatar: playerAvatar,
    hand: hands[0],
    isUno: false,
    connected: true,
  });

  // Add bots
  for (let i = 0; i < botCount; i++) {
    const bot = botNames[i % botNames.length];
    players.push({
      id: `bot-${i}`,
      name: `${bot.name} ${bot.avatar}`,
      email: `bot-${i}@ai`,
      avatar: bot.avatar,
      hand: hands[i + 1],
      isUno: false,
      connected: true,
    });
  }

  let drawPile = remaining;
  let startCard: Card | undefined;
  const startIndex = drawPile.findIndex(c => c.color !== 'wild' && !['skip', 'reverse', 'draw2'].includes(c.value));

  if (startIndex >= 0) {
    startCard = drawPile[startIndex];
    drawPile = [...drawPile.slice(0, startIndex), ...drawPile.slice(startIndex + 1)];
  } else {
    startCard = drawPile.pop()!;
  }

  return {
    players,
    drawPile,
    discardPile: [startCard],
    currentPlayerIndex: 0,
    direction: 1,
    phase: 'playing',
    winner: null,
    message: `${players[0].name}, your turn! 🎮`,
    pendingCard: null,
    lastAction: 'AI Game started! 🤖🎉',
    rankings: [],
    drawnCardId: null,
  };
}

export function isBot(player: Player): boolean {
  return player.email.endsWith('@ai');
}

export function getBotMove(state: GameState): GameState {
  const currentPlayer = state.players[state.currentPlayerIndex];
  if (!isBot(currentPlayer)) return state;

  const topCard = state.discardPile[state.discardPile.length - 1];

  // If bot already drew a card this turn, play it if possible, else pass
  if (state.drawnCardId) {
    const drawnCard = currentPlayer.hand.find(c => c.id === state.drawnCardId);
    if (drawnCard) {
      const canPlay = drawnCard.value === 'wild4'
        ? canPlayWild4(currentPlayer.hand, topCard)
        : canPlayCard(drawnCard, topCard);
      if (canPlay) {
        let chosenColor: CardColor | undefined;
        if (drawnCard.color === 'wild') {
          const colorCount: Record<string, number> = { red: 0, blue: 0, green: 0, yellow: 0 };
          currentPlayer.hand.forEach(c => { if (c.color !== 'wild') colorCount[c.color] = (colorCount[c.color] || 0) + 1; });
          const maxColor = Object.entries(colorCount).sort((a, b) => b[1] - a[1])[0];
          chosenColor = (maxColor[0] as CardColor) || 'red';
        }
        return playCard(state, drawnCard.id, chosenColor);
      }
    }
    // Can't play drawn card — pass turn
    const nextPlayerIndex = getNextPlayerIndex(state.currentPlayerIndex, state.direction, state.players.length);
    const nextPlayer = state.players[nextPlayerIndex];
    return {
      ...state,
      currentPlayerIndex: nextPlayerIndex,
      drawnCardId: null,
      message: `${nextPlayer.name}'s turn!`,
      lastAction: `${currentPlayer.name} drew and passed`,
    };
  }

  const playable = getPlayableCards(currentPlayer.hand, topCard);

  if (playable.length === 0) {
    return drawCardAction(state);
  }

  // AI Strategy: Prefer action cards, then match color, then wild
  const actionCards = playable.filter(c => ['skip', 'reverse', 'draw2', 'wild4'].includes(c.value));
  const colorMatch = playable.filter(c => c.color !== 'wild');
  const wilds = playable.filter(c => c.color === 'wild' && c.value !== 'wild4');

  let chosenCard: Card;

  if (currentPlayer.hand.length <= 3 && actionCards.length > 0) {
    chosenCard = actionCards[Math.floor(Math.random() * actionCards.length)];
  } else if (colorMatch.length > 0) {
    const sorted = [...colorMatch].sort((a, b) => {
      const valOrder: Record<string, number> = { 'draw2': 15, 'skip': 14, 'reverse': 13 };
      const aVal = valOrder[a.value] || parseInt(a.value) || 0;
      const bVal = valOrder[b.value] || parseInt(b.value) || 0;
      return bVal - aVal;
    });
    chosenCard = sorted[0];
  } else if (wilds.length > 0) {
    chosenCard = wilds[0];
  } else if (actionCards.length > 0) {
    chosenCard = actionCards[0];
  } else {
    chosenCard = playable[0];
  }

  // Choose color for wild cards
  let chosenColor: CardColor | undefined;
  if (chosenCard.color === 'wild') {
    const colorCount: Record<string, number> = { red: 0, blue: 0, green: 0, yellow: 0 };
    currentPlayer.hand.forEach(c => {
      if (c.color !== 'wild') colorCount[c.color] = (colorCount[c.color] || 0) + 1;
    });
    const maxColor = Object.entries(colorCount).sort((a, b) => b[1] - a[1])[0];
    chosenColor = (maxColor[0] as CardColor) || 'red';
  }

  return playCard(state, chosenCard.id, chosenColor);
}
