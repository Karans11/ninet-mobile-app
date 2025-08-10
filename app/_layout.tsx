// app/_layout.tsx - ENABLE AUTHGUARD
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