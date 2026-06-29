"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Provider, Session, User } from "@supabase/supabase-js";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";

type OAuthProvider = Extract<Provider, "google" | "github" | "discord">;

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  configured: boolean;
  error: string | null;
  signInWithOAuth: (provider: OAuthProvider) => Promise<void>;
  signInWithEmail: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function authRedirectUrl() {
  if (typeof window === "undefined") return undefined;
  const next = `${window.location.pathname}${window.location.search}`;
  return `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
}

function readAuthError(error: unknown) {
  return error instanceof Error ? error.message : "Authentication failed. Try again.";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    const supabase = getSupabaseClient();
    let alive = true;

    supabase.auth
      .getSession()
      .then(({ data, error: sessionError }) => {
        if (!alive) return;
        if (sessionError) setError(sessionError.message);
        setSession(data.session ?? null);
      })
      .catch((sessionError) => {
        if (alive) setError(readAuthError(sessionError));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
      setError(null);
    });

    return () => {
      alive = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signInWithOAuth = useCallback(async (provider: OAuthProvider) => {
    setError(null);
    if (!isSupabaseConfigured) {
      setError("Supabase Auth is not configured for this deployment.");
      return;
    }

    const { error: oauthError } = await getSupabaseClient().auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: authRedirectUrl(),
        queryParams: provider === "google" ? { prompt: "select_account" } : undefined,
      },
    });

    if (oauthError) setError(oauthError.message);
  }, []);

  const signInWithEmail = useCallback(async (email: string) => {
    setError(null);
    if (!isSupabaseConfigured) {
      setError("Supabase Auth is not configured for this deployment.");
      return;
    }

    const { error: emailError } = await getSupabaseClient().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: authRedirectUrl() },
    });

    if (emailError) {
      setError(emailError.message);
      throw emailError;
    }
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    if (!isSupabaseConfigured) return;
    const { error: signOutError } = await getSupabaseClient().auth.signOut();
    if (signOutError) setError(signOutError.message);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user: session?.user ?? null,
    session,
    loading,
    configured: isSupabaseConfigured,
    error,
    signInWithOAuth,
    signInWithEmail,
    signOut,
    clearError: () => setError(null),
  }), [error, loading, session, signInWithEmail, signInWithOAuth, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
