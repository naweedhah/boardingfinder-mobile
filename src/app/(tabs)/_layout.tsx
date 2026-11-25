import { Tabs } from 'expo-router/tabs';
import { Text, type ColorValue } from 'react-native';

import { useCurrentUser } from '@/auth/AuthProvider';
import { useNotifications } from '@/hooks/api';
import { useColors } from '@/theme';

// Simple text glyphs keep the bundle free of an icon font dependency.
const icon = (glyph: string) =>
  function TabIcon({ color }: { color: ColorValue }) {
    return <Text style={{ color, fontSize: 18 }}>{glyph}</Text>;
  };

export default function TabsLayout() {
  const c = useColors();
  const user = useCurrentUser();
  const { data } = useNotifications();
  const isOwner = user.role === 'boardingOwner';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.muted,
        tabBarStyle: { backgroundColor: c.surface, borderTopColor: c.border },
        headerStyle: { backgroundColor: c.surface },
        headerTintColor: c.text,
        sceneStyle: { backgroundColor: c.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Explore', tabBarIcon: icon('⌕') }} />
      <Tabs.Screen name="saved" options={{ title: isOwner ? 'My listings' : 'Saved', tabBarIcon: icon(isOwner ? '⌂' : '♡') }} />
      <Tabs.Screen name="chats" options={{ title: 'Chats', tabBarIcon: icon('✉') }} />
      <Tabs.Screen name="bookings" options={{ title: isOwner ? 'Requests' : 'Bookings', tabBarIcon: icon('☑') }} />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: icon('☺'),
          tabBarBadge: data?.unseenCount ? data.unseenCount : undefined,
        }}
      />
    </Tabs>
  );
}
