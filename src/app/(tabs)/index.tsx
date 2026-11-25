import * as Location from 'expo-location';
import { router, Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';

import type { ListingFilters } from '@/api/endpoints';
import type { BoardingType } from '@/api/types';
import { useCurrentUser } from '@/auth/AuthProvider';
import { ListingCard } from '@/components/ListingCard';
import { ListingsMap } from '@/components/ListingsMap';
import { OfflineBanner } from '@/components/OfflineBanner';
import { ChipGroup, EmptyState, ErrorView, LoadingView } from '@/components/ui';
import { useListings } from '@/hooks/api';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { boardingTypeLabel } from '@/lib/format';
import { radius, spacing, useColors } from '@/theme';

const RADII = [1, 2, 5, 10] as const;
const TYPES = Object.entries(boardingTypeLabel).map(([value, label]) => ({ value: value as BoardingType | 'all', label }));

export default function ExploreScreen() {
  const c = useColors();
  const user = useCurrentUser();
  const [city, setCity] = useState('');
  const [type, setType] = useState<BoardingType | 'all'>('all');
  const [maxPrice, setMaxPrice] = useState('');
  const [near, setNear] = useState<{ lat: number; lng: number } | null>(null);
  const [radiusKm, setRadiusKm] = useState<(typeof RADII)[number]>(2);
  const [view, setView] = useState<'list' | 'map'>('list');
  const [locationError, setLocationError] = useState<string | null>(null);

  // Wait until the user stops typing before hitting the API.
  const debouncedCity = useDebouncedValue(city, 400);
  const debouncedMax = useDebouncedValue(maxPrice, 400);

  const filters = useMemo<ListingFilters>(
    () => ({
      city: near ? undefined : debouncedCity || undefined,
      boardingType: type === 'all' ? undefined : type,
      maxPrice: /^\d+$/.test(debouncedMax) ? Number(debouncedMax) : undefined,
      near: near ? { ...near, radiusKm } : undefined,
    }),
    [debouncedCity, type, debouncedMax, near, radiusKm],
  );

  const { data, error, isLoading, isRefetching, refetch } = useListings(filters);

  async function toggleNearMe() {
    setLocationError(null);
    if (near) {
      setNear(null);
      return;
    }
    const { granted } = await Location.requestForegroundPermissionsAsync();
    if (!granted) {
      setLocationError('Allow location access to see rooms near you.');
      return;
    }
    const position =
      (await Location.getLastKnownPositionAsync({ maxAge: 5 * 60_000 })) ??
      (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
    setNear({ lat: position.coords.latitude, lng: position.coords.longitude });
  }

  const header = (
    <View style={styles.filters}>
      <TextInput
        accessibilityLabel="Search by city or area"
        placeholder={near ? 'Showing rooms near you' : 'City or area, e.g. Malabe'}
        placeholderTextColor={c.muted}
        editable={!near}
        value={city}
        onChangeText={setCity}
        style={[styles.search, { backgroundColor: c.surface, borderColor: c.border, color: c.text }]}
      />
      <View style={styles.row}>
        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: !!near }}
          onPress={toggleNearMe}
          style={[styles.toggle, { backgroundColor: near ? c.primary : c.chipBg }]}
        >
          <Text style={{ color: near ? c.primaryText : c.text, fontWeight: '700' }}>◎ Near me</Text>
        </Pressable>
        <TextInput
          accessibilityLabel="Maximum monthly rent"
          placeholder="Max rent (LKR)"
          placeholderTextColor={c.muted}
          keyboardType="number-pad"
          value={maxPrice}
          onChangeText={(v) => setMaxPrice(v.replace(/\D/g, ''))}
          style={[styles.price, { backgroundColor: c.surface, borderColor: c.border, color: c.text }]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={view === 'list' ? 'Show map' : 'Show list'}
          onPress={() => setView(view === 'list' ? 'map' : 'list')}
          style={[styles.toggle, { backgroundColor: c.chipBg }]}
        >
          <Text style={{ color: c.text, fontWeight: '700' }}>{view === 'list' ? 'Map' : 'List'}</Text>
        </Pressable>
      </View>
      {near ? (
        <ChipGroup
          value={String(radiusKm)}
          onChange={(v) => setRadiusKm(Number(v) as (typeof RADII)[number])}
          options={RADII.map((r) => ({ value: String(r), label: `${r} km` }))}
        />
      ) : null}
      {locationError ? <Text style={{ color: c.danger }}>{locationError}</Text> : null}
      <ChipGroup value={type} onChange={setType} options={[{ value: 'all', label: 'All types' }, ...TYPES]} />
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          headerRight: () =>
            user.role === 'boardingOwner' ? (
              <Pressable accessibilityRole="button" onPress={() => router.push('/add-listing')} style={{ paddingHorizontal: 16 }}>
                <Text style={{ color: c.primary, fontWeight: '700', fontSize: 16 }}>+ Add</Text>
              </Pressable>
            ) : null,
        }}
      />
      <OfflineBanner />
      {view === 'map' ? (
        <View style={{ flex: 1 }}>
          {header}
          <View style={{ flex: 1 }}>
            <ListingsMap listings={data ?? []} center={near} radiusKm={radiusKm} />
          </View>
        </View>
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ListingCard listing={item} />}
          ListHeaderComponent={header}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={c.primary} />}
          ListEmptyComponent={
            isLoading ? (
              <LoadingView />
            ) : error && !data ? (
              <ErrorView error={error} onRetry={() => void refetch()} />
            ) : (
              <EmptyState
                title="No rooms match"
                message={near ? `Nothing within ${radiusKm} km. Try a bigger radius.` : 'Try another city or clear the filters.'}
              />
            )
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg },
  filters: { gap: spacing.sm, marginBottom: spacing.md, paddingHorizontal: 0 },
  search: { borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 10, fontSize: 16 },
  row: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  toggle: { paddingHorizontal: spacing.md, paddingVertical: 10, borderRadius: radius.md },
  price: { flex: 1, flexBasis: 0, minWidth: 0, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 9, fontSize: 15 },
});
