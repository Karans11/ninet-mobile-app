// components/ImprovedApiTest.tsx - REPLACE ApiTest.tsx with this
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import Constants from 'expo-constants';

export default function ImprovedApiTest() {
  const [testResult, setTestResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const debugEnvironment = async () => {
    setLoading(true);
    setTestResult('🔍 Environment Debug:\n');
    
    try {
      // Check all environment sources
      setTestResult(prev => prev + `\n📱 Platform: ${Constants.platform?.ios ? 'iOS' : Constants.platform?.android ? 'Android' : 'Web'}\n`);
      
      // Check different ways to access env vars
      setTestResult(prev => prev + `\n🔧 Environment Variables:\n`);
      setTestResult(prev => prev + `- process.env.EXPO_PUBLIC_API_URL: ${process.env.EXPO_PUBLIC_API_URL}\n`);
      setTestResult(prev => prev + `- Constants.expoConfig?.extra?.apiUrl: ${Constants.expoConfig?.extra?.apiUrl}\n`);
      setTestResult(prev => prev + `- Constants.manifest?.extra?.apiUrl: ${Constants.manifest?.extra?.apiUrl}\n`);
      
      // Check if env vars are strings
      setTestResult(prev => prev + `\n🧪 Type checks:\n`);
      setTestResult(prev => prev + `- typeof process.env.EXPO_PUBLIC_API_URL: ${typeof process.env.EXPO_PUBLIC_API_URL}\n`);
      setTestResult(prev => prev + `- Length: ${process.env.EXPO_PUBLIC_API_URL?.length || 'undefined'}\n`);
      
      // Test URL construction
      const envApiUrl = process.env.EXPO_PUBLIC_API_URL;
      const directApiUrl = 'https://ai-news-api.skaybotlabs.workers.dev';
      
      setTestResult(prev => prev + `\n🔗 URL Comparison:\n`);
      setTestResult(prev => prev + `- Env URL: '${envApiUrl}'\n`);
      setTestResult(prev => prev + `- Direct URL: '${directApiUrl}'\n`);
      setTestResult(prev => prev + `- URLs match: ${envApiUrl === directApiUrl}\n`);
      
      // Check for invisible characters
      if (envApiUrl) {
        const cleaned = envApiUrl.trim();
        setTestResult(prev => prev + `- URL after trim: '${cleaned}'\n`);
        setTestResult(prev => prev + `- Has trailing spaces: ${envApiUrl !== cleaned}\n`);
        setTestResult(prev => prev + `- URL char codes: [${Array.from(envApiUrl).map(c => c.charCodeAt(0)).join(', ')}]\n`);
      }
      
    } catch (error) {
      setTestResult(prev => prev + `❌ Environment debug error: ${error.message}\n`);
    } finally {
      setLoading(false);
    }
  };

  const testBothApproaches = async () => {
    setLoading(true);
    setTestResult('🧪 Comparative API Test:\n');
    
    try {
      const envApiUrl = process.env.EXPO_PUBLIC_API_URL;
      const directApiUrl = 'https://ai-news-api.skaybotlabs.workers.dev';
      
      // Test 1: Environment variable approach
      setTestResult(prev => prev + `\n🔄 Testing ENV approach...\n`);
      try {
        const envResponse = await fetch(`${envApiUrl}/api/articles?t=${Date.now()}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache',
            'User-Agent': 'NineT-Mobile/1.0'
          }
        });
        
        setTestResult(prev => prev + `✅ ENV Response status: ${envResponse.status}\n`);
        const envData = await envResponse.json();
        setTestResult(prev => prev + `✅ ENV Articles count: ${envData.data?.length || 0}\n`);
        
      } catch (envError) {
        setTestResult(prev => prev + `❌ ENV Error: ${envError.message}\n`);
        setTestResult(prev => prev + `❌ ENV Error name: ${envError.name}\n`);
        setTestResult(prev => prev + `❌ ENV Error stack: ${envError.stack?.substring(0, 200)}...\n`);
      }
      
      // Test 2: Direct URL approach
      setTestResult(prev => prev + `\n🔄 Testing DIRECT approach...\n`);
      try {
        const directResponse = await fetch(`${directApiUrl}/api/articles?t=${Date.now()}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache',
            'User-Agent': 'NineT-Mobile/1.0'
          }
        });
        
        setTestResult(prev => prev + `✅ DIRECT Response status: ${directResponse.status}\n`);
        const directData = await directResponse.json();
        setTestResult(prev => prev + `✅ DIRECT Articles count: ${directData.data?.length || 0}\n`);
        
      } catch (directError) {
        setTestResult(prev => prev + `❌ DIRECT Error: ${directError.message}\n`);
      }
      
    } catch (error) {
      setTestResult(prev => prev + `❌ Test error: ${error.message}\n`);
    } finally {
      setLoading(false);
    }
  };

  const testNetworkConnectivity = async () => {
    setLoading(true);
    setTestResult('🌐 Network Connectivity Test:\n');
    
    const testUrls = [
      'https://httpbin.org/get',
      'https://jsonplaceholder.typicode.com/posts/1',
      'https://ai-news-api.skaybotlabs.workers.dev/api/articles'
    ];
    
    for (const url of testUrls) {
      try {
        setTestResult(prev => prev + `\n🔄 Testing: ${url}\n`);
        const response = await fetch(url);
        setTestResult(prev => prev + `✅ Status: ${response.status}\n`);
      } catch (error) {
        setTestResult(prev => prev + `❌ Failed: ${error.message}\n`);
      }
    }
    
    setLoading(false);
  };

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
      maxHeight: 500
    }}>
      <Text style={{
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 16
      }}>
        🔧 Environment & API Debug
      </Text>
      
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
        <TouchableOpacity
          onPress={debugEnvironment}
          disabled={loading}
          style={{
            backgroundColor: '#10B981',
            padding: 8,
            borderRadius: 6,
            flex: 1
          }}
        >
          <Text style={{ color: 'white', textAlign: 'center', fontSize: 11 }}>
            Debug Env
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={testBothApproaches}
          disabled={loading}
          style={{
            backgroundColor: '#F59E0B',
            padding: 8,
            borderRadius: 6,
            flex: 1
          }}
        >
          <Text style={{ color: 'white', textAlign: 'center', fontSize: 11 }}>
            Compare APIs
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={testNetworkConnectivity}
          disabled={loading}
          style={{
            backgroundColor: '#8B5CF6',
            padding: 8,
            borderRadius: 6,
            flex: 1
          }}
        >
          <Text style={{ color: 'white', textAlign: 'center', fontSize: 11 }}>
            Network Test
          </Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity
        onPress={() => setTestResult('')}
        style={{
          backgroundColor: '#EF4444',
          padding: 8,
          borderRadius: 6,
          marginBottom: 8
        }}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontSize: 12 }}>
          Clear Results
        </Text>
      </TouchableOpacity>
      
      <ScrollView style={{ maxHeight: 300 }}>
        <Text style={{
          color: '#D1D5DB',
          fontSize: 9,
          fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace'
        }}>
          {testResult || 'Click buttons above to debug the API connection issue'}
        </Text>
      </ScrollView>
    </View>
  );
}