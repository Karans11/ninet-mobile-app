// app/(tabs)/index.tsx - CLEAN NEWS TAB (ALL ARTICLES ONLY)
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
import { useFocusEffect } from 'expo-router'; // ADD THIS LINE
import { useAuth } from '../../contexts/AuthContext';
import SideMenu from '../../components/SideMenu';
import SwipeableArticles from '../../components/SwipeableArticles';
import UserProfileMenu from '../../components/UserProfileMenu';
import { Article, UserStats, UserPreferences } from '../../types/Article';

// Same categories as your PWA
const AVAILABLE_CATEGORIES = [
  'AI Models',
  'Machine Learning',
  'Policy',
  'Research',
  'Industry',
  'Startups',
  'AI Security',
  'AI Tools'
];

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

export default function NewsScreen() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [userStats, setUserStats] = useState<UserStats>({
    readArticles: new Set(),
    bookmarkedArticles: new Set(),
    readingTime: 0,
    articlesReadToday: 0,
    streak: 1
  });
  
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    selectedCategories: [...AVAILABLE_CATEGORIES],
    filterMode: 'all',
    fontSize: 'medium'
  });

  const { user, profile, signOut } = useAuth();

  // Get API URL from multiple sources with fallback
  const API_URL = Constants.expoConfig?.extra?.apiUrl || 
                  Constants.manifest?.extra?.apiUrl ||
                  process.env.EXPO_PUBLIC_API_URL || 
                  'https://ai-news-api.skaybotlabs.workers.dev';

  // Load articles and user data when component mounts
  useEffect(() => {
    fetchArticles();
    loadUserStats();
    loadUserPreferences();
  }, []);
  // ADD THIS HOOK HERE:
  useFocusEffect(
  useCallback(() => {
    loadUserStats();
  }, [])
);
  const fetchArticles = useCallback(async () => {
    try {
      const timestamp = Date.now();
      const apiUrl = `${API_URL}/api/articles?t=${timestamp}`;
      
      console.log('📰 Fetching articles from:', apiUrl);
      
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
      setRefreshing(false);
    }
  }, [API_URL]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchArticles();
  }, [fetchArticles]);

  const loadUserStats = async () => {
    try {
      const storage = getStorage();
      const savedStats = await storage.getItem(`userStats_${user?.id}`);
      if (savedStats) {
        const parsed = JSON.parse(savedStats);
        setUserStats({
          ...parsed,
          readArticles: new Set(parsed.readArticles || []),
          bookmarkedArticles: new Set(parsed.bookmarkedArticles || [])
        });
      }
    } catch (error) {
      console.error('❌ Error loading user stats:', error);
    }
  };

  const loadUserPreferences = async () => {
    try {
      const storage = getStorage();
      const savedPrefs = await storage.getItem(`userPreferences_${user?.id}`);
      if (savedPrefs) {
        const loadedPrefs = JSON.parse(savedPrefs);
        setUserPreferences({
          ...loadedPrefs,
          fontSize: 'medium'
        });
      }
    } catch (error) {
      console.error('❌ Error loading user preferences:', error);
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
    } catch (error) {
      console.error('❌ Error saving user stats:', error);
    }
  };

  const saveUserPreferences = async (newPrefs: UserPreferences) => {
    try {
      const storage = getStorage();
      const prefsToSave = {
        ...newPrefs,
        fontSize: 'medium' as const
      };
      await storage.setItem(`userPreferences_${user?.id}`, JSON.stringify(prefsToSave));
      setUserPreferences(prefsToSave);
    } catch (error) {
      console.error('❌ Error saving user preferences:', error);
    }
  };

  const handleBookmark = (articleId: string) => {
    const newBookmarks = new Set(userStats.bookmarkedArticles);
    if (newBookmarks.has(articleId)) {
      newBookmarks.delete(articleId);
    } else {
      newBookmarks.add(articleId);
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

  // Filter articles based on category preferences only
  const filteredArticles = articles.filter(article => {
    if (userPreferences.filterMode === 'selected') {
      return userPreferences.selectedCategories.includes(article.category);
    }
    return true;
  });

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
          Loading your AI news...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <SwipeableArticles
        articles={filteredArticles}
        onBookmark={handleBookmark}
        onMarkAsRead={handleMarkAsRead}
        isBookmarked={(id) => userStats.bookmarkedArticles.has(id)}
        isRead={(id) => userStats.readArticles.has(id)}
        formatTimeAgo={formatTimeAgo}
        viewMode="all"
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
        {/* Left: Hamburger Menu */}
        <TouchableOpacity
          onPress={() => setShowMenu(true)}
          style={{
            width: 44,
            height: 44,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(31, 41, 55, 0.9)',
            borderRadius: 12
          }}
        >
          <Text style={{ color: 'white', fontSize: 18 }}>☰</Text>
        </TouchableOpacity>

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

      {/* Side Menu - Categories and preferences only */}
      <SideMenu
        visible={showMenu}
        onClose={() => setShowMenu(false)}
        user={user}
        profile={profile}
        userStats={userStats}
        userPreferences={userPreferences}
        availableCategories={AVAILABLE_CATEGORIES}
        onPreferencesChange={saveUserPreferences}
      />

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