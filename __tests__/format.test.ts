import { formatDistance, formatRent, htmlToText, timeAgo } from '@/lib/format';
import { routeForNotification } from '@/push/routeForNotification';

describe('formatting', () => {
  it('formats rent and distance', () => {
    expect(formatRent(25000)).toBe('LKR 25,000');
    expect(formatDistance(0.42)).toBe('420 m away');
    expect(formatDistance(3.456)).toBe('3.5 km away');
  });

  it('describes times relative to now', () => {
    const now = new Date('2026-11-25T12:00:00Z');
    expect(timeAgo('2026-11-25T11:59:30Z', now)).toBe('just now');
    expect(timeAgo('2026-11-25T11:45:00Z', now)).toBe('15 min ago');
    expect(timeAgo('2026-11-25T09:00:00Z', now)).toBe('3 h ago');
    expect(timeAgo('2026-11-23T12:00:00Z', now)).toBe('2 d ago');
  });

  it('turns sanitised listing HTML into readable text', () => {
    expect(htmlToText('<p>Quiet room</p><p>Wi-Fi &amp; meals<br>Near bus stop</p>')).toBe(
      'Quiet room\nWi-Fi & meals\nNear bus stop',
    );
  });
});

describe('push notification deep links', () => {
  it('opens the conversation for a chat message', () => {
    expect(routeForNotification({ type: 'chatMessage', chatId: 'c1' })).toEqual({ pathname: '/chat/[id]', params: { id: 'c1' } });
  });

  it('opens bookings for booking updates', () => {
    expect(routeForNotification({ type: 'bookingApproved', postId: 'p1' })).toBe('/bookings');
  });

  it('opens the listing for saved-search and price alerts', () => {
    expect(routeForNotification({ type: 'priceDrop', postId: 'p9' })).toEqual({ pathname: '/listing/[id]', params: { id: 'p9' } });
  });

  it('falls back to the notification list for anything else or bad data', () => {
    expect(routeForNotification({ type: 'chatMessage' })).toBe('/notifications');
    expect(routeForNotification(null)).toBe('/notifications');
  });
});
