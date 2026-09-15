// ==========================================
// YAQIN PLATFORM SHARED DOMAIN TYPES
// ==========================================

export type Gender = 'MALE' | 'FEMALE';
export type LookingFor = 'MALE' | 'FEMALE' | 'ALL';
export type LikeType = 'LIKE' | 'SUPER_LIKE';
export type MessageType = 'TEXT' | 'IMAGE' | 'VOICE' | 'SYSTEM';
export type VerificationStatus = 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
export type ReportReason =
  | 'FAKE_PROFILE'
  | 'HARASSMENT'
  | 'SPAM'
  | 'INAPPROPRIATE_CONTENT'
  | 'SCAM'
  | 'OTHER';
export type ReportStatus = 'PENDING' | 'RESOLVED' | 'DISMISSED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
export type ProductType = 'PREMIUM' | 'BOOST' | 'SUPER_LIKE';
export type AdminRole = 'SUPERADMIN' | 'ADMIN';

export interface TelegramAuthData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export interface CityDto {
  id: string;
  name: string;
  region: string;
}

export interface InterestDto {
  id: string;
  name: string;
  category: string;
  icon?: string;
}

export interface ProfilePhotoDto {
  id: string;
  url: string;
  sortOrder: number;
  isPrimary: boolean;
}

export interface UserProfileDto {
  id: string;
  telegramId: string;
  username?: string | null;
  firstName: string;
  lastName?: string | null;
  birthDate: string; // ISO string
  age: number;
  gender: Gender;
  lookingFor: LookingFor;
  cityId?: string | null;
  cityName?: string | null;
  cityRegion?: string | null;
  bio?: string | null;
  isVerified: boolean;
  isPremium: boolean;
  premiumUntil?: string | null;
  isBlocked: boolean;
  isBanned: boolean;
  superLikeBalance: number;
  activeBoostUntil?: string | null;
  photos: ProfilePhotoDto[];
  interests: InterestDto[];
  createdAt: string;
}

export interface DiscoverCandidateDto {
  id: string;
  firstName: string;
  lastName?: string | null;
  age: number;
  city: string;
  distanceKm?: number;
  bio?: string | null;
  isVerified: boolean;
  isPremium: boolean;
  isBoosted: boolean;
  photos: ProfilePhotoDto[];
  interests: InterestDto[];
  matchScore: number;
}

export interface MatchDto {
  id: string;
  partner: {
    id: string;
    firstName: string;
    lastName?: string | null;
    age: number;
    city?: string | null;
    photoUrl?: string | null;
    isVerified: boolean;
    isPremium: boolean;
  };
  lastMessage?: {
    content: string;
    createdAt: string;
    isRead: boolean;
    senderId: string;
  } | null;
  createdAt: string;
  unreadCount: number;
}

export interface MessageDto {
  id: string;
  matchId: string;
  senderId: string;
  content: string;
  type: MessageType;
  isRead: boolean;
  createdAt: string;
}

export interface ReceivedLikeDto {
  id: string;
  fromUserId: string;
  type: LikeType;
  createdAt: string;
  // Bepul foydalanuvchilar uchun qisman yoki blurlangan ko'rinish
  user: {
    id?: string;
    firstName?: string;
    age?: number;
    city?: string;
    blurredPhotoUrl: string;
    realPhotoUrl?: string; // Faqat Premium uchun ochiladi
    isVerified?: boolean;
    isPremium?: boolean;
  };
}

export interface PremiumPlanConfig {
  id: string;
  durationDays: number;
  titleUz: string;
  titleRu: string;
  titleEn: string;
  priceUzs: number;
  starsAmount: number;
  isPopular?: boolean;
  discountPercentage?: number;
}

export interface BoostPlanConfig {
  id: string;
  durationHours: number;
  titleUz: string;
  priceUzs: number;
  starsAmount: number;
  multiplier: number;
}

export interface SuperLikePackageConfig {
  id: string;
  count: number;
  priceUzs: number;
  starsAmount: number;
}
