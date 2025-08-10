// components/SwipeableArticles.tsx - CLEAN REWRITE
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Animated,
  PanResponder,
  StatusBar,
  Linking,
  Platform,
  Share,
  Alert
} from 'react-native';
import { Article } from '../types/Article';
import { getCategoryColor } from '../utils/categoryColors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SwipeableArticlesProps {
  articles: Article[];
  onBookmark: (articleId: string) => void;
  onMarkAsRead: (articleId: string) => void;
  isBookmarked: (articleId: string) => boolean;
  isRead: (articleId: string) => boolean;
  formatTimeAgo: (dateString: string) => string;
  viewMode?: 'all' | 'bookmarks';
}

const SwipeableArticles: React.FC<SwipeableArticlesProps> = ({
  articles = [],
  onBookmark,
  onMarkAsRead,
  isBookmarked,
  isRead,
  formatTimeAgo,
  viewMode = 'all'
}) => {
  // State - minimal and clean
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  
  // Refs for performance
  const currentIndexRef = useRef(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const articlesRef = useRef(articles);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Constants
  const fontSizes = {
    title: SCREEN_HEIGHT > 700 ? 26 : 22,
    titleLineHeight: SCREEN_HEIGHT > 700 ? 34 : 28,
    summary: 15,
    summaryLineHeight: 22,
    bottomPadding: 250
  };

  // MINIMAL useEffects - only essential syncing
  useEffect(() => {
    articlesRef.current = articles;
  }, [articles]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
    // Reset scroll when article changes
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: false });
    }
  }, [currentIndex]);

  // Reset index when switching view modes
  useEffect(() => {
    setCurrentIndex(0);
  }, [viewMode]);

  // Clean navigation functions
  const goToNext = useCallback(() => {
    const currentIdx = currentIndexRef.current;
    const totalArticles = articlesRef.current.length;
    
    if (currentIdx < totalArticles - 1) {
      setCurrentIndex(currentIdx + 1);
    }
  }, []);

  const goToPrevious = useCallback(() => {
    const currentIdx = currentIndexRef.current;
    
    if (currentIdx > 0) {
      setCurrentIndex(currentIdx - 1);
    }
  }, []);

  // Clean gesture handling
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const { dx, dy, vy } = gestureState;
        const totalArticles = articlesRef.current.length;
        
        if (totalArticles <= 1) return false;
        
        const isVerticalSwipe = Math.abs(dy) > Math.abs(dx) * 2;
        const isFastSwipe = Math.abs(vy) > 1.5;
        const isLargeMovement = Math.abs(dy) > 80;
        
        // Next article (swipe up)
        if (dy < -60 && isVerticalSwipe && (isFastSwipe || isLargeMovement)) {
          return true;
        }
        
        // Previous article (swipe down) - only at top of scroll
        if (dy > 60 && scrollY < 10 && isVerticalSwipe && (isFastSwipe || isLargeMovement)) {
          return true;
        }
        
        return false;
      },
      onPanResponderGrant: () => {
        Animated.timing(scaleAnim, {
          toValue: 0.98,
          duration: 100,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderRelease: (_, gestureState) => {
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }).start();

        const { dy, vy } = gestureState;
        const currentIdx = currentIndexRef.current;
        const totalArticles = articlesRef.current.length;
        
        // Next article
        if ((dy < -100 || vy < -2.0) && currentIdx < totalArticles - 1) {
          goToNext();
        }
        // Previous article
        else if ((dy > 100 || vy > 2.0) && scrollY < 5 && currentIdx > 0) {
          goToPrevious();
        }
      },
      onPanResponderTerminate: () => {
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderTerminationRequest: () => true,
    })
  ).current;

  // Action handlers
  const handleArticlePress = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        onMarkAsRead(currentArticle.id);
      } else {
        Alert.alert('Error', 'Cannot open article');
      }
    } catch (error) {
      console.error('Error opening URL:', error);
      Alert.alert('Error', 'Cannot open article');
    }
  };

  const handleShare = async () => {
    try {
      const article = currentArticle;
      const words = article.summary.split(' ');
      const limitedSummary = words.length > 90 
        ? words.slice(0, 90).join(' ') + '...'
        : article.summary;

      const shareContent = {
        title: 'NineT - AI News',
        message: `📰 ${article.title}\n\n${limitedSummary}\n\nRead more: ${article.original_url}\n\n🤖 Shared via NineT - AI Briefed by AI`,
        url: article.original_url
      };

      await Share.share(shareContent);
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Could not share article');
    }
  };

  const handleScroll = (event: any) => {
    const { contentOffset } = event.nativeEvent;
    setScrollY(contentOffset.y);
  };

  // Get current article
  const currentArticle = articles[currentIndex];

  // Loading states
  if (!articles || articles.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <Text style={{ color: 'white', fontSize: 16 }}>Loading articles...</Text>
      </View>
    );
  }

  if (!currentArticle) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <Text style={{ color: 'white' }}>No articles available</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <Animated.View style={{
        flex: 1,
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }]
      }}>
        <View 
          style={{ flex: 1 }}
          {...panResponder.panHandlers}
        >
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={0.95}
            onPress={() => handleArticlePress(currentArticle.original_url)}
          >
            <ScrollView
              ref={scrollViewRef}
              style={{ flex: 1 }}
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingTop: Platform.OS === 'ios' ? 140 : 120,
                paddingBottom: fontSizes.bottomPadding,
              }}
              showsVerticalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              bounces={true}
            >
              <View>
                {/* Category Badge */}
                <View style={{
                  alignSelf: 'flex-start',
                  backgroundColor: getCategoryColor(currentArticle.category),
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 20,
                  marginBottom: 16
                }}>
                  <Text style={{
                    color: 'white',
                    fontSize: 12,
                    fontWeight: '600'
                  }}>
                    {currentArticle.category}
                  </Text>
                </View>

                {/* Article Title */}
                <Text style={{
                  color: 'white',
                  fontSize: fontSizes.title,
                  fontWeight: 'bold',
                  lineHeight: fontSizes.titleLineHeight,
                  marginBottom: 16
                }}>
                  {currentArticle.title}
                </Text>

                {/* Article Summary */}
                <Text style={{
                  color: '#D1D5DB',
                  fontSize: fontSizes.summary,
                  lineHeight: fontSizes.summaryLineHeight,
                  marginBottom: 24
                }}>
                  {currentArticle.summary}
                </Text>

                {/* Meta Information */}
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 32
                }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#9CA3AF', fontSize: 13 }}>
                      {currentArticle.source}
                    </Text>
                    <Text style={{ color: '#9CA3AF', fontSize: 11 }}>
                      {formatTimeAgo(currentArticle.published_at)}
                    </Text>
                  </View>
                  
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {isRead(currentArticle.id) && (
                      <>
                        <View style={{
                          backgroundColor: '#10B981',
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          marginRight: 4
                        }} />
                        <Text style={{ color: '#10B981', fontSize: 11 }}>
                          Read
                        </Text>
                      </>
                    )}
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={{
                  flexDirection: 'row',
                  gap: 12,
                  marginBottom: 40
                }}>
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      onBookmark(currentArticle.id);
                    }}
                    style={{
                      flex: 1,
                      backgroundColor: isBookmarked(currentArticle.id) ? '#F59E0B' : '#374151',
                      paddingVertical: 14,
                      borderRadius: 12,
                      alignItems: 'center'
                    }}
                  >
                    <Text style={{
                      color: 'white',
                      fontSize: 15,
                      fontWeight: '600'
                    }}>
                      {isBookmarked(currentArticle.id) ? '💾 Saved' : '🏷️ Save'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      handleShare();
                    }}
                    style={{
                      flex: 1,
                      backgroundColor: '#1D4ED8',
                      paddingVertical: 14,
                      borderRadius: 12,
                      alignItems: 'center'
                    }}
                  >
                    <Text style={{
                      color: 'white',
                      fontSize: 15,
                      fontWeight: '600'
                    }}>
                      🚀 Share
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Navigation hints */}
                {articles.length === 1 && (
                  <View style={{
                    alignItems: 'center',
                    marginBottom: 20,
                    paddingHorizontal: 20
                  }}>
                    <Text style={{
                      color: '#6B7280',
                      fontSize: 12,
                      textAlign: 'center'
                    }}>
                      📝 This is your only {viewMode === 'bookmarks' ? 'bookmarked' : ''} article
                    </Text>
                  </View>
                )}

                {articles.length > 1 && (
                  <View style={{
                    alignItems: 'center',
                    marginBottom: 20
                  }}>
                    <Text style={{
                      color: '#4B5563',
                      fontSize: 11,
                      textAlign: 'center'
                    }}>
                      Article {currentIndex + 1} of {articles.length} • Swipe to navigate
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

export default SwipeableArticles;