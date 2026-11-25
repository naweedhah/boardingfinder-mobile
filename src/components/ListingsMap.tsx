import { router } from 'expo-router';
import { StyleSheet } from 'react-native';
import MapView, { Callout, Circle, Marker } from 'react-native-maps';

import type { Listing } from '@/api/types';
import { formatRent } from '@/lib/format';
import { useColors } from '@/theme';

// Centre of Sri Lanka, zoomed to show the island.
const SRI_LANKA_REGION = { latitude: 7.8731, longitude: 80.7718, latitudeDelta: 3.6, longitudeDelta: 3.0 };

export function ListingsMap({
  listings,
  center,
  radiusKm,
}: {
  listings: Listing[];
  center?: { lat: number; lng: number } | null;
  radiusKm?: number;
}) {
  const c = useColors();
  const pinned = listings.filter((l) => l.latitude !== null && l.longitude !== null);
  const region = center
    ? { latitude: center.lat, longitude: center.lng, latitudeDelta: 0.08, longitudeDelta: 0.08 }
    : SRI_LANKA_REGION;

  return (
    <MapView style={StyleSheet.absoluteFill} initialRegion={region} showsUserLocation={!!center}>
      {center && radiusKm ? (
        <Circle
          center={{ latitude: center.lat, longitude: center.lng }}
          radius={radiusKm * 1000}
          strokeColor={c.primary}
          fillColor="rgba(47,109,181,0.08)"
        />
      ) : null}
      {pinned.map((listing) => (
        <Marker
          key={listing.id}
          coordinate={{ latitude: listing.latitude!, longitude: listing.longitude! }}
          pinColor={c.primary}
          title={listing.title}
          description={formatRent(listing.rent)}
        >
          <Callout onPress={() => router.push({ pathname: '/listing/[id]', params: { id: listing.id } })} />
        </Marker>
      ))}
    </MapView>
  );
}
