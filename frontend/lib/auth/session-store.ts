import { AuthResponse, User } from "@/lib/types";

/**
 * The signed-in session, persisted in localStorage so it survives reloads.
 * Shaped as an external store for React's useSyncExternalStore: the server
 * (and the first client render) sees `undefined`, meaning "not known yet",
 * which avoids a hydration mismatch.
 */

export interface Session {
  token: string;
  expiresAt: string;
  user: User;
}

const STORAGE_KEY = "macrocenter.session";

let cached: Session | null | undefined;
const listeners = new Set<() => void>();

function readStorage(): Session | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const session = JSON.parse(raw) as Session;
    if (!session.token || new Date(session.expiresAt).getTime() <= Date.now()) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

function writeStorage(session: Session | null) {
  try {
    if (session) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Private mode or blocked storage: the session still lasts for this tab.
  }
}

function emit() {
  for (const listener of listeners) listener();
}

export function getSessionSnapshot(): Session | null {
  if (cached === undefined) cached = readStorage();
  return cached;
}

export function getServerSessionSnapshot(): Session | null | undefined {
  return undefined;
}

export function subscribeToSession(listener: () => void): () => void {
  listeners.add(listener);

  // Keep tabs in sync: signing out in one tab signs out the others.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    cached = readStorage();
    listener();
  };
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function setSession(auth: AuthResponse | null) {
  cached = auth ? { token: auth.token, expiresAt: auth.expiresAt, user: auth.user } : null;
  writeStorage(cached);
  emit();
}

/** Replaces the stored user (e.g. after a profile edit) and keeps the token. */
export function updateSessionUser(user: User) {
  const current = getSessionSnapshot();
  if (!current) return;
  cached = { ...current, user };
  writeStorage(cached);
  emit();
}
