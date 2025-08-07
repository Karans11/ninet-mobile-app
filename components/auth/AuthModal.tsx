// components/auth/AuthModal.tsx - REPLACE COMPLETELY
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function AuthModal({ visible, onClose }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(true); // Default to sign up for new users
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth();

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (isSignUp && !name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    setLoading(true);
    
    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, name);
        if (error) {
          Alert.alert('Sign Up Error', error.message);
        } else {
          Alert.alert(
            'Welcome to NineT!', 
            'Account created successfully! You can now bookmark articles and track your reading progress.',
            [{ text: 'Start Reading', onPress: onClose }]
          );
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          Alert.alert('Sign In Error', error.message);
        } else {
          Alert.alert(
            'Welcome back!',
            'Successfully signed in to your NineT account.',
            [{ text: 'Continue', onPress: onClose }]
          );
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
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
      } else {
        onClose();
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
      const { error } = await resetPassword(email);
      
      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert(
          'Password Reset Sent',
          'Check your email for password reset instructions.',
          [{ text: 'OK', onPress: () => setShowForgotPassword(false) }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setLoading(false);
    setShowForgotPassword(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setShowForgotPassword(false);
    // Keep email, reset other fields
    setPassword('');
    setName('');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, backgroundColor: '#000' }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ flex: 1, padding: 24 }}>
            {/* Header */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 32,
              marginTop: Platform.OS === 'ios' ? 40 : 20
            }}>
              <View>
                <Text style={{
                  fontSize: 32,
                  fontWeight: 'bold',
                  color: 'white',
                  marginBottom: 8
                }}>
                  {showForgotPassword 
                    ? 'Reset Password' 
                    : isSignUp 
                      ? 'Join NineT' 
                      : 'Welcome to NineT'
                  }
                </Text>
                <Text style={{ fontSize: 16, color: '#9CA3AF' }}>
                  {showForgotPassword
                    ? 'Enter your email to reset password'
                    : isSignUp 
                      ? 'Get personalized AI news & save articles' 
                      : 'Sign in to access your saved articles'
                  }
                </Text>
              </View>
              
              <TouchableOpacity
                onPress={handleClose}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#374151',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>×</Text>
              </TouchableOpacity>
            </View>

            {/* Form */}
            <View style={{ marginBottom: 32 }}>
              {/* Name field for sign up */}
              {isSignUp && !showForgotPassword && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ color: 'white', marginBottom: 8, fontWeight: '600' }}>
                    Full Name *
                  </Text>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter your full name"
                    placeholderTextColor="#6B7280"
                    style={{
                      backgroundColor: '#1F2937',
                      borderRadius: 12,
                      padding: 16,
                      color: 'white',
                      fontSize: 16,
                      borderWidth: 1,
                      borderColor: name.trim() ? '#10B981' : '#374151'
                    }}
                  />
                </View>
              )}

              {/* Email field */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: 'white', marginBottom: 8, fontWeight: '600' }}>
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

              {/* Password field (not shown for forgot password) */}
              {!showForgotPassword && (
                <View style={{ marginBottom: 24 }}>
                  <Text style={{ color: 'white', marginBottom: 8, fontWeight: '600' }}>
                    Password *
                  </Text>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder={isSignUp ? "Create a password (min 6 characters)" : "Enter your password"}
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
                  {isSignUp && password.length > 0 && password.length < 6 && (
                    <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>
                      Password must be at least 6 characters
                    </Text>
                  )}
                </View>
              )}

              {/* Submit Button */}
              <TouchableOpacity
                onPress={showForgotPassword ? handleForgotPassword : handleSubmit}
                disabled={loading}
                style={{
                  backgroundColor: loading ? '#374151' : '#1D4ED8',
                  paddingVertical: 16,
                  borderRadius: 12,
                  marginBottom: 16,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                {loading && <ActivityIndicator color="white" size="small" />}
                <Text style={{
                  color: 'white',
                  fontSize: 16,
                  fontWeight: '600'
                }}>
                  {loading 
                    ? (showForgotPassword ? 'Sending...' : isSignUp ? 'Creating Account...' : 'Signing In...') 
                    : (showForgotPassword ? 'Send Reset Email' : isSignUp ? 'Create Account' : 'Sign In')
                  }
                </Text>
              </TouchableOpacity>

              {/* Google Sign In Button */}
              {!showForgotPassword && (
                <TouchableOpacity
                  onPress={handleGoogleSignIn}
                  disabled={loading}
                  style={{
                    backgroundColor: '#374151',
                    paddingVertical: 16,
                    borderRadius: 12,
                    marginBottom: 16,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    gap: 8,
                    borderWidth: 1,
                    borderColor: '#4B5563'
                  }}
                >
                  <Text style={{ fontSize: 18 }}>🔍</Text>
                  <Text style={{
                    color: 'white',
                    fontSize: 16,
                    fontWeight: '600'
                  }}>
                    Continue with Google
                  </Text>
                </TouchableOpacity>
              )}

              {/* Forgot Password Link */}
              {!isSignUp && !showForgotPassword && (
                <TouchableOpacity 
                  onPress={() => setShowForgotPassword(true)}
                  style={{ alignItems: 'center', marginBottom: 16 }}
                >
                  <Text style={{ color: '#60A5FA', fontSize: 14 }}>
                    Forgot your password?
                  </Text>
                </TouchableOpacity>
              )}

              {/* Back to Sign In from Forgot Password */}
              {showForgotPassword && (
                <TouchableOpacity 
                  onPress={() => setShowForgotPassword(false)}
                  style={{ alignItems: 'center', marginBottom: 16 }}
                >
                  <Text style={{ color: '#60A5FA', fontSize: 14 }}>
                    Back to Sign In
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Toggle Sign In/Sign Up */}
            {!showForgotPassword && (
              <View style={{
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 32
              }}>
                <Text style={{ color: '#9CA3AF' }}>
                  {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                </Text>
                <TouchableOpacity onPress={toggleMode} style={{ marginLeft: 8 }}>
                  <Text style={{ color: '#60A5FA', fontWeight: '600' }}>
                    {isSignUp ? 'Sign In' : 'Create Account'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Benefits */}
            {!showForgotPassword && (
              <View style={{
                backgroundColor: '#1F2937',
                borderRadius: 12,
                padding: 20,
                borderWidth: 1,
                borderColor: '#374151'
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
                  '📊 Track your reading progress',
                  '🎯 Get personalized AI news recommendations',
                  '📱 Sync across all your devices',
                  '🔔 Custom notification preferences'
                ].map((benefit, index) => (
                  <View key={index} style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 12
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
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}