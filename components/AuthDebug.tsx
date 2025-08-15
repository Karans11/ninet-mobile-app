// components/AuthDebug.tsx - Add this for testing
import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert, ScrollView, StyleSheet } from 'react-native';
import * as Linking from 'expo-linking';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function AuthDebug() {
  const [logs, setLogs] = useState<string[]>([]);
  const [initialUrl, setInitialUrl] = useState<string | null>(null);
  const { user, session } = useAuth();

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)]);
    console.log(`[AuthDebug] ${message}`);
  };

  useEffect(() => {
    // Get initial URL
    Linking.getInitialURL().then(url => {
      setInitialUrl(url);
      if (url) {
        addLog(`Initial URL: ${url}`);
      }
    });

    // Listen for deep links
    const subscription = Linking.addEventListener('url', ({ url }) => {
      addLog(`Deep link received: ${url}`);
      
      const parsed = Linking.parse(url);
      addLog(`Parsed - scheme: ${parsed.scheme}, path: ${parsed.path}, queryParams: ${JSON.stringify(parsed.queryParams)}`);
    });

    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    if (user) {
      addLog(`User authenticated: ${user.email}`);
    } else {
      addLog('User not authenticated');
    }
  }, [user]);

  useEffect(() => {
    if (session) {
      addLog(`Session active: ${session.access_token ? 'Has token' : 'No token'}`);
    } else {
      addLog('No session');
    }
  }, [session]);

  const testDeepLink = () => {
    const testUrl = 'ninet://auth/success';
    addLog(`Testing deep link: ${testUrl}`);
    Linking.openURL(testUrl).catch(err => {
      addLog(`Deep link test failed: ${err.message}`);
    });
  };

  const checkSession = async () => {
    addLog('Checking Supabase session...');
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      addLog(`Session check error: ${error.message}`);
    } else {
      addLog(`Session check result: ${session ? 'Active' : 'None'}`);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Auth Debug Panel</Text>
      
      <View style={styles.status}>
        <Text style={styles.statusText}>
          User: {user ? '✅ ' + user.email : '❌ Not logged in'}
        </Text>
        <Text style={styles.statusText}>
          Session: {session ? '✅ Active' : '❌ None'}
        </Text>
        <Text style={styles.statusText}>
          Initial URL: {initialUrl || 'None'}
        </Text>
      </View>

      <View style={styles.buttons}>
        <Button title="Test Deep Link" onPress={testDeepLink} />
        <Button title="Check Session" onPress={checkSession} />
        <Button title="Clear Logs" onPress={clearLogs} />
      </View>

      <Text style={styles.logsTitle}>Recent Logs:</Text>
      <ScrollView style={styles.logs}>
        {logs.map((log, index) => (
          <Text key={index} style={styles.logItem}>
            {log}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  status: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  statusText: {
    fontSize: 14,
    marginBottom: 5,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  logsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  logs: {
    flex: 1,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
  },
  logItem: {
    fontSize: 12,
    marginBottom: 5,
    fontFamily: 'monospace',
  },
});
