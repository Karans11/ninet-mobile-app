// components/auth/AuthGuard.tsx - CREATE NEW FILE
import React from 'react';
import { View, Text, ActivityIndicator, StatusBar } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import AuthScreen from './AuthScreen';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <View style={{
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <ActivityIndicator size="large" color="#60A5FA" />
        <View style={{ marginTop: 20, alignItems: 'center' }}>
          <View style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: '#1F2937',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 16
          }}>
            <Text style={{ fontSize: 32, color: 'white', fontWeight: 'bold' }}>N</Text>
          </View>
          <Text style={{
            color: 'white',
            fontSize: 18,
            fontWeight: 'bold',
            marginBottom: 8
          }}>
            NineT
          </Text>
          <Text style={{
            color: '#9CA3AF',
            fontSize: 14
          }}>
            Loading...
          </Text>
        </View>
      </View>
    );
  }

  // If user is not authenticated, show the mandatory authentication screen
  if (!user) {
    return <AuthScreen />;
  }

  // If user is authenticated, show the main app content
  return <>{children}</>;
}
