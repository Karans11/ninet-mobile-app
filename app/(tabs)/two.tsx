// app/(tabs)/two.tsx - UPDATED VERSION WITH FOCUS RELOAD
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
  Platform
} from 'react-native';
import Constants from 'expo-constants';
import { useFocusEffect } from 'expo-router'; // ← ADD THIS IMPORT
import { useAuth } from '../../contexts/AuthContext';
import SwipeableArticles from '../../components/SwipeableArticles';
import UserProfileMenu from '../../components/UserProfileMenu';
import { Article, UserStats } from '../../types/Article';

// Cross-platform storage helper
const getStorage = () => {
  if (Platform.OS === 'web') {
    return {
      getItem: async (key: string) => {
        if (typeof window !== 'undefined') {
          return window.localStorage.getItem(key);
        }
        return null;
      },
      setItem: async (key: string, value: string) => {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, value);
        }
      },
      removeItem: async (key: string) => {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(key);
        }
      }
    };
  } else {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    return AsyncStorage;
  }
};

export default function SavedScreen() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [userStats, setUserStats] = useState<UserStats>({
    readArticles: new Set(),
    bookmarkedArticles: new Set(),
    readingTime: 0,
    articlesReadToday: 0,
    streak: 1
  });

  const { user, profile, signOut } = useAuth();

  // Get API URL from multiple sources with fallback
  const API_URL = Constants.expoConfig?.extra?.apiUrl || 
                  Constants.manifest?.extra?.apiUrl ||
                  process.env.EXPO_PUBLIC_API_URL || 
                  'https://ai-news-api.skaybotlabs.workers.dev';

  // REPLACE THE OLD useEffect WITH useFocusEffect
  // This will reload data every time the tab becomes active
  useFocusEffect(
    useCallback(() => {
      console.log('📚 Saved tab focused - reloading data...');
      fetchArticles();
      loadUserStats();
    }, [])
  );

  const fetchArticles = useCallback(async () => {
    try {
      const timestamp = Date.now();
      const apiUrl = `${API_URL}/api/articles?t=${timestamp}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const headers = Platform.OS === 'web' 
        ? { 'Accept': 'application/json' }
        : {
            'Cache-Control': 'no-cache',
            'Accept': 'application/json',
            'User-Agent': 'NineT-Mobile/1.0'
          };
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data && Array.isArray(data.data)) {
        const articlesWithSource = data.data.map((article: Article) => ({
          ...article,
          source: article.source || article.original_url.split('/')[2]?.replace('www.', '') || 'AI News'
        }));
        setArticles(articlesWithSource);
        console.log('📰 Articles loaded:', articlesWithSource.length);
      } else if (data.success && (!data.data || data.data.length === 0)) {
        setArticles([]);
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('❌ Error fetching articles:', error);
      
      let errorMessage = 'Failed to load articles.';
      if (error.name === 'AbortError') {
        errorMessage = 'Request timed out. Please check your internet connection.';
      } else if (error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.message.includes('API Error')) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Network request failed. Please try again.';
      }
      
      Alert.alert(
        'Connection Error', 
        errorMessage,
        [
          { text: 'Retry', onPress: () => fetchArticles() },
          { text: 'Cancel' }
        ]
      );
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  const loadUserStats = async () => {
    try {
      const storage = getStorage();
      const savedStats = await storage.getItem(`userStats_${user?.id}`);
      // ADD THIS DEBUG:
      console.log('🔍 Raw saved stats:', savedStats);

      if (savedStats) {
        const parsed = JSON.parse(savedStats);
        // ADD THIS DEBUG TOO:
        console.log('🔍 Parsed bookmarks array:', parsed.bookmarkedArticles);

        const newStats = {
          ...parsed,
          readArticles: new Set(parsed.readArticles || []),
          bookmarkedArticles: new Set(parsed.bookmarkedArticles || [])
        };
        setUserStats(newStats);
        console.log('🔖 Bookmarked articles loaded:', newStats.bookmarkedArticles.size);
      } else {
        console.log('📚 No saved stats found');
      }
    } catch (error) {
      console.error('❌ Error loading user stats:', error);
    }
  };

  const saveUserStats = async (newStats: UserStats) => {
    try {
      const statsToSave = {
        ...newStats,
        readArticles: Array.from(newStats.readArticles),
        bookmarkedArticles: Array.from(newStats.bookmarkedArticles)
      };
      
      const storage = getStorage();
      await storage.setItem(`userStats_${user?.id}`, JSON.stringify(statsToSave));
      
      setUserStats(newStats);
      console.log('💾 User stats saved, bookmarks:', newStats.bookmarkedArticles.size);
    } catch (error) {
      console.error('❌ Error saving user stats:', error);
    }
  };

  const handleBookmark = (articleId: string) => {
    console.log('🔖 Bookmark toggled for article:', articleId);
    
    const newBookmarks = new Set(userStats.bookmarkedArticles);
    if (newBookmarks.has(articleId)) {
      newBookmarks.delete(articleId);
      console.log('❌ Bookmark removed');
    } else {
      newBookmarks.add(articleId);
      console.log('✅ Bookmark added');
    }

    saveUserStats({
      ...userStats,
      bookmarkedArticles: newBookmarks
    });
  };

  const handleMarkAsRead = (articleId: string) => {
    const newReadArticles = new Set(userStats.readArticles);
    newReadArticles.add(articleId);

    const newStats = {
      ...userStats,
      readArticles: newReadArticles,
      articlesReadToday: userStats.articlesReadToday + 1
    };

    saveUserStats(newStats);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  // Filter to show only bookmarked articles
  const bookmarkedArticles = articles.filter(article => 
    userStats.bookmarkedArticles.has(article.id)
  );
  
  // ADD THIS DEBUG LINE:
console.log('🔍 Debug - Bookmarked IDs:', Array.from(userStats.bookmarkedArticles), 'Found articles:', bookmarkedArticles.map(a => a.id), 'Found count:', bookmarkedArticles.length);

  console.log('📊 Stats - Total articles:', articles.length, 'Bookmarked:', bookmarkedArticles.length);

  if (loading) {
    return (
      <SafeAreaView style={{
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <ActivityIndicator size="large" color="#60A5FA" />
        <Text style={{
          color: 'white',
          marginTop: 16,
          fontSize: 16
        }}>
          Loading your saved articles...
        </Text>
      </SafeAreaView>
    );
  }

  // Show empty state when no bookmarks
  if (bookmarkedArticles.length === 0) {
    return (
      <SafeAreaView style={{
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        
        {/* Header */}
        <View style={{
          position: 'absolute',
          top: Platform.OS === 'ios' ? 50 : 30,
          left: 0,
          right: 0,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 20,
          zIndex: 1000
        }}>
          {/* Left - Empty space for balance */}
          <View style={{ width: 44 }} />

          {/* Center - App Name */}
          <View style={{
            backgroundColor: 'rgba(31, 41, 55, 0.9)',
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
            alignItems: 'center'
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: 'white'
            }}>
              NineT
            </Text>
            <Text style={{
              fontSize: 10,
              color: '#9CA3AF'
            }}>
              AI Briefed by AI
            </Text>
          </View>

          {/* Right - User Profile */}
          <TouchableOpacity
            onPress={() => setShowUserMenu(true)}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: '#1D4ED8',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <Text style={{
              color: 'white',
              fontSize: 16,
              fontWeight: 'bold'
            }}>
              {profile?.full_name?.[0] || user?.email?.[0] || 'U'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Empty State */}
        <View style={{ alignItems: 'center', paddingHorizontal: 40 }}>
          <Text style={{ fontSize: 60, marginBottom: 20 }}>📚</Text>
          <Text style={{
            color: 'white',
            fontSize: 24,
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: 12
          }}>
            No Saved Articles Yet
          </Text>
          <Text style={{
            color: '#9CA3AF',
            fontSize: 16,
            textAlign: 'center',
            lineHeight: 24
          }}>
            Articles you bookmark from the News tab will appear here for easy access
          </Text>
        </View>

        {/* User Profile Menu */}
        <UserProfileMenu
          visible={showUserMenu}
          onClose={() => setShowUserMenu(false)}
          user={user}
          profile={profile}
          onSignOut={signOut}
        />
      </SafeAreaView>
    );
  }
  console.log('🎯 Passing to SwipeableArticles:', bookmarkedArticles.length, 'articles');

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <SwipeableArticles
        articles={bookmarkedArticles}
        onBookmark={handleBookmark}
        onMarkAsRead={handleMarkAsRead}
        isBookmarked={(id) => userStats.bookmarkedArticles.has(id)}
        isRead={(id) => userStats.readArticles.has(id)}
        formatTimeAgo={formatTimeAgo}
        viewMode="bookmarks"
      />

      {/* Header */}
      <View style={{
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 30,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        zIndex: 1000
      }}>
        {/* Left - Empty space for balance */}
        <View style={{ width: 44 }} />

        {/* Center - App Name */}
        <View style={{
          backgroundColor: 'rgba(31, 41, 55, 0.9)',
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 20,
          alignItems: 'center'
        }}>
          <Text style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: 'white'
          }}>
            NineT
          </Text>
          <Text style={{
            fontSize: 10,
            color: '#9CA3AF'
          }}>
            AI Briefed by AI
          </Text>
        </View>

        {/* Right - User Profile */}
        <TouchableOpacity
          onPress={() => setShowUserMenu(true)}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: '#1D4ED8',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <Text style={{
            color: 'white',
            fontSize: 16,
            fontWeight: 'bold'
          }}>
            {profile?.full_name?.[0] || user?.email?.[0] || 'U'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* User Profile Menu */}
      <UserProfileMenu
        visible={showUserMenu}
        onClose={() => setShowUserMenu(false)}
        user={user}
        profile={profile}
        onSignOut={signOut}
      />
    </View>
  );
}