// app/_layout.tsx - REPLACE COMPLETELY
import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import AuthGuard from '../components/auth/AuthGuard';

export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthGuard>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </AuthGuard>
    </AuthProvider>
  );
}