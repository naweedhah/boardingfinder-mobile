import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { FlatList, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import type { ListingDetail } from '@/api/types';
import { useCurrentUser } from '@/auth/AuthProvider';
import { Badge, Button, ErrorView, LoadingView } from '@/components/ui';
import { useListing, useRequestBooking, useReviews, useSaveReview, useStartChat, useToggleSaved } from '@/hooks/api';
import { notify } from '@/lib/dialogs';
import { boardingTypeLabel, bookingStatusLabel, formatRent, htmlToText } from '@/lib/format';
import { radius, spacing, useColors } from '@/theme';

const FACILITIES: { key: keyof NonNullable<ListingDetail['postDetail']>; label: string }[] = [
  { key: 'wifi', label: 'Wi-Fi' },
  { key: 'mealsProvided', label: 'Meals' },
  { key: 'kitchenAccess', label: 'Kitchen' },
  { key: 'parking', label: 'Parking' },
  { key: 'attachedBathroom', label: 'Attached bathroom' },
  { key: 'furnished', label: 'Furnished' },
  { key: 'petAllowed', label: 'Pets allowed' },
];

export default function ListingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = useColors();
  const me = useCurrentUser();
  const { width } = useWindowDimensions();
  const { data: listing, error, isLoading, refetch } = useListing(id);
  const { data: reviews } = useReviews(id);
  const toggleSaved = useToggleSaved(id);
  const requestBooking = useRequestBooking(id);
  const startChat = useStartChat();
  const saveReview = useSaveReview(id);
  const [rating, setRating] = useState(0);

  if (isLoading) return <LoadingView />;
  if (!listing) return <ErrorView error={error} onRetry={() => void refetch()} />;

  const detail = listing.postDetail;
  const isStudent = me.role === 'student';
  const isMine = listing.ownerId === me.id;
  const canBook = isStudent && listing.status === 'available' && (listing.remainingSlots ?? 1) > 0;

  function openInMaps() {
    if (listing!.latitude === null || listing!.longitude === null) return;
    const q = `${listing!.latitude},${listing!.longitude}`;
    void Linking.openURL(Platform.OS === 'ios' ? `maps:0,0?q=${q}` : `geo:0,0?q=${q}(${encodeURIComponent(listing!.title)})`);
  }

  function messageOwner() {
    startChat.mutate(listing!.ownerId, {
      onSuccess: (chat) => router.push({ pathname: '/chat/[id]', params: { id: chat.id, name: listing!.owner?.username } }),
      onError: (e) => notify('Could not open chat', e.message),
    });
  }

  function book() {
    requestBooking.mutate(undefined, {
      onSuccess: (result) => notify(result.message, 'The owner will be notified. You can track it in Bookings.'),
      onError: (e) => notify('Booking failed', e.message),
    });
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: listing.area ?? listing.city,
          headerRight: () =>
            isStudent ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={listing.isSaved ? 'Remove from saved' : 'Save listing'}
                onPress={() => toggleSaved.mutate(undefined, { onError: (e) => notify('Not saved', e.message) })}
                hitSlop={12}
              >
                <Text style={{ fontSize: 24, color: c.danger }}>{listing.isSaved ? '♥' : '♡'}</Text>
              </Pressable>
            ) : null,
        }}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <FlatList
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          data={listing.images}
          keyExtractor={(uri) => uri}
          renderItem={({ item }) => (
            <Image source={item} style={{ width, aspectRatio: 4 / 3 }} contentFit="cover" cachePolicy="memory-disk" />
          )}
        />
        <View style={styles.body}>
          <Text style={[styles.title, { color: c.text }]}>{listing.title}</Text>
          <Text style={[styles.price, { color: c.primary }]}>{formatRent(listing.rent)} / month</Text>
          <Text style={{ color: c.muted }}>
            {listing.address}, {[listing.area, listing.city].filter(Boolean).join(', ')}
          </Text>
          <View style={styles.badges}>
            <Badge label={boardingTypeLabel[listing.boardingType]} />
            <Badge label={`For ${listing.preferredTenantGender === 'any' ? 'anyone' : listing.preferredTenantGender + 's'}`} />
            <Badge
              label={listing.remainingSlots !== undefined ? `${listing.remainingSlots} of ${listing.capacity} slots free` : `${listing.capacity} slots`}
              tone={canBook ? 'success' : 'danger'}
            />
          </View>

          {detail ? (
            <>
              <View style={styles.badges}>
                {FACILITIES.filter((f) => detail[f.key]).map((f) => (
                  <Badge key={f.key} label={`✓ ${f.label}`} tone="success" />
                ))}
              </View>
              {detail.nearestCampus ? (
                <Text style={{ color: c.text }}>
                  🎓 {detail.nearestCampus}
                  {detail.distanceToCampus ? ` · ${(detail.distanceToCampus / 1000).toFixed(1)} km` : ''}
                </Text>
              ) : null}
              <Text style={[styles.section, { color: c.text }]}>About</Text>
              <Text style={{ color: c.text, lineHeight: 21 }}>{htmlToText(detail.description)}</Text>
              {detail.rules ? (
                <>
                  <Text style={[styles.section, { color: c.text }]}>House rules</Text>
                  <Text style={{ color: c.text }}>{detail.rules}</Text>
                </>
              ) : null}
            </>
          ) : null}

          {listing.latitude !== null ? (
            <Button title="Open in Maps" variant="secondary" onPress={openInMaps} style={{ marginTop: spacing.md }} />
          ) : null}

          {!isMine ? (
            <View style={styles.actions}>
              {isStudent ? (
                listing.bookingRequestStatus ? (
                  <View style={[styles.status, { borderColor: c.border }]}>
                    <Text style={{ color: c.text }}>Your request: {bookingStatusLabel[listing.bookingRequestStatus]}</Text>
                  </View>
                ) : (
                  <Button title={canBook ? 'Request booking' : 'No slots left'} onPress={book} disabled={!canBook} loading={requestBooking.isPending} />
                )
              ) : null}
              <Button title="Message owner" variant="secondary" onPress={messageOwner} loading={startChat.isPending} />
            </View>
          ) : null}

          <Text style={[styles.section, { color: c.text }]}>
            Reviews {reviews?.count ? `· ★ ${reviews.avgRating?.toFixed(1)} (${reviews.count})` : ''}
          </Text>
          {reviews?.reviews.length ? (
            reviews.reviews.slice(0, 5).map((r) => (
              <View key={r.id} style={[styles.review, { borderColor: c.border }]}>
                <Text style={{ color: c.text, fontWeight: '700' }}>
                  {'★'.repeat(r.rating)}
                  {'☆'.repeat(5 - r.rating)} {r.user?.username ?? ''}
                </Text>
                {r.comment ? <Text style={{ color: c.text, marginTop: 2 }}>{r.comment}</Text> : null}
              </View>
            ))
          ) : (
            <Text style={{ color: c.muted }}>No reviews yet.</Text>
          )}
          {isStudent ? (
            <View style={styles.rateRow}>
              <Text style={{ color: c.text }}>Rate it:</Text>
              {[1, 2, 3, 4, 5].map((n) => (
                <Pressable
                  key={n}
                  accessibilityRole="button"
                  accessibilityLabel={`${n} star${n > 1 ? 's' : ''}`}
                  onPress={() => {
                    setRating(n);
                    saveReview.mutate({ rating: n }, { onError: (e) => notify('Review not saved', e.message) });
                  }}
                >
                  <Text style={{ fontSize: 26, color: n <= rating ? c.warning : c.muted }}>★</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.lg, gap: spacing.sm },
  title: { fontSize: 22, fontWeight: '800' },
  price: { fontSize: 20, fontWeight: '800' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginVertical: spacing.xs },
  section: { fontSize: 17, fontWeight: '800', marginTop: spacing.md },
  actions: { gap: spacing.sm, marginTop: spacing.md },
  status: { borderWidth: 1, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  review: { borderBottomWidth: 1, paddingVertical: spacing.sm },
  rateRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
});
