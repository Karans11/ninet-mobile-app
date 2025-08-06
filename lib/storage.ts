import { Platform } from 'react-native';

// Cross-platform secure storage
let SecureStore: any;
let AsyncStorage: any;

if (Platform.OS === 'web') {
  // Web fallback using localStorage
  SecureStore = {
    setItemAsync: (key: string, value: string) => {
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem(key, value);
        }
        return Promise.resolve();
      } catch (error) {
        return Promise.reject(error);
      }
    },
    getItemAsync: (key: string) => {
      try {
        if (typeof window !== 'undefined') {
          return Promise.resolve(localStorage.getItem(key));
        }
        return Promise.resolve(null);
      } catch (error) {
        return Promise.reject(error);
      }
    },
    deleteItemAsync: (key: string) => {
      try {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(key);
        }
        return Promise.resolve();
      } catch (error) {
        return Promise.reject(error);
      }
    }
  };
} else {
  // Native platforms use real SecureStore
  SecureStore = require('expo-secure-store');
}

// AsyncStorage for Supabase
if (typeof window !== 'undefined') {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} else {
  AsyncStorage = {
    getItem: () => Promise.resolve(null),
    setItem: () => Promise.resolve(),
    removeItem: () => Promise.resolve(),
  };
}

export { SecureStore, AsyncStorage };
