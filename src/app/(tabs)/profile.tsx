import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import type { NotificationPreferences } from '@/api/types';
import { useAuth, useCurrentUser } from '@/auth/AuthProvider';
import { Button } from '@/components/ui';
import { useNotifications, useUpdatePreferences } from '@/hooks/api';
import { notify } from '@/lib/dialogs';
import { radius, spacing, useColors } from '@/theme';

const TOGGLES: { key: keyof NotificationPreferences; label: string }[] = [
  { key: 'pushEnabled', label: 'Push notifications on this phone' },
  { key: 'bookingUpdates', label: 'Booking updates' },
  { key: 'watchlistAlerts', label: 'Saved listing alerts' },
  { key: 'priceAlerts', label: 'Price drops' },
  { key: 'roommateAlerts', label: 'Roommate matches' },
  { key: 'safetyAlerts', label: 'Safety warnings' },
];

export default function ProfileScreen() {
  const c = useColors();
  const user = useCurrentUser();
  const { signOut } = useAuth();
  const { data } = useNotifications();
  const update = useUpdatePreferences();
  const prefs = data?.preferences;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
        <Text style={[styles.name, { color: c.text }]}>{user.fullName ?? user.username}</Text>
        <Text style={{ color: c.muted }}>@{user.username} · {user.role === 'boardingOwner' ? 'Boarding owner' : 'Student'}</Text>
        <Text style={{ color: c.muted, marginTop: 4 }}>{user.email}</Text>
      </View>

        <Pressable
          onPress={() => router.push('/notifications')}
          style={[styles.card, styles.linkRow, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={{ color: c.text, fontWeight: '700', fontSize: 16 }}>Notifications</Text>
          <Text style={{ color: c.primary, fontWeight: '700' }}>
            {data?.unseenCount ? `${data.unseenCount} new` : 'View'} ›
          </Text>
        </Pressable>

      <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
        <Text style={[styles.section, { color: c.text }]}>Alert settings</Text>
        {TOGGLES.map(({ key, label }) => (
          <View key={key} style={styles.toggleRow}>
            <Text style={{ color: c.text, flex: 1 }}>{label}</Text>
            <Switch
              accessibilityLabel={label}
              value={prefs?.[key] ?? false}
              disabled={!prefs || update.isPending}
              onValueChange={(value) =>
                update.mutate({ [key]: value }, { onError: (e) => notify('Could not save', e.message) })
              }
              trackColor={{ true: c.primary, false: c.border }}
            />
          </View>
        ))}
      </View>

      <Button title="Sign out" variant="danger" onPress={() => void signOut()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.md },
  card: { borderWidth: 1, borderRadius: radius.md, padding: spacing.lg },
  name: { fontSize: 20, fontWeight: '800' },
  linkRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  section: { fontWeight: '800', fontSize: 16, marginBottom: spacing.sm },
  toggleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: spacing.md },
});
