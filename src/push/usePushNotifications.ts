import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { endpoints } from '@/api/endpoints';
import { useAuth } from '@/auth/AuthProvider';
import { routeForNotification } from './routeForNotification';

// Show notifications as banners even while the app is open (native only; web has no push).
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/**
 * Asks for permission and returns this device's Expo push token, or null when push is not
 * possible: web, simulators, permission denied, or no EAS project id configured yet.
 */
async function getExpoPushToken(): Promise<string | null> {
  if (Platform.OS === 'web' || !Device.isDevice) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Bookings and messages',
      // eslint-disable-next-line import/namespace -- re-exported via `export *`, which the rule can't follow
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  const current = await Notifications.getPermissionsAsync();
  const granted = current.granted || (await Notifications.requestPermissionsAsync()).granted;
  if (!granted) return null;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) {
    console.warn('Push disabled: run `eas init` to add an EAS project id (see README).');
    return null;
  }

  return (await Notifications.getExpoPushTokenAsync({ projectId })).data;
}

/** Registers the device with the API after sign-in and deep-links when a notification is tapped. */
export function usePushNotifications() {
  const { state, setPushToken } = useAuth();
  const signedIn = state.status === 'signedIn';

  useEffect(() => {
    if (!signedIn) return;
    let cancelled = false;

    getExpoPushToken()
      .then(async (token) => {
        if (!token || cancelled) return;
        await endpoints.registerPushToken(token, Platform.OS === 'ios' ? 'ios' : 'android');
        setPushToken(token);
      })
      .catch((error) => console.warn('Push registration failed', error));

    return () => {
      cancelled = true;
    };
  }, [signedIn, setPushToken]);

  useEffect(() => {
    if (!signedIn || Platform.OS === 'web') return;

    const open = (response: Notifications.NotificationResponse | null) => {
      if (response) router.push(routeForNotification(response.notification.request.content.data));
    };

    // The app may have been launched by tapping a notification.
    open(Notifications.getLastNotificationResponse());
    const subscription = Notifications.addNotificationResponseReceivedListener(open);
    return () => subscription.remove();
  }, [signedIn]);
}
