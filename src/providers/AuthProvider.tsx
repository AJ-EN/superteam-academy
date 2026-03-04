'use client';

import {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { supabase } from '@/lib/supabase';
import type { User } from '@/types';

// ─── Context shape ────────────────────────────────────────────────────────────

export interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  walletAddress: string | null;
  /**
   * Authenticate using the currently connected wallet.
   * Fetches or creates a user profile in Supabase keyed by wallet address.
   *
   * TODO (PRODUCTION — SIWS):
   * Replace the anon sign-in with Sign-In With Solana (SIWS):
   *   1. Generate a nonce from the server (POST /api/auth/nonce)
   *   2. Build a SIWS message (EIP-4361 adapted for Solana)
   *   3. Request wallet.signMessage(message)
   *   4. POST signature to /api/auth/verify → server issues a Supabase JWT
   *   5. supabase.auth.setSession({ access_token, refresh_token })
   * This prevents profile hijacking by proving wallet ownership.
   */
  signInWithWallet: () => Promise<void>;
  /**
   * Authenticate via Google OAuth (Supabase provider).
   * Redirects to Google; Supabase handles the callback.
   * After return, `onAuthStateChange` picks up the session automatically.
   *
   * TODO: Create /app/auth/callback/route.ts to exchange the code for a session.
   */
  signInWithGoogle: () => Promise<void>;
  /** Sign out of both wallet (disconnect) and Supabase session. */
  signOut: () => Promise<void>;
  /**
   * Link a wallet address to the currently authenticated user.
   * Used when a user signed in with Google first, then connects a wallet.
   */
  linkWallet: (address: string) => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

const SESSION_WALLET_KEY = 'academy:wallet_address';

interface SupabaseProfileRow extends User {
  wallet_address: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  twitter_url?: string | null;
  github_url?: string | null;
  preferred_language?: 'en' | 'pt-BR' | 'es' | null;
  theme_preference?: 'dark' | 'light' | 'system' | null;
  email_notifications?: boolean | null;
  profile_visibility?: 'public' | 'private' | null;
  show_on_leaderboard?: boolean | null;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { publicKey, connected, disconnect } = useWallet();

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Prevent concurrent sign-in calls when wallet events fire rapidly.
  const signingIn = useRef(false);

  // ── Fetch or create a user profile in Supabase ────────────────────────────

  const fetchOrCreateProfile = useCallback(
    async (supabaseUserId: string, walletAddr: string): Promise<User> => {
      const { data: existing, error: fetchErr } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('wallet_address', walletAddr)
        .maybeSingle<SupabaseProfileRow>();

      if (fetchErr) throw new Error(fetchErr.message);

      if (existing) {
        return {
          id: existing.id,
          walletAddress: existing.wallet_address,
          username: existing.username,
          displayName: existing.display_name,
          avatarUrl: existing.avatar_url,
          bio: existing.bio ?? null,
          twitterUrl: existing.twitter_url ?? null,
          githubUrl: existing.github_url ?? null,
          preferredLanguage: existing.preferred_language ?? undefined,
          themePreference: existing.theme_preference ?? undefined,
          emailNotifications: existing.email_notifications ?? undefined,
          profileVisibility: existing.profile_visibility ?? undefined,
          showOnLeaderboard: existing.show_on_leaderboard ?? undefined,
          xp: existing.xp,
          level: existing.level,
          streak: existing.streak,
          createdAt: existing.created_at,
          updatedAt: existing.updated_at,
        } as User;
      }

      // ── New user — seed profile + streak ──────────────────────────────────
      const defaultUsername = `learner_${walletAddr.slice(0, 6).toLowerCase()}`;
      const now = new Date().toISOString();

      const { data: created, error: createErr } = await supabase
        .from('user_profiles')
        .insert({
          id: supabaseUserId,
          wallet_address: walletAddr,
          username: defaultUsername,
          display_name: defaultUsername,
          avatar_url: null,
          bio: null,
          xp: 0,
          level: 0,
          streak: 0,
          twitter_url: null,
          github_url: null,
          preferred_language: 'en',
          theme_preference: 'dark',
          email_notifications: true,
          profile_visibility: 'public',
          show_on_leaderboard: true,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single<SupabaseProfileRow>();

      if (createErr) throw new Error(createErr.message);

      // Seed streak record
      await supabase.from('streak_data').upsert({
        user_id: supabaseUserId,
        current_streak: 0,
        longest_streak: 0,
        last_activity_date: now.split('T')[0],
        freezes_remaining: 0,
        total_active_days: 0,
      });

      return {
        id: created.id,
        walletAddress: created.wallet_address,
        username: created.username,
        displayName: created.display_name,
        avatarUrl: created.avatar_url,
        bio: created.bio ?? null,
        twitterUrl: created.twitter_url ?? null,
        githubUrl: created.github_url ?? null,
        preferredLanguage: created.preferred_language ?? undefined,
        themePreference: created.theme_preference ?? undefined,
        emailNotifications: created.email_notifications ?? undefined,
        profileVisibility: created.profile_visibility ?? undefined,
        showOnLeaderboard: created.show_on_leaderboard ?? undefined,
        xp: created.xp,
        level: created.level,
        streak: created.streak,
        createdAt: created.created_at,
        updatedAt: created.updated_at,
      } as User;
    },
    [],
  );

  // ── Sign in with connected wallet ─────────────────────────────────────────

  const signInWithWallet = useCallback(async () => {
    if (!publicKey || signingIn.current) return;
    signingIn.current = true;
    setIsLoading(true);

    try {
      const walletAddr = publicKey.toBase58();

      // Get or create an anonymous Supabase session.
      // In production, replace with SIWS signature verification (see JSDoc above).
      let sessionUserId: string;

      const { data: sessionData } = await supabase.auth.getSession();

      if (sessionData.session?.user) {
        sessionUserId = sessionData.session.user.id;
      } else {
        const { data: anonData, error: anonErr } =
          await supabase.auth.signInAnonymously();
        if (anonErr || !anonData.user) throw new Error(anonErr?.message ?? 'Anon sign-in failed');
        sessionUserId = anonData.user.id;
      }

      const profile = await fetchOrCreateProfile(sessionUserId, walletAddr);
      setUser(profile);

      if (typeof window !== 'undefined') {
        localStorage.setItem(SESSION_WALLET_KEY, walletAddr);
      }
    } catch (e) {
      console.error('[AuthProvider] signInWithWallet:', e);
    } finally {
      setIsLoading(false);
      signingIn.current = false;
    }
  }, [publicKey, fetchOrCreateProfile]);

  // ── Auto sign-in when wallet connects ────────────────────────────────────

  useEffect(() => {
    if (connected && publicKey && !user) {
      signInWithWallet();
    }
    if (!connected && user?.walletAddress) {
      // Wallet was disconnected — only clear if auth was wallet-based.
      // Google auth users keep their session.
      const { data: { session } } = supabase.auth.getSession() as unknown as { data: { session: { user: { app_metadata?: { provider?: string } } } | null } };
      if (!session?.user?.app_metadata?.provider || session?.user?.app_metadata?.provider === 'anon') {
        setUser(null);
        if (typeof window !== 'undefined') localStorage.removeItem(SESSION_WALLET_KEY);
      }
    }
  }, [connected, publicKey, user, signInWithWallet]);

  // ── Restore session on mount ──────────────────────────────────────────────

  useEffect(() => {
    let mounted = true;

    const restoreSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user || !mounted) {
        setIsLoading(false);
        return;
      }

      // Fetch profile for existing session
      const cachedWallet =
        typeof window !== 'undefined'
          ? localStorage.getItem(SESSION_WALLET_KEY)
          : null;

      if (cachedWallet) {
        try {
          const profile = await fetchOrCreateProfile(session.user.id, cachedWallet);
          if (mounted) setUser(profile);
        } catch {
          // Profile fetch failed — reset
        }
      }

      if (mounted) setIsLoading(false);
    };

    restoreSession();

    // Listen for Supabase auth state changes (Google OAuth callback, token refresh, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_OUT') {
          setUser(null);
          if (typeof window !== 'undefined') localStorage.removeItem(SESSION_WALLET_KEY);
          return;
        }

        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
          // For Google OAuth sign-in: build a profile from the OAuth user data.
          if (session.user.app_metadata?.provider === 'google') {
            const walletAddr =
              typeof window !== 'undefined'
                ? (localStorage.getItem(SESSION_WALLET_KEY) ?? '')
                : '';

            if (!walletAddr) {
              // Google user, no wallet linked yet — set partial user from OAuth data.
              const oauthProfile: User = {
                id: session.user.id,
                walletAddress: '',
                username: session.user.email?.split('@')[0] ?? 'user',
                displayName: session.user.user_metadata?.['full_name'] ?? 'User',
                avatarUrl: session.user.user_metadata?.['avatar_url'] ?? null,
                bio: null,
                xp: 0,
                level: 0,
                streak: 0,
                createdAt: session.user.created_at,
                updatedAt: session.user.created_at,
              };
              setUser(oauthProfile);
            } else {
              try {
                const profile = await fetchOrCreateProfile(session.user.id, walletAddr);
                if (mounted) setUser(profile);
              } catch {/* silently ignore */}
            }
          }
        }
      },
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchOrCreateProfile]);

  // ── Google OAuth ──────────────────────────────────────────────────────────

  const signInWithGoogle = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined'
          ? `${window.location.origin}/auth/callback`
          : undefined,
      },
    });
    // Redirect happens; onAuthStateChange handles the session on return.
  }, []);

  // ── Sign out ──────────────────────────────────────────────────────────────

  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      await disconnect();
      await supabase.auth.signOut();
      setUser(null);
      if (typeof window !== 'undefined') localStorage.removeItem(SESSION_WALLET_KEY);
    } finally {
      setIsLoading(false);
    }
  }, [disconnect]);

  // ── Link wallet to Google-authenticated user ──────────────────────────────

  const linkWallet = useCallback(async (address: string) => {
    if (!user) throw new Error('Must be authenticated before linking a wallet.');

    const { error } = await supabase
      .from('user_profiles')
      .update({ wallet_address: address, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (error) throw new Error(error.message);

    setUser((prev) => (prev ? { ...prev, walletAddress: address } : null));
    if (typeof window !== 'undefined') localStorage.setItem(SESSION_WALLET_KEY, address);
  }, [user]);

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: user !== null,
        walletAddress: user?.walletAddress ?? null,
        signInWithWallet,
        signInWithGoogle,
        signOut,
        linkWallet,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Raw context export (used only by useAuth hook) ───────────────────────────

export { AuthContext };
