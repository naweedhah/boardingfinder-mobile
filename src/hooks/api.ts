import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { endpoints, type ListingFilters } from '@/api/endpoints';
import type { Booking, ChatDetail, ChatSummary, ListingDetail, Message, NotificationPreferences } from '@/api/types';
import { queryKeys } from './queryKeys';

// ---- Listings ---------------------------------------------------------------

export const useListings = (filters: ListingFilters) =>
  useQuery({ queryKey: queryKeys.listings(filters), queryFn: () => endpoints.listings(filters) });

export const useListing = (id: string) =>
  useQuery({ queryKey: queryKeys.listing(id), queryFn: () => endpoints.listing(id) });

export const useReviews = (id: string) =>
  useQuery({ queryKey: queryKeys.reviews(id), queryFn: () => endpoints.reviews(id) });

export const useSavedListings = () =>
  useQuery({ queryKey: queryKeys.saved, queryFn: endpoints.savedListings });

/**
 * Save/unsave flips the heart immediately (optimistic update) and rolls back if the API call
 * fails, e.g. when offline.
 */
export function useToggleSaved(listingId: string) {
  const queryClient = useQueryClient();
  const key = queryKeys.listing(listingId);

  return useMutation({
    mutationFn: () => endpoints.toggleSaved(listingId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ListingDetail>(key);
      queryClient.setQueryData<ListingDetail>(key, (listing) => listing && { ...listing, isSaved: !listing.isSaved });
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: key });
      void queryClient.invalidateQueries({ queryKey: queryKeys.saved });
    },
  });
}

export function useRequestBooking(listingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => endpoints.requestBooking(listingId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.listing(listingId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.bookings });
    },
  });
}

export function useSaveReview(listingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { rating: number; comment?: string }) => endpoints.saveReview(listingId, body),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: queryKeys.reviews(listingId) }),
  });
}

export function useAddListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: endpoints.addListing,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['listings'] }),
  });
}

// ---- Bookings ---------------------------------------------------------------

export const useBookings = () => useQuery({ queryKey: queryKeys.bookings, queryFn: endpoints.bookings });

export function useRespondToBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'approve' | 'reject' | 'cancel' }) =>
      endpoints.respondToBooking(id, action),
    onMutate: async ({ id, action }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.bookings });
      const previous = queryClient.getQueryData<Booking[]>(queryKeys.bookings);
      const status = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'cancelled';
      queryClient.setQueryData<Booking[]>(queryKeys.bookings, (list) =>
        list?.map((b) => (b.id === id ? { ...b, status } : b)),
      );
      return { previous };
    },
    onError: (_e, _v, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.bookings, context.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.bookings });
      void queryClient.invalidateQueries({ queryKey: queryKeys.chats });
    },
  });
}

// ---- Chat -------------------------------------------------------------------

export const useChats = () => useQuery({ queryKey: queryKeys.chats, queryFn: endpoints.chats });

export const useChat = (id: string) => useQuery({ queryKey: queryKeys.chat(id), queryFn: () => endpoints.chat(id) });

export function useStartChat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: endpoints.startChat,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: queryKeys.chats }),
  });
}

/**
 * Sending shows the message straight away with a "sending" state. When the API answers, the
 * temporary message is swapped for the stored one (which also carries the scam-check flag).
 * If the live WebSocket echo arrives first, the duplicate is dropped by id.
 */
export function useSendMessage(chatId: string, userId: string) {
  const queryClient = useQueryClient();
  const key = queryKeys.chat(chatId);

  return useMutation({
    mutationFn: (text: string) => endpoints.sendMessage(chatId, text),
    onMutate: async (text) => {
      await queryClient.cancelQueries({ queryKey: key });
      const tempId = `temp-${Date.now()}`;
      const optimistic: Message = {
        id: tempId,
        chatId,
        userId,
        text,
        scamFlag: null,
        createdAt: new Date().toISOString(),
        pending: true,
      };
      queryClient.setQueryData<ChatDetail>(key, (chat) => chat && { ...chat, messages: [...chat.messages, optimistic] });
      return { tempId };
    },
    onSuccess: (saved, _text, context) => {
      queryClient.setQueryData<ChatDetail>(key, (chat) => {
        if (!chat) return chat;
        const withoutTemp = chat.messages.filter((m) => m.id !== context?.tempId && m.id !== saved.id);
        return { ...chat, lastMessage: saved.text, messages: [...withoutTemp, saved] };
      });
      queryClient.setQueryData<ChatSummary[]>(queryKeys.chats, (chats) =>
        chats?.map((c) => (c.id === chatId ? { ...c, lastMessage: saved.text } : c)),
      );
    },
    onError: (_error, _text, context) => {
      queryClient.setQueryData<ChatDetail>(
        key,
        (chat) => chat && { ...chat, messages: chat.messages.filter((m) => m.id !== context?.tempId) },
      );
    },
  });
}

// ---- Notifications ----------------------------------------------------------

export const useNotifications = () =>
  useQuery({ queryKey: queryKeys.notifications, queryFn: endpoints.notifications });

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id?: string) => (id ? endpoints.markNotificationRead(id) : endpoints.markAllNotificationsRead()),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: queryKeys.notifications }),
  });
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (prefs: Partial<NotificationPreferences>) => endpoints.updatePreferences(prefs),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: queryKeys.notifications }),
  });
}
