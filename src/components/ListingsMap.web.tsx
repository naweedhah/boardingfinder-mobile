import { StyleSheet, Text, View } from 'react-native';

import type { Listing } from '@/api/types';
import { useColors } from '@/theme';

/** react-native-maps has no web implementation; the browser preview shows a note instead. */
export function ListingsMap({ listings }: { listings: Listing[]; center?: unknown; radiusKm?: number }) {
  const c = useColors();
  return (
    <View style={[StyleSheet.absoluteFill, styles.box, { backgroundColor: c.chipBg }]}>
      <Text style={{ color: c.text, fontWeight: '700' }}>Map view runs on iOS and Android</Text>
      <Text style={{ color: c.muted, marginTop: 4 }}>{listings.length} listing(s) would be pinned here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({ box: { alignItems: 'center', justifyContent: 'center', padding: 24 } });
