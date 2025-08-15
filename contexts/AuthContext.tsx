// contexts/AuthContext.tsx - COMPLETE UPDATED FILE
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
// ADD these imports for Google OAuth
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

// ADD this configuration for OAuth
WebBrowser.maybeCompleteAuthSession();

// Worker URLs - UPDATE these with your actual worker URLs
const API_WORKER_URL = 'https://ai-news-api.skaybotlabs.workers.dev'; // Your existing API worker
const AUTH_WORKER_URL = 'https://ninet-auth.royal-sun-7194.workers.dev';   // Your new auth worker

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

  // ADD this useEffect for deep link handling
  useEffect(() => {
    const handleDeepLink = (url: string) => {
      const parsedUrl = Linking.parse(url);
      
      // Handle OAuth callback
      if (parsedUrl.path?.includes('auth/success') || parsedUrl.path?.includes('auth/confirmed') || parsedUrl.path?.includes('auth/callback')) {
        console.log('🔗 Auth success deep link received');
        // Refresh session to get the latest auth state
        supabase.auth.getSession();
      }
    };

    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    // Handle initial URL if app was opened from a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    return () => {
      subscription?.remove();
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

  // UPDATED: Sign up with auth worker for email confirmation
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
          emailRedirectTo: `${AUTH_WORKER_URL}/auth/confirm`
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

  // FIXED: Google sign in using auth worker for both web and mobile
  // UPDATED: signInWithGoogle function in AuthContext.tsx
const signInWithGoogle = async () => {
  try {
    console.log('🔍 Google sign in via NineT Auth Worker...');
    console.log('🔧 AUTH_WORKER_URL:', AUTH_WORKER_URL);
    console.log('🔧 Platform:', Platform.OS);
    
    if (Platform.OS === 'web') {
      // Web: Use the new auth worker
      const redirectUrl = `${AUTH_WORKER_URL}/auth/google`;
      window.location.href = redirectUrl;
      return { error: null };
    } else {
      // ✅ Mobile: Create proper redirect URL and pass mobile context
      const redirectUrl = Linking.createURL('auth/success');
      console.log('📱 Mobile redirect URL:', redirectUrl);
      
      // Pass mobile context explicitly to worker
      const workerOAuthUrl = `${AUTH_WORKER_URL}/auth/google?mobile=true&redirect_to=${encodeURIComponent(redirectUrl)}&platform=${Platform.OS}`;
      
      console.log('🔗 Opening OAuth via worker:', workerOAuthUrl);
      
      const result = await WebBrowser.openAuthSessionAsync(
        workerOAuthUrl,
        redirectUrl,
        {
          dismissButtonStyle: 'close',
          readerMode: false,
          enableBarCollapsing: true,
          showInRecents: true
        }
      );

      console.log('🔄 WebBrowser result:', result);

      if (result.type === 'success') {
        console.log('✅ Google OAuth success via worker');
        
        // Small delay to ensure session is established
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Force refresh session
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('🔄 Session after OAuth:', !!session, error);
        
        return { error: null };
      } else if (result.type === 'cancel') {
        console.log('ℹ️ Google OAuth cancelled');
        return { error: new Error('User cancelled') as AuthError };
      } else {
        console.log('❌ Google OAuth failed:', result);
        return { error: new Error('Authentication failed') as AuthError };
      }
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

  // UPDATED: Resend verification using auth worker
  const resendVerification = async () => {
    if (!user?.email) {
      return { error: new Error('No user email found') as AuthError };
    }

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: {
          emailRedirectTo: `${AUTH_WORKER_URL}/auth/confirm`
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