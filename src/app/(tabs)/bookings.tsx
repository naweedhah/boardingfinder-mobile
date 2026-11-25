import { router } from 'expo-router';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import type { Booking, BookingStatus } from '@/api/types';
import { useCurrentUser } from '@/auth/AuthProvider';
import { Badge, Button, EmptyState, ErrorView, LoadingView } from '@/components/ui';
import { useBookings, useRespondToBooking } from '@/hooks/api';
import { confirmAction, notify } from '@/lib/dialogs';
import { bookingStatusLabel, formatRent, timeAgo } from '@/lib/format';
import { radius, spacing, useColors } from '@/theme';

const tone = (status: BookingStatus) =>
  status === 'approved' || status === 'confirmed'
    ? 'success'
    : status === 'pending' || status === 'paymentPending'
      ? 'warning'
      : 'danger';

export default function BookingsScreen() {
  const c = useColors();
  const user = useCurrentUser();
  const isOwner = user.role === 'boardingOwner';
  const { data, error, isLoading, isRefetching, refetch } = useBookings();
  const respond = useRespondToBooking();

  function act(booking: Booking, action: 'approve' | 'reject' | 'cancel') {
    const verb = { approve: 'Approve', reject: 'Reject', cancel: 'Cancel' }[action];
    confirmAction(
      `${verb} booking?`,
      booking.post.title,
      verb,
      () =>
        respond.mutate(
          { id: booking.id, action },
          {
            onSuccess: (result) => {
              if (result.chatId) {
                router.push({
                  pathname: '/chat/[id]',
                  params: { id: result.chatId, name: isOwner ? booking.student.username : booking.owner.username },
                });
              }
            },
            onError: (e) => notify('Could not update booking', e.message),
          },
        ),
      action !== 'approve',
    );
  }

  return (
    <FlatList
      data={data ?? []}
      keyExtractor={(b) => b.id}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={c.primary} />}
      renderItem={({ item }) => (
        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          <View style={styles.top}>
            <Text style={[styles.title, { color: c.text }]} numberOfLines={1}>
              {item.post.title}
            </Text>
            <Badge label={bookingStatusLabel[item.status]} tone={tone(item.status)} />
          </View>
          <Text style={{ color: c.muted }}>
            {formatRent(item.post.rent)} · {item.post.area ?? item.post.city}
          </Text>
          <Text style={{ color: c.muted, marginTop: 2 }}>
            {isOwner ? `From ${item.student.fullName ?? item.student.username}` : `Owner: ${item.owner.fullName ?? item.owner.username}`} ·{' '}
            {timeAgo(item.createdAt)}
          </Text>
          {item.status === 'pending' ? (
            <View style={styles.actions}>
              {isOwner ? (
                <>
                  <Button title="Approve" onPress={() => act(item, 'approve')} style={{ flex: 1 }} />
                  <Button title="Reject" variant="secondary" onPress={() => act(item, 'reject')} style={{ flex: 1 }} />
                </>
              ) : (
                <Button title="Cancel request" variant="secondary" onPress={() => act(item, 'cancel')} style={{ flex: 1 }} />
              )}
            </View>
          ) : null}
        </View>
      )}
      ListEmptyComponent={
        isLoading ? (
          <LoadingView />
        ) : error && !data ? (
          <ErrorView error={error} onRetry={() => void refetch()} />
        ) : (
          <EmptyState
            title={isOwner ? 'No booking requests' : 'No bookings yet'}
            message={isOwner ? 'Requests from students appear here.' : 'Request a room from its listing page.'}
          />
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, flexGrow: 1 },
  card: { borderWidth: 1, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, gap: 2 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  title: { fontWeight: '700', fontSize: 16, flex: 1 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
});
