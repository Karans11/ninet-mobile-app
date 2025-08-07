// components/ArticleCard.tsx - REPLACE COMPLETELY
import React from 'react';
import { View, Text, Image, TouchableOpacity, Linking, Alert, Share, Platform } from 'react-native';
import { Article } from '../types/Article';

interface ArticleCardProps {
  article: Article;
  isRead: boolean;
  isBookmarked: boolean;
  onBookmark: () => void;
  onMarkAsRead: () => void;
  formatTimeAgo: (date: string) => string;
  isAuthenticated: boolean;
}

export default function ArticleCard({
  article,
  isRead,
  isBookmarked,
  onBookmark,
  onMarkAsRead,
  formatTimeAgo,
  isAuthenticated
}: ArticleCardProps) {

  // IMPROVEMENT 1: Handle article click - opens original URL (entire card clickable)
  const handleArticlePress = async () => {
    try {
      // Mark as read when user clicks
      onMarkAsRead();
      
      if (Platform.OS === 'web') {
        // For web, open in new tab
        window.open(article.original_url, '_blank');
      } else {
        // For mobile, use Linking
        const supported = await Linking.canOpenURL(article.original_url);
        if (supported) {
          await Linking.openURL(article.original_url);
        } else {
          Alert.alert('Error', 'Cannot open this link');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open article');
      console.error('Error opening article:', error);
    }
  };

  // IMPROVEMENT 2: Handle share with NineT promotion
  const handleShare = async () => {
    try {
      const shareMessage = `📱 Found this interesting AI news on NineT app!\n\n📰 ${article.title}\n\n📝 ${article.summary}\n\n🔗 Read full article: ${article.original_url}\n\n⬇️ Get NineT app for more AI news updates!`;
      
      if (Platform.OS === 'web') {
        // For web, use Web Share API or fallback to clipboard
        if (navigator.share) {
          await navigator.share({
            title: article.title,
            text: shareMessage,
            url: article.original_url,
          });
        } else {
          // Fallback: copy to clipboard
          await navigator.clipboard.writeText(shareMessage);
          Alert.alert('Copied!', 'Share message copied to clipboard');
        }
      } else {
        // For mobile, use React Native Share
        const result = await Share.share({
          message: shareMessage,
          title: article.title,
          url: article.original_url,
        });
        
        if (result.action === Share.sharedAction) {
          console.log('Article shared successfully');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to share article');
      console.error('Error sharing:', error);
    }
  };

  return (
    <TouchableOpacity
      onPress={handleArticlePress}
      activeOpacity={0.95}
      style={{
        backgroundColor: '#1F2937',
        borderRadius: 16,
        padding: 24,
        minHeight: 500,
        margin: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      }}
    >
      {/* Source and Time Header */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ color: '#60A5FA', fontWeight: '600', fontSize: 14 }}>
            {article.source}
          </Text>
          <Text style={{ color: '#9CA3AF', marginHorizontal: 8 }}>•</Text>
          <Text style={{ color: '#9CA3AF', fontSize: 14 }}>
            {formatTimeAgo(article.published_at)}
          </Text>
        </View>
        
        <View style={{
          backgroundColor: 'rgba(147, 51, 234, 0.3)',
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 12
        }}>
          <Text style={{ color: '#A78BFA', fontSize: 12 }}>
            {article.category}
          </Text>
        </View>
      </View>

      {/* Article Image */}
      {article.image_url && (
        <View style={{
          marginBottom: 16,
          borderRadius: 12,
          overflow: 'hidden',
          backgroundColor: '#374151',
          height: 192,
          position: 'relative'
        }}>
          <Image
            source={{ uri: article.image_url }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
            onError={() => console.log('Image failed to load')}
          />
          {isRead && (
            <View style={{
              position: 'absolute',
              top: 8,
              right: 8,
              backgroundColor: '#10B981',
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 12
            }}>
              <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
                ✓ Read
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Article Title */}
      <Text style={{
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 16,
        lineHeight: 32
      }}>
        {article.title}
      </Text>

      {/* Article Summary */}
      <Text style={{
        fontSize: 16,
        color: '#D1D5DB',
        lineHeight: 24,
        marginBottom: 24,
        flex: 1
      }}>
        {article.summary}
      </Text>

      {/* Reading Time */}
      <View style={{
        alignItems: 'center',
        marginBottom: 24
      }}>
        <Text style={{ color: '#9CA3AF', fontSize: 14 }}>
          📖 2 min read
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={{
        flexDirection: 'row',
        gap: 12
      }}>
        {/* Bookmark Button */}
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            if (!isAuthenticated) {
              Alert.alert('Sign In Required', 'Please sign in to bookmark articles');
              return;
            }
            onBookmark();
          }}
          style={{
            flex: 1,
            backgroundColor: isBookmarked ? '#F59E0B' : '#374151',
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: 12,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 8,
            opacity: !isAuthenticated ? 0.75 : 1
          }}
        >
          <Text style={{ fontSize: 18 }}>
            {isBookmarked ? '⭐' : '🔖'}
          </Text>
          <Text style={{
            color: isBookmarked ? 'white' : '#D1D5DB',
            fontWeight: '600'
          }}>
            {isBookmarked ? 'Saved' : 'Save'}
          </Text>
        </TouchableOpacity>

        {/* Share Button */}
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            handleShare();
          }}
          style={{
            flex: 1,
            backgroundColor: '#1D4ED8',
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: 12,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 8
          }}
        >
          <Text style={{ fontSize: 18 }}>📤</Text>
          <Text style={{ color: 'white', fontWeight: '600' }}>
            Share
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tap Anywhere Hint */}
      <View style={{
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#374151',
        alignItems: 'center'
      }}>
        <Text style={{
          color: '#9CA3AF',
          fontSize: 12,
          textAlign: 'center'
        }}>
          💡 Tap anywhere on article to read full story
        </Text>
      </View>
    </TouchableOpacity>
  );
}