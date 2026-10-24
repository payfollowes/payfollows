'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from './supabase/client';
import { authAPI } from './api';
import type { AppUser, UserProfile } from './types';

interface AuthContextValue {
  user: AppUser | null;
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<UserProfile | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
  refreshProfile: async () => null,
  signOut: async () => {},
});

const PROFILE_CACHE_KEY = 'payfollows.currentUser';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    try {
      const p = await authAPI.getUserProfile();
      setProfile(p);
      if (p) {
        const appUser: AppUser = { id: p.id, username: p.username, email: p.email, role: p.role };
        setUser(appUser);
        window.localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(appUser));
      }
      return p;
    } catch (error) {
      console.warn('[auth] refreshProfile failed', error);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          if (mounted) {
            setUser(null);
            setProfile(null);
            setLoading(false);
          }
          return;
        }

        const p = await authAPI.getUserProfile();
        if (!mounted) return;
        if (p) {
          setProfile(p);
          const appUser: AppUser = { id: p.id, username: p.username, email: p.email, role: p.role };
          setUser(appUser);
          window.localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(appUser));
        }
      } catch (error) {
        console.warn('[auth] bootstrap failed', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void bootstrap();

    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        window.localStorage.removeItem(PROFILE_CACHE_KEY);
        setLoading(false);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        void bootstrap();
      }
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await authAPI.signOut();
    setUser(null);
    setProfile(null);
    window.localStorage.removeItem(PROFILE_CACHE_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
