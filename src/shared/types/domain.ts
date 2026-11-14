// ==============================================================================
// CONTRATOS E ENTIDADES DE DOMÍNIO — 13 DOMÍNIOS OFICIAIS
// ==============================================================================

export type UserRole = 'VISITOR' | 'MERCHANT' | 'OPERATOR' | 'ADMIN';
export type PassportLevel = 'BRONZE' | 'SILVER' | 'GOLD' | 'DIAMOND';
export type StoreCategory = 'GASTRONOMIA' | 'MODA' | 'BELEZA' | 'LAZER' | 'SERVICOS' | 'TECNOLOGIA';
export type CampaignStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'ENDED';
export type CheckInStatus = 'VALID' | 'REJECTED_DISTANCE' | 'REJECTED_DUPLICATE' | 'REJECTED_QR';
export type MissionFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'SPECIAL';
export type MissionStatus = 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED';
export type PointTransactionType = 'CREDIT' | 'DEBIT';
export type PointTransactionOrigin =
  | 'CHECKIN'
  | 'MISSION'
  | 'REWARD_REDEMPTION'
  | 'PROMO_BONUS'
  | 'ADMIN_ADJUSTMENT';
export type VoucherStatus = 'ACTIVE' | 'USED' | 'EXPIRED' | 'CANCELLED';

// 1. User
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  isPhoneVerified: boolean;
  lgpdConsentAt: string;
  lgpdConsentVersion: string;
  isActive: boolean;
  createdAt: string;
}

// 2. VisitorProfile
export interface VisitorProfile {
  id: string;
  userId: string;
  visitorName: string;
  memberCode: string;
  level: PassportLevel;
  currentPoints: number;
  lifetimePoints: number;
  totalCheckIns: number;
  totalStamps: number;
}

// 3. Store
export interface Store {
  id: string;
  slug: string;
  name: string;
  category: StoreCategory;
  floor: string;
  unitNumber: string;
  description: string;
  logoUrl?: string;
  coverUrl?: string;
  qrCodeToken: string;
  checkInPoints: number;
  latitude: number;
  longitude: number;
  isFeatured: boolean;
  isActive: boolean;
}

// 4. Campaign
export interface Campaign {
  id: string;
  storeId?: string;
  storeName?: string;
  title: string;
  slug: string;
  description: string;
  bannerUrl?: string;
  bonusMultiplier: number;
  status: CampaignStatus;
  startsAt: string;
  endsAt: string;
}

// 5. CheckIn
export interface CheckIn {
  id: string;
  visitorId: string;
  storeId: string;
  storeName: string;
  checkInDate: string; // YYYY-MM-DD
  latitude: number;
  longitude: number;
  distanceMeters: number;
  isWithinGeofence: boolean;
  status: CheckInStatus;
  pointsAwarded: number;
  createdAt: string;
}

// 6. Stamp
export interface Stamp {
  id: string;
  visitorId: string;
  storeId: string;
  storeName: string;
  checkInId: string;
  badgeTitle: string;
  category: StoreCategory;
  earnedAt: string;
}

// 7. Mission
export interface Mission {
  id: string;
  code: string;
  title: string;
  description: string;
  frequency: MissionFrequency;
  targetType: 'CHECKIN_COUNT' | 'CATEGORY_VARIETY' | 'SPECIFIC_STORE';
  targetCategory?: StoreCategory;
  targetCount: number;
  currentCount: number;
  rewardPoints: number;
  status: MissionStatus;
  periodKey: string;
}

// 8. PointTransaction
export interface PointTransaction {
  id: string;
  visitorId: string;
  type: PointTransactionType;
  amount: number;
  balanceAfter: number;
  origin: PointTransactionOrigin;
  referenceId?: string;
  description: string;
  createdAt: string;
}

// 9. Reward
export interface Reward {
  id: string;
  storeId: string;
  storeName: string;
  storeFloor: string;
  title: string;
  description: string;
  rules: string;
  pointsCost: number;
  initialStock: number;
  availableStock: number;
  maxPerVisitor: number;
  voucherValidityHours: number;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  isActive: boolean;
}

// 10. Voucher
export interface Voucher {
  id: string;
  code: string;
  qrPayload: string;
  visitorId: string;
  visitorName: string;
  rewardId: string;
  rewardTitle: string;
  storeId: string;
  storeName: string;
  storeFloor: string;
  pointsSpent: number;
  status: VoucherStatus;
  issuedAt: string;
  expiresAt: string;
  usedAt?: string;
  validatedByOperatorId?: string;
}

// 11. Merchant
export interface Merchant {
  id: string;
  userId: string;
  storeId: string;
  storeName: string;
  cnpj: string;
  jobTitle: string;
  isApproved: boolean;
}

// 12. Operator
export interface Operator {
  id: string;
  userId: string;
  operatorName: string;
  storeId: string;
  storeName: string;
  badgeNumber: string;
  canManageOffers: boolean;
  isActive: boolean;
}

// 13. Administrator
export interface Administrator {
  id: string;
  userId: string;
  department: string;
  permissionLevel: 'SUPER_ADMIN' | 'MARKETING' | 'AUDITOR';
}

// Envelope Padrão de API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    timestamp: string;
    page?: number;
    pageSize?: number;
    total?: number;
  };
}

// Contrato entre Dev 02 (Sistema de Pontos) e Dev 03 (Resgate de Recompensas)
export interface IPointsLedgerService {
  creditPoints(params: {
    visitorId: string;
    amount: number;
    origin: PointTransactionOrigin;
    referenceId?: string;
    description: string;
  }): Promise<PointTransaction>;

  debitPoints(params: {
    visitorId: string;
    amount: number;
    origin: PointTransactionOrigin;
    referenceId?: string;
    description: string;
  }): Promise<PointTransaction>;
}
