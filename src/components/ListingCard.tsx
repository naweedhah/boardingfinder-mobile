import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Listing } from '@/api/types';
import { boardingTypeLabel, formatDistance, formatRent } from '@/lib/format';
import { radius, spacing, useColors } from '@/theme';
import { Badge } from './ui';

export function ListingCard({ listing }: { listing: Listing }) {
  const c = useColors();
  const place = [listing.area, listing.city].filter(Boolean).join(', ');
  const full = listing.status !== 'available' || listing.remainingSlots === 0;

  return (
    <Pressable
        onPress={() => router.push({ pathname: '/listing/[id]', params: { id: listing.id } })}
        accessibilityRole="button"
        accessibilityLabel={`${listing.title}, ${formatRent(listing.rent)} per month, ${place}`}
        style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}
      >
        <Image
          source={listing.images[0]}
          style={styles.image}
          contentFit="cover"
          transition={150}
          cachePolicy="memory-disk"
          accessibilityIgnoresInvertColors
        />
        <View style={styles.body}>
          <Text style={[styles.title, { color: c.text }]} numberOfLines={2}>
            {listing.title}
          </Text>
          <Text style={[styles.meta, { color: c.muted }]} numberOfLines={1}>
            {place} · {boardingTypeLabel[listing.boardingType]}
          </Text>
          <View style={styles.row}>
            <Text style={[styles.price, { color: c.primary }]}>
              {formatRent(listing.rent)}
              <Text style={{ color: c.muted, fontSize: 13, fontWeight: '400' }}> /month</Text>
            </Text>
            {listing.distanceKm !== undefined ? (
              <Text style={[styles.meta, { color: c.muted }]}>{formatDistance(listing.distanceKm)}</Text>
            ) : null}
          </View>
          <View style={styles.row}>
            {full ? (
              <Badge label="No slots left" tone="danger" />
            ) : (
              <Badge
                label={listing.remainingSlots !== undefined ? `${listing.remainingSlots} slot(s) left` : 'Available'}
                tone="success"
              />
            )}
            {listing.demandLevel === 'high' ? <Badge label="In demand" tone="warning" /> : null}
          </View>
        </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: radius.lg, overflow: 'hidden', marginBottom: spacing.md },
  image: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#ccd5e3' },
  body: { padding: spacing.md, gap: spacing.xs },
  title: { fontSize: 17, fontWeight: '700' },
  meta: { fontSize: 14 },
  price: { fontSize: 17, fontWeight: '800' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm, marginTop: 2 },
});
