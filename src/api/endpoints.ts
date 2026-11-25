import { api, type Query } from './client';
import type {
  AppNotification,
  Booking,
  ChatDetail,
  ChatSummary,
  Listing,
  ListingDetail,
  LoginResponse,
  Message,
  NotificationPreferences,
  ReviewSummary,
  User,
} from './types';

export interface ListingFilters {
  city?: string;
  boardingType?: string;
  preferredTenantGender?: string;
  minPrice?: number;
  maxPrice?: number;
  /** "Near me" search: the API filters by radius and sorts by distance. */
  near?: { lat: number; lng: number; radiusKm: number };
}

export function listingQuery(filters: ListingFilters): Query {
  const { near, ...rest } = filters;
  return {
    ...rest,
    city: rest.city?.trim(),
    ...(near ? { lat: near.lat.toFixed(5), lng: near.lng.toFixed(5), radiusKm: near.radiusKm } : {}),
  };
}

export const endpoints = {
  // ---- Auth ---------------------------------------------------------------
  login: (body: { username: string; password: string; deviceName: string }) =>
    api<LoginResponse>('auth/mobile/login', { method: 'POST', body }),
  register: (body: Record<string, string>) => api<{ message: string }>('auth/register', { method: 'POST', body }),
  me: () => api<User>('auth/me'),
  logout: (pushToken?: string | null) =>
    api<{ message: string }>('auth/mobile/logout', { method: 'POST', body: { pushToken: pushToken ?? undefined } }),

  // ---- Listings -----------------------------------------------------------
  listings: (filters: ListingFilters) => api<Listing[]>('posts', { query: listingQuery(filters) }),
  listing: (id: string) => api<ListingDetail>(`posts/${id}`),
  reviews: (id: string) => api<ReviewSummary>(`posts/${id}/reviews`),
  saveReview: (id: string, body: { rating: number; comment?: string }) =>
    api<{ message: string }>(`posts/${id}/reviews`, { method: 'POST', body }),
  toggleSaved: (postId: string) => api<{ message: string }>('users/save', { method: 'POST', body: { postId } }),
  savedListings: () => api<{ userPosts: Listing[]; savedPosts: Listing[] }>('users/profilePosts'),
  requestBooking: (postId: string) =>
    api<{ message: string; bookingRequest: Booking }>(`posts/${postId}/book`, { method: 'POST', body: {} }),
  addListing: (form: FormData) =>
    api<{ message: string; boarding: Listing }>('boardings/add', { method: 'POST', body: form }),

  // ---- Bookings -----------------------------------------------------------
  bookings: () => api<Booking[]>('bookings'),
  respondToBooking: (id: string, action: 'approve' | 'reject' | 'cancel') =>
    api<{ message: string; chatId?: string }>(`bookings/${id}/${action}`, { method: 'PUT' }),

  // ---- Chat ---------------------------------------------------------------
  chats: () => api<ChatSummary[]>('chats'),
  chat: (id: string) => api<ChatDetail>(`chats/${id}`),
  startChat: (receiverId: string) => api<ChatSummary>('chats', { method: 'POST', body: { receiverId } }),
  sendMessage: (chatId: string, text: string) => api<Message>(`messages/${chatId}`, { method: 'POST', body: { text } }),
  markChatRead: (chatId: string) => api<unknown>(`chats/read/${chatId}`, { method: 'PUT' }),

  // ---- Notifications ------------------------------------------------------
  notifications: () =>
    api<{ unseenCount: number; notifications: AppNotification[]; preferences: NotificationPreferences }>(
      'users/notifications',
    ),
  markNotificationRead: (id: string) => api<unknown>(`users/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () => api<unknown>('users/notifications/read-all', { method: 'PUT' }),
  updatePreferences: (prefs: Partial<NotificationPreferences>) =>
    api<NotificationPreferences>('users/notifications/preferences', { method: 'PUT', body: prefs }),
  registerPushToken: (token: string, platform: 'ios' | 'android') =>
    api<unknown>('users/push-tokens', { method: 'POST', body: { token, platform } }),
};
