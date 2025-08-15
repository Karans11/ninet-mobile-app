// app/(tabs)/weekly.tsx - Weekly Articles Screen
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
  Platform,
  Dimensions,
  Image,
  RefreshControl
} from 'react-native';
import Constants from 'expo-constants';
import { useAuth } from '../../contexts/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface WeeklyArticle {
  id: string;
  title: string;
  content: string;
  summary: string;
  author_name: string;
  topic_category: string;
  featured_image_url?: string;
  reading_time_minutes: number;
  publish_date: string;
  week_number: number;
  year: number;
  view_count: number;
  tags: string[];
  created_at: string;
}

export default function WeeklyArticlesScreen() {
  const [articles, setArticles] = useState<WeeklyArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<WeeklyArticle | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { user } = useAuth();

  // Get API URL from multiple sources with fallback
  const API_URL = Constants.expoConfig?.extra?.apiUrl || 
                  Constants.manifest?.extra?.apiUrl ||
                  process.env.EXPO_PUBLIC_API_URL || 
                  'https://ai-news-api.skaybotlabs.workers.dev';

  useEffect(() => {
    fetchWeeklyArticles();
  }, []);

  const fetchWeeklyArticles = async () => {
    try {
      const timestamp = Date.now();
      const apiUrl = `${API_URL}/api/weekly-articles?t=${timestamp}`;
      
      console.log('📚 Fetching The Breakdown articles from:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data && Array.isArray(data.data)) {
        setArticles(data.data);
      } else {
        setArticles([]);
      }
    } catch (error) {
      console.error('❌ Error fetching weekly articles:', error);
      Alert.alert('Error', 'Failed to load The Breakdown articles. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWeeklyArticles();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatContent = (content: string) => {
    // Split content into paragraphs and format for mobile reading
    return content.split('\n\n').map((paragraph, index) => (
      <Text key={index} style={{
        fontSize: 16,
        lineHeight: 24,
        color: '#E5E7EB',
        marginBottom: 16,
        textAlign: 'left'
      }}>
        {paragraph.trim()}
      </Text>
    ));
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={{
            color: '#9CA3AF',
            marginTop: 16,
            fontSize: 16
          }}>
            Loading The Breakdown articles...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Detail view for selected article
  if (selectedArticle) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: '#1F2937'
        }}>
          <TouchableOpacity
            onPress={() => setSelectedArticle(null)}
            style={{
              backgroundColor: '#1F2937',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 8
            }}
          >
            <Text style={{ color: '#3B82F6', fontSize: 16, fontWeight: '600' }}>
              ← Back
            </Text>
          </TouchableOpacity>
          
          <Text style={{
            color: '#3B82F6',
            fontSize: 14,
            fontWeight: '600'
          }}>
            Week {selectedArticle.week_number}, {selectedArticle.year}
          </Text>
        </View>

        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Featured Image */}
          {selectedArticle.featured_image_url && (
            <Image
              source={{ uri: selectedArticle.featured_image_url }}
              style={{
                width: SCREEN_WIDTH,
                height: 200,
                backgroundColor: '#1F2937'
              }}
              resizeMode="cover"
            />
          )}

          <View style={{ padding: 20 }}>
            {/* Category & Reading Time */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12
            }}>
              <Text style={{
                color: '#3B82F6',
                fontSize: 14,
                fontWeight: '600',
                backgroundColor: '#1E3A8A',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 16
              }}>
                {selectedArticle.topic_category}
              </Text>
              
              <Text style={{
                color: '#9CA3AF',
                fontSize: 14
              }}>
                {selectedArticle.reading_time_minutes} min read
              </Text>
            </View>

            {/* Title */}
            <Text style={{
              fontSize: 28,
              fontWeight: 'bold',
              color: 'white',
              lineHeight: 36,
              marginBottom: 16
            }}>
              {selectedArticle.title}
            </Text>

            {/* Author & Date */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 24,
              paddingBottom: 16,
              borderBottomWidth: 1,
              borderBottomColor: '#1F2937'
            }}>
              <Text style={{
                color: '#9CA3AF',
                fontSize: 14
              }}>
                By {selectedArticle.author_name}
              </Text>
              
              <Text style={{
                color: '#9CA3AF',
                fontSize: 14
              }}>
                {formatDate(selectedArticle.publish_date)}
              </Text>
            </View>

            {/* Content */}
            <View>
              {formatContent(selectedArticle.content)}
            </View>

            {/* Tags */}
            {selectedArticle.tags && selectedArticle.tags.length > 0 && (
              <View style={{
                marginTop: 24,
                paddingTop: 24,
                borderTopWidth: 1,
                borderTopColor: '#1F2937'
              }}>
                <Text style={{
                  color: '#9CA3AF',
                  fontSize: 14,
                  marginBottom: 12
                }}>
                  Tags:
                </Text>
                <View style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: 8
                }}>
                  {selectedArticle.tags.map((tag, index) => (
                    <View
                      key={index}
                      style={{
                        backgroundColor: '#1F2937',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 16
                      }}
                    >
                      <Text style={{
                        color: '#9CA3AF',
                        fontSize: 12
                      }}>
                        #{tag}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // List view
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Header */}
      <View style={{
        paddingHorizontal: 20,
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#1F2937'
      }}>
        <Text style={{
          fontSize: 28,
          fontWeight: 'bold',
          color: 'white',
          marginBottom: 8
        }}>
          The Breakdown
        </Text>
        <Text style={{
          fontSize: 16,
          color: '#9CA3AF'
        }}>
          In-depth analysis on key AI topics
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        refreshControl={
         <RefreshControl
         refreshing={refreshing}
         onRefresh={onRefresh}
         tintColor="#3B82F6"
       />
      }
    >
        {articles.length === 0 ? (
          <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: 60
          }}>
            <Text style={{
              fontSize: 48,
              marginBottom: 16
            }}>
              📚
            </Text>
            <Text style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: 'white',
              marginBottom: 8
            }}>
              No Breakdown Articles Yet
            </Text>
            <Text style={{
              fontSize: 16,
              color: '#9CA3AF',
              textAlign: 'center',
              lineHeight: 22
            }}>
              The Breakdown articles will appear here soon!
            </Text>
          </View>
        ) : (
          <View style={{ gap: 20 }}>
            {articles.map((article) => (
              <TouchableOpacity
                key={article.id}
                onPress={() => setSelectedArticle(article)}
                style={{
                  backgroundColor: '#111827',
                  borderRadius: 16,
                  padding: 20,
                  borderWidth: 1,
                  borderColor: '#1F2937'
                }}
              >
                {/* Category & Week */}
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 12
                }}>
                  <Text style={{
                    color: '#3B82F6',
                    fontSize: 12,
                    fontWeight: '600',
                    backgroundColor: '#1E3A8A',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 12
                  }}>
                    {article.topic_category}
                  </Text>
                  
                  <Text style={{
                    color: '#9CA3AF',
                    fontSize: 12
                  }}>
                    Week {article.week_number}, {article.year}
                  </Text>
                </View>

                {/* Title */}
                <Text style={{
                  fontSize: 20,
                  fontWeight: 'bold',
                  color: 'white',
                  lineHeight: 28,
                  marginBottom: 12
                }}>
                  {article.title}
                </Text>

                {/* Summary */}
                <Text style={{
                  fontSize: 14,
                  color: '#9CA3AF',
                  lineHeight: 20,
                  marginBottom: 16
                }}>
                  {article.summary}
                </Text>

                {/* Meta Info */}
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <Text style={{
                    color: '#6B7280',
                    fontSize: 12
                  }}>
                    {article.reading_time_minutes} min read • {formatDate(article.publish_date)}
                  </Text>
                  
                  <Text style={{
                    color: '#3B82F6',
                    fontSize: 14,
                    fontWeight: '600'
                  }}>
                    Read More →
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}