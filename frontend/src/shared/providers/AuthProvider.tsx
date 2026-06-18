'use client';

/**
 * ═══════════════════════════════════════════════════════════════
 * SENTINEL — Ephemeral Auth Provider
 * ═══════════════════════════════════════════════════════════════
 *
 * Holds the JWT access token in React Context (RAM only).
 * Per SENTINEL_ARCHITECTURE.md §1:
 *   "Financial/KYC data must reside in RAM (Redux/Context)
 *    client-side. NEVER use IndexedDB or LocalStorage."
 *
 * This replaces all localStorage.getItem('token') usage.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { supabaseClient } from '@/shared/lib/supabase.client';
import { setAccessToken } from '@/shared/lib/api-client';

// ── Types ────────────────────────────────────────────────────

interface AuthUser {
  id: string;
  email: string | undefined;
}

interface AuthContextValue {
  /** The currently authenticated user, or null. */
  user: AuthUser | null;
  /** Whether we are still loading the initial session. */
  loading: boolean;
  /** Sign out and clear the ephemeral token. */
  signOut: () => Promise<void>;
}

// ── Context ──────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

// ── Provider ─────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync the Supabase session token into the in-memory api-client
  const syncToken = useCallback((accessToken: string | null) => {
    setAccessToken(accessToken);
  }, []);

  useEffect(() => {
    // 1. Get the initial session
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email });
        syncToken(session.access_token);
      }
      setLoading(false);
    });

    // 2. Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setUser({ id: session.user.id, email: session.user.email });
          syncToken(session.access_token);
        } else {
          setUser(null);
          syncToken(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [syncToken]);

  const signOut = useCallback(async () => {
    await supabaseClient.auth.signOut();
    setUser(null);
    syncToken(null);
  }, [syncToken]);

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
