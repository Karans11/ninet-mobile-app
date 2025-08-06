import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useAuth } from '@/contexts/AuthContext';
import { Article, apiClient } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import * as SecureStore from 'expo-secure-store';

export default function BookmarksScreen() {
  const [bookmarkedArticles, setBookmarkedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadBookmarkedArticles();
  }, [user]);

  const loadBookmarkedArticles = async () => {
    try {
      setLoading(true);
      
      if (user) {
        // Load from Supabase for authenticated users
        const { data: userStats, error } = await supabase
          .from('user_stats')
          .select('article_id')
          .eq('user_id', user.id)
          .eq('action', 'bookmark');

        if (error) throw error;

        const articleIds = userStats.map(stat => stat.article_id);
        
        if (articleIds.length > 0) {
          const { data: articles, error: articlesError } = await supabase
            .from('articles')
            .select('*')
            .in('id', articleIds)
            .order('published_at', { ascending: false });

          if (articlesError) throw articlesError;
          setBookmarkedArticles(articles || []);
        } else {
          setBookmarkedArticles([]);
        }
      } else {
        // Load from local storage for guests
        const saved = await SecureStore.getItemAsync('userStats');
        if (saved) {
          const parsed = JSON.parse(saved);
          const bookmarkedIds = parsed.bookmarkedArticles || [];
          
          // Fetch articles from API
          const allArticles = await apiClient.fetchArticles();
          const bookmarked = allArticles.filter(article => 
            bookmarkedIds.includes(article.id)
          );
          setBookmarkedArticles(bookmarked);
        }
      }
    } catch (error) {
      console.error('Error loading bookmarked articles:', error);
      Alert.alert('Error', 'Failed to load bookmarked articles');
    } finally {
      setLoading(false);
    }
  };

  const removeBookmark = async (articleId: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      if (user) {
        await supabase
          .from('user_stats')
          .delete()
          .eq('user_id', user.id)
          .eq('article_id', articleId)
          .eq('action', 'bookmark');
      } else {
        // Update local storage
        const saved = await SecureStore.getItemAsync('userStats');
        if (saved) {
          const parsed = JSON.parse(saved);
          const bookmarkedIds = (parsed.bookmarkedArticles || []).filter((id: string) => id !== articleId);
          parsed.bookmarkedArticles = bookmarkedIds;
          await SecureStore.setItemAsync('userStats', JSON.stringify(parsed));
        }
      }

      setBookmarkedArticles(prev => prev.filter(article => article.id !== articleId));
    } catch (error) {
      console.error('Error removing bookmark:', error);
      Alert.alert('Error', 'Failed to remove bookmark');
    }
  };

  const openArticle = (url: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(url);
  };

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

  const renderArticleItem = ({ item }: { item: Article }) => (
    <View style={styles.articleItem}>
      {item.image_url && (
        <Image source={{ uri: item.image_url }} style={styles.articleImage} />
      )}
      
      <View style={styles.articleContent}>
        <View style={styles.articleMeta}>
          <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) }]}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
          <Text style={styles.sourceText}>{item.source}</Text>
        </View>
        
        <Text style={styles.articleTitle} numberOfLines={2}>
          {item.title}
        </Text>
        
        <Text style={styles.articleSummary} numberOfLines={3}>
          {item.summary}
        </Text>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.readButton}
            onPress={() => openArticle(item.original_url)}
          >
            <Ionicons name="open-outline" size={16} color="#3B82F6" />
            <Text style={styles.readButtonText}>Read</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => removeBookmark(item.id)}
          >
            <Ionicons name="trash-outline" size={16} color="#EF4444" />
            <Text style={styles.removeButtonText}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Saved Articles</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading saved articles...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Saved Articles</Text>
        <Text style={styles.headerSubtitle}>{bookmarkedArticles.length} articles</Text>
      </View>

      {bookmarkedArticles.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="bookmark-outline" size={64} color="#374151" />
          <Text style={styles.emptyTitle}>No saved articles yet</Text>
          <Text style={styles.emptySubtitle}>
            Bookmark articles from the news feed to read them later
          </Text>
        </View>
      ) : (
        <FlatList
          data={bookmarkedArticles}
          renderItem={renderArticleItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#9CA3AF',
    fontSize: 16,
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#9CA3AF',
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 24,
  },
  listContainer: {
    padding: 16,
  },
  articleItem: {
    backgroundColor: '#111827',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  articleImage: {
    width: '100%',
    height: 120,
  },
  articleContent: {
    padding: 16,
  },
  articleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  sourceText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  articleTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 8,
  },
  articleSummary: {
    color: '#D1D5DB',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  readButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    justifyContent: 'center',
  },
  readButtonText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
  },
  removeButtonText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
});
