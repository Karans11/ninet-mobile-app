// contexts/AuthContext.tsx - COMPLETE FILE RESTORED
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// Use the same interface as your PWA
interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role: 'user' | 'admin';
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: any | null }>;
  resendVerification: () => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Get initial session - same as your PWA
    const getInitialSession = async () => {
      try {
        console.log('🔍 Checking session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (mounted) {
          if (error) {
            console.error('❌ Session error:', error);
          } else {
            console.log('📱 Session found:', !!session);
            setSession(session);
            setUser(session?.user ?? null);
            
            if (session?.user) {
              await fetchUserProfile(session.user.id);
            }
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ Error getting session:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes - same as your PWA
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('🔄 Auth state changed:', event, session?.user?.email);
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setProfile(null);
      }
      
      setLoading(false);

      // Handle PWA auth persistence for web
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        if (session) {
          localStorage.setItem('supabase_auth_session', JSON.stringify(session));
        } else {
          localStorage.removeItem('supabase_auth_session');
          localStorage.removeItem('userStats');
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Use the same profile fetching as your PWA
  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('👤 Fetching profile for:', userId);
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Profile fetch error:', error);
        return;
      }

      if (data) {
        console.log('✅ Profile loaded:', data.email);
        setProfile(data);
      } else {
        console.log('📝 No profile found, this should be handled by trigger');
        // Don't create profile manually - let the database trigger handle it
      }
    } catch (error) {
      console.error('❌ Error in fetchUserProfile:', error);
    }
  };

  // UPDATED: Sign up with your hosted confirmation page
  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      console.log('📝 Signing up:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || email.split('@')[0]
          },
          emailRedirectTo: 'https://auth.ninet.io/confirm'
        }
      });

      if (error) {
        console.error('❌ Sign up error:', error);
        return { error };
      }

      if (data?.user && !data?.user?.email_confirmed_at) {
        Alert.alert(
          'Check Your Email',
          `We sent a verification link to ${email}. Please check your email and click the link to verify your account.\n\nAfter verification, return to the app to sign in.`,
          [{ text: 'OK' }]
        );
      }

      console.log('✅ Sign up successful:', email);
      return { error: null };
    } catch (error) {
      console.error('❌ Sign up exception:', error);
      return { error: error as AuthError };
    }
  };

  // Same sign in as your PWA
  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 Signing in:', email);
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('❌ Sign in error:', error);
      } else {
        console.log('✅ Sign in successful:', email);
      }

      return { error };
    } catch (error) {
      console.error('❌ Sign in exception:', error);
      return { error: error as AuthError };
    }
  };

  // Same Google sign in as your PWA
  const signInWithGoogle = async () => {
    try {
      console.log('🔍 Google sign in...');
      
      if (Platform.OS === 'web') {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${process.env.EXPO_PUBLIC_SITE_URL}/auth/callback`
          }
        });
        
        if (error) {
          console.error('❌ Google auth error:', error);
        } else {
          console.log('✅ Google auth initiated');
        }
        
        return { error };
      } else {
        Alert.alert(
          'Coming Soon',
          'Google sign-in for mobile is coming soon. Please use email/password for now.'
        );
        return { error: null };
      }
    } catch (error) {
      console.error('❌ Google auth exception:', error);
      return { error: error as AuthError };
    }
  };

  // Same sign out as your PWA
  const signOut = async () => {
    try {
      console.log('👋 Signing out...');
      
      const { error } = await supabase.auth.signOut();
      
      if (!error) {
        setProfile(null);
        
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          localStorage.removeItem('supabase_auth_session');
          localStorage.removeItem('userStats');
        }
        
        console.log('✅ Sign out successful');
      } else {
        console.error('❌ Sign out error:', error);
      }
      
      return { error };
    } catch (error) {
      console.error('❌ Sign out exception:', error);
      return { error: error as AuthError };
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) {
      return { error: new Error('No user logged in') };
    }

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (!error) {
        setProfile(prev => prev ? { ...prev, ...updates } : null);
      }

      return { error };
    } catch (error) {
      console.error('❌ Update profile error:', error);
      return { error };
    }
  };

  // UPDATED: Resend verification with your hosted page
  const resendVerification = async () => {
    if (!user?.email) {
      return { error: new Error('No user email found') as AuthError };
    }

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: {
          emailRedirectTo: 'https://auth.ninet.io/confirm'
        }
      });

      if (!error) {
        Alert.alert(
          'Verification Email Sent',
          `We sent a new verification link to ${user.email}. Please check your email and click the link to verify.`,
          [{ text: 'OK' }]
        );
      }

      return { error };
    } catch (error) {
      console.error('❌ Resend verification error:', error);
      return { error: error as AuthError };
    }
  };

  const value = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    updateProfile,
    resendVerification
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};