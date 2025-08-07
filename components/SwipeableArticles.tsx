// components/SwipeableArticles.tsx - IMPROVED SMOOTH EXPERIENCE
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
  SafeAreaView,
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
}

const SwipeableArticles: React.FC<SwipeableArticlesProps> = ({
  articles,
  onBookmark,
  onMarkAsRead,
  isBookmarked,
  isRead,
  formatTimeAgo
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentIndexRef = useRef(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const translateY = useRef(new Animated.Value(0)).current;
  const [hasReadCurrentArticle, setHasReadCurrentArticle] = useState(false);

  // Keep ref in sync with state
  useEffect(() => {
    currentIndexRef.current = currentIndex;
    setHasReadCurrentArticle(false); // Reset read state for new article
    console.log('📊 Current index updated to:', currentIndex);
  }, [currentIndex]);

  // FIXED: Mark as read when user views article for a few seconds
  useEffect(() => {
    if (articles[currentIndex] && !hasReadCurrentArticle) {
      const timer = setTimeout(() => {
        console.log('👁️ User has read the summarized article');
        onMarkAsRead(articles[currentIndex].id);
        setHasReadCurrentArticle(true);
      }, 3000); // Mark as read after 3 seconds of viewing

      return () => clearTimeout(timer);
    }
  }, [currentIndex, articles, onMarkAsRead, hasReadCurrentArticle]);

  // Reset when articles change
  useEffect(() => {
    setCurrentIndex(0);
    currentIndexRef.current = 0;
    setHasReadCurrentArticle(false);
    console.log('🔄 Articles changed, reset to index 0');
  }, [articles.length]);

  // IMPROVED: Much smoother animations
  const animateToNext = useCallback(() => {
    Animated.timing(translateY, {
      toValue: -SCREEN_HEIGHT,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      translateY.setValue(0);
    });
  }, [translateY]);

  const animateToPrevious = useCallback(() => {
    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      translateY.setValue(0);
    });
  }, [translateY]);

  const animateReturn = useCallback(() => {
    Animated.spring(translateY, {
      toValue: 0,
      tension: 300,
      friction: 25,
      useNativeDriver: true,
    }).start();
  }, [translateY]);

  const goToNext = useCallback(() => {
    const currentIdx = currentIndexRef.current;
    if (currentIdx < articles.length - 1) {
      const newIndex = currentIdx + 1;
      console.log(`⬆️ SWIPE UP: Going from article ${currentIdx + 1} to ${newIndex + 1}`);
      animateToNext();
      setCurrentIndex(newIndex);
    } else {
      console.log('🔚 Already at last article');
      animateReturn();
    }
  }, [articles, animateToNext, animateReturn]);

  const goToPrevious = useCallback(() => {
    const currentIdx = currentIndexRef.current;
    if (currentIdx > 0) {
      const newIndex = currentIdx - 1;
      console.log(`⬇️ SWIPE DOWN: Going from article ${currentIdx + 1} to ${newIndex + 1}`);
      animateToPrevious();
      setCurrentIndex(newIndex);
    } else {
      console.log('🔚 Already at first article');
      animateReturn();
    }
  }, [animateToPrevious, animateReturn]);

  // IMPROVED: Much more responsive and smooth pan responder
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const { dx, dy } = gestureState;
        // More sensitive - start detecting at 5px
        const verticalMovement = Math.abs(dy);
        const horizontalMovement = Math.abs(dx);
        const isVerticalSwipe = verticalMovement > 5 && verticalMovement > horizontalMovement * 0.8;
        
        return isVerticalSwipe;
      },
      onPanResponderGrant: () => {
        translateY.setOffset(translateY._value);
        translateY.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        // IMPROVED: More responsive visual feedback with resistance at edges
        const currentIdx = currentIndexRef.current;
        let dampening = 0.5;
        
        // Add resistance at edges
        if (gestureState.dy > 0 && currentIdx === 0) {
          dampening = 0.2; // More resistance when at first article swiping down
        } else if (gestureState.dy < 0 && currentIdx === articles.length - 1) {
          dampening = 0.2; // More resistance when at last article swiping up
        }
        
        const movement = gestureState.dy * dampening;
        translateY.setValue(movement);
      },
      onPanResponderRelease: (_, gestureState) => {
        translateY.flattenOffset();
        
        // IMPROVED: Lower thresholds for more responsive swiping
        const { dy, vy } = gestureState;
        const currentIdx = currentIndexRef.current;
        
        console.log('🔄 Swipe gesture:', { 
          dy: dy.toFixed(1), 
          vy: vy.toFixed(2), 
          direction: dy > 0 ? 'DOWN ⬇️' : 'UP ⬆️',
          currentIndex: currentIdx
        });
        
        // IMPROVED: More sensitive thresholds
        // SWIPE UP (negative dy) = Next article
        if (dy < -50 || vy < -0.3) {
          console.log('⬆️ SWIPE UP - Next article');
          goToNext();
        }
        // SWIPE DOWN (positive dy) = Previous article  
        else if (dy > 50 || vy > 0.3) {
          console.log('⬇️ SWIPE DOWN - Previous article');
          goToPrevious();
        }
        // Not enough movement - snap back
        else {
          console.log('↩️ Snapping back');
          animateReturn();
        }
      },
    })
  ).current;

  // Article click opens full article AND marks as read
  const handleArticlePress = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        // Mark as read when user opens full article
        onMarkAsRead(currentArticle.id);
        setHasReadCurrentArticle(true);
      } else {
        Alert.alert('Error', 'Cannot open article');
      }
    } catch (error) {
      console.error('Error opening URL:', error);
      Alert.alert('Error', 'Cannot open article');
    }
  };

  // Share function
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

  const currentArticle = articles[currentIndex];

  if (!currentArticle) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <Text style={{ color: 'white' }}>No articles available</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* IMPROVED: Full screen swipeable content with smooth animations */}
      <Animated.View
        style={{
          flex: 1,
          transform: [{ translateY }]
        }}
        {...panResponder.panHandlers}
      >
        {/* Article content - clickable to open full article */}
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={0.95}
          onPress={() => handleArticlePress(currentArticle.original_url)}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: Platform.OS === 'ios' ? 110 : 90,
              paddingBottom: 40, // FIXED: Back to normal padding
              justifyContent: 'center',
              minHeight: SCREEN_HEIGHT - 140
            }}
            showsVerticalScrollIndicator={false}
          >
            {/* Article Content */}
            <View style={{
              flex: 1,
              justifyContent: 'center'
            }}>
              
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
                fontSize: SCREEN_HEIGHT > 700 ? 26 : 22,
                fontWeight: 'bold',
                lineHeight: SCREEN_HEIGHT > 700 ? 34 : 28,
                marginBottom: 16
              }}>
                {currentArticle.title}
              </Text>

              {/* Article Summary */}
              <Text style={{
                color: '#D1D5DB',
                fontSize: 15,
                lineHeight: 22,
                marginBottom: 24
              }}>
                {currentArticle.summary}
              </Text>

              {/* FIXED: Meta Information - Consistent read indicator */}
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
                
                {/* FIXED: Consistent read indicator */}
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {(isRead(currentArticle.id) || hasReadCurrentArticle) && (
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

              {/* FIXED: Action Buttons - Back in content flow (not fixed) */}
              <View style={{
                flexDirection: 'row',
                gap: 12,
                marginBottom: 20
              }}>
                {/* Modern Bookmark Button */}
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

                {/* Modern Share Button */}
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

              {/* Subtle swipe hint */}
              <Text style={{
                color: '#4B5563',
                fontSize: 11,
                textAlign: 'center',
                marginTop: 10
              }}>
                Swipe ↕️ to navigate
              </Text>
            </View>
          </ScrollView>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

export default SwipeableArticles;