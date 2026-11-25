import { router, Stack } from 'expo-router';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { EmptyState, ErrorView, LoadingView } from '@/components/ui';
import { useMarkNotificationsRead, useNotifications } from '@/hooks/api';
import { timeAgo } from '@/lib/format';
import { routeForNotification } from '@/push/routeForNotification';
import { radius, spacing, useColors } from '@/theme';

export default function NotificationsScreen() {
  const c = useColors();
  const { data, error, isLoading, isRefetching, refetch } = useNotifications();
  const markRead = useMarkNotificationsRead();

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () =>
            data?.unseenCount ? (
              <Pressable onPress={() => markRead.mutate(undefined)} accessibilityRole="button">
                <Text style={{ color: c.primary, fontWeight: '700' }}>Mark all read</Text>
              </Pressable>
            ) : null,
        }}
      />
      <FlatList
        data={data?.notifications ?? []}
        keyExtractor={(n) => n.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={c.primary} />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              if (!item.isRead) markRead.mutate(item.id);
              const target = routeForNotification({ type: item.type, ...(item.metadata ?? {}) });
              if (target !== '/notifications') router.push(target);
            }}
            style={[styles.card, { backgroundColor: c.surface, borderColor: item.isRead ? c.border : c.primary }]}
          >
            <View style={styles.top}>
              <Text style={[styles.title, { color: c.text }]}>{item.title}</Text>
              <Text style={{ color: c.muted, fontSize: 12 }}>{timeAgo(item.createdAt)}</Text>
            </View>
            <Text style={{ color: c.muted, marginTop: 4 }}>{item.message}</Text>
          </Pressable>
        )}
        ListEmptyComponent={
          isLoading ? <LoadingView /> : error && !data ? <ErrorView error={error} onRetry={() => void refetch()} /> : <EmptyState title="You're all caught up" />
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, flexGrow: 1 },
  card: { borderWidth: 1, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  top: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  title: { fontWeight: '700', flex: 1 },
});
