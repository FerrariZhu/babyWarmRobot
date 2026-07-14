'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { AuthUser } from '@/lib/lessons/types';

const STORAGE_KEY = 'lessons_auth';

type StoredAuth = {
  accessToken: string;
  user: AuthUser;
};

type LessonsAuthContextValue = {
  accessToken: string | null;
  user: AuthUser | null;
  setAuth: (data: StoredAuth | null) => void;
  logout: () => void;
};

const LessonsAuthContext = createContext<LessonsAuthContextValue | null>(null);

function readStored(): StoredAuth | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredAuth;
  } catch {
    return null;
  }
}

export function LessonsAuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuthState] = useState<StoredAuth | null>(() => readStored());

  const setAuth = useCallback((data: StoredAuth | null) => {
    setAuthState(data);
    if (data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const logout = useCallback(() => setAuth(null), [setAuth]);

  const value = useMemo(
    () => ({
      accessToken: auth?.accessToken ?? null,
      user: auth?.user ?? null,
      setAuth,
      logout,
    }),
    [auth, setAuth, logout],
  );

  return (
    <LessonsAuthContext.Provider value={value}>{children}</LessonsAuthContext.Provider>
  );
}

export function useLessonsAuth() {
  const ctx = useContext(LessonsAuthContext);
  if (!ctx) {
    throw new Error('useLessonsAuth must be used within LessonsAuthProvider');
  }
  return ctx;
}
