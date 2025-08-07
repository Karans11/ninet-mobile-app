// components/UserProfileMenu.tsx - CREATE THIS NEW COMPONENT
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Dimensions,
  Platform,
  Linking,
  Alert
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface UserProfileMenuProps {
  visible: boolean;
  onClose: () => void;
  user: any;
  profile: any;
  onSignOut: () => void;
}

const UserProfileMenu: React.FC<UserProfileMenuProps> = ({
  visible,
  onClose,
  user,
  profile,
  onSignOut
}) => {
  const handleFeedback = async () => {
    // You mentioned you'll share the URL later - placeholder for now
    const feedbackUrl = 'https://feedback.ninet.io'; // Replace with your actual feedback URL
    
    try {
      const supported = await Linking.canOpenURL(feedbackUrl);
      if (supported) {
        await Linking.openURL(feedbackUrl);
        onClose();
      } else {
        Alert.alert('Error', 'Cannot open feedback form');
      }
    } catch (error) {
      console.error('Error opening feedback URL:', error);
      Alert.alert('Error', 'Cannot open feedback form');
    }
  };

  const handleContactUs = async () => {
    const email = 'contact@ninet.io';
    const subject = 'NineT App - Contact Us';
    const body = 'Hello NineT Team,\n\n';
    
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    try {
      const supported = await Linking.canOpenURL(mailtoUrl);
      if (supported) {
        await Linking.openURL(mailtoUrl);
        onClose();
      } else {
        // Fallback - copy email to clipboard or show alert
        Alert.alert(
          'Contact Us',
          `Please email us at: ${email}`,
          [
            { text: 'OK', onPress: onClose }
          ]
        );
      }
    } catch (error) {
      console.error('Error opening email:', error);
      Alert.alert(
        'Contact Us',
        `Please email us at: ${email}`,
        [
          { text: 'OK', onPress: onClose }
        ]
      );
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: () => {
            onSignOut();
            onClose();
          }
        }
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)'
        }}
        activeOpacity={1}
        onPress={onClose}
      >
        {/* Menu Container */}
        <View style={{
          position: 'absolute',
          top: Platform.OS === 'ios' ? 100 : 80,
          right: 20,
          backgroundColor: '#1F2937',
          borderRadius: 12,
          paddingVertical: 8,
          minWidth: 200,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8
        }}>
          {/* User Info Header */}
          <View style={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: '#374151'
          }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center'
            }}>
              {/* User Avatar */}
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#1D4ED8',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12
              }}>
                <Text style={{
                  color: 'white',
                  fontSize: 16,
                  fontWeight: 'bold'
                }}>
                  {profile?.full_name?.[0] || user?.email?.[0] || 'U'}
                </Text>
              </View>
              
              {/* User Details */}
              <View style={{ flex: 1 }}>
                <Text style={{
                  color: 'white',
                  fontSize: 14,
                  fontWeight: '600'
                }}>
                  {profile?.full_name || 'User'}
                </Text>
                <Text style={{
                  color: '#9CA3AF',
                  fontSize: 12
                }}>
                  {user?.email}
                </Text>
              </View>
            </View>
          </View>

          {/* Menu Items */}
          <View style={{ paddingVertical: 4 }}>
            {/* Feedback Option */}
            <TouchableOpacity
              onPress={handleFeedback}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 12
              }}
            >
              <Text style={{ fontSize: 18, marginRight: 12 }}>💬</Text>
              <Text style={{
                color: 'white',
                fontSize: 16
              }}>
                Feedback
              </Text>
            </TouchableOpacity>

            {/* Contact Us Option */}
            <TouchableOpacity
              onPress={handleContactUs}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 12
              }}
            >
              <Text style={{ fontSize: 18, marginRight: 12 }}>📧</Text>
              <View style={{ flex: 1 }}>
                <Text style={{
                  color: 'white',
                  fontSize: 16
                }}>
                  Contact Us
                </Text>
                <Text style={{
                  color: '#9CA3AF',
                  fontSize: 12
                }}>
                  contact@ninet.io
                </Text>
              </View>
            </TouchableOpacity>

            {/* Divider */}
            <View style={{
              height: 1,
              backgroundColor: '#374151',
              marginVertical: 4
            }} />

            {/* Sign Out Option */}
            <TouchableOpacity
              onPress={handleSignOut}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 12
              }}
            >
              <Text style={{ fontSize: 18, marginRight: 12 }}>🚪</Text>
              <Text style={{
                color: '#EF4444',
                fontSize: 16
              }}>
                Sign Out
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

export default UserProfileMenu;
