import { router } from 'expo-router';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { useCurrentUser } from '@/auth/AuthProvider';
import { EmptyState, ErrorView, LoadingView } from '@/components/ui';
import { useChats } from '@/hooks/api';
import { timeAgo } from '@/lib/format';
import { useRealtimeConnection } from '@/realtime/RealtimeProvider';
import { radius, spacing, useColors } from '@/theme';

export default function ChatsScreen() {
  const c = useColors();
  const me = useCurrentUser();
  const connection = useRealtimeConnection();
  const { data, error, isLoading, isRefetching, refetch } = useChats();

  return (
    <FlatList
      data={data ?? []}
      keyExtractor={(chat) => chat.id}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={c.primary} />}
      ListHeaderComponent={
        connection === 'unavailable' ? (
          <Text style={[styles.note, { color: c.muted }]}>Live updates are paused. Pull down to refresh.</Text>
        ) : undefined
      }
      renderItem={({ item }) => {
        const unread = !item.seenBy.includes(me.id);
        return (
            <Pressable
              onPress={() => router.push({ pathname: '/chat/[id]', params: { id: item.id, name: item.receiver?.username ?? 'Chat' } })}
              style={[styles.row, { backgroundColor: c.surface, borderColor: c.border }]}>
              <View style={[styles.avatar, { backgroundColor: c.chipBg }]}>
                <Text style={{ color: c.primary, fontWeight: '800' }}>
                  {(item.receiver?.username ?? '?').slice(0, 1).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.top}>
                  <Text style={[styles.name, { color: c.text }]}>{item.receiver?.username ?? 'Deleted user'}</Text>
                  <Text style={{ color: c.muted, fontSize: 12 }}>{timeAgo(item.updatedAt)}</Text>
                </View>
                <Text
                  numberOfLines={1}
                  style={{ color: unread ? c.text : c.muted, fontWeight: unread ? '700' : '400', marginTop: 2 }}
                >
                  {item.lastMessage ?? 'No messages yet'}
                </Text>
              </View>
              {unread ? <View accessibilityLabel="Unread" style={[styles.dot, { backgroundColor: c.primary }]} /> : null}
            </Pressable>
        );
      }}
      ListEmptyComponent={
        isLoading ? (
          <LoadingView />
        ) : error && !data ? (
          <ErrorView error={error} onRetry={() => void refetch()} />
        ) : (
          <EmptyState title="No conversations yet" message="Message an owner from any listing." />
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, flexGrow: 1 },
  note: { textAlign: 'center', marginBottom: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  top: { flexDirection: 'row', justifyContent: 'space-between' },
  name: { fontWeight: '700', fontSize: 16 },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
