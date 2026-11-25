import { FlatList, RefreshControl, StyleSheet } from 'react-native';

import { useCurrentUser } from '@/auth/AuthProvider';
import { ListingCard } from '@/components/ListingCard';
import { EmptyState, ErrorView, LoadingView } from '@/components/ui';
import { useSavedListings } from '@/hooks/api';
import { spacing, useColors } from '@/theme';

/** Students see the listings they saved; owners see their own listings. */
export default function SavedScreen() {
  const c = useColors();
  const user = useCurrentUser();
  const { data, error, isLoading, isRefetching, refetch } = useSavedListings();
  const isOwner = user.role === 'boardingOwner';
  const listings = (isOwner ? data?.userPosts : data?.savedPosts) ?? [];

  return (
    <FlatList
      data={listings}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <ListingCard listing={item} />}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={c.primary} />}
      ListEmptyComponent={
        isLoading ? (
          <LoadingView />
        ) : error && !data ? (
          <ErrorView error={error} onRetry={() => void refetch()} />
        ) : isOwner ? (
          <EmptyState title="No listings yet" message="Tap + Add on the Explore tab to list a room." />
        ) : (
          <EmptyState title="Nothing saved yet" message="Tap ♡ on a listing to keep it here, even offline." />
        )
      }
    />
  );
}

const styles = StyleSheet.create({ list: { padding: spacing.lg, flexGrow: 1 } });
