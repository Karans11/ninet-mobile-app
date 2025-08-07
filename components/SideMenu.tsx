// components/SideMenu.tsx - FIXED VERSION WITH PROPER SCREEN FITTING
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  Platform,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { UserStats, UserPreferences } from '../types/Article';
import { getCategoryColor } from '../utils/categoryColors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SideMenuProps {
  visible: boolean;
  onClose: () => void;
  user: any;
  profile: any;
  userStats: UserStats;
  userPreferences: UserPreferences;
  availableCategories: string[];
  viewMode: 'all' | 'bookmarks';
  onViewModeChange: (mode: 'all' | 'bookmarks') => void;
  onPreferencesChange: (preferences: UserPreferences) => void;
  onSignOut: () => void;
}

const SideMenu: React.FC<SideMenuProps> = ({
  visible,
  onClose,
  user,
  profile,
  userStats,
  userPreferences,
  availableCategories,
  viewMode,
  onViewModeChange,
  onPreferencesChange,
  onSignOut
}) => {
  const [showCategories, setShowCategories] = useState(false);

  const toggleCategory = (category: string) => {
    const newCategories = userPreferences.selectedCategories.includes(category)
      ? userPreferences.selectedCategories.filter(c => c !== category)
      : [...userPreferences.selectedCategories, category];

    onPreferencesChange({
      ...userPreferences,
      selectedCategories: newCategories
    });
  };

  const toggleFilterMode = () => {
    const newMode = userPreferences.filterMode === 'all' ? 'selected' : 'all';
    onPreferencesChange({
      ...userPreferences,
      filterMode: newMode
    });
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={{
        flex: 1,
        flexDirection: 'row',
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
      }}>
        {/* Menu Content */}
        <View style={{
          width: SCREEN_WIDTH * 0.85, // 85% of screen width
          maxWidth: 320, // Max width for larger screens
          height: SCREEN_HEIGHT,
          backgroundColor: '#111827'
        }}>
          <SafeAreaView style={{ flex: 1 }}>
            <StatusBar barStyle="light-content" backgroundColor="#111827" />
            
            {/* Header */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 20,
              borderBottomWidth: 1,
              borderBottomColor: '#374151'
            }}>
              <Text style={{
                color: 'white',
                fontSize: 24,
                fontWeight: 'bold'
              }}>
                NineT
              </Text>
              
              <TouchableOpacity
                onPress={onClose}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#374151',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <Text style={{ color: 'white', fontSize: 18 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={false}
            >
              {/* User Info */}
              <View style={{
                padding: 20,
                borderBottomWidth: 1,
                borderBottomColor: '#374151'
              }}>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 16
                }}>
                  <View style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    backgroundColor: '#1D4ED8',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 12
                  }}>
                    <Text style={{
                      color: 'white',
                      fontSize: 20,
                      fontWeight: 'bold'
                    }}>
                      {profile?.full_name?.[0] || user?.email?.[0] || 'U'}
                    </Text>
                  </View>
                  
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      color: 'white',
                      fontSize: 16,
                      fontWeight: '600'
                    }}>
                      {profile?.full_name || 'User'}
                    </Text>
                    <Text style={{
                      color: '#9CA3AF',
                      fontSize: 14
                    }}>
                      {user?.email}
                    </Text>
                  </View>
                </View>

                {/* User Stats */}
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between'
                }}>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{
                      color: 'white',
                      fontSize: 18,
                      fontWeight: 'bold'
                    }}>
                      {userStats.readArticles.size}
                    </Text>
                    <Text style={{
                      color: '#9CA3AF',
                      fontSize: 12
                    }}>
                      Read
                    </Text>
                  </View>
                  
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{
                      color: 'white',
                      fontSize: 18,
                      fontWeight: 'bold'
                    }}>
                      {userStats.bookmarkedArticles.size}
                    </Text>
                    <Text style={{
                      color: '#9CA3AF',
                      fontSize: 12
                    }}>
                      Saved
                    </Text>
                  </View>
                  
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{
                      color: 'white',
                      fontSize: 18,
                      fontWeight: 'bold'
                    }}>
                      {userStats.streak}
                    </Text>
                    <Text style={{
                      color: '#9CA3AF',
                      fontSize: 12
                    }}>
                      Streak
                    </Text>
                  </View>
                </View>
              </View>

              {/* View Mode Toggle */}
              <View style={{ padding: 20 }}>
                <Text style={{
                  color: 'white',
                  fontSize: 18,
                  fontWeight: '600',
                  marginBottom: 16
                }}>
                  View Mode
                </Text>
                
                <View style={{
                  flexDirection: 'row',
                  backgroundColor: '#374151',
                  borderRadius: 8,
                  padding: 4
                }}>
                  <TouchableOpacity
                    onPress={() => onViewModeChange('all')}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      alignItems: 'center',
                      backgroundColor: viewMode === 'all' ? '#1D4ED8' : 'transparent',
                      borderRadius: 6
                    }}
                  >
                    <Text style={{
                      color: 'white',
                      fontSize: 14,
                      fontWeight: viewMode === 'all' ? '600' : '400'
                    }}>
                      All Articles
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={() => onViewModeChange('bookmarks')}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      alignItems: 'center',
                      backgroundColor: viewMode === 'bookmarks' ? '#1D4ED8' : 'transparent',
                      borderRadius: 6
                    }}
                  >
                    <Text style={{
                      color: 'white',
                      fontSize: 14,
                      fontWeight: viewMode === 'bookmarks' ? '600' : '400'
                    }}>
                      Bookmarks
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Categories Filter */}
              <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
                <TouchableOpacity
                  onPress={() => setShowCategories(!showCategories)}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 16
                  }}
                >
                  <Text style={{
                    color: 'white',
                    fontSize: 18,
                    fontWeight: '600'
                  }}>
                    Categories
                  </Text>
                  <Text style={{
                    color: '#9CA3AF',
                    fontSize: 18
                  }}>
                    {showCategories ? '▼' : '▶'}
                  </Text>
                </TouchableOpacity>

                {showCategories && (
                  <View>
                    {/* Filter Mode Toggle */}
                    <TouchableOpacity
                      onPress={toggleFilterMode}
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: '#374151',
                        padding: 12,
                        borderRadius: 8,
                        marginBottom: 12
                      }}
                    >
                      <Text style={{ color: 'white', fontSize: 14 }}>
                        {userPreferences.filterMode === 'all' 
                          ? 'Show All Categories' 
                          : 'Show Selected Only'
                        }
                      </Text>
                      <View style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        backgroundColor: userPreferences.filterMode === 'selected' ? '#10B981' : '#6B7280'
                      }} />
                    </TouchableOpacity>

                    {/* Category List with colored indicators */}
                    {availableCategories.map((category) => (
                      <TouchableOpacity
                        key={category}
                        onPress={() => toggleCategory(category)}
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          paddingVertical: 12,
                          paddingHorizontal: 8
                        }}
                      >
                        {/* Category with color indicator */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                          <View style={{
                            width: 12,
                            height: 12,
                            borderRadius: 6,
                            backgroundColor: getCategoryColor(category),
                            marginRight: 12
                          }} />
                          <Text style={{
                            color: 'white',
                            fontSize: 14,
                            flex: 1
                          }}>
                            {category}
                          </Text>
                        </View>
                        
                        <View style={{
                          width: 20,
                          height: 20,
                          borderRadius: 4,
                          backgroundColor: userPreferences.selectedCategories.includes(category)
                            ? '#10B981'
                            : '#6B7280',
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}>
                          {userPreferences.selectedCategories.includes(category) && (
                            <Text style={{ color: 'white', fontSize: 12 }}>✓</Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </ScrollView>
          </SafeAreaView>
        </View>

        {/* Backdrop - closes menu when tapped */}
        <TouchableOpacity
          style={{ flex: 1 }}
          onPress={onClose}
          activeOpacity={1}
        />
      </View>
    </Modal>
  );
};

export default SideMenu;