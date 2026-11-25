import { useNetInfo } from '@react-native-community/netinfo';
import { StyleSheet, Text, View } from 'react-native';

import { useColors } from '@/theme';

/** Tells the user they are looking at cached data, rather than failing silently. */
export function OfflineBanner() {
  const c = useColors();
  const { isConnected } = useNetInfo();
  if (isConnected !== false) return null;

  return (
    <View accessibilityRole="alert" style={[styles.banner, { backgroundColor: c.warning }]}>
      <Text style={styles.text}>{"You're offline. Showing saved data; changes need a connection."}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { paddingVertical: 6, paddingHorizontal: 12 },
  text: { color: '#fff', fontWeight: '600', textAlign: 'center', fontSize: 13 },
});
