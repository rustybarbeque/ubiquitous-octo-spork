"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import { ApiError } from "@/lib/api-client";
import * as authService from "@/lib/services/auth-service";
import {
  getServerSessionSnapshot,
  getSessionSnapshot,
  setSession,
  subscribeToSession,
  updateSessionUser,
} from "@/lib/auth/session-store";
import { User } from "@/lib/types";

type AuthStatus = "loading" | "signed-in" | "signed-out";

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<User>;
  register: (input: authService.RegisterInput) => Promise<User>;
  logout: () => void;
  /** Swap in a fresher copy of the user, e.g. after editing the profile. */
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const session = useSyncExternalStore(subscribeToSession, getSessionSnapshot, getServerSessionSnapshot);
  const token = session?.token ?? null;

  // Re-check a remembered token once per page load: the account may have been
  // deleted or its role changed since it was issued.
  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    authService
      .getCurrentUser(token)
      .then((user) => {
        if (!cancelled) updateSessionUser(user);
      })
      .catch((error) => {
        if (cancelled) return;
        if (error instanceof ApiError && (error.status === 401 || error.status === 404)) {
          setSession(null);
        }
        // Any other failure (API down) keeps the session; the next request decides.
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    const auth = await authService.login(email, password);
    setSession(auth);
    return auth.user;
  }, []);

  const register = useCallback(async (input: authService.RegisterInput) => {
    const auth = await authService.register(input);
    setSession(auth);
    return auth.user;
  }, []);

  const logout = useCallback(() => setSession(null), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status: session === undefined ? "loading" : session ? "signed-in" : "signed-out",
      user: session?.user ?? null,
      token,
      login,
      register,
      logout,
      setUser: updateSessionUser,
    }),
    [session, token, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>.");
  return context;
}
