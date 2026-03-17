import { RoomData, RoomPlayer, GameState } from '../types';
import { db } from './firebase';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';

const ROOMS_COL = 'rooms';

// ─── Create Room ──────────────────────────────────────────────────────────────

export async function createRoom(
  hostEmail: string,
  hostName: string,
  hostAvatar: string,
  maxPlayers: number
): Promise<RoomData> {
  const pin = Math.floor(100000 + Math.random() * 900000).toString();

  const room: RoomData = {
    roomPin: pin,
    hostEmail,
    hostName,
    maxPlayers,
    players: [{ email: hostEmail, name: hostName, avatar: hostAvatar, ready: true }],
    gameState: null,
    status: 'waiting',
    createdAt: Date.now(),
  };

  await setDoc(doc(db, ROOMS_COL, pin), { ...room, updatedAt: serverTimestamp() });
  return room;
}

// ─── Get Room (one-time) ──────────────────────────────────────────────────────

export async function getRoom(pin: string): Promise<RoomData | null> {
  try {
    const snap = await getDoc(doc(db, ROOMS_COL, pin));
    return snap.exists() ? (snap.data() as RoomData) : null;
  } catch {
    return null;
  }
}

// ─── Join Room ────────────────────────────────────────────────────────────────

export async function joinRoom(
  pin: string,
  player: RoomPlayer
): Promise<{ success: boolean; room?: RoomData; error?: string }> {
  const room = await getRoom(pin);

  if (!room) return { success: false, error: 'Room not found! Check PIN.' };
  if (room.status !== 'waiting') return { success: false, error: 'Game already started!' };
  if (room.players.length >= room.maxPlayers && !room.players.find(p => p.email === player.email)) {
    return { success: false, error: 'Room is full!' };
  }

  let updatedPlayers: RoomPlayer[];
  if (room.players.find(p => p.email === player.email)) {
    updatedPlayers = room.players.map(p => p.email === player.email ? player : p);
  } else {
    updatedPlayers = [...room.players, player];
  }

  await updateDoc(doc(db, ROOMS_COL, pin), {
    players: updatedPlayers,
    updatedAt: serverTimestamp(),
  });

  return { success: true, room: { ...room, players: updatedPlayers } };
}

// ─── Leave Room ───────────────────────────────────────────────────────────────

export async function leaveRoom(pin: string, email: string): Promise<void> {
  const room = await getRoom(pin);
  if (!room) return;

  // Host left → delete room
  if (room.hostEmail === email) {
    await deleteDoc(doc(db, ROOMS_COL, pin));
    return;
  }

  const updatedPlayers = room.players.filter(p => p.email !== email);
  if (updatedPlayers.length === 0) {
    await deleteDoc(doc(db, ROOMS_COL, pin));
  } else {
    await updateDoc(doc(db, ROOMS_COL, pin), {
      players: updatedPlayers,
      updatedAt: serverTimestamp(),
    });
  }
}

// ─── Start Game ───────────────────────────────────────────────────────────────

export async function startRoomGame(pin: string, gameState: GameState): Promise<void> {
  await updateDoc(doc(db, ROOMS_COL, pin), {
    gameState,
    status: 'playing',
    updatedAt: serverTimestamp(),
  });
}

// ─── Update Game State ────────────────────────────────────────────────────────

export async function updateRoomGameState(pin: string, gameState: GameState): Promise<void> {
  await updateDoc(doc(db, ROOMS_COL, pin), {
    gameState,
    status: gameState.phase === 'game-over' ? 'finished' : 'playing',
    updatedAt: serverTimestamp(),
  });
}

// ─── Real-time Listener ───────────────────────────────────────────────────────

export function subscribeToRoom(
  pin: string,
  callback: (room: RoomData | null) => void
): Unsubscribe {
  return onSnapshot(doc(db, ROOMS_COL, pin), (snap) => {
    callback(snap.exists() ? (snap.data() as RoomData) : null);
  });
}

// ─── Delete Room ──────────────────────────────────────────────────────────────

export async function deleteRoom(pin: string): Promise<void> {
  await deleteDoc(doc(db, ROOMS_COL, pin));
}
