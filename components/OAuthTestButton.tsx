// components/OAuthTestButton.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Alert, 
  StyleSheet, 
  ScrollView,
  Platform 
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';
import { useAuth } from '../contexts/AuthContext';

// Configure WebBrowser
WebBrowser.maybeCompleteAuthSession();

export default function OAuthTestButton() {
  const [testLogs, setTestLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user, session } = useAuth();

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    setTestLogs(prev => [logEntry, ...prev.slice(0, 9)]); // Keep last 10 logs
    console.log(`[OAuth Test] ${message}`);
  };

  const testOAuthFlow = async () => {
    try {
      setIsLoading(true);
      setTestLogs([]); // Clear previous logs
      
      addLog('🚀 Starting OAuth test...');
      addLog(`📱 Platform: ${Platform.OS}`);
      addLog(`🔧 Expo Go: ${Constants.appOwnership === 'expo' ? 'Yes' : 'No'}`);

      // Create redirect URL
      const redirectUrl = Linking.createURL('auth/success');
      addLog(`🔗 Redirect URL: ${redirectUrl}`);

      // OAuth worker URL
      const AUTH_WORKER_URL = 'https://ninet-auth.royal-sun-7194.workers.dev';
      const oauthUrl = `${AUTH_WORKER_URL}/auth/google?mobile=true&platform=${Platform.OS}&redirect_to=${encodeURIComponent(redirectUrl)}`;
      
      addLog(`🌐 OAuth URL: ${oauthUrl.slice(0, 80)}...`);
      addLog('📂 Opening WebBrowser...');

      const result = await WebBrowser.openAuthSessionAsync(
        oauthUrl,
        redirectUrl,
        {
          dismissButtonStyle: 'close',
          readerMode: false,
          enableBarCollapsing: true,
          showInRecents: true
        }
      );

      addLog(`📋 WebBrowser result: ${result.type}`);

      if (result.type === 'success') {
        addLog('✅ OAuth flow completed successfully!');
        addLog(`📄 Return URL: ${result.url}`);
        
        // Show success alert
        Alert.alert(
          '✅ OAuth Success',
          'OAuth flow completed! Check the logs below for details. The session should be active now.',
          [{ text: 'OK' }]
        );

        // Wait a moment and check session
        setTimeout(async () => {
          addLog('🔄 Checking session status...');
          // The useAuth hook should automatically update, but we can log current state
          addLog(`👤 Current user: ${user ? user.email : 'None'}`);
          addLog(`🎫 Current session: ${session ? 'Active' : 'None'}`);
        }, 2000);

      } else if (result.type === 'cancel') {
        addLog('❌ OAuth cancelled by user');
        Alert.alert('Cancelled', 'OAuth flow was cancelled');
      } else {
        addLog(`❌ OAuth failed: ${result.type}`);
        Alert.alert('Failed', `OAuth failed: ${result.type}`);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addLog(`💥 Error: ${errorMessage}`);
      console.error('OAuth Test Error:', error);
      Alert.alert('Error', `OAuth test failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testDeepLink = () => {
    const testUrl = Linking.createURL('auth/success');
    addLog(`🔗 Testing deep link: ${testUrl}`);
    
    Linking.openURL(testUrl)
      .then(() => {
        addLog('✅ Deep link test completed');
      })
      .catch(err => {
        addLog(`❌ Deep link failed: ${err.message}`);
      });
  };

  const clearLogs = () => {
    setTestLogs([]);
    addLog('🧹 Logs cleared');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🧪 OAuth Test Panel</Text>
      
      {/* Current Status */}
      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>Current Status</Text>
        <Text style={styles.statusText}>
          👤 User: {user ? `✅ ${user.email}` : '❌ Not logged in'}
        </Text>
        <Text style={styles.statusText}>
          🎫 Session: {session ? '✅ Active' : '❌ None'}
        </Text>
        <Text style={styles.statusText}>
          📱 Platform: {Platform.OS}
        </Text>
        <Text style={styles.statusText}>
          🔧 Environment: {Constants.appOwnership === 'expo' ? 'Expo Go' : 'Standalone'}
        </Text>
      </View>

      {/* Test Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton, isLoading && styles.disabledButton]}
          onPress={testOAuthFlow}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? '🔄 Testing OAuth...' : '🚀 Test OAuth Flow'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]}
          onPress={testDeepLink}
        >
          <Text style={styles.buttonText}>🔗 Test Deep Link</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.clearButton]}
          onPress={clearLogs}
        >
          <Text style={styles.buttonText}>🧹 Clear Logs</Text>
        </TouchableOpacity>
      </View>

      {/* Test Logs */}
      <View style={styles.logsContainer}>
        <Text style={styles.logsTitle}>📋 Test Logs</Text>
        <View style={styles.logsBox}>
          {testLogs.length === 0 ? (
            <Text style={styles.noLogsText}>No logs yet. Click "Test OAuth Flow" to start.</Text>
          ) : (
            testLogs.map((log, index) => (
              <Text key={index} style={styles.logText}>
                {log}
              </Text>
            ))
          )}
        </View>
      </View>

      {/* Instructions */}
      <View style={styles.instructionsCard}>
        <Text style={styles.instructionsTitle}>📖 Instructions</Text>
        <Text style={styles.instructionsText}>
          1. Click "Test OAuth Flow" to start Google authentication
        </Text>
        <Text style={styles.instructionsText}>
          2. Complete the Google sign-in process
        </Text>
        <Text style={styles.instructionsText}>
          3. Check the logs to see if authentication succeeded
        </Text>
        <Text style={styles.instructionsText}>
          4. In Expo Go, the app won't auto-open, but authentication should work
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#1f2937',
  },
  statusCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#1f2937',
  },
  statusText: {
    fontSize: 14,
    marginBottom: 8,
    color: '#4b5563',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#1d4ed8',
  },
  secondaryButton: {
    backgroundColor: '#10b981',
  },
  clearButton: {
    backgroundColor: '#6b7280',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  logsContainer: {
    marginBottom: 20,
  },
  logsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#1f2937',
  },
  logsBox: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    minHeight: 200,
    maxHeight: 300,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  noLogsText: {
    color: '#9ca3af',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 60,
  },
  logText: {
    fontSize: 12,
    marginBottom: 4,
    color: '#374151',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  instructionsCard: {
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#92400e',
  },
  instructionsText: {
    fontSize: 14,
    marginBottom: 8,
    color: '#92400e',
  },
});
