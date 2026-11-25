import type { ListingFilters } from '@/api/endpoints';

export const queryKeys = {
  listings: (filters: ListingFilters) => ['listings', filters] as const,
  listing: (id: string) => ['listing', id] as const,
  reviews: (id: string) => ['reviews', id] as const,
  saved: ['saved'] as const,
  bookings: ['bookings'] as const,
  chats: ['chats'] as const,
  chat: (id: string) => ['chat', id] as const,
  notifications: ['notifications'] as const,
};
