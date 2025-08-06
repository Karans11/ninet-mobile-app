import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  Linking,
  Image,
  ActivityIndicator,
  Share,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';

import { useAuth } from '@/contexts/AuthContext';
import { Article, apiClient } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { SecureStore } from '@/lib/storage';

// Only import Haptics on native platforms
let Haptics: any;
if (Platform.OS !== 'web') {
  Haptics = require('expo-haptics');
} else {
  // Web fallback for haptic feedback
  Haptics = {
    impactAsync: () => Promise.resolve(),
    notificationAsync: () => Promise.resolve(),
    ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
    NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
  };
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface UserStats {
  readArticles: Set<string>;
  bookmarkedArticles: Set<string>;
  readingTime: number;
  articlesReadToday: number;
  streak: number;
}

export default function EnhancedHomeScreen() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'all' | 'bookmarks'>('all');
  const [userStats, setUserStats] = useState<UserStats>({
    readArticles: new Set(),
    bookmarkedArticles: new Set(),
    readingTime: 0,
    articlesReadToday: 0,
    streak: 1
  });

  const { user, profile, loading: authLoading } = useAuth();
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  const filteredArticles = useMemo(() => {
    if (viewMode === 'bookmarks') {
      return articles.filter(article => userStats.bookmarkedArticles.has(article.id));
    }
    return articles;
  }, [articles, viewMode, userStats.bookmarkedArticles]);

  useEffect(() => {
    fetchArticles();
    if (user) {
      loadUserStats();
    } else {
      loadLocalUserStats();
    }
  }, [user]);

  useEffect(() => {
    if (filteredArticles[currentIndex] && !userStats.readArticles.has(filteredArticles[currentIndex].id)) {
      const timer = setTimeout(() => {
        markAsRead(filteredArticles[currentIndex].id);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, filteredArticles, userStats.readArticles]);

  const fetchArticles = async () => {
    try {
      const fetchedArticles = await apiClient.fetchArticles();
      setArticles(fetchedArticles);
    } catch (error) {
      console.error('Error fetching articles:', error);
      Alert.alert('Error', 'Failed to load articles. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fetchArticles();
  }, []);

  const loadUserStats = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error loading user stats:', error);
        return;
      }

      const readArticles = new Set(
        data.filter(stat => stat.action === 'read').map(stat => stat.article_id)
      );
      const bookmarkedArticles = new Set(
        data.filter(stat => stat.action === 'bookmark').map(stat => stat.article_id)
      );

      setUserStats({
        readArticles,
        bookmarkedArticles,
        readingTime: data.filter(stat => stat.action === 'read').length * 0.5,
        articlesReadToday: data.filter(stat => 
          stat.action === 'read' && 
          new Date(stat.created_at).toDateString() === new Date().toDateString()
        ).length,
        streak: calculateStreak(data.filter(stat => stat.action === 'read'))
      });
    } catch (error) {
      console.error('Error in loadUserStats:', error);
      loadLocalUserStats();
    }
  };

  const loadLocalUserStats = async () => {
    try {
      const saved = await SecureStore.getItemAsync('userStats');
      if (saved) {
        const parsed = JSON.parse(saved);
        setUserStats({
          ...parsed,
          readArticles: new Set(parsed.readArticles || []),
          bookmarkedArticles: new Set(parsed.bookmarkedArticles || [])
        });
      }
    } catch (error) {
      console.error('Error loading local user stats:', error);
    }
  };

  const saveUserStats = async (stats: UserStats) => {
    try {
      const toSave = {
        ...stats,
        readArticles: Array.from(stats.readArticles),
        bookmarkedArticles: Array.from(stats.bookmarkedArticles)
      };
      await SecureStore.setItemAsync('userStats', JSON.stringify(toSave));
    } catch (error) {
      console.error('Error saving user stats:', error);
    }
  };

  const updateUserAction = async (articleId: string, action: 'read' | 'bookmark' | 'share') => {
    if (!user) return;

    try {
      if (action === 'bookmark') {
        const exists = userStats.bookmarkedArticles.has(articleId);
        if (exists) {
          await supabase
            .from('user_stats')
            .delete()
            .eq('user_id', user.id)
            .eq('article_id', articleId)
            .eq('action', 'bookmark');
        } else {
          await supabase
            .from('user_stats')
            .insert({
              user_id: user.id,
              article_id: articleId,
              action: action,
            });
        }
      } else {
        await supabase
          .from('user_stats')
          .upsert({
            user_id: user.id,
            article_id: articleId,
            action: action,
          }, {
            onConflict: 'user_id,article_id,action'
          });
      }
    } catch (error) {
      console.error('Error updating user action:', error);
    }
  };

  const markAsRead = useCallback(async (articleId: string) => {
    if (userStats.readArticles.has(articleId)) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    setUserStats(prev => {
      const newStats = {
        ...prev,
        readArticles: new Set(prev.readArticles).add(articleId),
        readingTime: prev.readingTime + 0.5,
        articlesReadToday: prev.articlesReadToday + 1
      };
      saveUserStats(newStats);
      return newStats;
    });

    if (user) {
      await updateUserAction(articleId, 'read');
    }
  }, [userStats.readArticles, user]);

  const toggleBookmark = useCallback(async (articleId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setUserStats(prev => {
      const newBookmarks = new Set(prev.bookmarkedArticles);
      if (newBookmarks.has(articleId)) {
        newBookmarks.delete(articleId);
      } else {
        newBookmarks.add(articleId);
      }
      const newStats = { ...prev, bookmarkedArticles: newBookmarks };
      saveUserStats(newStats);
      return newStats;
    });

    if (user) {
      await updateUserAction(articleId, 'bookmark');
    }
  }, [userStats.bookmarkedArticles, user]);

  const shareArticle = async (article: Article) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      const message = `🚀 Check out this AI news from NineT:\n\n"${article.title}"\n\n${article.original_url}\n\nDownload NineT: https://ninet.io`;
      
      await Share.share({
        message,
        url: article.original_url,
        title: article.title,
      });

      if (user) {
        await updateUserAction(article.id, 'share');
      }
    } catch (error) {
      console.error('Error sharing article:', error);
    }
  };

  const openArticle = (url: string, articleId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(url);
    
    if (user) {
      updateUserAction(articleId, 'share');
    }
  };

  const navigateToArticle = (direction: 'next' | 'prev') => {
    const newIndex = direction === 'next' 
      ? Math.min(currentIndex + 1, filteredArticles.length - 1)
      : Math.max(currentIndex - 1, 0);

    if (newIndex !== currentIndex) {
      translateY.value = withSpring(direction === 'next' ? -SCREEN_HEIGHT : SCREEN_HEIGHT);
      opacity.value = withTiming(0, { duration: 200 }, () => {
        runOnJS(setCurrentIndex)(newIndex);
        translateY.value = direction === 'next' ? SCREEN_HEIGHT : -SCREEN_HEIGHT;
        opacity.value = withTiming(1, { duration: 200 });
        translateY.value = withSpring(0);
      });
    }
  };

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, context: any) => {
      context.startY = translateY.value;
    },
    onActive: (event, context: any) => {
      translateY.value = context.startY + event.translationY;
      const progress = Math.abs(event.translationY) / 100;
      scale.value = interpolate(progress, [0, 1], [1, 0.95], 'clamp');
    },
    onEnd: (event) => {
      const shouldGoNext = event.translationY < -80 && event.velocityY < -800;
      const shouldGoPrev = event.translationY > 80 && event.velocityY > 800;

      if (shouldGoNext && currentIndex < filteredArticles.length - 1) {
        runOnJS(navigateToArticle)('next');
      } else if (shouldGoPrev && currentIndex > 0) {
        runOnJS(navigateToArticle)('prev');
      } else {
        translateY.value = withSpring(0);
        scale.value = withSpring(1);
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: translateY.value },
        { scale: scale.value },
      ],
      opacity: opacity.value,
    };
  });

  if (loading || authLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading NineT insights...</Text>
          <Text style={styles.loadingSubtext}>Curating the best AI news for you</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (filteredArticles.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logo}>
              <Text style={styles.logoEmoji}>🚀</Text>
            </View>
            <Text style={styles.title}>NineT</Text>
          </View>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="newspaper-outline" size={64} color="#374151" />
          <Text style={styles.emptyText}>No articles available</Text>
          <Text style={styles.emptySubtext}>Pull down to refresh or check your connection</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchArticles}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentArticle = filteredArticles[currentIndex];

  return (
    <SafeAreaView style={styles.container}>
      {/* Enhanced Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logo}>
            <Text style={styles.logoEmoji}>🚀</Text>
          </View>
          <Text style={styles.title}>NineT</Text>
          
          {viewMode === 'bookmarks' && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Saved</Text>
            </View>
          )}
          
          <Text style={styles.articleCount}>{filteredArticles.length} stories</Text>
        </View>

        <View style={styles.headerRight}>
          {user && profile ? (
            <TouchableOpacity style={styles.userButton}>
              <Text style={styles.userInitials}>
                {profile.full_name?.charAt(0) || profile.email.charAt(0).toUpperCase()}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.loginButton}>
              <Ionicons name="person-outline" size={20} color="#3B82F6" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Enhanced View Mode Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'all' && styles.toggleActive]}
          onPress={() => {
            setViewMode('all');
            setCurrentIndex(0);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <Ionicons 
            name={viewMode === 'all' ? 'newspaper' : 'newspaper-outline'} 
            size={16} 
            color={viewMode === 'all' ? '#FFFFFF' : '#9CA3AF'} 
          />
          <Text style={[styles.toggleText, viewMode === 'all' && styles.toggleTextActive]}>
            Latest News
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'bookmarks' && styles.toggleActive]}
          onPress={() => {
            setViewMode('bookmarks');
            setCurrentIndex(0);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <Ionicons 
            name={viewMode === 'bookmarks' ? 'bookmark' : 'bookmark-outline'} 
            size={16} 
            color={viewMode === 'bookmarks' ? '#FFFFFF' : '#9CA3AF'} 
          />
          <Text style={[styles.toggleText, viewMode === 'bookmarks' && styles.toggleTextActive]}>
            Saved ({userStats.bookmarkedArticles.size})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content with Enhanced Gestures */}
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={[styles.cardContainer, animatedStyle]}>
          <ScrollView
            style={styles.articleContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#3B82F6"
                colors={['#3B82F6']}
                title="Pull to refresh"
                titleColor="#9CA3AF"
              />
            }
          >
            {currentArticle && (
              <View style={styles.articleCard}>
                {/* Article Image */}
                {currentArticle.image_url && (
                  <View style={styles.imageContainer}>
                    <Image 
                      source={{ uri: currentArticle.image_url }}
                      style={styles.articleImage}
                      resizeMode="cover"
                    />
                    {/* Reading Time Overlay */}
                    <View style={styles.readingTimeOverlay}>
                      <Ionicons name="time-outline" size={12} color="#FFFFFF" />
                      <Text style={styles.readingTimeText}>2 min read</Text>
                    </View>
                  </View>
                )}

                {/* Enhanced Article Content */}
                <View style={styles.articleContent}>
                  {/* Category & Meta */}
                  <View style={styles.articleMeta}>
                    <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(currentArticle.category) }]}>
                      <Text style={styles.categoryText}>{currentArticle.category}</Text>
                    </View>
                    <Text style={styles.sourceText}>{currentArticle.source}</Text>
                    <Text style={styles.timeText}>
                      {formatTimeAgo(currentArticle.published_at)}
                    </Text>
                    {userStats.readArticles.has(currentArticle.id) && (
                      <View style={styles.readIndicator}>
                        <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                      </View>
                    )}
                  </View>

                  {/* Enhanced Title */}
                  <Text style={styles.articleTitle}>{currentArticle.title}</Text>

                  {/* Enhanced Summary */}
                  <Text style={styles.articleSummary}>{currentArticle.summary}</Text>

                  {/* Enhanced Action Buttons */}
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        userStats.bookmarkedArticles.has(currentArticle.id) && styles.actionButtonActive
                      ]}
                      onPress={() => toggleBookmark(currentArticle.id)}
                    >
                      <Ionicons
                        name={userStats.bookmarkedArticles.has(currentArticle.id) ? 'bookmark' : 'bookmark-outline'}
                        size={20}
                        color={userStats.bookmarkedArticles.has(currentArticle.id) ? '#FFFFFF' : '#9CA3AF'}
                      />
                      <Text style={[
                        styles.actionButtonText,
                        userStats.bookmarkedArticles.has(currentArticle.id) && styles.actionButtonTextActive
                      ]}>
                        {userStats.bookmarkedArticles.has(currentArticle.id) ? 'Saved ✓' : 'Save'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionButton, styles.primaryAction]}
                      onPress={() => openArticle(currentArticle.original_url, currentArticle.id)}
                    >
                      <Ionicons name="open-outline" size={20} color="#FFFFFF" />
                      <Text style={[styles.actionButtonText, { color: '#FFFFFF' }]}>
                        Read Full
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => shareArticle(currentArticle)}
                    >
                      <Ionicons name="share-outline" size={20} color="#9CA3AF" />
                      <Text style={styles.actionButtonText}>Share</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Enhanced Navigation Indicators */}
          <View style={styles.indicatorContainer}>
            <View style={styles.indicators}>
              {filteredArticles.slice(Math.max(0, currentIndex - 2), currentIndex + 3).map((_, index) => {
                const actualIndex = Math.max(0, currentIndex - 2) + index;
                const isActive = actualIndex === currentIndex;
                const isRead = userStats.readArticles.has(filteredArticles[actualIndex]?.id);
                
                return (
                  <View
                    key={actualIndex}
                    style={[
                      styles.indicator,
                      isActive && styles.indicatorActive,
                      isRead && styles.indicatorRead,
                    ]}
                  />
                );
              })}
            </View>
            <Text style={styles.progressText}>
              {currentIndex + 1} of {filteredArticles.length}
            </Text>
          </View>

          {/* Enhanced Swipe Hints */}
          {currentIndex === 0 && (
            <View style={styles.swipeHint}>
              <Ionicons name="chevron-up" size={16} color="#6B7280" />
              <Text style={styles.swipeHintText}>Swipe up for next story</Text>
            </View>
          )}
        </Animated.View>
      </PanGestureHandler>

      {/* Enhanced User Stats */}
      {user && (
        <View style={styles.statsOverlay}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userStats.articlesReadToday}</Text>
              <Text style={styles.statLabel}>Today</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userStats.readingTime.toFixed(1)}m</Text>
              <Text style={styles.statLabel}>Reading</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userStats.streak}d</Text>
              <Text style={styles.statLabel}>Streak 🔥</Text>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

