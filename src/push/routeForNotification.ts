import type { Href } from 'expo-router';

/**
 * Where tapping a push notification should take the user. The API puts `type` and the
 * notification's metadata (chatId, postId, bookingRequestId...) in the push payload.
 */
export function routeForNotification(data: Record<string, unknown> | null | undefined): Href {
  const type = typeof data?.type === 'string' ? data.type : '';
  const id = (key: string) => (typeof data?.[key] === 'string' ? (data[key] as string) : null);

  if (type === 'chatMessage' && id('chatId')) {
    return { pathname: '/chat/[id]', params: { id: id('chatId')! } };
  }
  if (type.startsWith('booking') || type.startsWith('payment')) {
    return '/bookings';
  }
  if (id('postId') && ['watchlistMatch', 'boardingAvailable', 'priceDrop', 'lowAvailability', 'searchMatch'].includes(type)) {
    return { pathname: '/listing/[id]', params: { id: id('postId')! } };
  }
  return '/notifications';
}
