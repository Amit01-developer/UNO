import { UserAccount } from '../types';
import { db } from './firebase';
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';

const SESSION_KEY = 'uno_session';

// ─── Firestore helpers ────────────────────────────────────────────────────────

async function getUserFromDB(email: string): Promise<UserAccount | null> {
  try {
    const docRef = doc(db, 'users', email);
    const snap = await getDoc(docRef);
    return snap.exists() ? (snap.data() as UserAccount) : null;
  } catch {
    return null;
  }
}

async function saveUserToDB(user: UserAccount): Promise<void> {
  try {
    await setDoc(doc(db, 'users', user.email), {
      email: user.email,
      password: user.password, // NOTE: hash karna better hai production mein
      name: user.name,
      avatar: user.avatar,
      createdAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error('DB save error:', e);
  }
}

async function emailExistsInDB(email: string): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, 'users', email));
    return snap.exists();
  } catch {
    return false;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function registerUser(
  email: string,
  password: string,
  name: string,
  avatar: string
): Promise<{ success: boolean; error?: string }> {
  const emailLower = email.toLowerCase().trim();

  if (!emailLower || !password || !name.trim()) {
    return { success: false, error: 'Please fill all fields!' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) {
    return { success: false, error: 'Please enter a valid email!' };
  }
  if (password.length < 4) {
    return { success: false, error: 'Password must be at least 4 characters!' };
  }
  if (name.trim().length < 2) {
    return { success: false, error: 'Name must be at least 2 characters!' };
  }

  const exists = await emailExistsInDB(emailLower);
  if (exists) {
    return { success: false, error: 'This email is already registered!' };
  }

  const user: UserAccount = { email: emailLower, password, name: name.trim(), avatar };
  await saveUserToDB(user);
  setSession(user);
  return { success: true };
}

export async function loginUser(
  email: string,
  password: string
): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
  const emailLower = email.toLowerCase().trim();
  const user = await getUserFromDB(emailLower);

  if (!user || user.password !== password) {
    return { success: false, error: 'Incorrect email or password!' };
  }

  setSession(user);
  return { success: true, user };
}

// ─── Session (localStorage) ───────────────────────────────────────────────────

export function setSession(user: UserAccount) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function getSession(): UserAccount | null {
  try {
    const data = localStorage.getItem(SESSION_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}