// Helper Functions
const getCategoryColor = (category: string) => {
  const colors: { [key: string]: string } = {
    'AI Models': '#3B82F6',
    'Machine Learning': '#10B981',
    'Research': '#8B5CF6',
    'Policy': '#F59E0B',
    'Industry': '#EF4444',
    'Startups': '#06B6D4',
    'AI Security': '#F97316',
  };
  return colors[category] || '#6B7280';
};

const formatTimeAgo = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInHours < 48) return 'Yesterday';
  return `${Math.floor(diffInHours / 24)}d ago`;
};

const calculateStreak = (readStats: any[]): number => {
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  
  const readToday = readStats.some(stat => 
    new Date(stat.created_at).toDateString() === today
  );
  const readYesterday = readStats.some(stat => 
    new Date(stat.created_at).toDateString() === yesterday
  );

  if (readToday && readYesterday) return 2;
  if (readToday) return 1;
  return 0;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  loadingSubtext: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 32,
    height: 32,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoEmoji: {
    fontSize: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 12,
  },
  badge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  articleCount: {
    color: '#6B7280',
    fontSize: 12,
  },
  userButton: {
    width: 32,
    height: 32,
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInitials: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  loginButton: {
    width: 32,
    height: 32,
    backgroundColor: '#1F2937',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#000000',
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: '#1F2937',
  },
  toggleActive: {
    backgroundColor: '#3B82F6',
  },
  toggleText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  cardContainer: {
    flex: 1,
  },
  articleContainer: {
    flex: 1,
  },
  articleCard: {
    flex: 1,
    backgroundColor: '#111827',
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    minHeight: SCREEN_HEIGHT * 0.7,
  },
  imageContainer: {
    position: 'relative',
  },
  articleImage: {
    width: '100%',
    height: 220,
  },
  readingTimeOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  readingTimeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  articleContent: {
    padding: 20,
    flex: 1,
  },
  articleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 4,
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  sourceText: {
    color: '#9CA3AF',
    fontSize: 12,
    marginRight: 8,
  },
  timeText: {
    color: '#6B7280',
    fontSize: 12,
    marginRight: 8,
  },
  readIndicator: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    padding: 4,
    borderRadius: 8,
  },
  articleTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    lineHeight: 28,
    marginBottom: 12,
  },
  articleSummary: {
    color: '#D1D5DB',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#374151',
    gap: 8,
  },
  actionButton: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    backgroundColor: '#1F2937',
  },
  actionButtonActive: {
    backgroundColor: '#F59E0B',
  },
  primaryAction: {
    backgroundColor: '#3B82F6',
  },
  actionButtonText: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  actionButtonTextActive: {
    color: '#FFFFFF',
  },
  indicatorContainer: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -50 }],
    alignItems: 'center',
  },
  indicators: {
    alignItems: 'center',
  },
  indicator: {
    width: 4,
    height: 12,
    backgroundColor: '#374151',
    borderRadius: 2,
    marginVertical: 2,
  },
  indicatorActive: {
    backgroundColor: '#3B82F6',
    height: 24,
  },
  indicatorRead: {
    backgroundColor: '#10B981',
  },
  progressText: {
    color: '#6B7280',
    fontSize: 10,
    marginTop: 8,
    transform: [{ rotate: '90deg' }],
  },
  swipeHint: {
    position: 'absolute',
    bottom: 140,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  swipeHintText: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 4,
  },
  statsOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#9CA3AF',
    fontSize: 10,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#374151',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
