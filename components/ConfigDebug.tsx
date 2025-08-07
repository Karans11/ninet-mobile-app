// components/ConfigDebug.tsx - CREATE THIS FILE
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Constants from 'expo-constants';

export default function ConfigDebug() {
  const [showDebug, setShowDebug] = React.useState(false);

  const debugInfo = {
    'Constants.expoConfig?.extra?.apiUrl': Constants.expoConfig?.extra?.apiUrl,
    'Constants.manifest?.extra?.apiUrl': Constants.manifest?.extra?.apiUrl,
    'process.env.EXPO_PUBLIC_API_URL': process.env.EXPO_PUBLIC_API_URL,
    'Platform': Constants.platform,
    'App Config': Constants.expoConfig?.name,
  };

  if (!showDebug) {
    return (
      <TouchableOpacity
        onPress={() => setShowDebug(true)}
        style={{
          position: 'absolute',
          top: 50,
          right: 20,
          backgroundColor: '#374151',
          padding: 8,
          borderRadius: 6,
          zIndex: 1000
        }}
      >
        <Text style={{ color: 'white', fontSize: 12 }}>🔧 Debug</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={{
      position: 'absolute',
      top: 100,
      left: 20,
      right: 20,
      backgroundColor: '#1F2937',
      borderRadius: 8,
      padding: 16,
      zIndex: 1000,
      maxHeight: 300
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
        <Text style={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}>
          🔧 Configuration Debug
        </Text>
        <TouchableOpacity onPress={() => setShowDebug(false)}>
          <Text style={{ color: '#EF4444', fontSize: 16 }}>✕</Text>
        </TouchableOpacity>
      </View>
      
      {Object.entries(debugInfo).map(([key, value]) => (
        <View key={key} style={{ marginBottom: 8 }}>
          <Text style={{ color: '#9CA3AF', fontSize: 10 }}>{key}:</Text>
          <Text style={{ color: 'white', fontSize: 11, fontFamily: 'monospace' }}>
            {JSON.stringify(value) || 'undefined'}
          </Text>
        </View>
      ))}
    </View>
  );
}
