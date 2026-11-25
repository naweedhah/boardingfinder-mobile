import { useQueryClient } from '@tanstack/react-query';
import * as Device from 'expo-device';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { configureApiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import type { User } from '@/api/types';
import { tokenStorage } from './tokenStorage';

type AuthState =
  | { status: 'loading'; user: null }
  | { status: 'signedOut'; user: null }
  | { status: 'signedIn'; user: User };

interface AuthContextValue {
  state: AuthState;
  signIn: (username: string, password: string) => Promise<User>;
  signOut: () => Promise<void>;
  /** Push token registered for this device, so sign-out can unlink it. */
  setPushToken: (token: string | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<AuthState>({ status: 'loading', user: null });
  // Kept in refs so the API client always sees the current values without re-configuring.
  const tokenRef = useRef<string | null>(null);
  const pushTokenRef = useRef<string | null>(null);

  const forgetSession = useCallback(async () => {
    tokenRef.current = null;
    await tokenStorage.clear();
    // Cached chats, bookings etc. belong to the previous user.
    queryClient.clear();
    setState({ status: 'signedOut', user: null });
  }, [queryClient]);

  useEffect(() => {
    configureApiClient({
      getToken: () => tokenRef.current,
      onUnauthorized: () => void forgetSession(),
    });
  }, [forgetSession]);

  // Restore the session on launch. Offline launches keep the cached profile instead of signing out.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [token, cachedUser] = await Promise.all([tokenStorage.getToken(), tokenStorage.getUser()]);
      if (!token) {
        if (!cancelled) setState({ status: 'signedOut', user: null });
        return;
      }
      tokenRef.current = token;
      try {
        const user = await endpoints.me();
        await tokenStorage.saveUser(JSON.stringify(user));
        if (!cancelled) setState({ status: 'signedIn', user });
      } catch (error) {
        const offline = (error as { isNetworkError?: boolean }).isNetworkError;
        if (offline && cachedUser && !cancelled) {
          setState({ status: 'signedIn', user: JSON.parse(cachedUser) as User });
        } else if (!cancelled) {
          await forgetSession();
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [forgetSession]);

  const signIn = useCallback(async (username: string, password: string) => {
    const deviceName = (Device.deviceName ?? Device.modelName ?? 'Mobile device').slice(0, 60);
    const { token, user } = await endpoints.login({ username: username.trim(), password, deviceName });
    tokenRef.current = token;
    await tokenStorage.save(token, JSON.stringify(user));
    setState({ status: 'signedIn', user });
    return user;
  }, []);

  const signOut = useCallback(async () => {
    try {
      await endpoints.logout(pushTokenRef.current);
    } catch {
      // Offline or already revoked: still clear the device. The token expires server-side.
    }
    pushTokenRef.current = null;
    await forgetSession();
  }, [forgetSession]);

  const value = useMemo<AuthContextValue>(
    () => ({ state, signIn, signOut, setPushToken: (token) => (pushTokenRef.current = token) }),
    [state, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}

/** For screens that are only reachable when signed in. */
export function useCurrentUser(): User {
  const { state } = useAuth();
  if (state.status !== 'signedIn') throw new Error('useCurrentUser used while signed out');
  return state.user;
}
