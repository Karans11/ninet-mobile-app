// app/auth/callback.tsx - CREATE THIS NEW FILE
import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StatusBar } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔄 Handling OAuth callback...');
        
        // Get the current session after OAuth callback
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ OAuth callback error:', error);
          router.replace('/auth?error=oauth_failed');
          return;
        }

        if (data.session) {
          console.log('✅ OAuth callback successful');
          router.replace('/(tabs)');
        } else {
          console.log('⚠️ No session found after OAuth');
          router.replace('/auth?error=no_session');
        }
      } catch (error) {
        console.error('❌ Unexpected error in OAuth callback:', error);
        router.replace('/auth?error=unexpected');
      }
    };

    // Small delay to ensure the component is mounted
    const timer = setTimeout(handleAuthCallback, 100);
    
    return () => clearTimeout(timer);
  }, [router, params]);

  return (
    <View style={{
      flex: 1,
      backgroundColor: '#000',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    }}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      <View style={{
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#1D4ED8',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24
      }}>
        <Text style={{
          fontSize: 36,
          color: 'white',
          fontWeight: 'bold'
        }}>
          N
        </Text>
      </View>
      
      <ActivityIndicator size="large" color="#1D4ED8" />
      <Text style={{
        color: '#fff',
        fontSize: 16,
        marginTop: 16,
        textAlign: 'center',
      }}>
        Completing Google authentication...
      </Text>
    </View>
  );
}
