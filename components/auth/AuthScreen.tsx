// components/auth/AuthScreen.tsx - REPLACE COMPLETELY
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  StatusBar,
  SafeAreaView
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export default function AuthScreen() {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signup'); // Default to signup for new users
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn, signUp, signInWithGoogle } = useAuth();

  // Helper function to switch between modes
  const switchMode = (newMode: 'signin' | 'signup' | 'forgot') => {
    setMode(newMode);
    setPassword('');
    if (newMode === 'signin') {
      setFullName('');
    }
  };

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (mode === 'signup' && !fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          if (error.message.includes('already registered')) {
            Alert.alert(
              'Account Exists', 
              'This email is already registered. Please sign in instead.',
              [
                { text: 'OK' },
                { text: 'Sign In', onPress: () => switchMode('signin') }
              ]
            );
          } else {
            Alert.alert('Sign Up Error', error.message);
          }
        } else {
          Alert.alert(
            'Welcome to NineT!',
            'Account created successfully! You can now access personalized AI news.',
            [{ text: 'Start Reading' }]
          );
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            Alert.alert(
              'Sign In Failed',
              'Invalid email or password. Please check your credentials and try again.',
              [
                { text: 'Try Again' },
                { text: 'Forgot Password?', onPress: () => switchMode('forgot') }
              ]
            );
          } else {
            Alert.alert('Sign In Error', error.message);
          }
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        Alert.alert('Google Sign In Error', error.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Google sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address first');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: Platform.OS === 'web' ? `${window.location.origin}/auth/reset` : undefined
      });

      if (error) {
        Alert.alert('Reset Password Error', error.message);
      } else {
        Alert.alert(
          'Password Reset Sent',
          'Check your email for password reset instructions. You may need to check your spam folder.',
          [{ text: 'OK', onPress: () => switchMode('signin') }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send reset email. Please try again.');
      console.error('Forgot password error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
            {/* App Logo & Title */}
            <View style={{ alignItems: 'center', marginBottom: 48 }}>
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
              
              <Text style={{
                fontSize: 32,
                fontWeight: 'bold',
                color: 'white',
                marginBottom: 8
              }}>
                NineT
              </Text>
              
              <Text style={{
                fontSize: 16,
                color: '#9CA3AF',
                textAlign: 'center'
              }}>
                AI Briefed by AI
              </Text>
            </View>

            {/* Auth Form Header */}
            <View style={{ marginBottom: 32 }}>
              <Text style={{
                fontSize: 28,
                fontWeight: 'bold',
                color: 'white',
                marginBottom: 8,
                textAlign: 'center'
              }}>
                {mode === 'forgot' 
                  ? 'Reset Password' 
                  : mode === 'signup' 
                    ? 'Create Your Account' 
                    : 'Welcome to NineT'
                }
              </Text>
              
              <Text style={{
                fontSize: 16,
                color: '#9CA3AF',
                textAlign: 'center'
              }}>
                {mode === 'forgot'
                  ? 'Enter your email to reset password'
                  : mode === 'signup'
                    ? 'Join NineT to get personalized AI news'
                    : 'Sign in to your NineT account'
                }
              </Text>
            </View>

            {/* Google Sign In Button (not for forgot password) */}
            {mode !== 'forgot' && (
              <>
                <TouchableOpacity
                  onPress={handleGoogleSignIn}
                  disabled={loading}
                  style={{
                    backgroundColor: '#fff',
                    paddingVertical: 14,
                    borderRadius: 12,
                    marginBottom: 24,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    gap: 12,
                    opacity: loading ? 0.7 : 1
                  }}
                >
                  {/* Improved Google Logo */}
                  <View style={{
                    width: 20,
                    height: 20,
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    <View style={{
                      width: 18,
                      height: 18,
                      borderRadius: 2,
                      backgroundColor: '#4285f4',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}>
                      <Text style={{ 
                        fontSize: 12,
                        fontWeight: 'bold',
                        color: '#fff'
                      }}>G</Text>
                    </View>
                  </View>
                  <Text style={{
                    color: '#1F2937',
                    fontSize: 16,
                    fontWeight: '600'
                  }}>
                    Continue with Google
                  </Text>
                </TouchableOpacity>

                {/* Divider */}
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 24
                }}>
                  <View style={{ flex: 1, height: 1, backgroundColor: '#374151' }} />
                  <Text style={{
                    color: '#9CA3AF',
                    fontSize: 14,
                    marginHorizontal: 16
                  }}>
                    or
                  </Text>
                  <View style={{ flex: 1, height: 1, backgroundColor: '#374151' }} />
                </View>
              </>
            )}

            {/* Email/Password Form */}
            <View style={{ marginBottom: 32 }}>
              {/* Full Name (signup only) */}
              {mode === 'signup' && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{
                    color: 'white',
                    marginBottom: 8,
                    fontWeight: '600'
                  }}>
                    Full Name *
                  </Text>
                  <TextInput
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Enter your full name"
                    placeholderTextColor="#6B7280"
                    style={{
                      backgroundColor: '#1F2937',
                      borderRadius: 12,
                      padding: 16,
                      color: 'white',
                      fontSize: 16,
                      borderWidth: 1,
                      borderColor: fullName.trim() ? '#10B981' : '#374151'
                    }}
                  />
                </View>
              )}

              {/* Email */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{
                  color: 'white',
                  marginBottom: 8,
                  fontWeight: '600'
                }}>
                  Email Address *
                </Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email address"
                  placeholderTextColor="#6B7280"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={{
                    backgroundColor: '#1F2937',
                    borderRadius: 12,
                    padding: 16,
                    color: 'white',
                    fontSize: 16,
                    borderWidth: 1,
                    borderColor: email.includes('@') ? '#10B981' : '#374151'
                  }}
                />
              </View>

              {/* Password (not for forgot password) */}
              {mode !== 'forgot' && (
                <View style={{ marginBottom: 24 }}>
                  <Text style={{
                    color: 'white',
                    marginBottom: 8,
                    fontWeight: '600'
                  }}>
                    Password *
                  </Text>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder={mode === 'signup' ? "Create password (min 6 chars)" : "Enter your password"}
                    placeholderTextColor="#6B7280"
                    secureTextEntry
                    style={{
                      backgroundColor: '#1F2937',
                      borderRadius: 12,
                      padding: 16,
                      color: 'white',
                      fontSize: 16,
                      borderWidth: 1,
                      borderColor: password.length >= 6 ? '#10B981' : '#374151'
                    }}
                  />
                  {mode === 'signup' && password.length > 0 && password.length < 6 && (
                    <Text style={{
                      color: '#EF4444',
                      fontSize: 12,
                      marginTop: 4
                    }}>
                      Password must be at least 6 characters
                    </Text>
                  )}
                </View>
              )}

              {/* Submit Button */}
              <TouchableOpacity
                onPress={mode === 'forgot' ? handleForgotPassword : handleSubmit}
                disabled={loading || (mode !== 'forgot' && (!email || !password || (mode === 'signup' && !fullName.trim())))}
                style={{
                  backgroundColor: loading ? '#374151' : '#1D4ED8',
                  paddingVertical: 16,
                  borderRadius: 12,
                  marginBottom: 16,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8,
                  opacity: loading || (mode !== 'forgot' && (!email || !password || (mode === 'signup' && !fullName.trim()))) ? 0.7 : 1
                }}
              >
                {loading && <ActivityIndicator color="white" size="small" />}
                <Text style={{
                  color: 'white',
                  fontSize: 16,
                  fontWeight: '600'
                }}>
                  {loading 
                    ? (mode === 'forgot' ? 'Sending...' : mode === 'signup' ? 'Creating Account...' : 'Signing In...') 
                    : (mode === 'forgot' ? 'Send Reset Email' : mode === 'signup' ? 'Create Account' : 'Sign In')
                  }
                </Text>
              </TouchableOpacity>

              {/* Forgot Password Link (signin only) */}
              {mode === 'signin' && (
                <TouchableOpacity
                  onPress={() => switchMode('forgot')}
                  style={{ alignItems: 'center', marginBottom: 16 }}
                >
                  <Text style={{ color: '#60A5FA', fontSize: 14 }}>
                    Forgot your password?
                  </Text>
                </TouchableOpacity>
              )}

              {/* Back to Sign In (forgot password only) */}
              {mode === 'forgot' && (
                <TouchableOpacity
                  onPress={() => switchMode('signin')}
                  style={{ alignItems: 'center', marginBottom: 16 }}
                >
                  <Text style={{ color: '#60A5FA', fontSize: 14 }}>
                    Back to Sign In
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Toggle Sign In/Sign Up (not for forgot password) */}
            {mode !== 'forgot' && (
              <View style={{
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 32
              }}>
                <Text style={{ color: '#9CA3AF' }}>
                  {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}
                </Text>
                <TouchableOpacity
                  onPress={() => switchMode(mode === 'signup' ? 'signin' : 'signup')}
                  style={{ marginLeft: 8 }}
                >
                  <Text style={{ color: '#60A5FA', fontWeight: '600' }}>
                    {mode === 'signup' ? 'Sign In' : 'Create Account'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Benefits Section (signup only) */}
            {mode === 'signup' && (
              <View style={{
                backgroundColor: '#1F2937',
                borderRadius: 12,
                padding: 20,
                borderWidth: 1,
                borderColor: '#374151',
                marginBottom: 24
              }}>
                <Text style={{
                  color: 'white',
                  fontSize: 18,
                  fontWeight: 'bold',
                  marginBottom: 16,
                  textAlign: 'center'
                }}>
                  Why join NineT?
                </Text>

                {[
                  '🔖 Save articles for later reading',
                  '📊 Track your reading progress and streaks',
                  '🎯 Get personalized AI news recommendations',
                  '📱 Sync across all your devices',
                  '🔔 Custom notification preferences',
                  '⚡ Faster loading and offline reading'
                ].map((benefit, index) => (
                  <View key={index} style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 8
                  }}>
                    <Text style={{
                      color: '#D1D5DB',
                      fontSize: 14,
                      lineHeight: 20
                    }}>
                      {benefit}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Terms & Privacy */}
            <Text style={{
              color: '#6B7280',
              fontSize: 12,
              textAlign: 'center',
              lineHeight: 18
            }}>
              By continuing, you agree to our Terms of Service and Privacy Policy.
              {'\n'}Your data is secure and encrypted.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}