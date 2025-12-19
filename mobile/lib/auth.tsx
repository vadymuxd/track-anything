import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { localStorage } from './localStorage';
import { dataSync } from './dataSync';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  dataLoading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any; needsEmailConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const runInitial = async () => {
      // Check active sessions and set the user
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // If user is already logged in, do an initial preload (blocking) so the UI
      // can render from cache immediately after this.
      if (session?.user) {
        setDataLoading(true);
        try {
          await dataSync.preloadAll();
        } finally {
          if (!cancelled) setDataLoading(false);
        }
      }
    };

    runInitial().catch(err => console.error('[AuthProvider] Initial session load failed:', err));

    // Listen for changes on auth state (signed in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (cancelled) return;

      const prevUserId = user?.id;
      const nextUserId = nextSession?.user?.id;

      // If the user changed (including from a different account), clear caches to avoid mixing data.
      if (prevUserId && nextUserId && prevUserId !== nextUserId) {
        await localStorage.clearAll();
      }

      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);

      if (nextSession?.user) {
        setDataLoading(true);
        try {
          await dataSync.preloadAll();
        } finally {
          if (!cancelled) setDataLoading(false);
        }
      } else {
        setDataLoading(false);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [user?.id]);

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    // Check if email confirmation is needed
    const needsEmailConfirmation = data?.user && !data.session;

    return { error, needsEmailConfirmation: !!needsEmailConfirmation };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error };
  };

  const signOut = async () => {
    // Clear local storage cache
    await localStorage.clearAll();
    
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, dataLoading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
