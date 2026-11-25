import type { BoardingType, BookingStatus } from '@/api/types';

const lkr = new Intl.NumberFormat('en-LK', { maximumFractionDigits: 0 });

export const formatRent = (rent: number) => `LKR ${lkr.format(rent)}`;

export function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m away` : `${km.toFixed(1)} km away`;
}

export const boardingTypeLabel: Record<BoardingType, string> = {
  singleRoom: 'Single room',
  sharedRoom: 'Shared room',
  annex: 'Annex',
  hostel: 'Hostel',
  houseShare: 'House share',
};

export const bookingStatusLabel: Record<BookingStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  paymentPending: 'Payment pending',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  expired: 'Expired',
};

/** "just now", "5 min ago", "3 h ago", "2 d ago", then a date. */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const seconds = Math.max(0, (now.getTime() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h ago`;
  if (seconds < 7 * 86400) return `${Math.floor(seconds / 86400)} d ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Listing descriptions are sanitised HTML from the web editor; show them as plain text. */
export function htmlToText(html: string): string {
  return html
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h\d)>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
