import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/auth/AuthProvider';
import { LoadingView } from '@/components/ui';
import { QueryProvider } from '@/lib/queryClient';
import { usePushNotifications } from '@/push/usePushNotifications';
import { RealtimeProvider } from '@/realtime/RealtimeProvider';
import { useColors } from '@/theme';

function RootNavigator() {
  const { state } = useAuth();
  const c = useColors();
  usePushNotifications();

  if (state.status === 'loading') return <LoadingView />;
  const signedIn = state.status === 'signedIn';

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: c.surface },
        headerTintColor: c.text,
        contentStyle: { backgroundColor: c.background },
      }}
    >
      {/* Stack.Protected removes routes whose guard is false, so a signed-out user cannot deep-link into the app. */}
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="listing/[id]" options={{ title: 'Listing' }} />
        <Stack.Screen name="chat/[id]" options={{ title: 'Chat' }} />
        <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
        <Stack.Screen name="add-listing" options={{ title: 'New listing', presentation: 'modal' }} />
      </Stack.Protected>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="sign-in" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ title: 'Create account' }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryProvider>
        <AuthProvider>
          <RealtimeProvider>
            <StatusBar style="auto" />
            <RootNavigator />
          </RealtimeProvider>
        </AuthProvider>
      </QueryProvider>
    </SafeAreaProvider>
  );
}
