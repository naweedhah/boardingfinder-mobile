/** Shapes returned by the BoardingFinder Laravel API (camelCase JSON, ULID string ids). */

export type UserRole = 'student' | 'boardingOwner' | 'admin';
export type Gender = 'male' | 'female' | 'other' | 'preferNotToSay';
export type BoardingType = 'singleRoom' | 'sharedRoom' | 'annex' | 'hostel' | 'houseShare';
export type BoardingStatus = 'available' | 'full' | 'reserved' | 'inactive';
export type TenantGender = 'male' | 'female' | 'any';
export type BookingStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'paymentPending'
  | 'confirmed'
  | 'cancelled'
  | 'expired';

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  avatar: string | null;
  gender: Gender | null;
  role: UserRole;
  isActive: boolean;
  isVerified: boolean;
}

export interface Listing {
  id: string;
  ownerId: string;
  title: string;
  rent: number;
  images: string[];
  address: string;
  city: string;
  area: string | null;
  latitude: number | null;
  longitude: number | null;
  boardingType: BoardingType;
  status: BoardingStatus;
  capacity: number;
  bathroomCount: number | null;
  preferredTenantGender: TenantGender;
  createdAt: string;
  remainingSlots?: number;
  demandLevel?: 'low' | 'medium' | 'high';
  /** Present only on "near me" searches. */
  distanceKm?: number;
}

export interface ListingDetail extends Listing {
  postDetail: {
    description: string;
    wifi: boolean;
    mealsProvided: boolean;
    kitchenAccess: boolean;
    parking: boolean;
    attachedBathroom: boolean;
    furnished: boolean;
    petAllowed: boolean;
    nearestCampus: string | null;
    distanceToCampus: number | null;
    distanceToBusStop: number | null;
    distanceToTown: number | null;
    rules: string | null;
  } | null;
  owner: { id: string; username: string; avatar: string | null; phone: string | null } | null;
  isSaved: boolean;
  bookingRequestStatus: BookingStatus | null;
  bookingRequestId: string | null;
}

export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user?: { id: string; username: string; avatar: string | null };
}

export interface ReviewSummary {
  reviews: Review[];
  avgRating: number | null;
  count: number;
}

export interface Booking {
  id: string;
  studentId: string;
  ownerId: string;
  postId: string;
  status: BookingStatus;
  createdAt: string;
  post: Pick<Listing, 'id' | 'title' | 'address' | 'city' | 'area' | 'rent' | 'images'>;
  student: { id: string; username: string; fullName: string | null; phone: string | null };
  owner: { id: string; username: string; fullName: string | null };
}

export interface ChatSummary {
  id: string;
  userIDs: string[];
  seenBy: string[];
  lastMessage: string | null;
  updatedAt: string;
  receiver: { id: string; username: string; avatar: string | null } | null;
}

export type ScamFlag = 'safe' | 'warning' | 'danger';

export interface Message {
  id: string;
  chatId: string;
  userId: string;
  text: string;
  scamFlag: ScamFlag | null;
  createdAt: string;
  /** Client-only: optimistic message that the server has not confirmed yet. */
  pending?: boolean;
}

export interface ChatDetail extends Omit<ChatSummary, 'receiver'> {
  messages: Message[];
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  metadata: Record<string, unknown> | null;
}

export interface NotificationPreferences {
  pushEnabled: boolean;
  emailEnabled: boolean;
  inAppEnabled: boolean;
  bookingUpdates: boolean;
  watchlistAlerts: boolean;
  searchAlerts: boolean;
  priceAlerts: boolean;
  roommateAlerts: boolean;
  safetyAlerts: boolean;
}

export interface LoginResponse {
  token: string;
  expiresAt: string;
  user: User;
}
