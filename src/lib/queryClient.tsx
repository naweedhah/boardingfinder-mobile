import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { focusManager, onlineManager, QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useEffect, type ReactNode } from 'react';
import { AppState, Platform } from 'react-native';

import { ApiError } from '@/api/client';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Keep cached data for a day so the app opens with listings, chats and bookings offline.
      gcTime: 24 * 60 * 60 * 1000,
      retry: (failureCount, error) =>
        error instanceof ApiError && error.status >= 400 && error.status < 500 ? false : failureCount < 2,
    },
    mutations: { retry: false },
  },
});

// Persisted to AsyncStorage. Only API data is cached here: the token stays in SecureStore.
const persister = createAsyncStoragePersister({ storage: AsyncStorage, key: 'bf.query-cache' });

// React Query pauses requests while offline and resumes them when NetInfo says we're back.
onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) => setOnline(state.isConnected !== false)),
);

function useRefetchOnAppForeground() {
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const subscription = AppState.addEventListener('change', (status) => focusManager.setFocused(status === 'active'));
    return () => subscription.remove();
  }, []);
}

export function QueryProvider({ children }: { children: ReactNode }) {
  useRefetchOnAppForeground();
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, maxAge: 24 * 60 * 60 * 1000, buster: 'v1' }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
