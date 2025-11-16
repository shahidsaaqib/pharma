import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { authStorage } from '@/lib/storage';
import { useOnlineStatus } from './useOnlineStatus';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isOnline: boolean;
  signUp: (email: string, password: string, username: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const isOnline = useOnlineStatus();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Sync with localStorage auth
        if (session?.user) {
          authStorage.setCurrentUser({
            id: session.user.id,
            username: session.user.email || session.user.id,
            role: 'admin' // Default role, can be updated from profiles table
          });
        } else {
          authStorage.logout();
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, username: string) => {
    if (!isOnline) {
      return { error: new Error('Cannot sign up in offline mode') };
    }

    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { username }
      }
    });

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    // Try Supabase auth first if online
    if (isOnline) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!error) {
        return { error: null };
      }

      // If Supabase fails, fall through to local auth
      console.log('Supabase auth failed, trying local auth');
    }

    // Fallback to local auth for offline mode
    const result = authStorage.login(email, password);
    if (!result.success) {
      return { error: new Error(result.error || 'Login failed') };
    }

    return { error: null };
  };

  const signOut = async () => {
    if (isOnline) {
      await supabase.auth.signOut();
    }
    authStorage.logout();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isOnline, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
