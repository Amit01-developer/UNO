export type CardColor = 'red' | 'blue' | 'green' | 'yellow';
export type WildColor = 'wild';
export type AnyColor = CardColor | WildColor;

export type CardValue =
  | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
  | 'skip' | 'reverse' | 'draw2'
  | 'wild' | 'wild4';

export interface Card {
  id: string;
  color: AnyColor;
  value: CardValue;
  chosenColor?: CardColor;
}

export type Direction = 1 | -1;

export interface Player {
  id: string;
  name: string;
  email: string;
  avatar: string;
  hand: Card[];
  isUno: boolean;
  connected: boolean;
}

export interface GameState {
  players: Player[];
  drawPile: Card[];
  discardPile: Card[];
  currentPlayerIndex: number;
  direction: Direction;
  phase: 'waiting' | 'playing' | 'choosing-color' | 'game-over';
  winner: string | null;
  message: string;
  pendingCard: Card | null;
  lastAction: string;
}

export interface UserAccount {
  email: string;
  password: string;
  name: string;
  avatar: string;
}

export interface RoomData {
  roomPin: string;
  hostEmail: string;
  hostName: string;
  maxPlayers: number;
  players: RoomPlayer[];
  gameState: GameState | null;
  status: 'waiting' | 'playing' | 'finished';
  createdAt: number;
}

export interface RoomPlayer {
  email: string;
  name: string;
  avatar: string;
  ready: boolean;
}

// BroadcastChannel message types
export type RoomMessage =
  | { type: 'player-joined'; player: RoomPlayer; roomPin: string }
  | { type: 'player-left'; email: string; roomPin: string }
  | { type: 'game-start'; gameState: GameState; roomPin: string }
  | { type: 'game-update'; gameState: GameState; roomPin: string }
  | { type: 'room-closed'; roomPin: string }
  | { type: 'player-ready'; email: string; roomPin: string }
  | { type: 'request-sync'; roomPin: string; email: string }
  | { type: 'sync-response'; room: RoomData; roomPin: string };

export type AppScreen = 'login' | 'register' | 'lobby' | 'room' | 'game' | 'ai-game';
