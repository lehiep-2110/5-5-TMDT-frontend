'use client';

import { create } from 'zustand';
import Cookies from 'js-cookie';
import type { User } from './types';

const ACCESS_TOKEN_KEY = 'accessToken';
const USER_KEY = 'authUser';

interface AuthState {
  accessToken: string | null;
  user: User | null;
  hydrated: boolean;
  setAuth: (token: string, user: User) => void;
  setUser: (user: User | null) => void;
  setAccessToken: (token: string | null) => void;
  clear: () => void;
  logout: () => void;
  hydrate: () => void;
}

function readTokenFromStorage(): string | null {
  if (typeof window === 'undefined') return null;
  const ls = window.localStorage.getItem(ACCESS_TOKEN_KEY);
  if (ls) return ls;
  const cookie = Cookies.get(ACCESS_TOKEN_KEY);
  return cookie ?? null;
}

function readUserFromStorage(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function writeToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
    Cookies.set(ACCESS_TOKEN_KEY, token, { sameSite: 'lax' });
  } else {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    Cookies.remove(ACCESS_TOKEN_KEY);
  }
}

function writeUser(user: User | null) {
  if (typeof window === 'undefined') return;
  if (user) {
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    window.localStorage.removeItem(USER_KEY);
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  hydrated: false,
  setAuth: (token, user) => {
    writeToken(token);
    writeUser(user);
    set({ accessToken: token, user });
  },
  setUser: (user) => {
    writeUser(user);
    set({ user });
  },
  setAccessToken: (token) => {
    writeToken(token);
    set({ accessToken: token });
  },
  clear: () => {
    writeToken(null);
    writeUser(null);
    set({ accessToken: null, user: null });
  },
  logout: () => {
    writeToken(null);
    writeUser(null);
    set({ accessToken: null, user: null });
  },
  hydrate: () => {
    const token = readTokenFromStorage();
    const user = readUserFromStorage();
    set({ accessToken: token, user, hydrated: true });
  },
}));

// Non-hook helper for axios interceptor access.
export function getAuthSnapshot() {
  return useAuthStore.getState();
}
